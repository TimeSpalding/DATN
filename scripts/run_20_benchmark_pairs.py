import os
import time
import json
import requests
from PIL import Image

API_URL = "https://aspire-traps-deserving.ngrok-free.dev/api/tryon"
HEADERS = {"ngrok-skip-browser-warning": "true"}
RESULTS_DIR = "Evidence/W05/results"
os.makedirs(RESULTS_DIR, exist_ok=True)

PAIRS = [
    {"pair_id": "P-01", "mode": "Paired", "person": "011363_0.jpg", "cloth": "011363_1.jpg", "category": "upper", "desc": "Áo đỏ phối ren viền đen, cổ tròn"},
    {"pair_id": "P-02", "mode": "Paired", "person": "002883_0.jpg", "cloth": "002883_1.jpg", "category": "upper", "desc": "Áo đen phối ren vai, tay ngắn"},
    {"pair_id": "P-03", "mode": "Paired", "person": "019340_0.jpg", "cloth": "019340_1.jpg", "category": "upper", "desc": "Áo thun cotton in họa tiết graphic"},
    {"pair_id": "P-04", "mode": "Paired", "person": "017639_0.jpg", "cloth": "017639_1.jpg", "category": "upper", "desc": "Áo thun kẻ sọc ngang đen trắng"},
    {"pair_id": "P-05", "mode": "Paired", "person": "010381_0.jpg", "cloth": "010381_1.jpg", "category": "upper", "desc": "Áo đen họa tiết hoa nhí đa sắc"},
    {"pair_id": "P-06", "mode": "Paired", "person": "017957_0.jpg", "cloth": "017957_1.jpg", "category": "upper", "desc": "Áo thun thể thao Adidas in logo"},
    {"pair_id": "P-07", "mode": "Paired", "person": "016687_0.jpg", "cloth": "016687_1.jpg", "category": "upper", "desc": "Áo phông đen họa tiết đầu lâu cá tính"},
    {"pair_id": "P-08", "mode": "Paired", "person": "004342_0.jpg", "cloth": "004342_1.jpg", "category": "upper", "desc": "Áo len trắng dài tay phối lớp trong đen"},
    {"pair_id": "P-09", "mode": "Paired", "person": "000339_0.jpg", "cloth": "000339_1.jpg", "category": "upper", "desc": "Áo len dệt kim kẻ sọc xám trắng"},
    {"pair_id": "P-10", "mode": "Paired", "person": "004702_0.jpg", "cloth": "004702_1.jpg", "category": "upper", "desc": "Áo thun trắng in chữ 'i am' trước ngực"},
    {"pair_id": "P-11", "mode": "Unpaired", "person": "000001_0.jpg", "cloth": "009084_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo thun trắng -> Áo len đen tay dài hở vai"},
    {"pair_id": "P-12", "mode": "Unpaired", "person": "000010_0.jpg", "cloth": "009332_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo cộc tay -> Áo đen cổ chữ V dài tay"},
    {"pair_id": "P-13", "mode": "Unpaired", "person": "000028_0.jpg", "cloth": "013989_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo trơn -> Áo xám có cúc cài ngực"},
    {"pair_id": "P-14", "mode": "Unpaired", "person": "000057_0.jpg", "cloth": "018626_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo không cổ -> Áo polo đỏ có cổ bẻ"},
    {"pair_id": "P-15", "mode": "Unpaired", "person": "000074_0.jpg", "cloth": "007874_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo hoa -> Áo sọc ngang xanh trắng"},
    {"pair_id": "P-16", "mode": "Unpaired", "person": "000082_0.jpg", "cloth": "007664_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo tối màu -> Áo đỏ hoa nhí trắng"},
    {"pair_id": "P-17", "mode": "Unpaired", "person": "000339_0.jpg", "cloth": "015158_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo len sọc -> Áo thun trắng in chữ 'fn'"},
    {"pair_id": "P-18", "mode": "Unpaired", "person": "004342_0.jpg", "cloth": "013593_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo trắng -> Áo cardigan len đen dệt thưa"},
    {"pair_id": "P-19", "mode": "Unpaired", "person": "017639_0.jpg", "cloth": "001614_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo cộc sọc -> Áo thể thao The North Face"},
    {"pair_id": "P-20", "mode": "Unpaired", "person": "011363_0.jpg", "cloth": "001255_1.jpg", "category": "overall", "desc": "Hoán đổi: Áo thun đỏ -> Váy hai dây đầm liền ren"}
]

print(f"Bắt đầu thực nghiệm 20 cặp thử đồ qua Kaggle CatVTON API: {API_URL}")
print("=" * 70, flush=True)

records = []

for idx, p in enumerate(PAIRS, start=1):
    pid = p["pair_id"]
    p_img_path = os.path.join("datacard/test_img", p["person"])
    c_img_path = os.path.join("datacard/test_color", p["cloth"])
    out_img_path = os.path.join(RESULTS_DIR, f"{pid}_result.png")
    out_grid_path = os.path.join(RESULTS_DIR, f"{pid}_grid.png")
    
    # If already downloaded and valid, skip or re-run
    if os.path.exists(out_img_path) and os.path.getsize(out_img_path) > 10000:
        print(f"[{idx}/20] {pid} đã tồn tại ({os.path.getsize(out_img_path)} bytes), đang kiểm tra grid...", flush=True)
        # Verify grid exists
        if not os.path.exists(out_grid_path):
            try:
                p_im = Image.open(p_img_path).convert("RGB").resize((768, 1024))
                c_im = Image.open(c_img_path).convert("RGB").resize((768, 1024))
                res_im = Image.open(out_img_path).convert("RGB").resize((768, 1024))
                grid = Image.new("RGB", (768 * 3, 1024))
                grid.paste(p_im, (0, 0))
                grid.paste(c_im, (768, 0))
                grid.paste(res_im, (768 * 2, 0))
                grid.save(out_grid_path)
            except Exception as e:
                print(f"Lỗi tạo grid cho {pid}: {e}")
        continue
        
    print(f"[{idx}/20] Đang gửi {pid}: person={p['person']}, cloth={p['cloth']}, category={p['category']}...", flush=True)
    t0 = time.time()
    
    max_retries = 2
    success = False
    
    for attempt in range(max_retries):
        try:
            with open(p_img_path, "rb") as f_p, open(c_img_path, "rb") as f_c:
                files = {
                    "person_image": (p["person"], f_p, "image/jpeg"),
                    "cloth_image": (p["cloth"], f_c, "image/jpeg")
                }
                data = {"category": p["category"]}
                res = requests.post(API_URL, headers=HEADERS, files=files, data=data, timeout=120)
                
            elapsed = time.time() - t0
            
            if res.status_code == 200 and len(res.content) > 10000:
                with open(out_img_path, "wb") as f_out:
                    f_out.write(res.content)
                    
                # Create side-by-side grid
                p_im = Image.open(p_img_path).convert("RGB").resize((768, 1024))
                c_im = Image.open(c_img_path).convert("RGB").resize((768, 1024))
                res_im = Image.open(out_img_path).convert("RGB").resize((768, 1024))
                
                grid = Image.new("RGB", (768 * 3, 1024))
                grid.paste(p_im, (0, 0))
                grid.paste(c_im, (768, 0))
                grid.paste(res_im, (768 * 2, 0))
                grid.save(out_grid_path)
                
                print(f"  -> THÀNH CÔNG: {pid} hoàn thành trong {elapsed:.2f}s, kích thước {len(res.content)} bytes", flush=True)
                records.append({
                    "pair_id": pid,
                    "mode": p["mode"],
                    "person": p["person"],
                    "cloth": p["cloth"],
                    "category": p["category"],
                    "latency_seconds": round(elapsed, 2),
                    "file_size_bytes": len(res.content),
                    "status": "SUCCESS"
                })
                success = True
                break
            else:
                print(f"  -> Lỗi HTTP {res.status_code} (lần thử {attempt+1}): {res.text[:150]}", flush=True)
                time.sleep(3)
        except Exception as e:
            print(f"  -> Ngoại lệ khi gọi API (lần thử {attempt+1}): {e}", flush=True)
            time.sleep(3)
            
    if not success:
        print(f"  -> THẤT BẠI: {pid} không thể hoàn thành sau {max_retries} lần thử.", flush=True)

print("=" * 70)
print(f"Đã hoàn thành lượt chạy. Tổng số ảnh kết quả: {len(os.listdir(RESULTS_DIR))} tệp trong {RESULTS_DIR}")

