import argparse
import csv
import hashlib
import json
import os
import time
import numpy as np
import requests
from PIL import Image
from skimage.metrics import peak_signal_noise_ratio as psnr
from skimage.metrics import structural_similarity as ssim

DEFAULT_API_URL = os.environ.get(
    "CATVTON_SERVICE_URL",
    "https://aspire-traps-deserving.ngrok-free.dev/api/tryon",
)
DEFAULT_MANIFEST = "Evidence/W08/frozen_pairs_w08.json"
HEADERS = {"ngrok-skip-browser-warning": "true"}


def _file_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_frozen_manifest(manifest_path: str) -> list[dict]:
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    pairs = []
    for rec in manifest["pairs"]:
        p_path = rec["person_rel"]
        c_path = rec["cloth_rel"]
        if not os.path.isfile(p_path) or not os.path.isfile(c_path):
            raise FileNotFoundError(f"{rec['pair_id']}: khong tim thay {p_path} hoac {c_path}")
        if _file_sha256(p_path) != rec["person_sha256"]:
            raise ValueError(f"{rec['pair_id']}: sai SHA-256 cho {p_path}")
        if _file_sha256(c_path) != rec["cloth_sha256"]:
            raise ValueError(f"{rec['pair_id']}: sai SHA-256 cho {c_path}")
        pairs.append({
            "pair_id": rec["pair_id"],
            "mode": rec.get("group", "Unpaired"),
            "person_path": p_path,
            "cloth_path": c_path,
            "category": rec["category"],
            "pair_seed": rec["pair_seed"],
        })
    return pairs


def compute_quality_metrics(person_path: str, result_path: str) -> tuple[float, float]:
    """Tinh SSIM va PSNR tren vung bien 15% tren + 15% duoi khi API khong tra ve mask."""
    p_img = Image.open(person_path).convert("RGB").resize((768, 1024))
    r_img = Image.open(result_path).convert("RGB").resize((768, 1024))

    p_arr = np.array(p_img)
    r_arr = np.array(r_img)

    h, _, _ = p_arr.shape
    bg_p = np.concatenate([p_arr[0 : int(h * 0.15), :], p_arr[int(h * 0.85) : h, :]], axis=0)
    bg_r = np.concatenate([r_arr[0 : int(h * 0.15), :], r_arr[int(h * 0.85) : h, :]], axis=0)

    val_ssim = ssim(bg_p, bg_r, channel_axis=2, data_range=255)
    val_psnr = psnr(bg_p, bg_r, data_range=255)
    return round(float(val_ssim), 4), round(float(val_psnr), 2)


def _safe_float(val, fallback=0.0):
    try:
        return round(float(val), 3)
    except (TypeError, ValueError):
        return fallback


def run_profiling(
    api_url: str = DEFAULT_API_URL,
    manifest_path: str = DEFAULT_MANIFEST,
    output_csv: str = "Evidence/W08/results/api_profiling.csv",
    steps: int = 20,
    guidance_scale: float = 4.5,
    mask_mode: str = "refined",
    override_seed: int | None = None,
):
    pairs = load_frozen_manifest(manifest_path)
    total_pairs = len(pairs)
    print(f"=== CHAY PROFILING {total_pairs} CAP CO DINH ({manifest_path}) ===")
    print(f"Target: {api_url} | steps={steps}, guidance={guidance_scale}, mask_mode={mask_mode}")

    health_url = api_url.replace("/api/tryon", "/api/health")
    cold_start_time = 0.0
    health_meta = {}
    try:
        r_health = requests.get(health_url, headers=HEADERS, timeout=10)
        if r_health.status_code == 200:
            health_meta = r_health.json()
            cold_start_time = _safe_float(health_meta.get("cold_start_time_s"), 0.0)
            print(
                f"[HEALTH] GPU: {health_meta.get('gpu')} | "
                f"Commit: {health_meta.get('catvton_commit', 'N/A')} | "
                f"VRAM: {health_meta.get('current_vram_gb')} GB"
            )
    except Exception as exc:
        print(f"[HEALTH] Khong ket noi duoc {health_url}: {exc}")
        return

    out_dir = os.path.dirname(output_csv) or "."
    raw_logs_dir = os.path.join(out_dir, "raw_logs")
    os.makedirs(raw_logs_dir, exist_ok=True)

    results = []
    for idx, p in enumerate(pairs, start=1):
        pid = p["pair_id"]
        seed_to_use = p["pair_seed"] if override_seed is None else override_seed
        out_path = os.path.join(raw_logs_dir, f"{pid}_{mask_mode}_s{steps}.png")

        print(f"[{idx:02d}/{total_pairs}] {pid} (seed={seed_to_use})...", end=" ", flush=True)
        t_req_start = time.perf_counter()

        try:
            with open(p["person_path"], "rb") as f_p, open(p["cloth_path"], "rb") as f_c:
                files = {
                    "person_image": (os.path.basename(p["person_path"]), f_p, "image/jpeg"),
                    "cloth_image": (os.path.basename(p["cloth_path"]), f_c, "image/jpeg"),
                }
                data = {
                    "category": p["category"],
                    "seed": str(seed_to_use),
                    "steps": str(steps),
                    "guidance_scale": str(guidance_scale),
                    "mask_mode": mask_mode,
                }
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
                score_ssim, score_psnr = compute_quality_metrics(p["person_path"], out_path)

                print(
                    f"OK | E2E: {e2e_latency}s | Internal: {internal_total}s "
                    f"(Prep: {prep_time}s, Infer: {infer_time}s) | SSIM_bg: {score_ssim}"
                )

                results.append({
                    "pair_id": pid,
                    "group": p["mode"],
                    "category": p["category"],
                    "seed": seed_to_use,
                    "steps": steps,
                    "guidance_scale": guidance_scale,
                    "mask_mode": mask_mode,
                    "cold_start_time_s": cold_start,
                    "preprocess_time_s": prep_time,
                    "inference_time_s": infer_time,
                    "postprocess_time_s": post_time,
                    "internal_total_latency_s": internal_total,
                    "e2e_latency_s": e2e_latency,
                    "network_transit_overhead_s": network_overhead,
                    "peak_vram_gb": peak_vram,
                    "ssim_border": score_ssim,
                    "psnr_border": score_psnr,
                    "status": "SUCCESS",
                })
            else:
                print(f"FAILED HTTP {res.status_code}")
                results.append({
                    "pair_id": pid, "group": p["mode"], "category": p["category"],
                    "seed": seed_to_use, "steps": steps, "guidance_scale": guidance_scale,
                    "mask_mode": mask_mode, "cold_start_time_s": cold_start_time,
                    "preprocess_time_s": "ERR", "inference_time_s": "ERR", "postprocess_time_s": "ERR",
                    "internal_total_latency_s": "ERR", "e2e_latency_s": e2e_latency,
                    "network_transit_overhead_s": "ERR", "peak_vram_gb": "ERR",
                    "ssim_border": 0.0, "psnr_border": 0.0, "status": f"FAILED_HTTP_{res.status_code}",
                })
        except Exception as exc:
            print(f"EXCEPTION: {exc}")
            results.append({
                "pair_id": pid, "group": p["mode"], "category": p["category"],
                "seed": seed_to_use, "steps": steps, "guidance_scale": guidance_scale,
                "mask_mode": mask_mode, "cold_start_time_s": cold_start_time,
                "preprocess_time_s": "ERR", "inference_time_s": "ERR", "postprocess_time_s": "ERR",
                "internal_total_latency_s": "ERR", "e2e_latency_s": "ERR",
                "network_transit_overhead_s": "ERR", "peak_vram_gb": "ERR",
                "ssim_border": 0.0, "psnr_border": 0.0, "status": f"EXCEPTION_{type(exc).__name__}",
            })

    fieldnames = [
        "pair_id", "group", "category", "seed", "steps", "guidance_scale", "mask_mode",
        "cold_start_time_s", "preprocess_time_s", "inference_time_s", "postprocess_time_s",
        "internal_total_latency_s", "e2e_latency_s", "network_transit_overhead_s",
        "peak_vram_gb", "ssim_border", "psnr_border", "status",
    ]
    with open(output_csv, "w", encoding="utf-8", newline="") as f_csv:
        writer = csv.DictWriter(f_csv, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    meta_path = os.path.splitext(output_csv)[0] + "_meta.json"
    with open(meta_path, "w", encoding="utf-8") as f_meta:
        json.dump({
            "manifest": manifest_path,
            "api_url": api_url,
            "steps": steps,
            "guidance_scale": guidance_scale,
            "mask_mode": mask_mode,
            "override_seed": override_seed,
            "server_health": health_meta,
        }, f_meta, ensure_ascii=False, indent=2)

    print(f"Da luu: {output_csv} va {meta_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CatVTON Reproducible API Benchmark")
    parser.add_argument("--url", default=DEFAULT_API_URL)
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST)
    parser.add_argument("--out", default="Evidence/W08/results/api_profiling.csv")
    parser.add_argument("--steps", type=int, default=20)
    parser.add_argument("--guidance", type=float, default=4.5)
    parser.add_argument("--mask-mode", choices=["refined", "baseline"], default="refined")
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()
    run_profiling(
        api_url=args.url,
        manifest_path=args.manifest,
        output_csv=args.out,
        steps=args.steps,
        guidance_scale=args.guidance,
        mask_mode=args.mask_mode,
        override_seed=args.seed,
    )
