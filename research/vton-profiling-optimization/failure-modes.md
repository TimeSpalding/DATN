# Phân tích các trường hợp thất bại và biên độ lỗi trong thử nghiệm CatVTON

Tài liệu này ghi nhận và phân loại chi tiết các trường hợp thất bại (Failure Cases) và các ca biên (Marginal / Degraded Cases) thu được từ thực nghiệm 20 cặp thử đồ (P-01 đến P-20) trên mô hình CatVTON tại môi trường GPU Tesla T4.

---

## 1. Phân loại các dạng lỗi (Taxonomy of Failure Modes)

Quá trình phân tích thực nghiệm trên 20 cặp kiểm thử cho thấy các lỗi và biến dạng thị giác tập trung vào 4 nhóm cơ chế kỹ thuật chính:

| Nhóm lỗi | Tên cơ chế | Nguyên nhân kỹ thuật gốc rễ | Trường hợp ghi nhận |
| :--- | :--- | :--- | :--- |
| **Nhóm 1** | Biến dạng hoa văn và logo (Logo & Graphic Distortion) | Bộ mã hóa/giải mã VAE nén không gian với tỷ lệ $8\times$, làm tiêu hao các tần số không gian cao (high-frequency components) của ký tự văn bản hoặc logo nhỏ. | **P-06** (Logo Adidas), **P-10** (Ký tự 'i am') |
| **Nhóm 2** | Xung đột ranh giới tay áo và da người mẫu (Sleeve Boundary Inconsistency) | Quá trình hoán đổi giữa trang phục cộc tay sang dài tay (hoặc ngược lại) yêu cầu AutoMasker phải phục hồi hoặc xóa vùng da cánh tay. Khi mặt nạ SCHP không bám sát viền da, xuất hiện hiện tượng nhòe viền. | **P-12** (Cộc tay $\rightarrow$ Tay dài chữ V), **P-02** (Ren vai) |
| **Nhóm 3** | Suy giảm độ sắc nét hoa văn mật độ cao (High-frequency Pattern Blurring) | Họa tiết hoa nhí đa sắc hoặc sọc dệt kim nhỏ bị suy giảm độ tương phản cục bộ do số bước khuếch tán (20 steps) của DPM++ chưa tối ưu hóa hoàn toàn việc khôi phục các chi tiết micro-texture. | **P-16** (Hoa nhí đỏ), **P-09** (Dệt kim xám trắng) |
| **Nhóm 4** | Xung đột phân vùng danh mục đầm liền thân (Overall Category Misalignment) | Thử trang phục dạng váy liền (`overall`) lên người mẫu đang mặc áo thun và quần tách rời. Vùng mặt nạ mặc định che phủ không đồng bộ giữa thân trên và thân dưới, dẫn đến hiện tượng lem màu tại vị trí thắt lưng. | **P-20** (Áo đỏ $\rightarrow$ Đầm hai dây ren) |

---

## 2. Phân tích chi tiết các ca kiểm thử tiêu biểu

### Trường hợp 1: P-06 (Áo thun thể thao in logo thương hiệu)
*   **Dạng kiểm thử**: Paired (Người mẫu `017957_0.jpg`, Trang phục `017957_1.jpg`, Danh mục `upper`).
*   **Chỉ số đo lường thực tế**: $\text{SSIM} = 0.9457$, $\text{PSNR} = 23.45\text{ dB}$, Thời gian suy diễn: $51.12\text{s}$, VRAM: $4.324\text{ GB}$.
*   **Hiện tượng thị giác**: Form dáng áo và màu đen đồng nhất được tái tạo chính xác. Tuy nhiên, logo ba sọc và chữ thương hiệu ở giữa ngực bị biến dạng nhẹ về nét viền, chữ không thể đọc rõ ràng như trên ảnh sản phẩm gốc.
*   **Nguyên nhân**: Không gian tiềm ẩn (latent space) của Stable Diffusion Inpainting tập trung bảo toàn ngữ nghĩa tổng thể (semantic layout) thay vì khớp pixel tuyệt đối đối với các chi tiết typographic nhỏ.

### Trường hợp 2: P-12 (Hoán đổi độ dài tay áo: Cộc tay sang dài tay)
*   **Dạng kiểm thử**: Unpaired (Người mẫu `000010_0.jpg`, Trang phục `009332_1.jpg`, Danh mục `upper`).
*   **Chỉ số đo lường thực tế**: $\text{SSIM} = 0.9284$, $\text{PSNR} = 19.43\text{ dB}$, Thời gian suy diễn: $51.17\text{s}$, VRAM: $4.324\text{ GB}$.
*   **Hiện tượng thị giác**: Người mẫu ban đầu để lộ toàn bộ cẳng tay. Khi đưa vào trang phục tay dài, mô hình phải sinh thêm phần vải đen che phủ cánh tay. Tại vị trí tiếp giáp giữa cổ tay áo mới và bàn tay người mẫu, đường biên xuất hiện dải mờ nhẹ (alpha bleeding).
*   **Nguyên nhân**: Mặt nạ do AutoMasker sinh ra được áp dụng phép làm mờ viền Gaussian (`blur_factor = 9`) để chống sắc cạnh. Tuy nhiên, tại các góc gập khuỷu tay, bán kính làm mờ 9 pixel tạo ra vùng giao thoa màu giữa da và vải tối màu.

### Trường hợp 3: P-16 (Hoán đổi sang áo hoa nhí mật độ cao)
*   **Dạng kiểm thử**: Unpaired (Người mẫu `000082_0.jpg`, Trang phục `007664_1.jpg`, Danh mục `upper`).
*   **Chỉ số đo lường thực tế**: $\text{SSIM} = 0.9372$, $\text{PSNR} = 20.27\text{ dB}$, Thời gian suy diễn: $50.99\text{s}$, VRAM: $4.324\text{ GB}$.
*   **Hiện tượng thị giác**: Họa tiết hoa nhí màu trắng trên nền vải đỏ bị phân bố hơi lệch hướng so với nếp gấp cơ học tự nhiên của ngực áo. Một số bông hoa nhỏ bị hòa lẫn vào nền đỏ.
*   **Nguyên nhân**: Trọng số chú ý chéo (Cross-Attention) trong CatVTON ưu tiên truyền tải thông tin hình dạng lớn (macro-geometry) của áo, trong khi các token đặc trưng hoa văn vi mô bị suy giảm tín hiệu trong quá trình lấy mẫu 20 bước.

### Trường hợp 4: P-20 (Thử nghiệm đầm liền thân `overall` - Ca thất bại điển hình)
*   **Dạng kiểm thử**: Unpaired (Người mẫu `011363_0.jpg`, Trang phục `001255_1.jpg`, Danh mục `overall`).
*   **Chỉ số đo lường thực tế**: $\text{SSIM} = 0.7864$ (suy giảm nghiêm trọng nhất), $\text{PSNR} = 17.09\text{ dB}$, Thời gian suy diễn: $50.86\text{s}$, VRAM: $4.324\text{ GB}$.
*   **Hiện tượng thị giác**: Váy liền thân dài hai dây đầm ren thay thế cho áo thun đỏ và quần ban đầu. Vùng tà váy dưới hông bị cắt nham nhở, ranh giới giữa phần thân áo và váy không liền mạch, xuất hiện hiện tượng lem màu đỏ cũ sang chân váy mới.
*   **Nguyên nhân**: Mô hình AutoMasker (DensePose + SCHP) mặc định phân đoạn thân trên cho danh mục `overall` khi không có nhãn tách biệt giữa váy và quần, dẫn đến mặt nạ inpainting chỉ che phủ một phần thân dưới, làm đứt gãy cấu trúc tà váy dài.

---

## 3. Đề xuất giải pháp khắc phục kỹ thuật

1.  **Tối ưu hóa bán kính làm mờ mặt nạ thích ứng (Adaptive Mask Blur)**: Thay vì cố định `blur_factor = 9` cho mọi trường hợp, áp dụng bán kính 3–5 pixel đối với vị trí cổ tay/cổ áo, và bán kính 7–9 pixel đối với vị trí vai và eo.
2.  **Bổ sung cơ chế tinh chỉnh chi tiết cao (High-frequency Detail Preservation)**: 
    *   Tăng số bước lấy mẫu của DPM++ lên 25 bước đối với các trường hợp trang phục có nhãn hoa nhí hoặc chữ in.
    *   Áp dụng kỹ thuật ghép mặt nạ độ nét cao (High-resolution Alpha Blending) trực tiếp trên ảnh gốc thay vì chỉ thực hiện giải mã toàn bộ qua VAE.

