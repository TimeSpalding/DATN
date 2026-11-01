import os
import sys
import time
import argparse
import requests
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as ssim
from skimage.metrics import peak_signal_noise_ratio as psnr

DEFAULT_API_URL = "https://aspire-traps-deserving.ngrok-free.dev/api/tryon"
HEADERS = {"ngrok-skip-browser-warning": "true"}

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

def compute_quality_metrics(person_path, result_path):
    p_img = Image.open(person_path).convert("RGB").resize((768, 1024))
    r_img = Image.open(result_path).convert("RGB").resize((768, 1024))
    
    p_arr = np.array(p_img)
    r_arr = np.array(r_img)
    
    # Crop non-garment border area (top 15% head + bottom 15% legs) for background preservation check
    h, w, _ = p_arr.shape
    top_p = p_arr[0:int(h * 0.15), :]
    top_r = r_arr[0:int(h * 0.15), :]
    bot_p = p_arr[int(h * 0.85):h, :]
    bot_r = r_arr[int(h * 0.85):h, :]
    
    bg_p = np.concatenate([top_p, bot_p], axis=0)
    bg_r = np.concatenate([top_r, bot_r], axis=0)
    
    score_ssim = ssim(bg_p, bg_r, channel_axis=2, data_range=255)
    score_psnr = psnr(bg_p, bg_r, data_range=255)
    
    return round(float(score_ssim), 4), round(float(score_psnr), 2)

def run_profiling(api_url=DEFAULT_API_URL, output_csv="research/vton-profiling-optimization/results/profiling_latency.csv"):
    print(f"=== BẮT ĐẦU CHẠY PROFILING 20 CẶP VTON ===")
    print(f"Target API Endpoint: {api_url}")
    
    # 1. Kiem tra healthcheck
    health_url = api_url.replace("/api/tryon", "/api/health")
    cold_start_time = "N/A"
    try:
        r_health = requests.get(health_url, headers=HEADERS, timeout=10)
        if r_health.status_code == 200:
            h_data = r_health.json()
            cold_start_time = h_data.get("cold_start_time_s", "N/A")
            print(f"[HEALTH CHECK] Server OK | GPU: {h_data.get('gpu')} | Cold-Start: {cold_start_time}s | Current VRAM: {h_data.get('current_vram_gb')} GB")
        else:
            print(f"[HEALTH CHECK] Server tra ve status: {r_health.status_code}")
    except Exception as e:
        print(f"[HEALTH CHECK] Khong the ket noi den {health_url}: {e}")
        print("Kiem tra lai trang thai session Kaggle hoac URL ngrok truoc khi tiep tuc.")
        return

    results = []
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    
    for idx, p in enumerate(PAIRS, start=1):
        pid = p["pair_id"]
        p_path = os.path.join("datacard/test_img", p["person"])
        c_path = os.path.join("datacard/test_color", p["cloth"])
        out_path = os.path.join("research/vton-profiling-optimization/results/raw_logs", f"{pid}_profiled.png")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        
        print(f"[{idx:02d}/20] Dang gui {pid} ({p['mode']})...", end=" ", flush=True)
        t_req_start = time.perf_counter()
        
        try:
            with open(p_path, "rb") as f_p, open(c_path, "rb") as f_c:
                files = {
                    "person_image": (p["person"], f_p, "image/jpeg"),
                    "cloth_image": (p["cloth"], f_c, "image/jpeg")
                }
                data = {"category": p["category"]}
                res = requests.post(api_url, headers=HEADERS, files=files, data=data, timeout=180)
                
            e2e_latency = round(time.perf_counter() - t_req_start, 3)
            
            if res.status_code == 200:
                with open(out_path, "wb") as f_out:
                    f_out.write(res.content)
                    
                h = res.headers
                prep_time = float(h.get("X-Preprocess-Time-Sec", 0.0))
                infer_time = float(h.get("X-Inference-Time-Sec", 0.0))
                post_time = float(h.get("X-Postprocess-Time-Sec", 0.0))
                internal_total = float(h.get("X-Internal-Total-Sec", 0.0))
                peak_vram = float(h.get("X-Peak-VRAM-GB", 0.0))
                cold_start = h.get("X-Cold-Start-Sec", cold_start_time)
                
                network_overhead = round(e2e_latency - internal_total, 3) if internal_total > 0 else "N/A"
                
                # Tinh SSIM/PSNR
                score_ssim, score_psnr = compute_quality_metrics(p_path, out_path)
                
                print(f"OK | E2E: {e2e_latency}s | Internal: {internal_total}s (Prep: {prep_time}s, Infer: {infer_time}s) | VRAM: {peak_vram}GB | SSIM: {score_ssim}")
                
                results.append({
                    "pair_id": pid,
                    "mode": p["mode"],
                    "person_image": p["person"],
                    "cloth_image": p["cloth"],
                    "category": p["category"],
                    "cold_start_time_s": cold_start,
                    "preprocess_time_s": prep_time,
                    "inference_time_s": infer_time,
                    "postprocess_time_s": post_time,
                    "internal_total_latency_s": internal_total,
                    "e2e_latency_s": e2e_latency,
                    "network_transit_overhead_s": network_overhead,
                    "peak_vram_gb": peak_vram,
                    "ssim_out_of_mask": score_ssim,
                    "psnr_db": score_psnr,
                    "status": "SUCCESS"
                })
            else:
                print(f"FAILED (Status {res.status_code})")
                results.append({
                    "pair_id": pid,
                    "mode": p["mode"],
                    "person_image": p["person"],
                    "cloth_image": p["cloth"],
                    "category": p["category"],
                    "cold_start_time_s": cold_start_time,
                    "preprocess_time_s": "ERR",
                    "inference_time_s": "ERR",
                    "postprocess_time_s": "ERR",
                    "internal_total_latency_s": "ERR",
                    "e2e_latency_s": e2e_latency,
                    "network_transit_overhead_s": "ERR",
                    "peak_vram_gb": "ERR",
                    "ssim_out_of_mask": 0.0,
                    "psnr_db": 0.0,
                    "status": f"FAILED_HTTP_{res.status_code}"
                })
        except Exception as e:
            print(f"EXCEPTION: {e}")
            results.append({
                "pair_id": pid,
                "mode": p["mode"],
                "person_image": p["person"],
                "cloth_image": p["cloth"],
                "category": p["category"],
                "cold_start_time_s": cold_start_time,
                "preprocess_time_s": "ERR",
                "inference_time_s": "ERR",
                "postprocess_time_s": "ERR",
                "internal_total_latency_s": "ERR",
                "e2e_latency_s": "ERR",
                "network_transit_overhead_s": "ERR",
                "peak_vram_gb": "ERR",
                "ssim_out_of_mask": 0.0,
                "psnr_db": 0.0,
                "status": f"EXCEPTION_{type(e).__name__}"
            })

    # Ghi vao CSV
    with open(output_csv, "w", encoding="utf-8") as f_csv:
        header = "pair_id,mode,person_image,cloth_image,category,cold_start_time_s,preprocess_time_s,inference_time_s,postprocess_time_s,internal_total_latency_s,e2e_latency_s,network_transit_overhead_s,peak_vram_gb,ssim_out_of_mask,psnr_db,status\n"
        f_csv.write(header)
        for r in results:
            line = f"{r['pair_id']},{r['mode']},{r['person_image']},{r['cloth_image']},{r['category']},{r['cold_start_time_s']},{r['preprocess_time_s']},{r['inference_time_s']},{r['postprocess_time_s']},{r['internal_total_latency_s']},{r['e2e_latency_s']},{r['network_transit_overhead_s']},{r['peak_vram_gb']},{r['ssim_out_of_mask']},{r['psnr_db']},{r['status']}\n"
            f_csv.write(line)
            
    print(f"=== DA HOAN TAT VA XUAT KET QUA RA: {output_csv} ===")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CatVTON GPU Profiling Benchmark")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="Kaggle tryon API endpoint URL")
    parser.add_argument("--out", default="research/vton-profiling-optimization/results/profiling_latency.csv", help="Output CSV path")
    args = parser.parse_args()
    run_profiling(api_url=args.url, output_csv=args.out)

