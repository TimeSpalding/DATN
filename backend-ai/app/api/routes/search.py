import json
import logging
from decimal import Decimal

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.embedding.clip_model import clip_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/embeddings", tags=["Embeddings"])

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
    filters: dict[str, list[str]] | None = None



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
        filters: dict = {}
        for k in ["category", "color", "pattern", "style", "sleeve", "neckline", "gender"]:
            if attrs.get(k):
                filters[k] = [attrs[k]]

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
    Composed Image+Text Search (CIR - Composed Image Retrieval).

    Thuat toan:
      1. Lay vector anh V_img (tu imageEmbedding co san hoac tai anh tu MinIO roi encode).
      2. Lay vector text V_text tu modificationText.
      3. Tron vector: V_composed = Normalize(w * V_img + (1-w) * V_text)
      4. Attribute Delta: key text co -> GHI DE lên anh; key anh text khong nhac -> GIU NGUYEN.
      5. Tra ve composed embedding + merged_filters de Java day thang vao Qdrant.
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
        # ── BUOC 1: Lay vector anh ──────────────────────────────────────────────
        if request.imageEmbedding:
            # Java da gui kem vector san (anh da indexed trong catalog)
            v_img = request.imageEmbedding
            img_attrs = clip_model.predict_all_attributes(v_img)
        else:
            # Tai anh tu MinIO roi encode qua FashionCLIP
            from app.clients.minio_client import minio_client_wrapper
            image_bytes = minio_client_wrapper.download_image(request.storagePath)
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            v_img = clip_model.get_image_embedding(pil_image)
            img_attrs = clip_model.predict_all_attributes(v_img)

        # ── BUOC 2: Lay vector text + boc tach filter rule-based ───────────────
        v_text = clip_model.get_text_embedding(request.modificationText)
        text_filters = clip_model.extract_tags_from_text(request.modificationText)

        # LLM Fallback: bo sung category neu text khong noi loai do cu the
        if not text_filters.get("category"):
            try:
                from app.services.llm_intent_parser import parse_fashion_intent
                llm_filters = await parse_fashion_intent(request.modificationText)
                if llm_filters:
                    logger.info("[Composed-LLM] Bo sung filter tu Gemini: %s", llm_filters)
                    for k, v in llm_filters.items():
                        if k not in text_filters:
                            text_filters[k] = v
            except Exception as llm_err:
                logger.warning("[Composed-LLM] Bo qua do loi: %s", llm_err)

        # ── BUOC 3: Tron vector (Weighted Interpolation) ────────────────────────
        t_img  = torch.tensor(v_img,  dtype=torch.float32).unsqueeze(0)  # (1, 512)
        t_text = torch.tensor(v_text, dtype=torch.float32).unsqueeze(0)  # (1, 512)
        v_composed_raw = w * t_img + (1.0 - w) * t_text
        v_composed = F.normalize(v_composed_raw, dim=-1).squeeze(0).tolist()

        logger.info("[Composed] Vector blended successfully: w_img=%.2f, w_text=%.2f", w, 1.0 - w)

        # ── BUOC 4: Attribute Delta ─────────────────────────────────────────────
        # Quy tac uu tien:
        #   - Cac key TEXT co mat  -> GHI DE (dieu chinh cua user)
        #   - Cac key ANH khong co trong text -> GIU NGUYEN (bao toan kieu dang goc)
        img_filter_keys = ["category", "color", "pattern", "style", "sleeve", "neckline", "gender"]
        merged_filters = {}

        # Dien thuoc tinh tu anh truoc (kieu dang goc)
        for key in img_filter_keys:
            vi_val = img_attrs.get(key)
            if vi_val:
                merged_filters[key] = [vi_val]

        # Text GHI DE: mau, hoa tiet, style ma user mo ta
        for key, vals in text_filters.items():
            if vals:
                merged_filters[key] = vals
                logger.debug("[Composed] Delta override: %s=%s", key, vals)

        logger.info("[Composed] Final merged_filters: %s", merged_filters)

        return {"embedding": v_composed, "filters": merged_filters if merged_filters else None}

    except HTTPException:
        raise
    except Exception as err:
        logger.error("[Composed] Unexpected error: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
