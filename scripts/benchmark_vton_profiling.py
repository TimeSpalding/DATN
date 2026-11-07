import csv
import os
import time
import argparse
import requests
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity as ssim
from skimage.metrics import peak_signal_noise_ratio as psnr

DEFAULT_API_URL = os.environ.get(
    "CATVTON_SERVICE_URL",
    "https://aspire-traps-deserving.ngrok-free.dev/api/tryon",
)
HEADERS = {"ngrok-skip-browser-warning": "true"}

PAIRS = [
    {"pair_id": "P-01", "mode": "Unpaired", "person": "000164_0.jpg", "cloth": "011363_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo sơ mi trắng cộc tay cổ trụ -> Áo thun dài tay cổ tròn rộng màu đỏ thẫm"},
    {"pair_id": "P-02", "mode": "Unpaired", "person": "000183_0.jpg", "cloth": "000192_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo voan trắng sát nách -> Áo phông xanh lá đậm in chữ trắng 'HUSTLE'"},
    {"pair_id": "P-03", "mode": "Unpaired", "person": "000266_0.jpg", "cloth": "000532_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo phông đen & quần đen đồng màu -> Áo cộc tay họa tiết hoa văn đỏ - trắng"},
    {"pair_id": "P-04", "mode": "Unpaired", "person": "000209_0.jpg", "cloth": "017639_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo form rộng xanh rêu tay lửng -> Áo thun tay lỡ kẻ sọc ngang đen - trắng"},
    {"pair_id": "P-05", "mode": "Unpaired", "person": "000514_0.jpg", "cloth": "000118_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo phông trắng cộc tay -> Áo dài tay màu xanh tím than chấm bi trắng"},
    {"pair_id": "P-06", "mode": "Unpaired", "person": "000066_0.jpg", "cloth": "017957_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo dài tay cổ tim xanh dương đậm -> Áo phông trắng in biểu tượng 'adidas' đen"},
    {"pair_id": "P-07", "mode": "Unpaired", "person": "000466_0.jpg", "cloth": "000228_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo thun cổ tim xám sáng trơn -> Áo phông xanh rêu in hình đầu hổ tròn trắng"},
    {"pair_id": "P-08", "mode": "Unpaired", "person": "000174_0.jpg", "cloth": "000523_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo ba lỗ đen tuyền -> Áo tay ngắn kẻ sọc ngang bản lớn màu pastel xanh - cam - trắng"},
    {"pair_id": "P-09", "mode": "Unpaired", "person": "000258_0.jpg", "cloth": "000445_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo thun cộc tay xám than tối -> Áo tay hến cổ tròn màu đỏ hồng san hô"},
    {"pair_id": "P-10", "mode": "Unpaired", "person": "000320_0.jpg", "cloth": "004702_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo dài tay màu đỏ rượu dáng trùm hông -> Áo phông trắng in chữ đỏ 'IAM SCARLETT'"},
    {"pair_id": "P-11", "mode": "Unpaired", "person": "000274_0.jpg", "cloth": "000154_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo hai dây trắng bản to -> Áo dài tay xanh rêu phối ren cổ cao và gấu áo"},
    {"pair_id": "P-12", "mode": "Unpaired", "person": "000445_0.jpg", "cloth": "009332_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo tay ngắn màu hồng đỏ (tay đặt hông) -> Áo dài tay màu đen cổ đắp chéo chữ V"},
    {"pair_id": "P-13", "mode": "Unpaired", "person": "000028_0.jpg", "cloth": "013989_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo dài tay đen mỏng xuyên thấu -> Áo dài tay xám tiêu cổ chữ V đan dây chéo"},
    {"pair_id": "P-14", "mode": "Unpaired", "person": "000057_0.jpg", "cloth": "018626_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo sát nách xếp ly xanh cổ vịt -> Áo polo cộc tay có cổ bẻ màu đỏ tươi"},
    {"pair_id": "P-15", "mode": "Unpaired", "person": "000074_0.jpg", "cloth": "007874_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo thun trắng in chấm tròn pastel -> Áo tay cánh dơi kẻ sọc ngang xanh - trắng"},
    {"pair_id": "P-16", "mode": "Unpaired", "person": "000082_0.jpg", "cloth": "007664_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo henley tay lỡ màu xám chì -> Áo khoét vai màu đỏ tươi họa tiết hoa trắng - xanh"},
    {"pair_id": "P-17", "mode": "Unpaired", "person": "000339_0.jpg", "cloth": "015158_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo dài tay kẻ sọc xám - trắng -> Áo phông trắng tinh in chữ nhỏ 'RIOT' ngực trái"},
    {"pair_id": "P-18", "mode": "Unpaired", "person": "004342_0.jpg", "cloth": "013593_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo dài tay cổ tròn rộng xám trắng sáng -> Áo dài tay cổ tim màu đen tuyền"},
    {"pair_id": "P-19", "mode": "Unpaired", "person": "017639_0.jpg", "cloth": "001614_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo tay ngắn kẻ sọc đen - trắng -> Áo dài tay cổ lọ thấp màu hồng phấn pastel"},
    {"pair_id": "P-20", "mode": "Unpaired", "person": "011363_0.jpg", "cloth": "001255_1.jpg", "category": "overall", "desc": "Hoán đổi (overall): Áo đỏ dài tay & quần đen -> Áo sát nách dáng dài xanh tím than"},
    {"pair_id": "P-21", "mode": "Unpaired", "person": "000395_0.jpg", "cloth": "000370_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo tay lỡ màu xanh tím than trơn -> Áo cộc tay kẻ sọc ngang cam đất - đen đính hoa ngực"},
    {"pair_id": "P-22", "mode": "Unpaired", "person": "000129_0.jpg", "cloth": "000347_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo ba lỗ xám ghi dáng nghiêng -> Áo phông đỏ rượu vang in chữ gothic 'Authentic'"},
    {"pair_id": "P-23", "mode": "Unpaired", "person": "000001_0.jpg", "cloth": "000048_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo dài tay cổ tròn rộng màu đen -> Áo cộc tay xếp ly cổ màu vàng mù tạc"},
    {"pair_id": "P-24", "mode": "Unpaired", "person": "000109_0.jpg", "cloth": "000303_1.jpg", "category": "upper", "desc": "Hoán đổi: Áo sát nách đen họa tiết hoa ánh kim -> Áo dài tay kẻ sọc ngang trắng - xanh - đen"},
    {"pair_id": "P-25", "mode": "Unpaired", "person": "000020_0.jpg", "cloth": "000274_1.jpg", "category": "overall", "desc": "Hoán đổi (overall): Áo trắng tay bèo & chân váy bò -> Áo hai dây dáng dài trắng trên nền trắng"},
]


def compute_quality_metrics(person_path: str, result_path: str) -> tuple[float, float]:
    p_img = Image.open(person_path).convert("RGB").resize((768, 1024))
    r_img = Image.open(result_path).convert("RGB").resize((768, 1024))

    p_arr = np.array(p_img)
    r_arr = np.array(r_img)

    # Do luong bao toan vung nen ngoai mat na (15% dinh dau + 15% chan duoi)
    h, _, _ = p_arr.shape
    top_p = p_arr[0:int(h * 0.15), :]
    top_r = r_arr[0:int(h * 0.15), :]
    bot_p = p_arr[int(h * 0.85):h, :]
    bot_r = r_arr[int(h * 0.85):h, :]

    bg_p = np.concatenate([top_p, bot_p], axis=0)
    bg_r = np.concatenate([top_r, bot_r], axis=0)

    score_ssim = ssim(bg_p, bg_r, channel_axis=2, data_range=255)
    score_psnr = psnr(bg_p, bg_r, data_range=255)

    return round(float(score_ssim), 4), round(float(score_psnr), 2)


def _safe_float(val, fallback=0.0):
    try:
        return round(float(val), 3)
    except (TypeError, ValueError):
        return fallback


def run_profiling(
    api_url: str = DEFAULT_API_URL,
    output_csv: str = "research/vton-profiling-optimization/results/profiling_latency.csv",
):
    total_pairs = len(PAIRS)
    print(f"=== BAT DAU CHAY PROFILING {total_pairs} CAP VTON UNPAIRED ===")
    print(f"Target API Endpoint: {api_url}")

    health_url = api_url.replace("/api/tryon", "/api/health")
    cold_start_time = 0.0
    try:
        r_health = requests.get(health_url, headers=HEADERS, timeout=10)
        if r_health.status_code == 200:
            h_data = r_health.json()
            cold_start_time = _safe_float(h_data.get("cold_start_time_s"), 0.0)
            print(
                f"[HEALTH CHECK] Server OK | GPU: {h_data.get('gpu')} | "
                f"Cold-Start: {cold_start_time}s | Current VRAM: {h_data.get('current_vram_gb')} GB"
            )
        else:
            print(f"[HEALTH CHECK] Server tra ve status: {r_health.status_code}")
    except Exception as exc:
        print(f"[HEALTH CHECK] Khong the ket noi den {health_url}: {exc}")
        print("Kiem tra lai trang thai session Kaggle hoac URL ngrok truoc khi tiep tuc.")
        return

    results = []
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)

    for idx, p in enumerate(PAIRS, start=1):
        pid = p["pair_id"]
        p_path = os.path.join("datacard/test_img", p["person"])
        c_path = os.path.join("datacard/test_color", p["cloth"])
        out_path = os.path.join(
            "research/vton-profiling-optimization/results/raw_logs",
            f"{pid}_profiled.png",
        )
        os.makedirs(os.path.dirname(out_path), exist_ok=True)

        print(f"[{idx:02d}/{total_pairs}] Dang gui {pid} ({p['mode']})...", end=" ", flush=True)
        t_req_start = time.perf_counter()

        try:
            with open(p_path, "rb") as f_p, open(c_path, "rb") as f_c:
                files = {
                    "person_image": (p["person"], f_p, "image/jpeg"),
                    "cloth_image": (p["cloth"], f_c, "image/jpeg"),
                }
                data = {"category": p["category"]}
                res = requests.post(api_url, headers=HEADERS, files=files, data=data, timeout=180)

            e2e_latency = round(time.perf_counter() - t_req_start, 3)

            if res.status_code == 200:
                with open(out_path, "wb") as f_out:
                    f_out.write(res.content)

                h = res.headers
                prep_time = _safe_float(h.get("X-Preprocess-Time-Sec"), 0.0)
                infer_time = _safe_float(h.get("X-Inference-Time-Sec"), 0.0)
                post_time = _safe_float(h.get("X-Postprocess-Time-Sec"), 0.0)
                internal_total = _safe_float(h.get("X-Internal-Total-Sec"), 0.0)
                peak_vram = _safe_float(h.get("X-Peak-VRAM-GB"), 0.0)
                cold_start = _safe_float(h.get("X-Cold-Start-Sec"), cold_start_time)

                network_overhead = round(e2e_latency - internal_total, 3) if internal_total > 0 else "N/A"
                score_ssim, score_psnr = compute_quality_metrics(p_path, out_path)

                print(
                    f"OK | E2E: {e2e_latency}s | Internal: {internal_total}s "
                    f"(Prep: {prep_time}s, Infer: {infer_time}s) | "
                    f"VRAM: {peak_vram}GB | SSIM: {score_ssim}"
                )

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
                    "status": f"FAILED_HTTP_{res.status_code}",
                })
        except Exception as exc:
            print(f"EXCEPTION: {exc}")
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
                "status": f"EXCEPTION_{type(exc).__name__}",
            })

    with open(output_csv, "w", encoding="utf-8", newline="") as f_csv:
        fieldnames = [
            "pair_id",
            "mode",
            "person_image",
            "cloth_image",
            "category",
            "cold_start_time_s",
            "preprocess_time_s",
            "inference_time_s",
            "postprocess_time_s",
            "internal_total_latency_s",
            "e2e_latency_s",
            "network_transit_overhead_s",
            "peak_vram_gb",
            "ssim_out_of_mask",
            "psnr_db",
            "status",
        ]
        writer = csv.DictWriter(f_csv, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"=== DA HOAN TAT VA XUAT KET QUA RA: {output_csv} ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CatVTON GPU Profiling Benchmark (25 Unpaired Pairs)")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="Kaggle tryon API endpoint URL")
    parser.add_argument(
        "--out",
        default="research/vton-profiling-optimization/results/profiling_latency.csv",
        help="Output CSV path",
    )
    args = parser.parse_args()
    run_profiling(api_url=args.url, output_csv=args.out)
