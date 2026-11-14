# Minh chứng tiến độ tuần 6 (EVIDENCE / W06)

## Hệ thống thương mại điện tử thời trang đa phương thức và thử đồ ảo CatVTON

- **Đơn vị đào tạo**: Học viện Công nghệ Bưu chính Viễn thông (PTIT) – Khoa Công nghệ Thông tin (Khóa D21)
- **Mốc thời gian**: 01/11/2026 – 07/11/2026
- **Nhãn phiên bản Git**: `w06`
- **Báo cáo chi tiết đính kèm**:
  - `Evidence/W06/Báo cáo tiến độ đồ án tốt nghiệp tuần 6.docx`
  - `Evidence/W06/Báo cáo nghiên cứu phân rã hiệu năng và tối ưu hóa CatVTON GPU.docx`
  - `Evidence/W06/Báo cáo quyển đồ án cập nhật tuần 6.docx`
  - `Evidence/W06/Bao_cao_danh_gia_25_cap_thu_do_CatVTON_va_phan_tich_loi_tiennd.xlsx`

---

## 1. Phân công nhiệm vụ và cấu trúc bàn giao tuần 6

| Thành viên | Nhiệm vụ kỹ thuật trọng tâm tuần 6 | Hiện vật bàn giao (Deliverables) |
| :--- | :--- | :--- |
| **Lê Như Tùng** | - Đo đạc phân rã độ trễ 4 pha GPU có đồng bộ phần cứng `torch.cuda.synchronize()`.<br>- Thực nghiệm đối sánh chế độ dấu phẩy động Mixed Precision (`FP32`, `FP16`, `BF16`) trên GPU NVIDIA Tesla T4.<br>- Vận hành máy chủ suy diễn trực tuyến phục vụ kiểm thử mở rộng 25 cặp hoán đổi. | - `Evidence/W06/vton-profiling-optimization/results/precision_ablation.csv`<br>- `Evidence/W06/vton-profiling-optimization/results/profiling_latency.csv`<br>- `Evidence/W06/figures/fig_w6_latency_breakdown.png`<br>- `Evidence/W06/figures/fig_w6_precision_ablation.png` |
| **Nguyễn Đình Tiến** | - Thiết kế và kiểm định thị giác trực tiếp toàn bộ 25 cặp thử đồ hoán đổi chéo (`Unpaired`, `P-01` đến `P-25`), lập bảng phân tích 5 nhóm lỗi thực tế.<br>- Khắc phục toàn diện phản hồi giao diện (`FeedbackFE`), đồng bộ hệ thống thiết kế Grand Atelier trên 48 tệp React và kiểm thử 37 trạng thái trên Chrome (`1440px`, `1080px`, `390px`). | - `Evidence/W06/Bao_cao_danh_gia_25_cap_thu_do_CatVTON_va_phan_tich_loi_tiennd.xlsx`<br>- `Evidence/W06/results/` (25 ảnh kết quả & 25 ảnh ghép)<br>- `frontend/src/` (48 tệp giao diện chuẩn hóa)<br>- `Evidence/W06/Báo cáo tiến độ đồ án tốt nghiệp tuần 6.docx` |

---

## 2. Kết quả phân rã hiệu năng GPU và đối sánh Mixed Precision trên Tesla T4

### 2.1. Phân rã độ trễ các pha xử lý (trung bình trên 25 cặp hoán đổi)

| Pha xử lý | Thời gian đo đạc | Tỷ trọng E2E | Ghi chú cơ chế kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Khởi động nguội (Cold-start)** | `42.80s` | Khởi tạo 1 lần | Nạp trọng số SD-Inpainting, CatVTON Attention, DensePose và SCHP lên VRAM |
| **Tiền xử lý (Preprocessing)** | `0.93s` | `1.7%` | Phân đoạn giải phẫu người và sinh mặt nạ tự động bằng AutoMasker |
| **Suy diễn khuếch tán (UNet Inference)** | `51.32s` | `94.4%` | Thực thi 20 bước lấy mẫu DPM++ 2M Karras ở độ phân giải `768x1024` |
| **Hậu xử lý (Postprocessing)** | `0.29s` | `0.5%` | Giải mã không gian tiềm ẩn qua bộ giải mã VAE và đóng gói PNG |
| **Tổng độ trễ đầu-cuối (E2E Latency)** | `54.37s` | `100.0%` | Bao gồm thời gian truyền tải tệp đa phương tiện qua đường hầm HTTPS |

### 2.2. Kết quả đối sánh độ chính xác số học (Precision Ablation)

| Chế độ | Kiểu dữ liệu | Suy diễn trung bình | Peak VRAM | SSIM vs FP32 | PSNR vs FP32 | Kết luận tương thích trên Tesla T4 (CC 7.5) |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **FP32** | `torch.float32` | `157.56s` | `6.57 GB` | `1.0000` | `inf` | Mốc tham chiếu gốc trên nhân CUDA tiêu chuẩn, độ trễ cao |
| **FP16** | `torch.float16` | `55.95s` | `6.26 GB` | `0.8903` | `23.06 dB` | Tăng tốc `2.82x` nhờ nhân Turing Tensor Cores, duy trì cấu trúc thị giác ổn định |
| **BF16** | `torch.bfloat16` | Thất bại | OOM (`36 GiB`) | `N/A` | `N/A` | Kiến trúc Turing không hỗ trợ phần cứng BF16, gây tràn bộ nhớ khi cấp phát giả lập |

---

## 3. Bảng tổng hợp 25 cặp kiểm thử hoán đổi (Unpaired)

Toàn bộ 25 cặp kiểm thử trong `Evidence/W06/results/` đều sử dụng trang phục đích khác biệt rõ rệt với trang phục gốc của người mẫu và được chấm điểm thị giác trực tiếp trên từng ảnh:

| Mã cặp | Ảnh người mẫu | Ảnh trang phục | Danh mục | Mô tả ca hoán đổi thực tế | Suy diễn | SSIM | PSNR (dB) | Xếp loại thị giác |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **P-01** | `000164_0.jpg` | `011363_1.jpg` | `upper` | Hoán đổi: Áo sơ mi trắng cộc tay cổ trụ -> Áo thun dài tay cổ tròn rộng màu đỏ thẫm | 53.10s | 0.9482 | 26.10 | **Rất tốt (9.1/10)** |
| **P-02** | `000183_0.jpg` | `000192_1.jpg` | `upper` | Hoán đổi: Áo voan trắng sát nách -> Áo phông xanh lá đậm in chữ trắng 'HUSTLE' | 51.92s | 0.9464 | 25.12 | **Tốt - Nhiễu hạt nhẹ (8.4/10)** |
| **P-03** | `000266_0.jpg` | `000532_1.jpg` | `upper` | Hoán đổi: Áo phông đen & quần đen đồng màu -> Áo cộc tay họa tiết hoa văn đỏ - trắng | 50.65s | 0.7545 | 13.66 | **Trung bình - Tràn mặt nạ eo (6.8/10)** |
| **P-04** | `000209_0.jpg` | `017639_1.jpg` | `upper` | Hoán đổi: Áo form rộng xanh rêu tay lửng -> Áo thun tay lỡ kẻ sọc ngang đen - trắng | 51.20s | 0.9824 | 35.47 | **Tốt - Mờ nhẹ sọc dưới (8.6/10)** |
| **P-05** | `000514_0.jpg` | `000118_1.jpg` | `upper` | Hoán đổi: Áo phông trắng cộc tay -> Áo dài tay màu xanh tím than chấm bi trắng | 51.61s | 0.9821 | 38.34 | **Xuất sắc (9.4/10)** |
| **P-06** | `000066_0.jpg` | `017957_1.jpg` | `upper` | Hoán đổi: Áo dài tay cổ tim xanh dương đậm -> Áo phông trắng in biểu tượng 'adidas' đen | 51.31s | 0.9804 | 36.46 | **Tốt - Sót viền cổ tay cũ (8.5/10)** |
| **P-07** | `000466_0.jpg` | `000228_1.jpg` | `upper` | Hoán đổi: Áo thun cổ tim xám sáng trơn -> Áo phông xanh rêu in hình đầu hổ tròn trắng | 51.53s | 0.9682 | 32.13 | **Rất tốt (9.0/10)** |
| **P-08** | `000174_0.jpg` | `000523_1.jpg` | `upper` | Hoán đổi: Áo ba lỗ đen tuyền -> Áo tay ngắn kẻ sọc ngang bản lớn màu pastel xanh - cam - trắng | 51.31s | 0.9768 | 37.21 | **Khá - Loang sắc độ pastel (7.7/10)** |
| **P-09** | `000258_0.jpg` | `000445_1.jpg` | `upper` | Hoán đổi: Áo thun cộc tay xám than tối -> Áo tay hến cổ tròn màu đỏ hồng san hô | 51.49s | 0.9692 | 31.52 | **Tốt - Viền mờ vùng bắp tay (8.5/10)** |
| **P-10** | `000320_0.jpg` | `004702_1.jpg` | `upper` | Hoán đổi: Áo dài tay màu đỏ rượu dáng trùm hông -> Áo phông trắng in chữ đỏ 'IAM SCARLETT' | 51.38s | 0.9764 | 33.13 | **Lỗi nặng - Sót tay & gấu áo cũ (5.8/10)** |
| **P-11** | `000274_0.jpg` | `000154_1.jpg` | `upper` | Hoán đổi: Áo hai dây trắng bản to -> Áo dài tay xanh rêu phối ren cổ cao và gấu áo | 51.48s | 0.8697 | 16.10 | **Khá - Biến đổi bề mặt vải (7.8/10)** |
| **P-12** | `000445_0.jpg` | `009332_1.jpg` | `upper` | Hoán đổi: Áo tay ngắn màu hồng đỏ (tay đặt hông) -> Áo dài tay màu đen cổ đắp chéo chữ V | 51.52s | 0.9636 | 26.99 | **Khá - Nhiễu lưới tay & eo (7.5/10)** |
| **P-13** | `000028_0.jpg` | `013989_1.jpg` | `upper` | Hoán đổi: Áo dài tay đen mỏng xuyên thấu -> Áo dài tay xám tiêu cổ chữ V đan dây chéo | 51.25s | 0.9699 | 31.59 | **Rất tốt (9.2/10)** |
| **P-14** | `000057_0.jpg` | `018626_1.jpg` | `upper` | Hoán đổi: Áo sát nách xếp ly xanh cổ vịt -> Áo polo cộc tay có cổ bẻ màu đỏ tươi | 50.89s | 0.9702 | 31.69 | **Rất tốt (9.1/10)** |
| **P-15** | `000074_0.jpg` | `007874_1.jpg` | `upper` | Hoán đổi: Áo thun trắng in chấm tròn pastel -> Áo tay cánh dơi kẻ sọc ngang xanh - trắng | 50.87s | 0.9751 | 30.00 | **Tốt - Đốm nhiễu nhẹ cổ/tay (8.7/10)** |
| **P-16** | `000082_0.jpg` | `007664_1.jpg` | `upper` | Hoán đổi: Áo henley tay lỡ màu xám chì -> Áo khoét vai màu đỏ tươi họa tiết hoa trắng - xanh | 50.99s | 0.9372 | 20.27 | **Rất tốt (9.2/10)** |
| **P-17** | `000339_0.jpg` | `015158_1.jpg` | `upper` | Hoán đổi: Áo dài tay kẻ sọc xám - trắng -> Áo phông trắng tinh in chữ nhỏ 'RIOT' ngực trái | 50.81s | 0.9844 | 38.95 | **Lỗi nặng - Vệt rách ngực & lem tay (4.8/10)** |
| **P-18** | `004342_0.jpg` | `013593_1.jpg` | `upper` | Hoán đổi: Áo dài tay cổ tròn rộng xám trắng sáng -> Áo dài tay cổ tim màu đen tuyền | 51.12s | 0.9869 | 40.22 | **Xuất sắc (9.4/10)** |
| **P-19** | `017639_0.jpg` | `001614_1.jpg` | `upper` | Hoán đổi: Áo tay ngắn kẻ sọc đen - trắng -> Áo dài tay cổ lọ thấp màu hồng phấn pastel | 50.89s | 0.9633 | 32.23 | **Trung bình - Nhòe mờ ống tay dài (6.5/10)** |
| **P-20** | `011363_0.jpg` | `001255_1.jpg` | `overall` | Hoán đổi (overall): Áo đỏ dài tay & quần đen -> Áo sát nách dáng dài xanh tím than | 50.86s | 0.7864 | 17.09 | **Lỗi nặng - Nhiễu loạn thân dưới (5.2/10)** |
| **P-21** | `000395_0.jpg` | `000370_1.jpg` | `upper` | Hoán đổi: Áo tay lỡ màu xanh tím than trơn -> Áo cộc tay kẻ sọc ngang cam đất - đen đính hoa ngực | 51.40s | 0.9825 | 37.87 | **Xuất sắc (9.3/10)** |
| **P-22** | `000129_0.jpg` | `000347_1.jpg` | `upper` | Hoán đổi: Áo ba lỗ xám ghi dáng nghiêng -> Áo phông đỏ rượu vang in chữ gothic 'Authentic' | 51.38s | 0.9783 | 35.94 | **Rất tốt (9.1/10)** |
| **P-23** | `000001_0.jpg` | `000048_1.jpg` | `upper` | Hoán đổi: Áo dài tay cổ tròn rộng màu đen -> Áo cộc tay xếp ly cổ màu vàng mù tạc | 50.99s | 0.9660 | 26.87 | **Khá - Sót cổ tay áo đen cũ (7.6/10)** |
| **P-24** | `000109_0.jpg` | `000303_1.jpg` | `upper` | Hoán đổi: Áo sát nách đen họa tiết hoa ánh kim -> Áo dài tay kẻ sọc ngang trắng - xanh - đen | 51.53s | 0.9696 | 33.62 | **Rất tốt (9.1/10)** |
| **P-25** | `000020_0.jpg` | `000274_1.jpg` | `overall` | Hoán đổi (overall): Áo trắng tay bèo & chân váy bò -> Áo hai dây dáng dài trắng trên nền trắng | 51.49s | 0.7648 | 14.54 | **Lỗi nặng - Suy biến màu & kiểu dáng (4.2/10)** |

---

## 4. Phân loại 5 nhóm lỗi thị giác thực tế và hướng khắc phục

1. **Sót phần ống tay hoặc gấu áo cũ khi đổi dài sang ngắn (`P-06`, `P-10`, `P-23`, nhẹ ở `P-13`, `P-18`)**: Khi đổi từ áo dài tay tối màu sang áo cộc tay sáng màu, mặt nạ AutoMasker bỏ sót vòng cổ tay hoặc gấu áo trùm hông. Khắc phục bằng cách hợp nhất đầy đủ nhãn `upper_clothes` cũ của SCHP với vùng cánh tay DensePose.
2. **Tràn mặt nạ qua eo khi áo và quần đồng màu đen (`P-03`)**: Trang phục thân trên và quần thân dưới cùng màu đen làm SCHP gộp nhầm đùi trên vào thân áo (`SSIM = 0.7545`). Khắc phục bằng ngưỡng chặn dưới theo tọa độ khớp hông DensePose.
3. **Suy biến điều kiện hóa với trang phục trắng trên nền trắng (`P-17`, `P-25`)**: Áo trắng đặt trên nền ảnh trắng làm suy giảm đặc trưng biên trong Reference UNet, gây xám đục và vệt nhiễu dọc ngực (`P-17`) hoặc biến đổi sang đầm nâu xám (`P-25`). Khắc phục bằng tách mặt nạ tiền cảnh cho ảnh sản phẩm đầu vào.
4. **Nhiễu kết cấu bề mặt và nhòe chi tiết tần số cao (`P-02`, `P-04`, `P-07`, `P-08`, `P-11`, `P-12`, `P-19`)**: Nén không gian tiềm ẩn `8x` của VAE và 20 bước lấy mẫu làm nhòe chữ nhỏ vòng tròn hoặc khái quát hóa sai chất liệu ren/lưới.
5. **Xung đột mặt nạ danh mục `overall` (`P-20`, `P-25`)**: Kích hoạt cờ `overall` trên ảnh trang phục chỉ có thân trên làm xóa vùng quần/chân váy gốc và sinh nhiễu hạt ở thân dưới (`SSIM` giảm xuống `0.7756`).

---

## 5. Chuẩn hóa giao diện thương mại điện tử Grand Atelier (Frontend Audit)

- Đồng bộ hệ thống màu sắc và kiểu chữ kiến trúc **Grand Atelier** (`#FAF8F5`, `#161514`, `#C05A39`), loại bỏ toàn bộ bảng màu công cụ SaaS rời rạc và các thuật ngữ dịch máy thiếu tự nhiên trên `48` tệp mã nguồn trong `frontend/src/`.
- Khắc phục lỗi đường dẫn ảnh tĩnh nội bộ trong `resolveImageUrl`, sửa lỗi hiển thị giá và thao tác trong `CartDrawer`, chuẩn hóa thanh điều hướng đa điểm ngắt (`xl:` cho desktop, ngăn kéo cho màn hình nhỏ hơn `1280px`), sửa lệch chỉ số phân trang tìm kiếm và chuyển đổi hộp thoại sang phần tử gốc `<dialog>`.
- Kiểm chứng thực tế trên trình duyệt Chrome qua `37` trạng thái giao diện ở ba độ phân giải `1440px`, `1080px` và `390px`, bản dựng `npm run build` hoàn tất không phát sinh lỗi.
