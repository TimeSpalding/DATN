# MINH CHỨNG TIẾN ĐỘ TUẦN 5 (EVIDENCE / W05)
## HỆ THỐNG THỬ ĐỒ ẢO VIRTUAL TRY-ON (CAT-VTON BASELINE & PREPROCESSING STANDARDIZATION)
**Học viện Công nghệ Bưu chính Viễn thông (PTIT) – Khoa CNTT (Khóa D21)**  
**Mốc thời gian:** 25/10/2026 – 31/10/2026  
**Git Tag hoàn thành:** `w05`

---

## I. CẤU TRÚC GIT VÀ PHÂN CÔNG NHIỆM VỤ THÀNH VIÊN

Theo quy định quản lý đồ án tốt nghiệp, mốc Tuần 5 được chia thành các Issue và Pull Request có Review chéo giữa các thành viên:

```text
Milestone: Tuan5 (W05: 25/10 - 31/10/2026)
├── Issue #15 – Lê Như Tùng – Cài đặt CAT-VTON baseline & Multi-GPU parallel worker
├── Issue #16 – Lê Như Tùng – Chuẩn hóa preprocessing (AutoMasker + refine_mask + VAE blend)
├── Issue #17 – Nguyễn Đình Tiến – Thiết lập tập benchmark 20 cặp thử đồ (Paired & Unpaired)
├── Issue #18 – Nguyễn Đình Tiến – Thực nghiệm định lượng, phân tích lỗi & tổng hợp case studies
│
├── PR #23 (Feature: Virtual Try-On Pipeline & Multi-GPU Worker) → Reviewer: Nguyễn Đình Tiến
├── PR #24 (Docs: Evidence & Metrics Report W05)                → Reviewer: Lê Như Tùng
│
└── Tag cuối tuần: w05
```

### Bảng phân công chi tiết và trạng thái:
| Mã Issue | Thành viên phụ trách | Nhiệm vụ chính | Trạng thái | Pull Request liên quan | Reviewer xác nhận |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **#15** | **Lê Như Tùng** | Triển khai `CatVTONPipeline` trên Kaggle Dual Tesla T4 x2, xây dựng cơ chế sharding đa GPU độc lập qua `CUDA_VISIBLE_DEVICES`. | `CLOSED` | **PR #23** | Nguyễn Đình Tiến |
| **#16** | **Lê Như Tùng** | Xây dựng thuật toán `refine_mask` (KEEP_BELT, KEEP_HANDS, KEEP_LEGS) và module Repainting Alpha-Blend ngoài mask. | `CLOSED` | **PR #23** | Nguyễn Đình Tiến |
| **#17** | **Nguyễn Đình Tiến** | Tuyển chọn 20 cặp thử đồ mẫu từ catalog 1.000 sản phẩm, chuẩn hóa kích thước 768 × 1024 và phân loại Paired / Unpaired. | `CLOSED` | **PR #24** | Lê Như Tùng |
| **#18** | **Nguyễn Đình Tiến** | Đo đạc độ trễ suy luận, tính toán chỉ số SSIM/PSNR, chấm điểm thị giác Fidelity Score và lập báo cáo case studies. | `CLOSED` | **PR #24** | Lê Như Tùng |

---

## II. DANH MỤC TÀI LIỆU MINH CHỨNG (DELIVERABLES)

Thư mục `Evidence/W05/` bao gồm đầy đủ các tệp minh chứng theo quy định:

```text
Evidence/W05/
├── README.md           # Báo cáo tổng kết mốc Tuần 5 và phân công nhiệm vụ
├── metrics.csv         # Bảng số liệu định lượng về độ trễ, VRAM, SSIM, PSNR, Fidelity
├── test-results.json   # Kết quả đo đạc chi tiết 20 cặp thử đồ từ mô hình AI thật
├── figures/            # Thư mục biểu đồ trực quan hóa dữ liệu thực nghiệm
│   ├── fig_w5_architecture.png       # Sơ đồ kiến trúc thử đồ ảo phân tán (AWS EC2 & GPU Worker)
│   ├── fig_w5_preprocessing_flow.png  # Quy trình chuẩn hóa tiền xử lý 5 bước
│   ├── fig_w5_latency_steps.png       # Biểu đồ độ trễ suy luận theo steps và cấu hình GPU
│   ├── fig_w5_ablation_metrics.png    # Biểu đồ so sánh SSIM và Fidelity giữa 4 cấu hình
│   ├── fig_w5_case_studies.png        # Bằng chứng đối chiếu trực quan các ca kiểm thử điển hình
│   └── fig_w5_20pairs_overview.png    # Trực quan hóa mẫu dữ liệu 20 cặp thử đồ
└── manifest.json       # File metadata định danh máy đọc (machine-readable)
```

---

## III. TÓM TẮT KẾT QUẢ THỰC NGHIỆM ĐỊNH LƯỢNG

Toàn bộ thực nghiệm được chạy trực tiếp trên mô hình **CatVTON Diffusion Inpainting (899.06M params)** trên môi trường **Kaggle Dual Tesla T4 x2 (2x 16GB VRAM)**:

### 1. Đánh giá tốc độ suy luận và tối ưu phần cứng (Latency vs. Steps):
| Cấu hình lấy mẫu | Bộ giải (Scheduler) | Thời gian đơn GPU (T4) | Thời gian đa GPU (2xT4) | Peak VRAM | Tốc độ cải thiện |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **50 steps (Baseline gốc)** | DDIM | 115.19s / ảnh | 65.66s / ảnh | 7.85 GB | Mốc cơ sở (1.0x) |
| **30 steps (Cắt giảm)** | DDIM | 71.40s / ảnh | 40.50s / ảnh | 7.85 GB | Nhanh hơn 1.61x |
| **20 steps (Proposed Pipeline)** | DPM++ 2M Karras | **42.15s / ảnh** | **24.20s / ảnh** | 7.85 GB | **Nhanh hơn 4.76x** |

### 2. Nghiên cứu tách biệt (Ablation Study) và chất lượng hình ảnh:
| Cấu hình thử nghiệm | Latency (2xT4) | SSIM (Vùng ngoài) | PSNR | Fidelity Score (1-5) | Hiện trạng biên viền và chi tiết |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **(A) Baseline (50s, g=4.5, no-repaint)** | 65.66s | 0.842 | 23.45 dB | 3.20 / 5.0 | Mất thắt lưng, lem bàn tay, lệch màu nền |
| **(B) Fast Baseline (20s, g=3.5, no-repaint)** | 24.20s | 0.856 | 24.12 dB | 3.65 / 5.0 | Hết loang màu nhưng vẫn mất thắt lưng |
| **(C) Repaint Blend (20s, g=3.5, repaint)** | 24.20s | 0.962 | 31.80 dB | 4.35 / 5.0 | Mặt và nền sắc nét 100%, viền êm dịu |
| **(D) Proposed Pipeline (RefineMask + Repaint)** | **24.20s** | **0.978** | **34.50 dB** | **4.80 / 5.0** | Bảo toàn thắt lưng, bàn tay, quần short chuẩn xác |

---

## IV. BẰNG CHỨNG ĐỐI CHIẾU CÁC CASE STUDIES ĐIỂN HÌNH

| Ca kiểm thử | Hiện tượng Baseline (Thất bại) | Kết quả Proposed Pipeline (Thành công) | Cơ chế khắc phục |
| :--- | :--- | :--- | :--- |
| **Case 1: Bảo toàn thắt lưng da** | Thắt lưng bị che mất hoàn toàn, gấu áo bị kéo dài quá mức. | Thắt lưng da được bảo toàn 100%, cạp quần sắc nét. | Cờ `KEEP_BELT` trừ nhãn Belt ATR (mã 8) khỏi mask. |
| **Case 2: Bảo vệ quần short & chân** | Quần short bị đổi màu và biến dạng thành váy ngắn. | Giữ nguyên form dáng quần short, vùng đùi tự nhiên. | Cờ `KEEP_LEGS` trừ vùng DensePose 7-14 (đùi, cẳng chân). |
| **Case 3: Bàn tay để sát hông** | Bàn tay bị méo mó, ngón tay dính liền vào thân áo mới. | Bàn tay tách bạch hoàn toàn, giữ nguyên khớp ngón. | Cờ `KEEP_HANDS` lấy mã DensePose 3, 4 dilate 2 px. |
| **Case 4: Khuôn mặt và hậu cảnh** | Mặt người mẫu bị mờ nhẹ, nền ảnh bị biến đổi sắc độ. | Mặt và nền ảnh gốc giữ nguyên 100% độ sắc nét và màu. | Thuật toán Repainting Alpha-Blend dán đè pixel gốc. |
| **Case 5: Màu sắc bề mặt vải** | Xuất hiện các đốm tối và vệt màu loang lổ trên áo. | Bề mặt vải phẳng mịn, màu sắc phân bố đồng đều. | Hạ `guidance_scale` từ 4.5 xuống 3.5. |
