# Điều tra Issue #20: CatVTON chậm và lỗi nhiều ở pose / mask / occlusion

## 1. Bối cảnh từ dữ liệu Tuần 6 và Tuần 7

Qua 25 cặp ở Tuần 6 (`Evidence/W06/vton-profiling-optimization/failure-modes.md`) và 100 cặp ở Tuần 7 (`Evidence/W07/vton_metrics_top100_updated-v3.xlsx`), hệ thống gặp hai nhóm hạn chế chính:
1. **Độ trễ suy diễn cao**: Thời gian xử lý trung bình một lượt ở cấu hình `768x1024`, `DPM++ 2M Karras` 20 bước, `guidance_scale = 4.5` là khoảng `50.6s – 54.4s` trên 1 GPU Tesla T4 (trong đó UNet chiếm ~94% tổng thời gian, AutoMasker chiếm ~0.9s – 1.0s).
2. **Tỉ lệ lỗi thị giác còn cao ở các ca khó**: Ở bảng thống kê W07 (`Thống kê Xếp loại`), sau khi rà soát lại 41 mục sai, có `43/100` cặp rơi vào mức `Kém` (30) và `Lỗi nặng` (13), đặc biệt khi người mẫu mặc áo dài tay thử áo cộc tay, áo/quần tối màu tiệp nhau, có túi/cốc/tóc che phía trước hoặc tư thế chống tay.

---

## 2. Phân tích mã nguồn CatVTON để tìm nguyên nhân gốc rễ

Sau khi đối chiếu trực tiếp mã nguồn `model/cloth_masker.py`, `model/pipeline.py` và `model/attn_processor.py` của `zhengchong/CatVTON`, nhóm xác định được các điểm gây lỗi cụ thể như sau:

### 2.1. Nguyên nhân lỗi ở `AutoMasker.cloth_agnostic_mask` (`model/cloth_masker.py`)

1. **`hull_mask` làm phình mặt nạ thành bao lồi (dòng 247)**:
   ```python
   mask_area = hull_mask(mask_area * 255) // 255  # Convex Hull to expand the mask area
   ```
   Khi người mẫu chống tay lên hông (`P01`, `P04`), giơ tay chữ V (`P02`) hoặc cầm túi/cốc trước ngực (`O01`, `O03`, `O04`), tập điểm áo + cánh tay tạo thành đa giác lõm. Phép `cv2.convexHull` lấp đầy cả phần nền kẹp giữa cánh tay - hông, cũng như phần tay/vật che nằm trong bao lồi của phần thân.

2. **Làm mờ Gaussian `41x41` kết hợp ngưỡng cắt quá thấp `>= 25/255` (dòng 249–251)**:
   ```python
   kernal_size = max(w, h) // 25  # voi 1024px -> kernal_size = 41
   mask_area = cv2.GaussianBlur(mask_area * 255, (kernal_size, kernal_size), 0)
   mask_area[mask_area < 25] = 0
   mask_area[mask_area >= 25] = 1
   ```
   Ngay sau khi trừ `weak_protect_area` ở dòng 248 (chứa tóc, túi, quần/váy, tay), phép lọc `GaussianBlur(41x41)` trải giá trị `1` lan ra xung quanh bán kính ~20 pixel. Ngưỡng `25/255` (~9.8%) làm vùng mặt nạ **lấn ngược trở lại** khoảng 15–20 pixel đè lên vùng tóc, cạp quần và vật che vừa mới bảo vệ.

3. **Giãn nở (`dilate`) sau khi trừ vùng bảo vệ và bỏ sót bảo vệ phụ kiện/tóc/quần ở bước cuối (dòng 252–253)**:
   ```python
   mask_area = (mask_area | strong_mask_area) & (~strong_protect_area)
   mask_area = cv2.dilate(mask_area, dilate_kernel, iterations=1)
   ```
   Phép `cv2.dilate` nằm **sau** `& (~strong_protect_area)` nên mặt nạ ăn lấn vào viền khuôn mặt và bàn tay thêm ~5 pixel, đồng thời không trừ lại `cloth_protect_area` (quần/váy), `hair_protect_area` (tóc rủ xuống vai/ngực) và `accessory_protect_area` (`Bag`, `Hat`, `Scarf`).

4. **`MASK_CLOTH_PARTS['upper']` gộp cả `'Dress'` và `'Jumpsuits'` (dòng 80)**:
   `strong_mask_area` cho `upper` lấy `Upper-clothes | Coat | Dress | Jumpsuits`. Với các mẫu mặc áo tối màu + quần tối màu (`M02`, `M05`) hoặc áo dài trùm hông, SCHP dễ nhận nhầm phần thân dưới hoặc vạt áo thành `Dress`, kéo mặt nạ tràn xuống đùi dù `part='upper'`.

5. **Phụ thuộc `DensePose & SCHP` khi bàn tay bị che khuất (dòng 216–220)**:
   `hands_protect_area` lấy phép giao (`&`) giữa `densepose` (`hands|feet`) và `SCHP` (`arm|leg`). Khi người mẫu cầm túi/cốc hoặc nghiêng người khiến `DensePose` không bắt kịp bàn tay, phép giao bị rỗng và toàn bộ bàn tay bị mặt nạ xóa mất.

6. **Suy giảm điều kiện hóa với áo trắng trên nền trắng (`M03`)**:
   `resize_and_padding` đệm ảnh trang phục vào nền trắng `(255, 255, 255)`. Khi bản thân áo cũng màu trắng (`015158_1.jpg`), đường biên giữa áo và nền gần như biến mất trước khi đi qua VAE encoder của `condition_latent`.

### 2.2. Nguyên nhân độ trễ cao (`model/pipeline.py` & `model/attn_processor.py`)

1. **Kích thước tensor nối không gian và Classifier-Free Guidance (CFG)**:
   Tại `768x1024`, `pipeline.py` ghép `person_latent` và `condition_latent` theo trục dọc (`dim=-2`), tạo tensor kích thước latent `96 x 256` (gấp đôi chiều cao). Khi `guidance_scale > 1.0` (mặc định đang đặt `4.5`), mỗi bước khử nhiễu phải chạy UNet với `batch = 2` (`uncond` + `cond`). Với 20 bước = 40 lượt truyền xuôi UNet trên khối attention dài `6144` token ở tầng trên cùng.
2. **`xFormers` không hoạt động trên môi trường Kaggle Python 3.13 / Torch 2.11**:
   Log chạy thực tế W07 ghi nhận `[WARN] xFormers not available`. Thay vào đó `model/attn_processor.py` đã dùng sẵn `AttnProcessor2_0` (`F.scaled_dot_product_attention` của PyTorch 2.x). Việc gọi `enable_xformers` trong notebook thực chất bị bỏ qua nên không tạo thêm gia tốc như nhận định ban đầu ở W07.
3. **Chi phí `AutoMasker` lặp lại (~0.9s–1.1s/lượt)**:
   Mỗi request chạy tuần tự cả DensePose + SCHP-LIP + SCHP-ATR trên ảnh người mẫu, kể cả khi người dùng giữ nguyên ảnh người mẫu để thử nhiều áo khác nhau trên web.

---

## 3. Hướng xử lý sẽ thử nghiệm và đo đạc

1. **Khắc phục Pose / Mask / Occlusion (`mask_mode="refined"`)**:
   - Không dùng `hull_mask` thô cho `part="upper"` khi tồn tại lỗ hổng giải phẫu hoặc khi vùng bảo vệ bị kẹp bên trong (thay bằng morphological closing kích thước vừa phải để chỉ hàn các lỗ nhỏ bên trong thân áo mà không bắc cầu qua khủy tay chống hông hay túi xách).
   - Giảm nhân làm mờ biên mặt nạ và trừ lại **tất cả** vùng bảo vệ (`strong_protect_area | hair_protect_area | accessory_protect_area | cloth_protect_area`) **sau** bước giãn nở/làm mờ cuối, đảm bảo không ăn lấn vào tóc, túi/phụ kiện, quần và bàn tay.
   - Bổ sung hợp nhất bảo vệ bàn tay theo `SCHP arm` gần ranh giới ngón/tay hoặc `DensePose hands` (dùng hợp có điều kiện quanh khung bàn tay thay vì để giao rỗng xóa tay), đồng thời tách bỏ `'Dress'`/`'Jumpsuits'` khỏi `strong_mask_area` của `upper` và chặn biên dưới theo tỉ lệ hông DensePose khi độ tương phản áo-quần thấp.
   - Với ảnh trang phục trắng trên nền trắng (kiểm tra pixel 4 góc > 245 và phần biên áo sáng), thử thêm viền nền trung tính nhạt (`#E8E6E1`) hoặc tăng tương phản nhẹ trước `resize_and_padding`.
2. **Giảm độ trễ suy diễn và đánh đổi chất lượng**:
   - Kiểm chứng các cấu hình thực tế trên Kaggle T4:
     - `baseline`: 20 bước, `guidance=4.5`, `768x1024`.
     - `refined_s20_g45`: giữ nguyên tốc độ (`20 bước, guidance=4.5`) để cô lập riêng hiệu quả sửa mask/occlusion.
     - `refined_s12_g25`: giảm xuống `12 bước`, `guidance=2.5` (kỳ vọng giảm ~40% thời gian UNet) và đo xem chất lượng (`LPIPS_out`, `CLIP`, `DINO` và soi mắt) có tụt nhiều hay không.
     - `refined_cfg1_nocfg` (`15 bước, guidance=1.0`, tắt CFG `batch=1`) và/hoặc `512x768`: khảo sát giới hạn dưới của độ trễ (~18–25s) và ghi nhận trung thực nếu chất lượng bám áo giảm.
   - Tách cache `AutoMasker` theo SHA-256 ảnh người mẫu trên API server khi thử nhiều trang phục trên cùng 1 người.
