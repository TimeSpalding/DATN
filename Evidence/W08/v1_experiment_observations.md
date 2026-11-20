# Ghi nhận kết quả thực nghiệm v1 trên Kaggle (`2x Tesla T4`)

Tài liệu này tổng hợp kết quả định lượng và quan sát bằng mắt từ lần chạy v1 của notebook `w08_catvton_experiment.ipynb` trên 20 cặp kiểm thử cố định (`frozen_pairs_w08.json`), môi trường `Python 3.13.16`, `PyTorch 2.11.0+cu130`, `diffusers 0.32.2`, `2x Tesla T4`.

## 1. Kết quả kiểm chứng tái lập (Issue #19)

Số liệu từ `results_v1/reproducibility_check.csv` trên 3 cặp đại diện (`S01`, `M01`, `O01`):

- **Cùng GPU, lặp lại với seed cố định (`Det_RunA_vs_Det_RunB_GPU0`)**: `mae_px = 0.0`, `max_abs_px = 0.0`, `SSIM = 1.0`, tỷ lệ pixel khớp hoàn toàn trên cả 3 cặp.
- **Khác GPU (`cuda:0` so với `cuda:1`), cùng seed (`Det_RunA_GPU0_vs_Det_RunC_GPU1`)**: `mae_px = 0.0`, `max_abs_px = 0.0`, `SSIM = 1.0` trên cả 3 cặp.
- **Không cố định generator (`Det_RunA_vs_NoSeed_RunD_GPU0`)**: đầu ra lệch rõ rệt theo từng lần gọi (`S01`: MAE `15.70 px`, SSIM `0.7868`; `M01`: MAE `12.53 px`, SSIM `0.8205`; `O01`: MAE `3.55 px`, SSIM `0.9387`).

Nhận xét: cơ chế khóa `pair_seed`, `cudnn.deterministic=True`, `cudnn.benchmark=False` và `use_tf32=False` giải quyết được sai lệch ngẫu nhiên giữa các lần chạy benchmark trên cùng phần cứng.

## 2. Kết quả thử nghiệm v1 cho mặt nạ và độ trễ (Issue #20)

Số liệu trung bình từ `results_v1/summary_by_config.csv`:

| Cấu hình | Số cặp | Thời gian tiền xử lý (s) | Thời gian suy diễn UNet (s) | Tổng thời gian (s) | VRAM đỉnh (GB) | Diện tích mask (%) | LPIPS ngoài mask | SSIM ngoài mask | CLIP cloth gain | DINO cloth gain |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `C0_baseline_s20_g45` | 20 | 1.1217 | 52.2341 | 53.3559 | 4.333 | 26.0535 | 0.0520 | 0.9353 | +0.0668 | +0.1407 |
| `C1_refined_s20_g45` | 20 | 0.0898 | 52.0360 | 52.1259 | 4.333 | 18.0125 | 0.0450 | 0.9373 | +0.0601 | +0.0890 |
| `C2_refined_s12_g25` | 20 | 0.0915 | 31.6673 | 31.7588 | 4.333 | 18.0125 | 0.0253 | 0.9494 | +0.0596 | +0.0925 |
| `C3_refined_s15_g10` | 8 | 0.4990 | 19.1593 | 19.6584 | 4.332 | - | 0.0301 | 0.9423 | +0.0368 | +0.0680 |
| `C4_refined_512_s20` | 8 | 0.8044 | 14.3433 | 15.1477 | 3.664 | - | 0.0588 | 0.9239 | +0.0392 | +0.0778 |

### 2.1. Điểm cải thiện quan sát được ở v1

1. **Giảm tràn mask xuống quần tối màu và vật cản (`protected_region_analysis.csv`)**: trên cặp `M02` (áo đen - quần đen), diện tích tràn xuống vùng bảo vệ giảm `21.57%` diện tích ảnh, kéo SSIM vùng ngoài mask từ `0.5117` lên `0.9489` và giảm LPIPS vùng này từ `0.6307` xuống `0.1517`. Trên `P03` giảm tràn `11.79%`, `O02` giảm `7.10%`, `O03` giảm `5.46%`.
2. **Cache tiền xử lý AutoMasker**: tái sử dụng kết quả phân đoạn DensePose + SCHP giảm thời gian tiền xử lý trung bình từ `1.1217s` xuống `0.0898s` khi chạy lặp trên cùng ảnh người mẫu.
3. **Giảm số bước suy diễn (`C2_refined_s12_g25`)**: giảm từ `20` bước (`CFG=4.5`) xuống `12` bước (`CFG=2.5`) rút tổng thời gian từ `53.36s` xuống `31.76s` (giảm `40.5%`), đồng thời `clip_cloth_gain` chỉ chênh nhẹ (`+0.0596` so với `+0.0601` của `C1`).
4. **Các nhánh đánh đổi không đạt yêu cầu (`C3`, `C4`)**: tắt CFG (`C3`, `guidance=1.0`) giảm thời gian xuống `19.66s` nhưng `clip_cloth_gain` tụt từ `+0.0601` xuống `+0.0368`; hạ độ phân giải xuống `512x768` (`C4`) làm tăng `lpips_out_unified` lên `0.0588` do mờ biên ghép ảnh.

### 2.2. Các lỗi phát sinh ở mặt nạ `C1` v1 khi đối chiếu 20 ảnh lưới

Mặc dù LPIPS/SSIM ngoài mask tốt hơn, điểm `dino_cloth_gain` của `C1` (`+0.0890`) thấp hơn `C0` (`+0.1407`). Kiểm tra trực quan từng cặp trong `results_v1/grids/` cho thấy 4 lỗi cụ thể của thuật toán v1:

1. **Lỗi hở lỗ trắng ở ngực/vai/thân áo (`S01`, `S04`, `M02`, `P03`)**:
   - Do bỏ `convexHull`, thu hẹp `close_k` (~1.5% chiều cao), bỏ `Dress` khỏi `upper` và trừ `all_protect` (bao gồm các nhãn dễ phân loại nhầm như `Skirt`/`Pants`/`Scarf` khi áo tối màu hoặc sát nền), một số vùng bên trong thân áo bị khuyết khỏi mask (`M02`, `S01`, `S04`). Diffusion giữ lại mảng vải gốc bên trong mask bị hở, làm giảm mạnh độ khớp trang phục.
2. **Cắt ngang thân áo khoác bởi ngưỡng `y_hip_cut` (`P01`, `O05`)**:
   - Điều kiện `strict_upper = LIP["Upper-clothes"] & ATR["Upper-clothes"]` chỉ kiểm tra nhãn `Upper-clothes`. Với áo khoác (`P01` blazer xanh, `O05` áo lông), SCHP-LIP gán nhãn `Coat`, khiến `strict_upper` âm tính và cắt mất phần gấu áo phía dưới `y_hip_cut`.
3. **Biên mask ôm quá sát mép tay áo và cổ áo (`M01`, `M04`, `O03`, `O04`, `S02`)**:
   - Không mở rộng nhẹ ra vùng `Background` ở ngoài mép áo và ống tay làm sót viền `2-5 px` vải cũ (`M01` tay áo dài đỏ còn viền thành tay lưới; `O03` còn cổ áo nâu và gấu tay áo; `O04` còn viền hồng ở tay áo dẫn tới sinh nhầm cardigan hồng).
4. **Kết quả âm với áo trắng nền trắng (`M03`)**:
   - Bước đệm nền `#E8E6E0` trong `preprocess_cloth_for_tryon` giữ `white_on_white=True`, nhưng cả `C0`, `C1` lẫn `C2` vẫn xuất hiện nhiễu lưới mờ trên ngực áo (`M03_compare.jpg`). Giải pháp tiền xử lý tương phản ở đầu vào là chưa đủ để khắc phục hiện tượng sụp đổ chi tiết trắng-trên-trắng của CatVTON.

Kết luận tạm thời sau v1: phần tái lập (Issue #19) và hướng tối ưu `12 bước / CFG=2.5` + cache AutoMasker đạt hiệu quả rõ ràng, nhưng hàm `refined_cloth_agnostic_mask` v1 cần được hiệu chỉnh sang phiên bản v2 để khắc phục 3 lỗi phân đoạn (`M01`, `M02`, `O03`, `P01`, `S01`, `S04`) trước khi chốt kết quả Issue #20.
