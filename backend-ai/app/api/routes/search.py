import json
import logging
from decimal import Decimal

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.embedding.clip_model import clip_model, NO_SLEEVE_NECK, expand_category_group

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/embeddings", tags=["Embeddings"])

# Các thuộc tính của ảnh query được dùng làm "thuộc tính mục tiêu" khi re-rank.
_IMG_ATTR_KEYS = ["category", "color", "pattern", "style", "sleeve", "neckline", "gender"]


class ImageEmbeddingRequest(BaseModel):
    type: str
    imageUrl: str | None = None
    storagePath: str | None = None
    mimeType: str | None = None
    imageId: int | None = None

class TextEmbeddingRequest(BaseModel):
    type: str
    text: str | None = None


class ComposedEmbeddingRequest(BaseModel):
    """
    Composed Image+Text search request.
    Phải cung cấp đúng 1 trong 2: storagePath (ảnh trên MinIO) hoặc imageEmbedding (vector 512 chiều đã tính sẵn).
    """
    storagePath: str | None = None          # Đường dẫn ảnh trên MinIO
    mimeType: str | None = None
    imageEmbedding: list[float] | None = None  # Vector ảnh sẵn (tối ưu: tránh tính lại)
    modificationText: str                   # Text mô tả điều chỉnh ("áo kẻ, màu xanh rêu")
    imageWeight: float = 0.6                # Trọng số cho ảnh (0–1); text nhận phần còn lại


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    # Hard filter đẩy xuống Qdrant. Với /composed CHỈ chứa nhóm category lớn (top/bottom/...).
    filters: dict[str, list[str]] | None = None
    # Thuộc tính mục tiêu (ảnh + text ghi đè) để Java re-rank mềm. Chỉ /composed trả về.
    attributes: dict[str, list[str]] | None = None
    # Các key do TEXT điều chỉnh so với ảnh gốc -> Java cho trọng số cao hơn khi re-rank.
    textKeys: list[str] | None = None


def _image_attribute_filters(img_attrs: dict) -> dict[str, list[str]]:
    """
    Chuyển kết quả zero-shot của ảnh thành dict {key: [value]}.
    Zero-shot luôn chọn argmax nên quần/giày/mũ/túi vẫn bị gán sleeve/neckline vô nghĩa
    (vd. quần jean -> "ngắn tay"); những key này bị bỏ cho nhóm trang phục không có tay/cổ.
    """
    skip_sleeve_neck = img_attrs.get("category") in NO_SLEEVE_NECK
    result: dict[str, list[str]] = {}
    for key in _IMG_ATTR_KEYS:
        value = img_attrs.get(key)
        if not value:
            continue
        if skip_sleeve_neck and key in ("sleeve", "neckline"):
            continue
        result[key] = [value]
    return result


@router.post("/image", response_model=EmbeddingResponse)
async def get_image_embedding(request: ImageEmbeddingRequest, background_tasks: BackgroundTasks):
    """
    Java backend calls this API with type="image" and the storagePath.
    We will download the image, compute the embedding, and trigger OCR in background.
    """
    logger.info(f"Received image embedding request for storagePath={request.storagePath}, imageId={request.imageId}")
    if not request.storagePath:
        raise HTTPException(status_code=400, detail="storagePath is required")

    try:
        from app.clients.minio_client import minio_client_wrapper
        import io
        from PIL import Image

        image_bytes = minio_client_wrapper.download_image(request.storagePath)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        embedding = clip_model.get_image_embedding(pil_image)

        # Zero-shot prediction toàn bộ thuộc tính của ảnh query.
        # Dùng cho Two-stage retrieval: Re-ranking (Soft filter) ở backend-java.
        # Không dùng làm Hard filter vì dễ bị false negative.
        attrs = clip_model.predict_all_attributes(embedding)
        filters = _image_attribute_filters(attrs)

        return {"embedding": embedding, "filters": filters if filters else None}
    except Exception as e:
        logger.error(f"Error computing image embedding: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/text", response_model=EmbeddingResponse)
async def get_text_embedding(request: TextEmbeddingRequest):
    """
    Java backend calls this API to get text embedding for semantic search.
    """
    logger.info(f"Received text embedding request for text='{request.text}'")
    if not request.text:
        raise HTTPException(status_code=400, detail="text is required")

    try:
        embedding = clip_model.get_text_embedding(request.text)
        filters = clip_model.extract_tags_from_text(request.text)
        if filters:
            logger.info(f"[Filter] Bóc tách được filter từ query: {filters}")

        # --- LLM Fallback (Tầng 2) ---
        # Chỉ kích hoạt khi Tầng 1 không bóc được danh mục cụ thể nào.
        # Điều này có nghĩa là người dùng đang tìm theo phong cách trừu tượng
        # (ví dụ: "old money", "đồ đi biển") chứ không phải loại đồ cụ thể.
        if not filters.get("category"):
            try:
                from app.services.llm_intent_parser import parse_fashion_intent
                llm_filters = await parse_fashion_intent(request.text)
                if llm_filters:
                    logger.info(f"[LLM Fallback] Bổ sung filter từ Gemini: {llm_filters}")
                    # Hợp nhất: LLM chỉ điền vào những key mà Tầng 1 chưa bóc được.
                    # Tầng 1 vẫn có quyền ưu tiên tuyệt đối (gender, color, etc).
                    for k, v in llm_filters.items():
                        if k not in filters:
                            filters[k] = v
            except Exception as e:
                # LLM lỗi thì im lặng, không ảnh hưởng đến kết quả Tầng 1
                logger.warning(f"[LLM Fallback] Bỏ qua do lỗi: {e}")

        return {"embedding": embedding, "filters": filters or None}
    except Exception as e:
        logger.error(f"Error computing text embedding: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")



@router.post("/composed", response_model=EmbeddingResponse)
async def get_composed_embedding(request: ComposedEmbeddingRequest):
    """
    Composed Image+Text Search (CIR - Composed Image Retrieval), kiến trúc 2 tầng.

    Thuật toán:
      1. Lấy vector ảnh V_img (từ imageEmbedding có sẵn hoặc tải ảnh từ MinIO rồi encode).
      2. Lấy vector text V_text từ modificationText + bóc tách thuộc tính từ text.
      3. Trộn vector: V_composed = Normalize(w * V_img + (1-w) * V_text)
      4. Attribute Delta: key text có -> GHI ĐÈ lên ảnh; key ảnh mà text không nhắc -> GIỮ NGUYÊN.
         - Category: nếu text chỉ nói chung ("áo") mà category cụ thể của ảnh nằm trong nhóm đó
           thì giữ category cụ thể của ảnh.
         - sleeve/neckline bị bỏ với quần/chân váy/giày/mũ/túi (zero-shot gán nhãn vô nghĩa).
      5. Trả về:
         - embedding  : vector đã trộn
         - filters    : HARD filter cho Qdrant, CHỈ gồm nhóm category lớn (áo / quần / váy-đầm / ...)
         - attributes : thuộc tính mục tiêu đầy đủ để Java re-rank mềm
         - textKeys   : các key do text điều chỉnh (Java cho trọng số cao hơn)
    """
    import io, torch
    import torch.nn.functional as F
    from PIL import Image

    logger.info(
        "[Composed] storagePath=%s, has_precomputed=%s, text='%s', weight=%s",
        request.storagePath,
        request.imageEmbedding is not None,
        request.modificationText,
        request.imageWeight,
    )

    if not request.storagePath and not request.imageEmbedding:
        raise HTTPException(status_code=400, detail="Either storagePath or imageEmbedding must be provided")
    if not request.modificationText or not request.modificationText.strip():
        raise HTTPException(status_code=400, detail="modificationText is required")

    # Clamp weight vao [0, 1]
    w = max(0.0, min(1.0, request.imageWeight))

    try:
        # ── BƯỚC 1: Lấy vector ảnh ─────────────────────────────────────────────
        if request.imageEmbedding:
            # Java đã gửi kèm vector sẵn (ảnh đã indexed trong catalog)
            v_img = request.imageEmbedding
            img_attrs = clip_model.predict_all_attributes(v_img)
        else:
            # Tải ảnh từ MinIO rồi encode qua FashionCLIP
            from app.clients.minio_client import minio_client_wrapper
            image_bytes = minio_client_wrapper.download_image(request.storagePath)
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            v_img = clip_model.get_image_embedding(pil_image)
            img_attrs = clip_model.predict_all_attributes(v_img)

        # ── BƯỚC 2: Vector text + bóc tách filter rule-based ───────────────────
        v_text = clip_model.get_text_embedding(request.modificationText)
        text_filters = clip_model.extract_tags_from_text(request.modificationText)

        # LLM Fallback: chỉ bổ sung thuộc tính PHỤ. KHÔNG được đụng category —
        # text là phần chỉnh sửa, loại đồ phải lấy từ ảnh gốc (hoặc từ từ khoá rule-based).
        if not text_filters.get("category"):
            try:
                from app.services.llm_intent_parser import parse_fashion_intent
                llm_filters = await parse_fashion_intent(request.modificationText)
                if llm_filters:
                    logger.info("[Composed-LLM] Bổ sung filter từ Gemini: %s", llm_filters)
                    for k, v in llm_filters.items():
                        if k == "category":
                            continue
                        if k not in text_filters:
                            text_filters[k] = v
            except Exception as llm_err:
                logger.warning("[Composed-LLM] Bỏ qua do lỗi: %s", llm_err)

        # ── BƯỚC 3: Attribute Delta -> thuộc tính mục tiêu (soft) ───────────────
        attributes = _image_attribute_filters(img_attrs)   # nền: kiểu dáng gốc của ảnh
        text_keys: list[str] = []

        for key, vals in text_filters.items():
            if not vals:
                continue
            if key == "category":
                current = (attributes.get("category") or [None])[0]
                if current in vals:
                    # Text chỉ nói chung ("áo", "quần"...) và nhãn cụ thể của ảnh
                    # nằm trong nhóm đó -> giữ nhãn cụ thể của ảnh.
                    continue
            attributes[key] = vals
            text_keys.append(key)
            logger.debug("[Composed] Delta override: %s=%s", key, vals)

        # Text có thể đổi category sang loại không có tay/cổ (vd. áo -> quần):
        # bỏ sleeve/neckline thừa hưởng từ ảnh, trừ khi chính text nhắc tới.
        final_category = attributes.get("category") or []
        if final_category and all(c in NO_SLEEVE_NECK for c in final_category):
            for key in ("sleeve", "neckline"):
                if key not in text_keys:
                    attributes.pop(key, None)

        # ── BƯỚC 4: Xây Target Prompt từ thuộc tính đã merge ────────────────────
        def _build_target_prompt(attrs: dict) -> str:
            gender   = (attrs.get("gender")   or [None])[0] or ""
            style    = (attrs.get("style")    or [None])[0] or ""
            color    = (attrs.get("color")    or [None])[0] or ""
            pattern  = (attrs.get("pattern")  or [None])[0] or ""
            category = (attrs.get("category") or [None])[0] or "clothing"
            sleeve   = (attrs.get("sleeve")   or [None])[0] or ""
            neckline = (attrs.get("neckline") or [None])[0] or ""
            parts  = [p for p in [gender, style, color, pattern, category] if p]
            suffix = [p for p in [sleeve, neckline] if p]
            prompt = "a photo of a " + " ".join(parts)
            if suffix:
                prompt += " with " + " and ".join(suffix)
            return prompt

        target_prompt = _build_target_prompt(attributes)
        logger.info("[Composed] Target Prompt: '%s'", target_prompt)
        v_text_target = clip_model.get_text_embedding(target_prompt)

        # ── BƯỚC 5: Trộn vector với L2 normalize trước khi blend ────────────────
        t_img  = F.normalize(torch.tensor(v_img,         dtype=torch.float32).unsqueeze(0), dim=-1)
        t_text = F.normalize(torch.tensor(v_text_target, dtype=torch.float32).unsqueeze(0), dim=-1)
        v_composed_raw = w * t_img + (1.0 - w) * t_text
        v_composed = F.normalize(v_composed_raw, dim=-1).squeeze(0).tolist()

        logger.info("[Composed] Vector blended: w_img=%.2f, w_text=%.2f", w, 1.0 - w)

        # ── BƯỚC 6: Hard filter = nhóm category lớn; target_* cho Java re-rank ──
        hard_filters: dict[str, list[str]] = {}
        if attributes.get("category"):
            hard_filters["category"] = expand_category_group(attributes["category"])

        # Merge target attributes into filters with prefix so Java reads them without DTO change
        combined_filters: dict = dict(hard_filters)
        for k, v in attributes.items():
            combined_filters[f"target_{k}"] = v
        if text_keys:
            combined_filters["textKeys"] = text_keys

        logger.info(
            "[Composed] hard_filters=%s, attributes=%s, text_keys=%s",
            hard_filters, attributes, text_keys,
        )

        return {
            "embedding": v_composed,
            "filters": combined_filters or None,
            "attributes": attributes or None,
            "textKeys": text_keys or None,
        }

    except HTTPException:
        raise
    except Exception as err:
        logger.error("[Composed] Unexpected error: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# ─── Router mới: /api/v1/search ──────────────────────────────────────────────
search_router = APIRouter(prefix="/api/v1/search", tags=["Search"])


class ComposedSearchRequest(BaseModel):
    """
    Request cho endpoint search/composed — Python tự gọi Qdrant, đọc metadata_ai,
    re-rank rồi trả về danh sách imageId đã xếp hạng. Java chỉ cần proxy kết quả.
    """
    storagePath: str | None = None
    imageEmbedding: list[float] | None = None
    modificationText: str
    imageWeight: float = 0.6
    limit: int = 200          # Số ứng viên Qdrant cần lấy (Java truyền limit*10)
    excludedImageId: int | None = None   # Loại trừ chính ảnh gốc khỏi kết quả


class RankedItem(BaseModel):
    imageId: int
    score: float


class ComposedSearchResponse(BaseModel):
    results: list[RankedItem]
    targetAttributes: dict | None = None
    textKeys: list[str] | None = None


@search_router.post("/composed", response_model=ComposedSearchResponse)
async def composed_search(request: ComposedSearchRequest):
    """
    Composed Image+Text Search — pipeline hoàn chỉnh chạy trong Python:
      1. Tính composed embedding (giống /embeddings/composed)
      2. Gọi Qdrant lấy top candidates
      3. Đọc metadata_ai từ PostgreSQL
      4. Re-rank với weighted overlap + penalty
      5. Trả về danh sách imageId đã xếp hạng

    Java backend chỉ cần nhận list imageId và fetch thông tin đầy đủ từ DB.
    """
    import io, torch
    import torch.nn.functional as F
    from PIL import Image
    from qdrant_client.http.models import Filter, FieldCondition, MatchAny
    from app.clients.postgres_client import SessionLocal, ImageEntity as PgImageEntity
    from app.qdrant.client import qdrant_client_wrapper
    from sqlalchemy import select

    logger.info(
        "[ComposedSearch] storagePath=%s, has_precomputed=%s, text='%s'",
        request.storagePath, request.imageEmbedding is not None, request.modificationText,
    )

    if not request.storagePath and not request.imageEmbedding:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Either storagePath or imageEmbedding must be provided")

    w = max(0.0, min(1.0, request.imageWeight))

    try:
        # ── BƯỚC 1: Vector ảnh ────────────────────────────────────────────────
        if request.imageEmbedding:
            v_img = request.imageEmbedding
            img_attrs = clip_model.predict_all_attributes(v_img)
        else:
            from app.clients.minio_client import minio_client_wrapper
            image_bytes = minio_client_wrapper.download_image(request.storagePath)
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            v_img = clip_model.get_image_embedding(pil_image)
            img_attrs = clip_model.predict_all_attributes(v_img)

        # ── BƯỚC 2: Vector text + bóc tách attributes ─────────────────────────
        v_text = clip_model.get_text_embedding(request.modificationText)
        text_filters = clip_model.extract_tags_from_text(request.modificationText)

        # LLM Fallback (chỉ cho thuộc tính phụ, không đụng category)
        if not text_filters.get("category"):
            try:
                from app.services.llm_intent_parser import parse_fashion_intent
                llm_filters = await parse_fashion_intent(request.modificationText)
                if llm_filters:
                    for k, v in llm_filters.items():
                        if k == "category":
                            continue
                        if k not in text_filters:
                            text_filters[k] = v
            except Exception as llm_err:
                logger.warning("[ComposedSearch-LLM] Bỏ qua do lỗi: %s", llm_err)

        # ── BƯỚC 3: Attribute Delta ────────────────────────────────────────────
        attributes = _image_attribute_filters(img_attrs)
        text_keys: list[str] = []

        for key, vals in text_filters.items():
            if not vals:
                continue
            if key == "category":
                current = (attributes.get("category") or [None])[0]
                if current in vals:
                    continue
            attributes[key] = vals
            text_keys.append(key)

        final_category = attributes.get("category") or []
        if final_category and all(c in NO_SLEEVE_NECK for c in final_category):
            for key in ("sleeve", "neckline"):
                if key not in text_keys:
                    attributes.pop(key, None)

        # ── BƯỚC 4: Target Prompt + composed vector ────────────────────────────
        def _build_target_prompt(attrs: dict) -> str:
            gender   = (attrs.get("gender")   or [None])[0] or ""
            style    = (attrs.get("style")    or [None])[0] or ""
            color    = (attrs.get("color")    or [None])[0] or ""
            pattern  = (attrs.get("pattern")  or [None])[0] or ""
            category = (attrs.get("category") or [None])[0] or "clothing"
            sleeve   = (attrs.get("sleeve")   or [None])[0] or ""
            neckline = (attrs.get("neckline") or [None])[0] or ""
            parts  = [p for p in [gender, style, color, pattern, category] if p]
            suffix = [p for p in [sleeve, neckline] if p]
            prompt = "a photo of a " + " ".join(parts)
            if suffix:
                prompt += " with " + " and ".join(suffix)
            return prompt

        target_prompt = _build_target_prompt(attributes)
        logger.info("[ComposedSearch] Target Prompt: '%s'", target_prompt)
        v_text_target = clip_model.get_text_embedding(target_prompt)

        t_img  = F.normalize(torch.tensor(v_img,         dtype=torch.float32).unsqueeze(0), dim=-1)
        t_text = F.normalize(torch.tensor(v_text_target, dtype=torch.float32).unsqueeze(0), dim=-1)
        v_composed = F.normalize(w * t_img + (1.0 - w) * t_text, dim=-1).squeeze(0).tolist()

        # ── BƯỚC 5: Gọi Qdrant lấy candidates ────────────────────────────────
        hard_category: list[str] = []
        if attributes.get("category"):
            hard_category = expand_category_group(attributes["category"])

        qdrant_filter = None
        if hard_category:
            qdrant_filter = Filter(
                must=[FieldCondition(key="category", match=MatchAny(any=hard_category))]
            )

        fetch_limit = max(request.limit, 200)
        qdrant_hits = qdrant_client_wrapper.client.search(
            collection_name=qdrant_client_wrapper.collection_name,
            query_vector=v_composed,
            limit=fetch_limit,
            query_filter=qdrant_filter,
            with_payload=False,
            with_vectors=False,
        )

        # Lọc bỏ ảnh gốc (nếu có)
        candidate_ids = [
            int(h.id) for h in qdrant_hits
            if request.excludedImageId is None or int(h.id) != request.excludedImageId
        ]
        cosine_scores = {
            int(h.id): h.score for h in qdrant_hits
            if request.excludedImageId is None or int(h.id) != request.excludedImageId
        }

        # Fallback: nếu filter quá hẹp → pure vector search
        if not candidate_ids and hard_category:
            logger.warning("[ComposedSearch] 0 results with category filter — fallback to pure vector")
            qdrant_hits = qdrant_client_wrapper.client.search(
                collection_name=qdrant_client_wrapper.collection_name,
                query_vector=v_composed,
                limit=fetch_limit,
                with_payload=False,
                with_vectors=False,
            )
            candidate_ids = [
                int(h.id) for h in qdrant_hits
                if request.excludedImageId is None or int(h.id) != request.excludedImageId
            ]
            cosine_scores = {
                int(h.id): h.score for h in qdrant_hits
                if request.excludedImageId is None or int(h.id) != request.excludedImageId
            }

        if not candidate_ids:
            return ComposedSearchResponse(results=[], targetAttributes=attributes, textKeys=text_keys)

        # ── BƯỚC 6: Đọc metadata_ai từ PostgreSQL ────────────────────────────
        db = SessionLocal()
        try:
            rows = db.execute(
                select(PgImageEntity.id, PgImageEntity.metadata_ai)
                .where(PgImageEntity.id.in_(candidate_ids))
                .where(PgImageEntity.is_deleted == False)
            ).fetchall()
        finally:
            db.close()

        metadata_by_id: dict[int, dict] = {}
        for row in rows:
            img_id, meta = row[0], row[1]
            if meta:
                metadata_by_id[int(img_id)] = meta if isinstance(meta, dict) else {}

        # ── BƯỚC 7: Re-rank với weighted overlap + penalty ────────────────────
        KEYS_TO_MATCH = ["category", "color", "pattern", "sleeve", "neckline", "style", "gender"]
        text_key_set = set(text_keys)

        # Build weight map
        weight_map: dict[str, float] = {}
        for k in KEYS_TO_MATCH:
            w_val = 1.0
            if k in text_key_set:
                w_val = 3.0
            if k == "category":
                w_val = max(w_val, 2.0)
            weight_map[k] = w_val

        # Min-Max normalize cosine scores
        all_scores = list(cosine_scores.values())
        min_cos = min(all_scores) if all_scores else 0.0
        max_cos = max(all_scores) if all_scores else 1.0
        cos_range = (max_cos - min_cos) or 1e-6

        ranked: list[tuple[int, float]] = []
        for img_id in candidate_ids:
            cos = cosine_scores.get(img_id, 0.0)
            norm_cos = (cos - min_cos) / cos_range

            candidate_meta = metadata_by_id.get(img_id, {})
            total_w = 0.0
            matched_w = 0.0
            penalized = False

            for key in KEYS_TO_MATCH:
                q_vals = attributes.get(key)
                if not q_vals:
                    continue
                kw = weight_map.get(key, 1.0)
                total_w += kw
                q_str = q_vals[0] if q_vals else None
                c_str = candidate_meta.get(key)
                if c_str is not None:
                    if q_str and q_str.lower() == str(c_str).lower():
                        matched_w += kw
                    elif key in text_key_set:
                        penalized = True   # user yêu cầu key này nhưng giá trị sai
                # Nếu sản phẩm không có key → không thưởng, nhưng cũng không phạt
                # (thiếu data khác với sai data)

            weighted_overlap = matched_w / total_w if total_w > 0 else 0.0
            hybrid = 0.35 * norm_cos + 0.65 * weighted_overlap
            if penalized:
                hybrid *= 0.35

            logger.debug(
                "[Rerank] id=%s normCos=%.3f overlap=%.3f pen=%s hybrid=%.4f",
                img_id, norm_cos, weighted_overlap, penalized, hybrid
            )
            ranked.append((img_id, hybrid))

        ranked.sort(key=lambda x: x[1], reverse=True)

        results = [RankedItem(imageId=img_id, score=round(score, 6)) for img_id, score in ranked]
        logger.info("[ComposedSearch] Re-ranked %d candidates, returning top %d", len(results), len(results))

        return ComposedSearchResponse(
            results=results,
            targetAttributes=attributes,
            textKeys=text_keys,
        )

    except Exception as err:
        from fastapi import HTTPException
        logger.error("[ComposedSearch] Unexpected error: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ─── /api/v1/search/by-image ─────────────────────────────────────────────────

class ImageSearchRequest(BaseModel):
    """Tìm kiếm bằng ảnh: upload mới (storagePath) hoặc từ vector sẵn (imageEmbedding)."""
    storagePath: str | None = None
    imageEmbedding: list[float] | None = None
    limit: int = 200


class ImageSearchByIdRequest(BaseModel):
    """Tìm ảnh tương tự từ imageId đã được index trong Qdrant."""
    imageId: int
    limit: int = 200


class SearchResultRanked(BaseModel):
    imageId: int
    score: float


class ImageSearchResult(BaseModel):
    results: list[SearchResultRanked]
    queryAttributes: dict | None = None


@search_router.post("/by-image", response_model=ImageSearchResult)
async def search_by_image(request: ImageSearchRequest):
    """
    Tìm kiếm ảnh tương tự bằng upload ảnh mới hoặc vector có sẵn.
    Python tự gọi Qdrant, đọc metadata_ai, re-rank theo attribute overlap.
    Java chỉ cần fetch thông tin đầy đủ từ DB theo imageId.
    """
    import io
    from PIL import Image
    from app.clients.postgres_client import SessionLocal, ImageEntity as PgImageEntity
    from app.qdrant.client import qdrant_client_wrapper
    from sqlalchemy import select

    if not request.storagePath and not request.imageEmbedding:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="storagePath or imageEmbedding required")

    try:
        # Lấy vector ảnh
        if request.imageEmbedding:
            v_img = request.imageEmbedding
        else:
            from app.clients.minio_client import minio_client_wrapper
            image_bytes = minio_client_wrapper.download_image(request.storagePath)
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            v_img = clip_model.get_image_embedding(pil_image)

        img_attrs = clip_model.predict_all_attributes(v_img)
        query_filters = _image_attribute_filters(img_attrs)

        # Gọi Qdrant
        fetch_limit = max(request.limit, 200)
        qdrant_hits = qdrant_client_wrapper.client.search(
            collection_name=qdrant_client_wrapper.collection_name,
            query_vector=v_img,
            limit=fetch_limit,
            with_payload=False,
            with_vectors=False,
        )
        candidate_ids = [int(h.id) for h in qdrant_hits]
        cosine_scores = {int(h.id): h.score for h in qdrant_hits}

        if not candidate_ids:
            return ImageSearchResult(results=[], queryAttributes=query_filters)

        # Đọc metadata_ai từ PostgreSQL
        db = SessionLocal()
        try:
            rows = db.execute(
                select(PgImageEntity.id, PgImageEntity.metadata_ai)
                .where(PgImageEntity.id.in_(candidate_ids))
                .where(PgImageEntity.is_deleted == False)
            ).fetchall()
        finally:
            db.close()

        metadata_by_id = {int(r[0]): (r[1] if isinstance(r[1], dict) else {}) for r in rows if r[1]}

        # Re-rank bằng attribute overlap (không penalty vì không có textKeys)
        KEYS = ["category", "color", "pattern", "sleeve", "neckline", "style", "gender"]
        WEIGHTS = {"category": 2.0}

        all_scores = list(cosine_scores.values())
        min_cos = min(all_scores) if all_scores else 0.0
        max_cos = max(all_scores) if all_scores else 1.0
        cos_range = (max_cos - min_cos) or 1e-6

        ranked = []
        for img_id in candidate_ids:
            cos = cosine_scores.get(img_id, 0.0)
            norm_cos = (cos - min_cos) / cos_range
            meta = metadata_by_id.get(img_id, {})

            total_w, matched_w = 0.0, 0.0
            for key in KEYS:
                q_vals = query_filters.get(key)
                if not q_vals:
                    continue
                w = WEIGHTS.get(key, 1.0)
                total_w += w
                c_str = meta.get(key)
                if c_str and q_vals[0].lower() == str(c_str).lower():
                    matched_w += w

            overlap = matched_w / total_w if total_w > 0 else 0.0
            hybrid = 0.35 * norm_cos + 0.65 * overlap
            ranked.append((img_id, hybrid))

        ranked.sort(key=lambda x: x[1], reverse=True)
        results = [SearchResultRanked(imageId=i, score=round(s, 6)) for i, s in ranked]
        return ImageSearchResult(results=results, queryAttributes=query_filters)

    except Exception as e:
        from fastapi import HTTPException
        logger.error("[SearchByImage] Error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@search_router.post("/by-image-id", response_model=ImageSearchResult)
async def search_by_image_id(request: ImageSearchByIdRequest):
    """
    Tìm ảnh tương tự từ imageId đã index. Python tự lấy vector từ Qdrant,
    đọc metadata_ai, re-rank và trả về danh sách đã xếp hạng.
    """
    from app.clients.postgres_client import SessionLocal, ImageEntity as PgImageEntity
    from app.qdrant.client import qdrant_client_wrapper
    from sqlalchemy import select
    from qdrant_client.http.models import Filter, HasIdCondition

    try:
        # Lấy vector của ảnh gốc từ Qdrant
        points = qdrant_client_wrapper.client.retrieve(
            collection_name=qdrant_client_wrapper.collection_name,
            ids=[request.imageId],
            with_vectors=True,
        )
        if not points or not points[0].vector:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=f"Image {request.imageId} not found in Qdrant")

        v_img = points[0].vector

        # Lấy metadata_ai của ảnh gốc từ PostgreSQL
        db = SessionLocal()
        try:
            row = db.execute(
                select(PgImageEntity.metadata_ai)
                .where(PgImageEntity.id == request.imageId)
                .where(PgImageEntity.is_deleted == False)
            ).fetchone()
        finally:
            db.close()

        query_meta = (row[0] if row and row[0] else {})
        query_filters = {k: [v] for k, v in query_meta.items() if v and k != "view_angle"}

        # Tìm similar — loại trừ chính ảnh gốc
        fetch_limit = max(request.limit, 200)
        qdrant_hits = qdrant_client_wrapper.client.search(
            collection_name=qdrant_client_wrapper.collection_name,
            query_vector=v_img,
            limit=fetch_limit + 1,
            with_payload=False,
            with_vectors=False,
        )

        candidate_ids = [int(h.id) for h in qdrant_hits if int(h.id) != request.imageId]
        cosine_scores = {int(h.id): h.score for h in qdrant_hits if int(h.id) != request.imageId}

        if not candidate_ids:
            return ImageSearchResult(results=[], queryAttributes=query_filters)

        # Đọc metadata_ai từ PostgreSQL
        db = SessionLocal()
        try:
            rows = db.execute(
                select(PgImageEntity.id, PgImageEntity.metadata_ai)
                .where(PgImageEntity.id.in_(candidate_ids))
                .where(PgImageEntity.is_deleted == False)
            ).fetchall()
        finally:
            db.close()

        metadata_by_id = {int(r[0]): (r[1] if isinstance(r[1], dict) else {}) for r in rows if r[1]}

        KEYS = ["category", "color", "pattern", "sleeve", "neckline", "style", "gender"]
        WEIGHTS = {"category": 2.0}

        all_scores = list(cosine_scores.values())
        min_cos = min(all_scores) if all_scores else 0.0
        max_cos = max(all_scores) if all_scores else 1.0
        cos_range = (max_cos - min_cos) or 1e-6

        ranked = []
        for img_id in candidate_ids:
            cos = cosine_scores.get(img_id, 0.0)
            norm_cos = (cos - min_cos) / cos_range
            meta = metadata_by_id.get(img_id, {})

            total_w, matched_w = 0.0, 0.0
            for key in KEYS:
                q_vals = query_filters.get(key)
                if not q_vals:
                    continue
                w = WEIGHTS.get(key, 1.0)
                total_w += w
                c_str = meta.get(key)
                if c_str and q_vals[0].lower() == str(c_str).lower():
                    matched_w += w

            overlap = matched_w / total_w if total_w > 0 else 0.0
            hybrid = 0.35 * norm_cos + 0.65 * overlap
            ranked.append((img_id, hybrid))

        ranked.sort(key=lambda x: x[1], reverse=True)
        results = [SearchResultRanked(imageId=i, score=round(s, 6)) for i, s in ranked]
        return ImageSearchResult(results=results, queryAttributes=query_filters)

    except Exception as e:
        from fastapi import HTTPException
        logger.error("[SearchByImageId] Error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ─── /api/v1/search/by-text ──────────────────────────────────────────────────

class TextSearchRequest(BaseModel):
    """Text semantic search qua Qdrant với hard filter + fallback."""
    query: str
    limit: int = 20


class TextSearchResult(BaseModel):
    results: list[SearchResultRanked]


@search_router.post("/by-text", response_model=TextSearchResult)
async def search_by_text(request: TextSearchRequest):
    """
    Text semantic search: Python tính embedding, gọi Qdrant với hard filter,
    fallback 2 lớp, trả về danh sách imageId+score.
    Java chỉ cần fetch thông tin đầy đủ từ DB.
    """
    from app.qdrant.client import qdrant_client_wrapper
    from qdrant_client.http.models import Filter, FieldCondition, MatchAny, MatchValue

    try:
        embedding = clip_model.get_text_embedding(request.query)
        filters = clip_model.extract_tags_from_text(request.query)

        # LLM fallback nếu không bóc được category
        if not filters.get("category"):
            try:
                from app.services.llm_intent_parser import parse_fashion_intent
                llm_filters = await parse_fashion_intent(request.query)
                if llm_filters:
                    for k, v in llm_filters.items():
                        if k not in filters:
                            filters[k] = v
            except Exception as llm_err:
                logger.warning("[SearchByText-LLM] Bỏ qua: %s", llm_err)

        # Thêm view_angle mặc định nếu chưa có
        auto_added_view_angle = False
        if "view_angle" not in filters:
            filters["view_angle"] = ["mặt trước"]
            auto_added_view_angle = True

        def _build_qdrant_filter(f: dict):
            if not f:
                return None
            conditions = []
            for key, vals in f.items():
                if not vals:
                    continue
                if len(vals) == 1:
                    conditions.append(FieldCondition(key=key, match=MatchValue(value=vals[0])))
                else:
                    conditions.append(FieldCondition(key=key, match=MatchAny(any=vals)))
            return Filter(must=conditions) if conditions else None

        def _do_search(flt):
            hits = qdrant_client_wrapper.client.search(
                collection_name=qdrant_client_wrapper.collection_name,
                query_vector=embedding,
                limit=request.limit,
                query_filter=_build_qdrant_filter(flt),
                with_payload=False,
                with_vectors=False,
            )
            return hits

        hits = _do_search(filters)

        # Fallback 1: bỏ view_angle
        if not hits and auto_added_view_angle:
            logger.warning("[SearchByText] 0 results with view_angle — retrying without")
            filters.pop("view_angle", None)
            hits = _do_search(filters)

        # Fallback 2: pure semantic
        if not hits and filters:
            logger.warning("[SearchByText] Still 0 — fallback to pure semantic")
            hits = _do_search({})

        results = [SearchResultRanked(imageId=int(h.id), score=round(h.score, 6)) for h in hits]
        return TextSearchResult(results=results)

    except Exception as e:
        from fastapi import HTTPException
        logger.error("[SearchByText] Error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

