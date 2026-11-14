# Phân tích các trường hợp thất bại và biên độ lỗi trong thực nghiệm 25 cặp hoán đổi CatVTON

Tài liệu này phân loại chi tiết các trường hợp thất bại (Failure Cases) và các ca suy giảm chất lượng cục bộ (Marginal / Degraded Cases) được đối chiếu trực quan trên toàn bộ 25 cặp thử đồ hoán đổi (`Unpaired`, từ `P-01` đến `P-25`) chạy thực tế trên mô hình CatVTON (GPU NVIDIA Tesla T4, FP16, 20 bước DPM++ 2M Karras, độ phân giải `768x1024`).

---

## 1. Phân loại 5 nhóm lỗi thị giác thực tế (Taxonomy of Failure Modes)

| Nhóm lỗi | Cơ chế lỗi | Nguyên nhân kỹ thuật gốc rễ | Các cặp ghi nhận |
| :--- | :--- | :--- | :--- |
| **Nhóm 1** | Sót ống tay hoặc gấu áo cũ khi đổi dài sang ngắn (Incomplete Garment Erasure) | Khi hoán đổi từ áo dài tay tối màu sang áo cộc tay sáng màu hoặc dáng ngắn hơn, mặt nạ AutoMasker bỏ sót vùng cổ tay hẹp hoặc phần gấu áo trùm hông của trang phục gốc. | **P-10** (nặng), **P-06**, **P-23**, **P-13** (nhẹ), **P-18** (nhẹ) |
| **Nhóm 2** | Tràn mặt nạ qua ranh giới eo khi áo và quần tiệp màu (Mask Over-segmentation) | Người mẫu mặc áo phông đen đồng màu với quần đen ống rộng khiến mạng phân đoạn người SCHP gộp nhầm phần cạp và đùi quần trên vào mặt nạ thân áo. | **P-03** |
| **Nhóm 3** | Suy biến điều kiện hóa với trang phục trắng trên nền trắng (White-on-White Conditioning Collapse) | Ảnh sản phẩm màu trắng tinh đặt trên nền trắng đồng nhất làm suy giảm tương phản biên trong Reference UNet, gây mất ổn định Cross-Attention. | **P-17**, **P-25** |
| **Nhóm 4** | Nhiễu kết cấu bề mặt và nhòe chữ in nhỏ (Texture Hallucination & Fine Text Blur) | Phép nén không gian tiềm ẩn $8\times$ của VAE và 20 bước lấy mẫu DPM++ làm suy hao tần số không gian cao (chữ nhỏ, sọc mảnh) hoặc khái quát hóa sai chất liệu cục bộ (lưới, ren). | **P-02**, **P-04**, **P-07**, **P-08**, **P-11**, **P-12**, **P-19** |
| **Nhóm 5** | Xung đột mặt nạ danh mục toàn thân (Overall Category Mask Misalignment) | Tham số `category="overall"` xóa toàn bộ vùng quần/chân váy bên dưới trong khi ảnh trang phục đầu vào chỉ chứa phần thân trên, dẫn đến sinh ảo giác ở thân dưới. | **P-20**, **P-25** |

---

## 2. Phân tích chi tiết các ca lỗi điển hình

### Trường hợp 1: P-10 (Sót ống tay dài và gấu áo cũ khi đổi sang áo trắng cộc tay)
* **Cấu hình cặp**: `Unpaired` — Người mẫu `000320_0.jpg` (áo dài tay màu đỏ rượu dáng trùm hông) $\rightarrow$ Trang phục `004702_1.jpg` (áo phông trắng cộc tay in chữ đỏ `"IAM SCARLETT"`).
* **Chỉ số đo đạc**: $\text{SSIM ngoài mặt nạ} = 0.9764$, $\text{PSNR} = 33.13\text{ dB}$, Suy diễn: $51.38\text{s}$.
* **Hiện tượng thị giác**: Nửa ngực trên tái tạo rõ nền vải trắng và dòng chữ đỏ `"IAM SCARLETT"`, nhưng toàn bộ phần cẳng tay và vùng bụng dưới vẫn giữ lại mảng ống tay đỏ sẫm cùng dải gấu áo tối màu loang lổ như mặc chồng hai lớp áo. Hiện tượng tương tự ở mức độ nhẹ hơn xuất hiện tại cổ tay của **P-06** (`000066_0.jpg` $\rightarrow$ `017957_1.jpg`) và **P-23** (`000001_0.jpg` $\rightarrow$ `000048_1.jpg`), nơi còn sót hai vòng cổ tay áo tối màu.

### Trường hợp 2: P-03 (Tràn mặt nạ xuống thân dưới do áo và quần đồng màu đen)
* **Cấu hình cặp**: `Unpaired` — Người mẫu `000266_0.jpg` (áo phông đen và quần đen ống rộng) $\rightarrow$ Trang phục `000532_1.jpg` (áo cộc tay hoa văn đỏ - trắng).
* **Chỉ số đo đạc**: $\text{SSIM ngoài mặt nạ} = 0.7545$, $\text{PSNR} = 13.66\text{ dB}$, Suy diễn: $50.65\text{s}$.
* **Hiện tượng thị giác**: Không có đường biên độ sáng tách biệt giữa gấu áo đen và quần đen trên ảnh gốc, dẫn tới mặt nạ inpainting kéo tràn xuống đùi trên và biến áo cộc tay hoa văn thành vạt dài quá hông, kèm nhòe bệt họa tiết ở nửa dưới.

### Trường hợp 3: P-17 (Suy biến đặc trưng khi thử áo trắng tinh trên nền ảnh trắng)
* **Cấu hình cặp**: `Unpaired` — Người mẫu `000339_0.jpg` (áo dài tay kẻ sọc xám - trắng) $\rightarrow$ Trang phục `015158_1.jpg` (áo phông trắng in chữ nhỏ `"RIOT"`).
* **Chỉ số đo đạc**: $\text{SSIM ngoài mặt nạ} = 0.9844$, $\text{PSNR} = 38.95\text{ dB}$, Suy diễn: $50.81\text{s}$.
* **Hiện tượng thị giác**: Dù vùng đầu và quần jeans ngoài mặt nạ được bảo toàn nguyên vẹn (khiến SSIM ngoài mặt nạ cao), phần thân áo bên trong mặt nạ bị ngả sang xám đục, xuất hiện vệt nhiễu rách dọc màu nâu đen giữa ngực và tua nhiễu răng cưa dọc hai cánh tay. Ca này chứng minh chỉ số SSIM ngoài mặt nạ chỉ phản ánh độ bảo toàn hậu cảnh, bắt buộc phải kết hợp đánh giá thị giác trực tiếp trên vùng mặc thử.

### Trường hợp 4: P-20 và P-25 (Xung đột danh mục `overall` trên trang phục thân trên)
* **Cấu hình cặp**:
  * **P-20**: Người mẫu `011363_0.jpg` (áo đỏ dài tay, quần đen) $\rightarrow$ Trang phục `001255_1.jpg`, `category="overall"`, $\text{SSIM} = 0.7864$, $\text{PSNR} = 17.09\text{ dB}$.
  * **P-25**: Người mẫu `000020_0.jpg` (áo trắng, chân váy bò xanh) $\rightarrow$ Trang phục `000274_1.jpg`, `category="overall"`, $\text{SSIM} = 0.7648$, $\text{PSNR} = 14.54\text{ dB}$.
* **Hiện tượng thị giác**: Mặt nạ `overall` xóa toàn bộ vùng quần jeans đen (P-20) và chân váy bò (P-25); do thiếu dữ liệu chân váy từ ảnh đầu vào (cộng thêm hiệu ứng trắng-trên-trắng ở P-25), mô hình sinh mảng hạt nâu cam nhiễu loạn ở thân dưới (P-20) hoặc sinh ảo giác thành đầm dài tay xếp ly màu nâu xám (P-25).

---

## 3. Giải pháp kỹ thuật khắc phục

1. **Hợp nhất nhãn cánh tay đầy đủ khi đổi từ dài tay sang ngắn tay**: Bắt buộc gộp toàn bộ nhãn `upper_clothes` cũ (bao gồm cả đoạn cổ tay của SCHP) với vùng da cánh tay của DensePose để triệt tiêu hoàn toàn hiện tượng sót vòng cổ tay tối màu (`P-06`, `P-10`, `P-23`).
2. **Giới hạn biên dưới mặt nạ `upper` theo khớp hông DensePose**: Khi người mẫu mặc áo và quần đồng màu tối (`P-03`), sử dụng tọa độ khớp hông (hip keypoints) của DensePose làm ngưỡng chặn dưới để ngăn mặt nạ `upper` tràn xuống vùng đùi.
3. **Tách nền trang phục đầu vào (Garment Foreground Masking)**: Tách mặt nạ nhị phân cho ảnh trang phục hoặc đặt áo trắng lên nền trung tính xám nhạt trước khi đưa vào Reference UNet nhằm giữ biên dạng rõ ràng cho các mẫu áo trắng tinh (`P-17`, `P-25`).
4. **Kiểm tra tương thích danh mục `overall`**: Chỉ kích hoạt mặt nạ toàn thân `overall` khi tỷ lệ khung bao trang phục đầu vào xác nhận là đầm liền thân dài; tự động chuyển về `upper` đối với áo thun và áo sát nách (`P-20`, `P-25`).
