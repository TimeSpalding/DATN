import gc
import logging
import io
import json
import time
import datetime
import os
import re
import torch
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal
from PIL import Image
from sqlalchemy.orm import Session
from sqlalchemy import select
from qdrant_client.http.models import PointStruct

from app.clients.postgres_client import ImageEntity
from app.clients.minio_client import minio_client_wrapper
from app.embedding.clip_model import clip_model
from app.qdrant.client import qdrant_client_wrapper
from app.qdrant.images_v2_client import images_v2_client, encode_point_id
from app.detector.garment_detector import garment_detector, GarmentLabel


logger = logging.getLogger(__name__)

# Số luồng tải song song từ MinIO. Đây là I/O-bound (network call) nên chạy
# song song giúp giảm tổng thời gian chờ thay vì tải tuần tự từng ảnh.
_DOWNLOAD_WORKERS = max(1, int(os.environ.get("INDEXING_DOWNLOAD_WORKERS", "4")))
_SCAN_LIMIT = max(1, int(os.environ.get("INDEXING_SCAN_LIMIT", "16")))

def process_pending_images(db: Session):
    """
    Polls the database for images with index_status='PROCESSING' and processes them:
    - Generates CLIP embedding and upserts to Qdrant.
    - Updates status to 'INDEXED'.
    """
    query = select(ImageEntity).where(
        ImageEntity.index_status == 'PROCESSING',
        ImageEntity.is_deleted.is_(False)
    )

    pending_images = db.execute(query.limit(_SCAN_LIMIT)).scalars().all()

    if not pending_images:
        return

    print(f"\n🔍 [SCAN] Found {len(pending_images)} images with PROCESSING status to index.")
    logger.info(f"Found {len(pending_images)} images with PROCESSING status to index.")
    valid_ids = []
    failed_ids = []
    image_cache_dict: dict[int, Image.Image] = {}

    clip_start_time = time.time()

    def _download_and_decode(image: ImageEntity) -> Image.Image:
        image_bytes = minio_client_wrapper.download_image(image.storage_path)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img.thumbnail((1000, 1000))
        return img

    with ThreadPoolExecutor(max_workers=_DOWNLOAD_WORKERS) as executor:
        future_to_image = {
            executor.submit(_download_and_decode, image): image
            for image in pending_images
        }
        for future in as_completed(future_to_image):
            image = future_to_image[future]
            try:
                image_cache_dict[image.id] = future.result()
                valid_ids.append(image.id)
            except Exception as e:
                logger.error(f"Failed to load image id={image.id}: {e}")
                failed_ids.append(image.id)

    if image_cache_dict:
        try:
            valid_images = [image_cache_dict[image_id] for image_id in valid_ids]
            embeddings = clip_model.get_image_embeddings(valid_images)

            attributes_list = clip_model.predict_all_attributes_batch(embeddings)
            attributes_by_id = dict(zip(valid_ids, attributes_list))

            # Dict lookup O(1) thay vì next() O(n) bên trong vòng lặp -> tránh O(n^2)
            entity_map = {img.id: img for img in pending_images}

            payloads = []
            for img_id in valid_ids:
                img_entity = entity_map[img_id]
                filename = img_entity.original_filename or ""
                
                metadata = attributes_by_id.get(img_id)
                if metadata:
                    match = re.search(r'_BRAND_(.*?)_BRAND_', filename)
                    if match:
                        manual_brand = match.group(1).strip().lower() # Giữ chữ thường như đã thống nhất
                        metadata["brand"] = manual_brand
                        logger.info(f"[MANUAL OVERRIDE] Ghi đè brand='{manual_brand}' cho image id={img_id}")
                        
                        # AI tự động nạp brand này vào từ điển text search (nếu chưa có)
                        clip_model.add_dynamic_brand(manual_brand)
                        
                        clean_filename = re.sub(r'_BRAND_.*?_BRAND_', '', filename)
                        img_entity.original_filename = clean_filename
                        filename = clean_filename

                payloads.append({
                    "image_id": img_entity.id,
                    "original_filename": filename,
                    "uploaded_by": img_entity.uploaded_by,
                    "metadata_ai": metadata
                })

            qdrant_client_wrapper.upsert_vectors(point_ids=valid_ids, vectors=embeddings, payloads=payloads)

            # ── BƯỚC BỔ SUNG: Đánh chỉ mục YOLO crop vào images_v2 ──────────
            # Chạy GarmentDetector cho từng ảnh, encode crop, upsert vào images_v2.
            # Thực hiện sau khi đã upsert xong images_full để không block commit DB.
            _index_garment_crops(valid_ids, image_cache_dict)

            for image in pending_images:
                if image.id in valid_ids:
                    image.index_status = 'INDEXED'
                    image.indexed_at = datetime.datetime.utcnow()
                    image.updated_at = datetime.datetime.utcnow()
                    image.metadata_ai = attributes_by_id.get(image.id)

            logger.info(f"Successfully batch indexed {len(valid_ids)} images with AI metadata.")

            clip_duration = time.time() - clip_start_time
            speed = len(valid_ids) / clip_duration if clip_duration > 0 else 0
            print(
                f"\n========================================\n"
                f"⏱️ [SPEED CLIP] Xử lý xong {len(valid_ids)} ảnh trong "
                f"{clip_duration:.2f}s. Tốc độ: {speed:.2f} ảnh/giây.\n"
                f"========================================\n"
            )
        except Exception as e:
            logger.error(f"Batch embedding or upsert failed: {e}")
            failed_ids.extend(valid_ids)

    if failed_ids:
        for image in pending_images:
            if image.id in failed_ids:
                image.index_status = 'FAILED'
                image.updated_at = datetime.datetime.utcnow()
                logger.error(f"Marked image id={image.id} as FAILED.")

    try:
        db.commit()
    except Exception as e:
        logger.error(f"Database commit failed: {e}")
        db.rollback()

    # Dọn rác bộ nhớ CLIP ngay sau khi commit
    try:
        del valid_images
        del embeddings
    except NameError:
        pass

    for cached_image in image_cache_dict.values():
        try:
            cached_image.close()
        except Exception:
            pass

    image_cache_dict.clear()

    # Giải phóng VRAM cache nếu đang chạy trên GPU, bỏ qua nếu CPU-only
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    logger.info("[MEM] Đã dọn sạch bộ nhớ sau batch.")


def _index_garment_crops(image_ids: list[int], image_cache: dict[int, Image.Image]) -> None:
    """
    Chạy YOLOv8n Detector trên mỗi ảnh, encode từng crop bằng FashionCLIP,
    rồi upsert vào collection images_v2 trong Qdrant.

    Mỗi ảnh có thể tạo ra 1..N điểm trong images_v2:
      - 1 điểm: nếu fallback (không detect được box nào) → toàn ảnh
      - N điểm: N BBox detect được (N ≥ 1)

    Point ID: encode_point_id(image_id, box_index) = image_id * 100 + box_index
    Payload : image_id, box_index, label, confidence, is_fallback, area_ratio

    Thực hiện best-effort: lỗi từng ảnh chỉ log warning, không làm cả batch thất bại.
    """
    if garment_detector.is_stub:
        logger.info(
            "[IndexGarmentCrops] GarmentDetector chạy ở chế độ STUB "
            "(ONNX model chưa được mount). Bỏ qua indexing images_v2."
        )
        return

    t0 = time.time()
    total_points = 0

    for img_id in image_ids:
        img = image_cache.get(img_id)
        if img is None:
            logger.warning("[IndexGarmentCrops] Không tìm thấy ảnh id=%d trong cache.", img_id)
            continue

        try:
            # Xóa points cũ (nếu ảnh đã được index lại)
            images_v2_client.delete_by_image_id(img_id)

            # Phát hiện tất cả các món đồ trong ảnh
            garments = garment_detector.detect(img)

            # Encode tất cả crops trong 1 lần gọi batch để tối ưu throughput
            crops = [g.crop for g in garments]
            vectors = clip_model.get_image_embeddings(crops)   # list[list[float]]

            points_batch: list[PointStruct] = []
            for box_idx, (garment, vector) in enumerate(zip(garments, vectors)):
                point_id = encode_point_id(img_id, box_idx)
                payload = {
                    "image_id":    img_id,
                    "box_index":   box_idx,
                    "label":       garment.label.value,
                    "confidence":  round(garment.confidence, 4),
                    "is_fallback": garment.label.value == "full",
                    "area_ratio":  round(garment.area_ratio, 4),
                }
                points_batch.append(PointStruct(id=point_id, vector=vector, payload=payload))

            images_v2_client.upsert_batch(points_batch)
            total_points += len(points_batch)

            logger.debug(
                "[IndexGarmentCrops] image_id=%d → %d point(s) upserted vào images_v2.",
                img_id, len(points_batch),
            )

        except Exception as exc:
            logger.warning(
                "[IndexGarmentCrops] Lỗi khi xử lý image_id=%d: %s", img_id, exc
            )

    elapsed = time.time() - t0
    logger.info(
        "[IndexGarmentCrops] Hoàn thành: %d ảnh → %d points vào images_v2 trong %.2fs.",
        len(image_ids), total_points, elapsed,
    )