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






















