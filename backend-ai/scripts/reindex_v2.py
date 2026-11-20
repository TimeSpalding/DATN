"""
scripts/reindex_v2.py
---------------------
Script chạy thủ công để RE-INDEX toàn bộ ảnh đã INDEXED từ images_full
sang images_v2 (YOLO crop index).

Dùng khi:
  - Lần đầu triển khai YOLO (images_v2 đang trống)
  - Thay đổi trọng số YOLO hoặc CONF_THRESHOLD
  - Cần rebuild lại toàn bộ index

Cách dùng (trong container backend-ai):
  python scripts/reindex_v2.py [--batch-size 32] [--limit 1000]

Lưu ý:
  - Script tải ảnh từ MinIO → chạy YOLO → encode FashionCLIP → upsert Qdrant
  - Chậm hơn indexing_service.py vì chạy lại từ đầu
  - Có thể interrupt và chạy lại (upsert là idempotent)
"""

import argparse
import io
import logging
import os
import sys
import time

# Thêm root vào path để import app.*
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("reindex_v2")


def main(batch_size: int, limit: int | None, dry_run: bool):
    from sqlalchemy import select
    from PIL import Image
    from qdrant_client.http.models import PointStruct

    from app.clients.postgres_client import SessionLocal, ImageEntity
    from app.clients.minio_client import minio_client_wrapper
    from app.embedding.clip_model import clip_model
    from app.detector.garment_detector import garment_detector, GarmentLabel
    from app.qdrant.images_v2_client import images_v2_client, encode_point_id

    if garment_detector.is_stub:
        logger.error(
            "GarmentDetector đang ở chế độ STUB (ONNX model không tìm thấy). "
            "Hãy đặt YOLO_ONNX_PATH trỏ đến file .onnx trước khi chạy script này."
        )
        sys.exit(1)

    db = SessionLocal()
    try:
        query = select(ImageEntity).where(
            ImageEntity.index_status == "INDEXED",
            ImageEntity.is_deleted.is_(False),
        )
        if limit:
            query = query.limit(limit)
        images = db.execute(query).scalars().all()
    finally:
        db.close()

    logger.info("Tìm thấy %d ảnh INDEXED để re-index vào images_v2.", len(images))
    if dry_run:
        logger.info("[DRY RUN] Không thực sự upsert, chỉ log.")
        return

    total_ok, total_fail, total_points = 0, 0, 0
    t_start = time.time()

    for i in range(0, len(images), batch_size):
        batch = images[i: i + batch_size]
        logger.info("Batch %d/%d (ảnh %d–%d)...", i // batch_size + 1,
                    (len(images) + batch_size - 1) // batch_size, i + 1, i + len(batch))

        for img_entity in batch:
            try:
                image_bytes = minio_client_wrapper.download_image(img_entity.storage_path)
                pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                pil_image.thumbnail((1000, 1000))

                # Xóa points cũ
                images_v2_client.delete_by_image_id(img_entity.id)

                # Detect
                garments = garment_detector.detect(pil_image)
                crops = [g.crop for g in garments]
                vectors = clip_model.get_image_embeddings(crops)

                points_batch: list[PointStruct] = []
                for box_idx, (garment, vector) in enumerate(zip(garments, vectors)):
                    point_id = encode_point_id(img_entity.id, box_idx)
                    payload = {
                        "image_id":    img_entity.id,
                        "box_index":   box_idx,
                        "label":       garment.label.value,
                        "confidence":  round(garment.confidence, 4),
                        "is_fallback": garment.label.value == "full",
                        "area_ratio":  round(garment.area_ratio, 4),
                    }
                    points_batch.append(PointStruct(id=point_id, vector=vector, payload=payload))

                images_v2_client.upsert_batch(points_batch)
                total_points += len(points_batch)
                total_ok += 1
                logger.debug("image_id=%d → %d point(s) OK.", img_entity.id, len(points_batch))

            except Exception as exc:
                logger.warning("image_id=%d FAILED: %s", img_entity.id, exc)
                total_fail += 1

    elapsed = time.time() - t_start
    logger.info(
        "Hoàn thành: %d OK, %d FAIL, %d points tổng. Thời gian: %.1fs.",
        total_ok, total_fail, total_points, elapsed,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Re-index toàn bộ ảnh vào images_v2 (YOLO crop)")
    parser.add_argument("--batch-size", type=int, default=16, help="Số ảnh xử lý mỗi batch")
    parser.add_argument("--limit",      type=int, default=None, help="Giới hạn số ảnh (None = tất cả)")
    parser.add_argument("--dry-run",    action="store_true", help="Chỉ log, không upsert")
    args = parser.parse_args()
    main(args.batch_size, args.limit, args.dry_run)
