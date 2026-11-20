# Điều tra Issue #19: Tính có thể tái lập (Reproducibility) của benchmark thử đồ ảo chưa ổn định

## 1. Bối cảnh và phạm vi kiểm tra

Trong Tuần 6 và Tuần 7, nhóm sử dụng hai quy trình đánh giá CatVTON riêng biệt:
- Kịch bản client-API (`scripts/benchmark_vton_profiling.py`) gọi qua đường hầm `ngrok` tới notebook `backend-ai/notebooks/catvton-api-server.ipynb` (25 cặp từ `datacard/`).
- Notebook đánh giá hàng loạt (`Evidence/W07/vton-evalution-metrics.ipynb`) chạy trực tiếp trên Kaggle `2x Tesla T4` (100 cặp ghép từ `/kaggle/input/datasets/js042710/tuan6-vton-123`).

Khi đối chiếu lại mã nguồn để chạy lặp kiểm chứng ở Tuần 8, nhóm ghi nhận nhiều điểm làm kết quả giữa các lần chạy không đồng nhất hoặc người khác trong nhóm không thể chạy lại giống hệt.

---

## 2. Các nguyên nhân kỹ thuật đã xác định trong mã nguồn

| STT | Thành phần / vị trí mã nguồn | Nguyên nhân gây mất tái lập | Tác động quan sát được |
| :---: | :--- | :--- | :--- |
| 1 | `Evidence/W07/vton-evalution-metrics.ipynb` (Cell 4, `PERSON_DIR`/`CLOTH_DIR`) | Trỏ tới dataset Kaggle cá nhân (`js042710/tuan6-vton-123`). Khi kiểm tra bằng `kaggle datasets files` từ tài khoản khác (`neitng`), API trả về `403 Forbidden`. | Thành viên khác không truy cập được đúng tập 100 cặp đầu vào nếu không có manifest kèm checksum lưu trong repo. |
| 2 | `Evidence/W07/vton-evalution-metrics.ipynb` (Cell 4, `build_pairs`) | Tự động ghép cặp bằng `os.listdir` (đã sort) + `cloths[rng.randint(len(cloths))]` theo độ dài thư mục. Chỉ cần thêm hoặc xóa 1 tệp ảnh trong thư mục áo là toàn bộ chỉ số mảng `rng.randint` bị dịch, làm đổi hết các cặp phía sau. | Không đảm bảo đóng băng tập cặp khi dữ liệu đầu vào thay đổi nhẹ; phần chạy `N_SAMPLES` dùng tiếp `rng.choice` thứ hai nên càng khó đối soát. |
| 3 | `Evidence/W07/vton-evalution-metrics.ipynb` (Cell 4, `detect_categories`) | Dùng zero-shot `openai/clip-vit-base-patch32` tự đoán `upper`/`lower`/`overall` lúc chạy thay vì đọc nhãn đã gán cố định trong manifest. | Nếu cập nhật `transformers` hoặc thay đổi prompt/mẫu đệm, phân loại mặt nạ (`upper` vs `overall`) có thể nhảy giữa các lần chạy. |
| 4 | `backend-ai/notebooks/catvton-api-server.ipynb` (Cell 2 & Cell 3) & `backend-ai/app/api/routes/tryon.py` | API `/api/tryon` không nhận tham số `seed` và lời gọi `pipeline(...)` trong Cell 3 không truyền `generator`. Đồng thời Cell 2 bật `torch.backends.cudnn.benchmark = True`. | Gọi API hai lần liên tiếp với cùng 1 cặp ảnh sẽ sinh ra kết quả nhiễu khởi tạo khác nhau, đồng thời `cudnn.benchmark = True` tự chọn kernel theo trạng thái GPU tại thời điểm chạy. |
| 5 | `Evidence/W07/vton-evalution-metrics.ipynb` (Cell 1 & Cell 2) | Cài đặt không ghim phiên bản (`git clone --depth 1 CatVTON.git`, `git+https://github.com/facebookresearch/detectron2.git`, `huggingface_hub>=0.34.0,<2.0`). Khi `git clone` GitHub thất bại (lỗi exit code 128 trong log Cell 1), notebook tự fallback sang HuggingFace Space (`zhengchong/CatVTON`). | Hai lần chạy cách nhau vài tuần có thể kéo commit khác nhau của CatVTON/diffusers/detectron2; log Cell 2 còn báo `[WARN] xFormers not available` dù báo cáo W07 giả định đã bật xFormers. |
| 6 | `Evidence/W07/vton-evalution-metrics.ipynb` (Cell 3 & Cell 5, 2 GPUs) | Sử dụng `ThreadPoolExecutor(2)` chạy song song `cuda:0` và `cuda:1` trong cùng một tiến trình Python; chưa đặt `torch.backends.cudnn.deterministic = True` và seed chỉ dùng chung 1 số `SEED=42` cho mọi cặp, không lưu metadata phần cứng/commit vào artifact xuất ra. | Khi chạy lại bằng 1 GPU so với 2 GPU, thứ tự thực thi luồng và trạng thái cuDNN toàn cục có thể tạo sai lệch số học dấu phẩy động. |
| 7 | `scripts/benchmark_vton_profiling.py` vs `Evidence/W07/vton-evalution-metrics.ipynb` | Hai kịch bản dùng cách đo `SSIM/PSNR ngoài mặt nạ` khác nhau: W06 (`benchmark_vton_profiling.py`) lấy 15% đỉnh trên + 15% đáy dưới ảnh, còn W07 dùng `~dilate(mask, 16px)`. Ngoài ra Cell 5 W07 không lưu file thời gian nên Cell 13 bỏ qua cột tốc độ (`[INFO] Chưa có số liệu thời gian`). | Số liệu SSIM/PSNR giữa W06 (`0.9462`) và W07 (`0.9868`) không so sánh trực tiếp trên cùng một định nghĩa vùng đo. |

---

## 3. Kế hoạch khắc phục và kiểm chứng cho Issue #19

1. Đóng băng bộ kiểm thử `Evidence/W08/frozen_pairs_w08.json` (20 cặp có đường dẫn trong repo, `category` tường minh, `pair_seed` cố định theo từng `pair_id` và `SHA-256` cho từng ảnh đầu vào).
2. Cập nhật `backend-ai/app/api/routes/tryon.py`, `backend-ai/notebooks/catvton-api-server.ipynb` và `scripts/benchmark_vton_profiling.py` để truyền `seed`, tắt `cudnn.benchmark`, bật `cudnn.deterministic = True`, đồng bộ 1 công thức đo ngoài mặt nạ (`~dilate(mask, 16px)`) và ghi đầy đủ metadata môi trường (`catvton_commit`, phiên bản thư viện, GPU, latency từng pha).
3. Chạy kiểm chứng thực nghiệm trên Kaggle GPU (`Run A` vs `Run B` cùng seed trên `cuda:0`, so với `Run C` trên `cuda:1` và so với chế độ không khóa seed) để đo chính xác độ lệch pixel (`MAE`, `MaxAbsDiff`) và độ lệch metric.
