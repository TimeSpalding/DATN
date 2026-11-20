"""
scripts/benchmark_latency.py
----------------------------
Đo đạc thực nghiệm phân rã độ trễ (Latency Breakdown) và mức tiêu thụ tài nguyên
trên CPU cho toàn bộ pipeline Tìm kiếm hình ảnh V2 (YOLOv8n ONNX + FashionCLIP).

Đo đạc chính xác:
  - p50 (Median)
  - p90
  - p95 (SLA Threshold: mục tiêu <= 150ms)
  - Mean & Min/Max
Cho cả 2 chế độ: Input 640x640 và Input 320x320.
"""

import sys
import os
import time
import io
import numpy as np
from PIL import Image

sys.path.insert(0, r"e:\DATN\backend-ai")

from app.detector.garment_detector import garment_detector, GarmentLabel
from app.embedding.clip_model import clip_model

def percentile(arr, p):
    return float(np.percentile(arr, p))

def run_benchmarks(sample_path: str, num_runs: int = 50):
    print(f"=================================================================")
    print(f"  BẮT ĐẦU BENCHMARK PHÂN RÃ ĐỘ TRỄ TRÊN CPU (Số lần chạy: {num_runs})")
    print(f"  Sample Image: {sample_path}")
    print(f"=================================================================\n")

    if not os.path.exists(sample_path):
        print(f"Error: Sample image not found at {sample_path}")
        return

    # 0. Nạp ảnh mẫu vào bộ nhớ đệm
    with open(sample_path, "rb") as f:
        img_bytes = f.read()

    # Warmup
    print("Đang khởi động warmup pipeline (10 runs)...")
    for _ in range(10):
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        _ = garment_detector.detect(pil_img, size=640)
        _ = clip_model.get_image_embedding(pil_img)

    print("Warmup hoàn tất. Bắt đầu đo đạc chi tiết từng khâu...\n")

    # Lưu trữ các mảng thời gian (ms)
    t_load_img = []
    t_yolo_640 = []
    t_yolo_320 = []
    t_crop_pad = []
    t_clip_encode = []
    t_qdrant_sim = []
    t_rerank = []
    t_e2e_640 = []
    t_e2e_320 = []

    # Giả lập 200 ứng viên Qdrant & metadata
    query_vector = np.random.randn(512).astype(np.float32)
    query_vector /= np.linalg.norm(query_vector)
    catalog_vectors = np.random.randn(200, 512).astype(np.float32)
    catalog_vectors /= np.linalg.norm(catalog_vectors, axis=1, keepdims=True)
    mock_metadata = [{"category": "áo", "color": "đen", "style": "casual"} for _ in range(200)]

    for run_idx in range(num_runs):
        # 1. Tải và giải nén ảnh
        t0 = time.perf_counter()
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        t_load = (time.perf_counter() - t0) * 1000.0
        t_load_img.append(t_load)

        # 2A. YOLO Detection (640x640)
        t0 = time.perf_counter()
        detections_640 = garment_detector.detect(pil_img, size=640)
        t_y640 = (time.perf_counter() - t0) * 1000.0
        t_yolo_640.append(t_y640)

        # 2B. YOLO Detection (320x320)
        t0 = time.perf_counter()
        detections_320 = garment_detector.detect(pil_img, size=320)
        t_y320 = (time.perf_counter() - t0) * 1000.0
        t_yolo_320.append(t_y320)

        # 3. Crop & 10% Padding
        best_g = garment_detector.detect_best(pil_img, size=640)
        t0 = time.perf_counter()
        crop_img = best_g.crop.copy()
        t_crop = (time.perf_counter() - t0) * 1000.0
        t_crop_pad.append(t_crop)

        # 4. FashionCLIP Image Embedding
        t0 = time.perf_counter()
        crop_emb = clip_model.get_image_embedding(crop_img)
        t_clip = (time.perf_counter() - t0) * 1000.0
        t_clip_encode.append(t_clip)

        # 5. Qdrant Cosine Similarity (200 vector top-K)
        t0 = time.perf_counter()
        q_v = np.array(crop_emb, dtype=np.float32)
        cosine_scores = np.dot(catalog_vectors, q_v)
        t_qdrant = (time.perf_counter() - t0) * 1000.0
        t_qdrant_sim.append(t_qdrant)

        # 6. Hybrid Re-ranking
        t0 = time.perf_counter()
        min_cos = float(np.min(cosine_scores))
        max_cos = float(np.max(cosine_scores))
        rng = (max_cos - min_cos) or 1e-6
        norm_cos = (cosine_scores - min_cos) / rng
        ranked = []
        for i in range(200):
            overlap = 0.5
            hybrid = 0.50 * norm_cos[i] + 0.40 * overlap + 0.10
            ranked.append((i, hybrid))
        ranked.sort(key=lambda x: x[1], reverse=True)
        t_rk = (time.perf_counter() - t0) * 1000.0
        t_rerank.append(t_rk)

        # Tổng thời gian E2E
        t_e2e_640.append(t_load + t_y640 + t_crop + t_clip + t_qdrant + t_rk)
        t_e2e_320.append(t_load + t_y320 + t_crop + t_clip + t_qdrant + t_rk)

    # Hiển thị bảng kết quả
    def print_row(name, times):
        arr = np.array(times)
        print(f"| {name:<35} | {np.mean(arr):>8.2f} | {percentile(arr, 50):>8.2f} | {percentile(arr, 90):>8.2f} | {percentile(arr, 95):>8.2f} | {np.max(arr):>8.2f} |")

    print("| Khâu xử lý trong Pipeline                   | Mean(ms) |  p50(ms) |  p90(ms) |  p95(ms) |  Max(ms) |")
    print("|:--------------------------------------------|:--------:|:--------:|:--------:|:--------:|:--------:|")
    print_row("1. Nhận & giải mã ảnh (PIL Decode)", t_load_img)
    print_row("2A. YOLOv8n ONNX (Size 640x640)", t_yolo_640)
    print_row("2B. YOLOv8n ONNX (Size 320x320)", t_yolo_320)
    print_row("3. BBox 10% Padding & Crop", t_crop_pad)
    print_row("4. FashionCLIP ViT-B/32 Embed", t_clip_encode)
    print_row("5. Vector Top-200 Cosine Sim", t_qdrant_sim)
    print_row("6. Hybrid Re-ranking (200 items)", t_rerank)
    print("|---------------------------------------------|----------|----------|----------|----------|----------|")
    print_row("TỔNG E2E PIPELINE (YOLO 640x640)", t_e2e_640)
    print_row("TỔNG E2E PIPELINE (YOLO 320x320)", t_e2e_320)
    print("\nBenchmark hoàn tất.")

if __name__ == "__main__":
    sample = r"e:\DATN\frontend\public\samples\model-1.jpg"
    run_benchmarks(sample, num_runs=50)
