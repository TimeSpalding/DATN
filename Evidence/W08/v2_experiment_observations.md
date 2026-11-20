# Ghi nhận kết quả thực nghiệm v2 trên Kaggle (`2x Tesla T4`)

Lần chạy v2 kiểm chứng hàm `refined_cloth_agnostic_mask` phiên bản v2 (`844338d`) trên bộ 20 cặp đóng băng (`frozen_pairs_w08.json`) với 3 cấu hình chính (`C0_baseline_s20_g45`, `C1_refined_s20_g45`, `C2_refined_s12_g25`) và kiểm tra lặp lại tính tái lập trên `S01`.

## 1. Xác nhận tính tái lập sau khi sửa mask v2

Số liệu từ `results_v2/reproducibility_check.csv` (`S01`):

- `Det_RunA_vs_Det_RunB_GPU0`: `mae_px = 0.0`, `max_abs_px = 0.0`, `exact_pixel_pct = 100.0`, `SSIM = 1.0`.
- `Det_RunA_GPU0_vs_Det_RunC_GPU1`: `mae_px = 0.0`, `max_abs_px = 0.0`, `exact_pixel_pct = 100.0`, `SSIM = 1.0`.
- `Det_RunA_vs_NoSeed_RunD_GPU0`: `mae_px = 14.45836`, `max_abs_px = 247.0`, `exact_pixel_pct = 0.23`, `SSIM = 0.794652`.

Thay đổi mặt nạ v2 không làm phá vỡ tính tất định trên GPU đơn và đa GPU.

## 2. Kết quả định lượng 3 cấu hình (`summary_by_config.csv`)

| Cấu hình | Tiền xử lý (s) | Suy diễn UNet (s) | Tổng thời gian (s) | Diện tích mask (%) | LPIPS ngoài mask | SSIM ngoài mask | CLIP cloth gain | DINO cloth gain |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `C0_baseline_s20_g45` | 1.0190 | 40.8563 | 41.8752 | 26.0535 | 0.0520 | 0.9353 | +0.0669 | +0.1407 |
| `C1_refined_s20_g45` | 0.1319 | 41.0790 | 41.2110 | 19.3185 | 0.0468 | 0.9366 | +0.0529 | +0.0920 |
| `C2_refined_s12_g25` | 0.1345 | 25.2122 | 25.3467 | 19.3185 | 0.0264 | 0.9491 | +0.0643 | +0.0966 |

Theo từng nhóm (`results_v2/summary_by_group.csv`):

| Nhóm | Cấu hình | Thời gian (s) | Diện tích mask (%) | LPIPS ngoài mask | SSIM ngoài mask | CLIP gain | DINO gain |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| `standard` | `C0_baseline_s20_g45` | 41.5680 | 33.980 | 0.0362 | 0.9860 | +0.0393 | +0.1763 |
| `standard` | `C1_refined_s20_g45` | 41.1843 | 26.738 | 0.0280 | 0.9835 | +0.0142 | +0.1179 |
| `standard` | `C2_refined_s12_g25` | 25.3990 | 26.738 | 0.0113 | 0.9930 | +0.0492 | +0.1183 |
| `mask_boundary` | `C0_baseline_s20_g45` | 41.6217 | 32.206 | 0.0395 | 0.9729 | +0.0852 | +0.1454 |
| `mask_boundary` | `C1_refined_s20_g45` | 41.2524 | 23.116 | 0.0354 | 0.9804 | +0.0726 | +0.0828 |
| `mask_boundary` | `C2_refined_s12_g25` | 25.3189 | 23.116 | 0.0204 | 0.9885 | +0.0892 | +0.0943 |
| `occlusion` | `C0_baseline_s20_g45` | 42.1155 | 14.604 | 0.0663 | 0.8915 | +0.0743 | +0.1494 |
| `occlusion` | `C1_refined_s20_g45` | 41.1923 | 10.764 | 0.0618 | 0.8922 | +0.0641 | +0.1260 |
| `occlusion` | `C2_refined_s12_g25` | 25.3002 | 10.764 | 0.0361 | 0.9105 | +0.0758 | +0.1405 |
| `pose_overall` | `C0_baseline_s20_g45` | 42.1958 | 23.424 | 0.0659 | 0.8907 | +0.0690 | +0.0920 |
| `pose_overall` | `C1_refined_s20_g45` | 41.2148 | 16.656 | 0.0622 | 0.8901 | +0.0608 | +0.0413 |
| `pose_overall` | `C2_refined_s12_g25` | 25.3686 | 16.656 | 0.0379 | 0.9044 | +0.0430 | +0.0333 |

## 3. Phân tích đối chiếu ảnh lưới v2 (`results_v2/grids/`)

1. **Khắc phục được trong v2**:
   - Lỗi cắt ngang áo khoác ở cặp `P01`: phần thân dưới của blazer xanh được giữ liền mạch trong mask `C1` nhờ mở rộng điều kiện `strict_upper` cho nhãn `Coat`.
   - Bảo toàn vùng quần tối màu và vật che chắn (`results_v2/protected_region_analysis.csv`): trung bình giữ lại `6.74%` diện tích ảnh từng bị mask gốc phủ lấn, nổi bật ở `M02` (tiết kiệm `20.12%`, SSIM vùng bảo vệ tăng từ `0.5187` lên `0.9570`, LPIPS giảm từ `0.6421` xuống `0.1550`), `S04` (`9.57%`), `P03` (`9.44%`, SSIM `0.3569` lên `0.9063`), `O02` (`5.20%`) và `P05` (giữ được túi xách cầm tay mà `C0` xóa mất).
   - Cấu hình `C2_refined_s12_g25` rút thời gian suy diễn từ `41.88s` xuống `25.35s` (giảm `39.5%`), cho `CLIP_cloth_gain` (`+0.0643`) tiệm cận `C0` (`+0.0669`) và `LPIPS_out_unified` thấp nhất (`0.0264`). Ở cả nhóm `standard` lẫn `occlusion` và `mask_boundary`, `C2` đạt `CLIP_gain` và `LPIPS_out` tốt hơn `C1`.

2. **Hạn chế vẫn tồn tại và lý do kỹ thuật**:
   - `DINO_cloth_gain` của `C1`/`C2` (`+0.0920` / `+0.0966`) vẫn thấp hơn `C0_baseline` (`+0.1407`). Quan sát trực quan cho thấy hai nguyên nhân cốt lõi gắn với phân phối huấn luyện của CatVTON:
     1. *Sót viền mảnh tại ranh giới vùng bảo vệ (`M01`, `M04`, `O03`, `O04`, `P04`, `S02`)*: phép trừ chặt `& (~all_protect)` ở bước cuối để giữ tóc, quần, túi và cổ tay làm sót đường viền `2–5 px` của trang phục gốc khi SCHP lệch biên nhẹ. Mô hình inpainting bám vào dải viền chưa mask này và kéo dài màu/họa tiết áo cũ vào kết quả.
     2. *Khuyết vùng cổ áo / ngực trên không khép kín (`S01`, `S04`, `P03`) và giữ phom áo khoác ngoài (`P01`)*: khi áo cũ màu sáng trùng nền (`S01`) hoặc áo hai dây/hở vai (`S04`, `P03`), vùng xương quai xanh tạo vết lõm mở phía trên không bị `binary_fill_holes` lấp kín; trong khi `C0_baseline` dùng `hull_mask + GaussianBlur(41x41)` phủ kín toàn bộ vùng cổ – thân trên đúng với phân phối mask mà UNet của CatVTON được huấn luyện.
   - Kết quả âm đối với áo trắng nền trắng (`M03`): đệm nền `#E8E6E0` không đủ để ngăn sụp đổ họa tiết lưới đen ở cả `C1` lẫn `C2`.
