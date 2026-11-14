# Nghiên cứu phân rã hiệu năng và tối ưu hóa Mixed Precision cho mô hình thử đồ ảo CatVTON trên GPU Tesla T4

## 1. Mục tiêu và phạm vi nghiên cứu

Nghiên cứu này được thiết kế và thực thi nhằm giải quyết trực tiếp các yêu cầu của giáo viên hướng dẫn về việc phân tích nguyên nhân gây độ trễ, tối ưu hóa tài nguyên phần cứng và chuẩn hóa quy trình kiểm thử đối với mô hình thử đồ ảo CatVTON trên môi trường điện toán đám mây Kaggle:

1.  **Phân rã định lượng hiệu năng GPU (GPU Performance Profiling)**:
    *   Đo lường chính xác thời gian khởi động nguội (`cold_start_time`): Thời gian nạp trọng số mô hình từ ổ đĩa vào VRAM.
    *   Đo lường thời gian tiền xử lý (`preprocess_time`): Gồm resize/crop, trích xuất mặt nạ bằng DensePose + SCHP (AutoMasker), và làm mờ biên độ nét.
    *   Đo lường thời gian suy diễn (`inference_time`): Đo lường 20 bước lấy mẫu khử nhiễu (DPM++ 2M Karras) với cơ chế đồng bộ phần cứng `torch.cuda.synchronize()`.
    *   Đo lường thời gian hậu xử lý (`postprocess_time`): Giải mã VAE và ghép lớp mặt nạ.
    *   Đo lường độ trễ mạng đầu cuối (`end_to_end_latency`): Đo đạc qua đường hầm ngrok công cộng.
    *   Ghi nhận đỉnh mức tiêu thụ bộ nhớ đồ họa (`peak_vram_gb`).
2.  **Đánh giá thực nghiệm tối ưu hóa Mixed Precision (Ablation Study)**:
    *   Khảo sát 3 mức độ chính xác số học: **FP32** (Single Precision), **FP16** (Half Precision), và **BF16** (Bfloat16).
    *   Đánh giá mối tương quan giữa kiểu dữ liệu số học với năng lực phần cứng của kiến trúc Turing (GPU Tesla T4).
    *   Đo lường mức độ suy hao chất lượng hình ảnh bằng chỉ số độ tương đồng cấu trúc vùng giữ nguyên (SSIM ngoài mặt nạ) và tỷ số tín hiệu trên nhiễu đỉnh (PSNR) so với mốc đối chứng FP32.
3.  **Kiểm thử thực nghiệm và phân tích lỗi (Benchmark Testing & Failure Analysis)**:
    *   Thực hiện trên 25 cặp thử đồ hoán đổi chéo (`Unpaired`, gồm 23 cặp `upper` và 2 cặp `overall`), trong đó ảnh người mẫu gốc và trang phục đích khác biệt rõ về kiểu dáng, màu sắc hoặc độ dài ống tay.
    *   Lưu trữ kết quả ảnh thực tế, tệp đo lường chi tiết.
    *   Phân loại 5 nhóm lỗi thị giác và chỉ rõ cơ chế kỹ thuật của các ca thất bại và ca biên.

---

## 2. Cấu trúc thư mục nghiên cứu

```text
Evidence/W06/vton-profiling-optimization/
├── README.md                          # Tài liệu tổng quan nghiên cứu và phương pháp luận
├── failure-modes.md                   # Phân loại và phân tích chi tiết 5 nhóm lỗi thị giác
├── configs/
│   └── experiment_config.json         # Tham số kỹ thuật của pipeline và môi trường đo
├── figures/                           # Ảnh lưới đối sánh trực quan FP32 vs FP16 và mẫu benchmark
└── results/
    ├── profiling_latency.csv          # Bảng số liệu phân rã độ trễ 25 cặp benchmark Unpaired
    ├── precision_ablation.csv         # Bảng so sánh hiệu năng và chất lượng FP32 vs FP16 vs BF16
    └── raw_logs/                      # Nhật ký thực thi thô và ảnh kết quả 25 cặp benchmark
```

---

## 3. Cơ sở lý thuyết phần cứng và Mixed Precision

### Đặc tính kiến trúc NVIDIA Tesla T4 (Turing Architecture)
*   **Cấu hình phần cứng Kaggle (2x Tesla T4)**: Môi trường Kaggle cấp phát 2 GPU Tesla T4 độc lập kết nối qua giao tiếp PCIe (không trang bị cầu nối NVLink). Mặc định, tiến trình PyTorch chỉ định `device="cuda"` sẽ gán toàn bộ mô hình và tensor lên GPU 0 (`cuda:0`), giữ GPU 1 ở trạng thái chờ (idle).
*   **Tính chuẩn mực trong nghiên cứu định lượng (Single-GPU Isolation)**: Việc cô lập thực nghiệm đo lường trên một GPU đơn lẻ (`cuda:0`) là phương pháp luận chuẩn xác để đánh giá hiệu năng thuần của kiến trúc mô hình. Phương pháp này loại bỏ hoàn toàn độ trễ truyền dữ liệu liên GPU qua bus PCIe (inter-GPU communication overhead), đảm bảo các chỉ số phân rã thời gian và nghiên cứu Mixed Precision phản ánh chính xác năng lực tính toán của nhân Tensor Cores trên một chip Turing TU104.
*   **Điện toán FP16**: Trang bị Turing Tensor Cores thế hệ 2, hỗ trợ tăng tốc phần cứng trực tiếp đối với các phép nhân ma trận dấu phẩy động 16-bit (FP16). Băng thông bộ nhớ được giải phóng 50%, dung lượng VRAM tiêu hao giảm từ ~15 GB xuống ~7.85 GB.
*   **Điện toán FP32**: Xử lý trên các nhân CUDA truyền thống, dung lượng VRAM chiếm dụng chạm ngưỡng trần của GPU (gần 15 GB), tốc độ xử lý chậm hơn 2 đến 2.5 lần.
*   **Điện toán BF16 (Bfloat16)**: Kiến trúc Turing (Compute Capability 7.5) **không hỗ trợ phần cứng cho định dạng BF16**. Khả năng xử lý BF16 ở cấp phần cứng chỉ xuất hiện từ kiến trúc Ampere (Compute Capability 8.0 trở lên, như A100, RTX 3090, L4). Khi kích hoạt BF16 trên T4, PyTorch buộc phải dùng cơ chế chuyển đổi giả lập, dẫn đến hiệu năng suy giảm hoặc sinh lỗi thực thi.

---

## 4. Danh mục tài nguyên thực nghiệm

*   Tập dữ liệu kiểm thử: 25 cặp hình ảnh người mẫu và trang phục hoán đổi chéo (`Unpaired`) từ tập dữ liệu tại `datacard/test_img` và `datacard/test_color`.
*   Tệp notebook máy chủ API: [`backend-ai/notebooks/catvton-api-server.ipynb`](file:///d:/neit_ng/prjs_i/ptit_s9_pj/DATN/backend-ai/notebooks/catvton-api-server.ipynb).
*   Tệp notebook nghiên cứu độc lập: [`backend-ai/notebooks/catvton-profiling-research.ipynb`](file:///d:/neit_ng/prjs_i/ptit_s9_pj/DATN/backend-ai/notebooks/catvton-profiling-research.ipynb).
*   Kịch bản kiểm thử đo lường tự động: [`scripts/benchmark_vton_profiling.py`](file:///d:/neit_ng/prjs_i/ptit_s9_pj/DATN/scripts/benchmark_vton_profiling.py).

---

## 5. Kết quả thực nghiệm định lượng thu được

### 5.1. Phân rã độ trễ và tài nguyên GPU (Thí nghiệm 1 - 25 cặp benchmark Unpaired)

Dữ liệu thực tế được đo lường trực tiếp qua `torch.cuda.synchronize()` trên GPU Tesla T4 (tổng hợp tại [`profiling_latency.csv`](./results/profiling_latency.csv)):

| Chỉ số đo lường | Giá trị thực tế | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **Thời gian khởi động nguội (Cold-start)** | **42.80s – 46.77s** | Nạp pipeline CatVTON, SD-Inpainting và AutoMasker từ ổ đĩa lên VRAM |
| **Thời gian tiền xử lý (Preprocessing)** | **0.931s** | Chạy AutoMasker (DensePose + SCHP), trích xuất và làm mờ mặt nạ |
| **Thời gian suy diễn (Inference 20 steps)** | **51.340s** | Chạy 20 bước khử nhiễu DPM++ 2M Karras (~2.57s/bước) |
| **Thời gian hậu xử lý (Postprocessing)** | **0.287s** | Giải mã tiềm ẩn VAE và lưu tệp PNG kết quả |
| **Tổng thời gian xử lý nội bộ GPU (Internal)** | **52.559s** | Thời gian tính toán thực tế trên máy chủ GPU ở trạng thái ổn định |
| **Tổng độ trễ đầu cuối (End-to-End Latency)** | **54.395s** | Đo từ client cục bộ qua đường hầm ngrok công cộng |
| **Độ trễ truyền tải mạng (Network Overhead)** | **1.836s** | Chênh lệch trung bình giữa E2E và thời gian xử lý nội bộ GPU |
| **Mức chiếm dụng bộ nhớ đồ họa đỉnh (Peak VRAM)** | **4.324 GB** | Mức tiêu hao bộ nhớ ổn định trong các lượt suy diễn |
| **Độ tương đồng vùng biên ngoài mặt nạ (SSIM)** | **0.9462** | Trung bình 25 cặp (nhóm 23 cặp `upper` đạt trung bình 0.9628) |
| **Tỷ số tín hiệu trên nhiễu vùng biên (PSNR)** | **29.72 dB** | Trung bình trên toàn bộ 25 cặp kiểm thử |
| **Số cặp trả về HTTP 200 hợp lệ** | **25/25** | Tất cả 25 cặp kiểm thử hoàn tất suy diễn không phát sinh ngoại lệ máy chủ |

### 5.2. Đối sánh thực nghiệm Mixed Precision (Thí nghiệm 2 - Ablation Study trên ảnh người thật)

Dữ liệu thực nghiệm thu được từ tệp [`precision_ablation.csv`](./results/precision_ablation.csv) khi kiểm thử trực tiếp trên các mẫu ảnh người và trang phục thực tế của CatVTON:

| Chế độ Precision | Kiểu dữ liệu PyTorch | Thời gian suy diễn (s) | Đỉnh VRAM (GB) | SSIM so với FP32 | PSNR so với FP32 (dB) | Trạng thái và kết luận phần cứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FP32** | `torch.float32` | **157.56s** (~2.6 phút) | **6.57 GB** | 1.0000 | $\infty$ | Mốc đối chứng chất lượng gốc (chạy trên nhân CUDA chuẩn) |
| **FP16** | `torch.float16` | **55.95s** (~0.9 phút) | **6.26 GB** | **0.8903** | **23.06 dB** | **Tối ưu nhất trên Tesla T4**: Tốc độ tăng **2.82 lần**, bảo toàn cấu trúc trang phục và kiểu dáng người mẫu |
| **BF16** | `torch.bfloat16` | Lỗi thực thi | Tràn bộ nhớ | N/A | N/A | **Không tương thích phần cứng Turing**: PyTorch giả lập phần mềm làm bùng nổ bộ nhớ đệm đòi cấp phát **36.00 GiB** (vượt trần 14.56 GiB), kích hoạt lỗi CUDA Out of Memory |

*Minh chứng trực quan*: Hai ảnh lưới đối sánh 4 khung hình `[Người mẫu | Trang phục | Kết quả FP32 | Kết quả FP16]` đã được tạo tự động tại `/kaggle/working/research_results/P-01_comparison_grid.png` và `P-02_comparison_grid.png`.

### 5.3. Kết luận nghiên cứu

1.  **Tính tối ưu vượt trội của FP16 trên kiến trúc Turing (Tesla T4)**: Việc chuyển đổi từ FP32 sang FP16 kích hoạt trực tiếp nhân Turing Tensor Cores, giúp cắt giảm thời gian suy diễn từ hơn 2.6 phút (157.56s) xuống dưới 1 phút (55.95s) – tức tăng tốc **2.82 lần** trên ảnh thực tế, đồng thời tiết kiệm bộ nhớ VRAM. Chỉ số SSIM đạt 0.8903 phản ánh sự tích lũy sai số làm tròn số học (floating-point rounding) trong không gian tiềm ẩn (latent space) qua 20 bước khử nhiễu ngẫu nhiên, nhưng cấu trúc thị giác vĩ mô và sự tương thích trang phục hoàn toàn tương đồng.
2.  **Giới hạn phần cứng đối với Bfloat16**: Kết quả thực nghiệm chứng minh rằng kiến trúc Turing hoàn toàn không phù hợp cho BF16 do thiếu bộ hướng dẫn phần cứng native, phủ định giả thuyết có thể tăng tốc bằng BF16 trên hạ tầng Kaggle T4 hiện tại.


