"""
scripts/verify_measurements.py
------------------------------
Script kiểm chứng độc lập tính xác thực của:
1. Mô hình YOLOv8n ONNX (Kích thước, định dạng, các lớp hỗ trợ)
2. Độ trễ đo đạc thực tế trên CPU (10 runs độc lập, in log thời gian thực)
3. Nguồn gốc số liệu Recall@K (Truy xuất từ Evidence/W04/test-results.json)
"""

import sys
import os
import time
import io
import json
import numpy as np
from PIL import Image

sys.path.insert(0, r"e:\DATN\backend-ai")

def main():
    print("=" * 70)
    print("  KIỂM CHỨNG TÍNH CHÍNH XÁC CỦA TOÀN BỘ SỐ LIỆU ĐO ĐẠC")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. KIỂM TRA MÔ HÌNH VẬT LÝ VÀ ĐỊNH DẠNG
    # -------------------------------------------------------------
    print("\n[PHẦN 1] KIỂM TRA MÔ HÌNH YOLOV8N ONNX:")
    model_path = r"e:\DATN\backend-ai\models\yolov8n_garment.onnx"
    if not os.path.exists(model_path):
        print(f"  [LỖI] Không tìm thấy file tại: {model_path}")
        return
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"  - Đường dẫn: {model_path}")
    print(f"  - Kích thước file: {size_mb:.2f} MB")

    from app.detector.garment_detector import garment_detector
    print(f"  - Trạng thái STUB mode: {garment_detector.is_stub} (False nghĩa là mô hình nạp thành công)")
    print(f"  - Model path resolved: {garment_detector.model_path}")

    # -------------------------------------------------------------
    # 2. ĐO ĐẠC LẠI ĐỘ TRỄ CPU TRỰC TIẾP (10 VÒNG LẶP)
    # -------------------------------------------------------------
    print("\n[PHẦN 2] ĐO ĐẠC TRỰC TIẾP ĐỘ TRỄ CPU (10 runs thực tế):")
    sample_path = r"e:\DATN\frontend\public\samples\model-1.jpg"
    img = Image.open(sample_path).convert("RGB")

    from app.embedding.clip_model import clip_model

    yolo_times = []
    clip_times = []
    e2e_times = []

    for i in range(10):
        t0 = time.perf_counter()
        
        # Bước 1: YOLO ONNX
        t_y0 = time.perf_counter()
        g = garment_detector.detect_best(img, size=640)
        t_yolo = (time.perf_counter() - t_y0) * 1000.0
        yolo_times.append(t_yolo)

        # Bước 2: FashionCLIP
        t_c0 = time.perf_counter()
        v = clip_model.get_image_embedding(g.crop)
        t_clip = (time.perf_counter() - t_c0) * 1000.0
        clip_times.append(t_clip)

        t_total = (time.perf_counter() - t0) * 1000.0
        e2e_times.append(t_total)
        print(f"  Run {i+1:02d}: YOLO={t_yolo:5.1f}ms | CLIP={t_clip:5.1f}ms | Total={t_total:5.1f}ms | Detected={g.fine_label} (conf={g.confidence:.2f})")

    print(f"\n  --> KẾT QUẢ ĐO ĐẠC ĐỘ TRỄ:")
    print(f"      * YOLOv8n ONNX p50 : {np.percentile(yolo_times, 50):.2f} ms | p95: {np.percentile(yolo_times, 95):.2f} ms")
    print(f"      * FashionCLIP   p50 : {np.percentile(clip_times, 50):.2f} ms | p95: {np.percentile(clip_times, 95):.2f} ms")
    print(f"      * Tổng E2E      p50 : {np.percentile(e2e_times, 50):.2f} ms | p95: {np.percentile(e2e_times, 95):.2f} ms")

    # -------------------------------------------------------------
    # 3. TRUY XUẤT NGUỒN GỐC SỐ LIỆU RECALL@K
    # -------------------------------------------------------------
    print("\n[PHẦN 3] NGUỒN GỐC SỐ LIỆU TRUY XUẤT (RECALL@K / MRR):")
    res_path = r"e:\DATN\Evidence\W04\test-results.json"
    if os.path.exists(res_path):
        with open(res_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        img_res = data.get("image_search", {})
        print(f"  - Tệp gốc: {res_path}")
        print(f"  - Số lượng truy vấn kiểm thử: {img_res.get('count')} queries")
        print("  - Dữ liệu Baseline (Raw Image):")
        print(f"      {img_res.get('baseline')}")
        print("  - Dữ liệu Proposed (Two-Stage Hybrid W04):")
        print(f"      {img_res.get('proposed')}")
    else:
        print(f"  [LỖI] Không tìm thấy file {res_path}")

    print("\n" + "=" * 70)
    print("  KẾT LUẬN KIỂM CHỨNG HOÀN TẤT.")
    print("=" * 70)

if __name__ == "__main__":
    main()
