"""
app/qdrant/images_v2_client.py
-------------------------------
Qdrant client dành riêng cho collection `images_v2` — lưu vector crop từng
món đồ được phát hiện bởi YOLOv8n.

Schema 1 Point trong images_v2:
  id      : int   — Dạng: image_id * 100 + box_index (tránh trùng với images_full)
  vector  : [512] — FashionCLIP embedding của ảnh CÂY crop
  payload :
    image_id    : int    — ID ảnh gốc trong bảng `images` PostgreSQL
    box_index   : int    — Thứ tự BBox trong ảnh đó (0, 1, 2, ...)
    label       : str    — "upper_clothes" | "lower_clothes" | "dress"
    confidence  : float  — Score YOLO
    is_fallback : bool   — True nếu không phát hiện được box, dùng toàn ảnh
    area_ratio  : float  — Diện tích BBox / diện tích ảnh gốc

Lý do dùng client riêng thay vì sửa QdrantClientWrapper gốc:
  - Tránh phá vỡ collection `images` (images_full) đang chạy production.
  - Cấu hình collection độc lập, có thể xóa / rebuild images_v2 mà không
    ảnh hưởng gì đến Text Search và Composed Search.
"""

import logging
import os

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    PointStruct,
    VectorParams,
)

logger = logging.getLogger(__name__)

_QDRANT_URL       = os.environ.get("QDRANT_URL", "http://qdrant:6333")
_QDRANT_API_KEY   = os.environ.get("QDRANT_API_KEY", None)
_COLLECTION_V2    = os.environ.get("QDRANT_COLLECTION_V2", "images_v2")
_VECTOR_DIM       = 512   # FashionCLIP ViT-B/32

# Point ID encoding: image_id * 100 + box_index
# Giả sử tối đa 99 boxes / ảnh — đủ dùng thực tế.
_BOX_STRIDE = 100


def encode_point_id(image_id: int, box_index: int) -> int:
    return image_id * _BOX_STRIDE + box_index


def decode_point_id(point_id: int) -> tuple[int, int]:
    return point_id // _BOX_STRIDE, point_id % _BOX_STRIDE


class ImagesV2Client:
    """
    Wrapper quanh Qdrant cho collection images_v2.
    Tự động tạo collection nếu chưa tồn tại (lần đầu khởi động).
    """

    def __init__(self):
        self._client = QdrantClient(url=_QDRANT_URL, api_key=_QDRANT_API_KEY)
        self._col = _COLLECTION_V2
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            existing = [c.name for c in self._client.get_collections().collections]
            if self._col not in existing:
                self._client.create_collection(
                    collection_name=self._col,
                    vectors_config=VectorParams(size=_VECTOR_DIM, distance=Distance.COSINE),
                )
                logger.info("[ImagesV2Client] Đã tạo collection '%s'.", self._col)
            else:
                logger.info("[ImagesV2Client] Collection '%s' đã tồn tại.", self._col)
        except Exception as exc:
            logger.error("[ImagesV2Client] Lỗi khi kiểm tra / tạo collection: %s", exc)

    def upsert(
        self,
        image_id: int,
        box_index: int,
        vector: list[float],
        label: str,
        confidence: float,
        is_fallback: bool,
        area_ratio: float,
    ) -> None:
        point_id = encode_point_id(image_id, box_index)
        payload = {
            "image_id":   image_id,
            "box_index":  box_index,
            "label":      label,
            "confidence": confidence,
            "is_fallback": is_fallback,
            "area_ratio": area_ratio,
        }
        self._client.upsert(
            collection_name=self._col,
            points=[PointStruct(id=point_id, vector=vector, payload=payload)],
            wait=True,
        )

    def upsert_batch(self, points: list[PointStruct]) -> None:
        """Đẩy nhiều points cùng lúc."""
        if not points:
            return
        self._client.upsert(
            collection_name=self._col,
            points=points,
            wait=True,
        )

    def delete_by_image_id(self, image_id: int, max_boxes: int = _BOX_STRIDE - 1) -> None:
        """
        Xóa tất cả Point thuộc image_id (khi ảnh bị xóa hoặc re-index).
        """
        ids_to_delete = [encode_point_id(image_id, i) for i in range(max_boxes + 1)]
        try:
            self._client.delete(
                collection_name=self._col,
                points_selector=ids_to_delete,
            )
        except Exception as exc:
            logger.warning("[ImagesV2Client] Không xóa được points cho image_id=%d: %s", image_id, exc)

    def search(
        self,
        query_vector: list[float],
        limit: int = 200,
        label_filter: str | None = None,
    ) -> list[tuple[int, float, dict]]:
        """
        Tìm kiếm vector trong images_v2.
        Trả về list of (image_id_original, score, payload).

        label_filter: nếu truyền ("upper_clothes"|"lower_clothes"|"dress")
                      sẽ chỉ tìm trong nhóm đó (Soft Filter — không dùng
                      qdrant FieldCondition cứng để tránh bỏ sót khi fallback).
        """
        from qdrant_client.http.models import Filter, FieldCondition, MatchValue

        qdrant_filter = None
        if label_filter:
            qdrant_filter = Filter(
                must=[FieldCondition(key="label", match=MatchValue(value=label_filter))]
            )

        hits = self._client.search(
            collection_name=self._col,
            query_vector=query_vector,
            limit=limit,
            query_filter=qdrant_filter,
            with_payload=True,
            with_vectors=False,
        )

        results = []
        for h in hits:
            payload = h.payload or {}
            orig_image_id = payload.get("image_id", decode_point_id(int(h.id))[0])
            results.append((orig_image_id, h.score, payload))
        return results

    @property
    def collection_name(self) -> str:
        return self._col


# ─── SINGLETON ────────────────────────────────────────────────────────────────
images_v2_client = ImagesV2Client()
