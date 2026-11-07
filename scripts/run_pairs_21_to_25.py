import os
import sys
import time
import requests
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as ssim
from skimage.metrics import peak_signal_noise_ratio as psnr

API_URL = "https://aspire-traps-deserving.ngrok-free.dev/api/tryon"
HEADERS = {"ngrok-skip-browser-warning": "true"}

NEW_PAIRS = [
    {
        "pair_id": "P-21",
        "mode": "Paired",
        "person": "000048_0.jpg",
        "cloth": "000048_1.jpg",
        "category": "upper",
        "desc": "Áo thun vàng mù tạc nổi bật, cổ tròn cộc tay"
    },
    {
        "pair_id": "P-22",
        "mode": "Paired",
        "person": "000347_0.jpg",
        "cloth": "000347_1.jpg",
        "category": "upper",
        "desc": "Áo dệt kim cộc tay màu đỏ rượu vang (burgundy), cổ bẻ nhẹ"
    },
    {
        "pair_id": "P-23",
        "mode": "Unpaired",
        "person": "000001_0.jpg",
        "cloth": "000048_1.jpg",
        "category": "upper",
        "desc": "Hoán đổi: Áo thun trắng cổ tròn -> Áo vàng mù tạc tay lửng"
    },
    {
        "pair_id": "P-24",
        "mode": "Unpaired",
        "person": "000109_0.jpg",
        "cloth": "000303_1.jpg",
        "category": "upper",
        "desc": "Hoán đổi: Áo tối màu -> Áo dệt len xanh tím than (indigo) có gân sọc dệt"
    },
    {
        "pair_id": "P-25",
        "mode": "Unpaired",
        "person": "000020_0.jpg",
        "cloth": "000274_1.jpg",
        "category": "overall",
        "desc": "Hoán đổi: Áo thun/quần jean tách rời -> Váy suông đầm dài trắng liền thân"
    }
]

def compute_quality_metrics(person_path, result_path):
    p_img = Image.open(person_path).convert("RGB").resize((768, 1024))
    r_img = Image.open(result_path).convert("RGB").resize((768, 1024))
    
    p_arr = np.array(p_img)
    r_arr = np.array(r_img)
    
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

def main():
    print("=== BAT DAU CHAY 5 CAP VTON BO SUNG (P-21 DEN P-25) ===", flush=True)
    raw_logs_dir = "research/vton-profiling-optimization/results/raw_logs"
    os.makedirs(raw_logs_dir, exist_ok=True)
    
    results = []
    
    for idx, p in enumerate(NEW_PAIRS, start=21):
        pid = p["pair_id"]
        p_path = os.path.join("datacard/test_img", p["person"])
        c_path = os.path.join("datacard/test_color", p["cloth"])
        out_path = os.path.join(raw_logs_dir, f"{pid}_profiled.png")
        
        print(f"[{idx}/25] Dang gui {pid} ({p['mode']}) - {p['desc']}...", end=" ", flush=True)
        t_req_start = time.perf_counter()
        
        try:
            with open(p_path, "rb") as f_p, open(c_path, "rb") as f_c:
                files = {
                    "person_image": (p["person"], f_p, "image/jpeg"),
                    "cloth_image": (p["cloth"], f_c, "image/jpeg")
                }
                data = {"category": p["category"]}
                res = requests.post(API_URL, headers=HEADERS, files=files, data=data, timeout=180)
                
            e2e_latency = round(time.perf_counter() - t_req_start, 3)
            
            if res.status_code == 200:
                with open(out_path, "wb") as f_out:
                    f_out.write(res.content)
                    
                h = res.headers
                prep_time = float(h.get("X-Preprocess-Time-Sec", 0.0))
                infer_time = float(h.get("X-Inference-Time-Sec", 0.0))
                post_time = float(h.get("X-Postprocess-Time-Sec", 0.0))
                internal_total = float(h.get("X-Internal-Total-Sec", 0.0))
                peak_vram = float(h.get("X-Peak-Vram-Gb", h.get("X-Peak-VRAM-GB", 0.0)))
                cold_start = h.get("X-Cold-Start-Sec", "N/A")
                
                network_overhead = round(e2e_latency - internal_total, 3) if internal_total > 0 else "N/A"
                score_ssim, score_psnr = compute_quality_metrics(p_path, out_path)
                
                print(f"OK | E2E: {e2e_latency}s | Infer: {infer_time}s | VRAM: {peak_vram}GB | SSIM: {score_ssim} | PSNR: {score_psnr}dB", flush=True)
                
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
                    "status": "SUCCESS",
                    "desc": p["desc"]
                })
            else:
                print(f"FAILED (Status {res.status_code}): {res.text[:200]}", flush=True)
        except Exception as e:
            print(f"ERROR: {e}", flush=True)
            
    # Ghi log ra file tam de dung sau
    import json
    with open("research/vton-profiling-optimization/results/pairs_21_25_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("=== HOAN TAT CHAY 5 CAP MOI ===", flush=True)

if __name__ == "__main__":
    main()

