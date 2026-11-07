import os
import sys
import json
import shutil
import pandas as pd
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

# Import the verified 25-pair audit dictionary
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generate_excel_benchmark import BENCHMARK_AUDIT_DATA

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_LATENCY = os.path.join(ROOT, "research/vton-profiling-optimization/results/profiling_latency.csv")
CSV_PRECISION = os.path.join(ROOT, "research/vton-profiling-optimization/results/precision_ablation.csv")
RAW_LOGS_DIR = os.path.join(ROOT, "research/vton-profiling-optimization/results/raw_logs")

EVIDENCE_W6_DIR = os.path.join(ROOT, "Evidence/W06")
EVIDENCE_RES_DIR = os.path.join(EVIDENCE_W6_DIR, "results")
EVIDENCE_FIG_DIR = os.path.join(EVIDENCE_W6_DIR, "figures")

DOCX_OUT_PRIMARY = os.path.join(ROOT, "bao_cao_hang_tuan/Báo cáo tiến độ đồ án tốt nghiệp tuần 6.docx")
DOCX_OUT_MIRROR = os.path.join(ROOT, "docs/Báo cáo tiến độ đồ án tốt nghiệp tuần 6.docx")

plt.rcParams["font.sans-serif"] = ["Segoe UI", "Arial", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False


def get_pil_font(size=16, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def extract_numeric_score(grade_str):
    # e.g. "Rất tốt (9.1/10)" -> 9.1
    try:
        inside = grade_str.split("(")[1].split("/")[0]
        return float(inside)
    except Exception:
        return 8.0


def build_evidence_results_and_figures(df):
    os.makedirs(EVIDENCE_RES_DIR, exist_ok=True)
    os.makedirs(EVIDENCE_FIG_DIR, exist_ok=True)

    font_hdr = get_pil_font(20, bold=True)
    font_sub = get_pil_font(15, bold=False)

    # 1. Copy 25 result PNGs and generate 25 3-panel comparison grids
    for _, r in df.iterrows():
        pid = r["pair_id"]
        src_res = os.path.join(RAW_LOGS_DIR, f"{pid}_profiled.png")
        dst_res = os.path.join(EVIDENCE_RES_DIR, f"{pid}_result.png")
        if os.path.exists(src_res):
            shutil.copy2(src_res, dst_res)

        p_path = os.path.join(ROOT, "datacard/test_img", str(r["person_image"]))
        c_path = os.path.join(ROOT, "datacard/test_color", str(r["cloth_image"]))
        if os.path.exists(p_path) and os.path.exists(c_path) and os.path.exists(src_res):
            w_panel, h_panel = 384, 512
            p_im = Image.open(p_path).convert("RGB").resize((w_panel, h_panel), Image.Resampling.LANCZOS)
            c_im = Image.open(c_path).convert("RGB").resize((w_panel, h_panel), Image.Resampling.LANCZOS)
            r_im = Image.open(src_res).convert("RGB").resize((w_panel, h_panel), Image.Resampling.LANCZOS)

            top_h = 56
            grid = Image.new("RGB", (w_panel * 3 + 24, h_panel + top_h + 12), (248, 250, 252))
            draw = ImageDraw.Draw(grid)
            draw.rectangle([(0, 0), (grid.width, top_h)], fill=(27, 54, 93))
            grade_str = BENCHMARK_AUDIT_DATA[pid]["grade"]
            draw.text((16, 8), f"{pid} ({r['mode']} - {r['category']}) | Xếp loại: {grade_str}", fill=(255, 255, 255), font=font_hdr)
            draw.text((16, 33), "1. Người mẫu gốc", fill=(203, 213, 225), font=font_sub)
            draw.text((w_panel + 22, 33), "2. Trang phục đích", fill=(203, 213, 225), font=font_sub)
            draw.text((w_panel * 2 + 28, 33), "3. Kết quả CatVTON", fill=(203, 213, 225), font=font_sub)

            grid.paste(p_im, (6, top_h + 6))
            grid.paste(c_im, (w_panel + 12, top_h + 6))
            grid.paste(r_im, (w_panel * 2 + 18, top_h + 6))
            grid.save(os.path.join(EVIDENCE_RES_DIR, f"{pid}_grid.jpg"), "JPEG", quality=88)

    # 2. Figure 1: Latency Breakdown (4 GPU phases + Network)
    mean_prep = float(df["preprocess_time_s"].mean())
    mean_infer = float(df["inference_time_s"].mean())
    mean_post = float(df["postprocess_time_s"].mean())
    mean_net = float(df["network_transit_overhead_s"].mean())
    mean_e2e = mean_prep + mean_infer + mean_post + mean_net

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12.5, 4.6), gridspec_kw={"width_ratios": [1.35, 1]})
    stages = [
        "Tiền xử lý\n(DensePose + SCHP)",
        "Suy diễn UNet\n(20 bước DPM++ FP16)",
        "Hậu xử lý\n(VAE Decode + PNG)",
        "Truyền tải mạng\n(HTTP Multipart TLS)",
    ]
    vals = [mean_prep, mean_infer, mean_post, mean_net]
    colors = ["#3B82F6", "#1B365D", "#10B981", "#F59E0B"]

    y_pos = np.arange(len(stages))
    bars = ax1.barh(y_pos, vals, color=colors, height=0.55, edgecolor="#CBD5E1")
    ax1.set_yticks(y_pos)
    ax1.set_yticklabels(stages, fontsize=9.5)
    ax1.invert_yaxis()
    ax1.set_xlabel("Thời gian trung bình trên mỗi cặp thử đồ (giây)", fontsize=10)
    ax1.set_title("Phân rã thời gian xử lý đầu-cuối (E2E)", fontsize=11, fontweight="bold", color="#1B365D")
    ax1.set_xlim(0, max(vals) * 1.24)
    ax1.grid(axis="x", linestyle="--", alpha=0.4)
    for bar, v in zip(bars, vals):
        pct = (v / mean_e2e) * 100.0
        ax1.text(v + 0.8, bar.get_y() + bar.get_height() / 2, f"{v:.2f}s ({pct:.1f}%)", va="center", fontsize=9.5, fontweight="bold", color="#1E293B")

    # Right panel: Cold-start vs Warm E2E vs Internal GPU total
    summary_labels = ["Khởi động nguội\n(Cold-start 1 lần)", "Tính toán nội bộ GPU\n(Trung bình 25 cặp)", "Tổng độ trễ E2E\n(Trung bình 25 cặp)"]
    summary_vals = [42.80, mean_prep + mean_infer + mean_post, mean_e2e]
    s_bars = ax2.bar(summary_labels, summary_vals, color=["#64748B", "#1B365D", "#C05A39"], width=0.5)
    ax2.set_ylabel("Thời gian (giây)", fontsize=10)
    ax2.set_title("So sánh khởi động nguội và suy diễn", fontsize=11, fontweight="bold", color="#1B365D")
    ax2.set_ylim(0, max(summary_vals) * 1.2)
    ax2.grid(axis="y", linestyle="--", alpha=0.4)
    ax2.tick_params(axis="x", labelsize=8.8)
    for b, v in zip(s_bars, summary_vals):
        ax2.text(b.get_x() + b.get_width() / 2, v + 1.2, f"{v:.2f}s", ha="center", fontsize=9.5, fontweight="bold", color="#1E293B")

    plt.tight_layout()
    fig1_path = os.path.join(EVIDENCE_FIG_DIR, "fig_w6_latency_breakdown.png")
    plt.savefig(fig1_path, dpi=180)
    plt.close(fig)

    # 3. Figure 2: Mixed Precision Ablation (FP32 vs FP16 vs BF16)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11.8, 4.5))
    modes = ["FP32\n(torch.float32)", "FP16\n(torch.float16)", "BF16\n(torch.bfloat16)"]
    lat_prec = [157.56, 55.95, 0.0]
    b1 = ax1.bar(modes, lat_prec, color=["#475569", "#047857", "#DC2626"], width=0.48)
    ax1.set_ylabel("Thời gian suy diễn trung bình (giây)", fontsize=10)
    ax1.set_title("Tốc độ suy diễn theo chế độ dấu phẩy động (Tesla T4)", fontsize=11, fontweight="bold", color="#1B365D")
    ax1.set_ylim(0, 185)
    ax1.grid(axis="y", linestyle="--", alpha=0.4)
    ax1.text(b1[0].get_x() + b1[0].get_width() / 2, 161, "157.56s\n(1.00x)", ha="center", fontsize=9.5, fontweight="bold")
    ax1.text(b1[1].get_x() + b1[1].get_width() / 2, 60, "55.95s\n(Tăng tốc 2.82x)", ha="center", fontsize=9.5, fontweight="bold", color="#047857")
    ax1.text(b1[2].get_x() + b1[2].get_width() / 2, 12, "Thất bại (OOM)\nKhông hỗ trợ CC 7.5", ha="center", fontsize=9, fontweight="bold", color="#B91C1C")

    vram_prec = [6.57, 6.26, 36.0]
    b2 = ax2.bar(modes, vram_prec, color=["#475569", "#047857", "#DC2626"], width=0.48)
    ax2.axhline(15.0, color="#B91C1C", linestyle="--", linewidth=1.3, label="Giới hạn VRAM khả dụng T4 (~15 GB)")
    ax2.set_ylabel("Bộ nhớ GPU yêu cầu / chiếm dụng đỉnh (GB)", fontsize=10)
    ax2.set_title("Mức sử dụng bộ nhớ đồ họa đỉnh (Peak VRAM)", fontsize=11, fontweight="bold", color="#1B365D")
    ax2.set_ylim(0, 42)
    ax2.grid(axis="y", linestyle="--", alpha=0.4)
    ax2.legend(loc="upper left", fontsize=8.8)
    ax2.text(b2[0].get_x() + b2[0].get_width() / 2, 7.5, "6.57 GB", ha="center", fontsize=9.5, fontweight="bold")
    ax2.text(b2[1].get_x() + b2[1].get_width() / 2, 7.2, "6.26 GB", ha="center", fontsize=9.5, fontweight="bold", color="#047857")
    ax2.text(b2[2].get_x() + b2[2].get_width() / 2, 36.8, "36.00 GB (Tràn VRAM)", ha="center", fontsize=9, fontweight="bold", color="#B91C1C")

    plt.tight_layout()
    fig2_path = os.path.join(EVIDENCE_FIG_DIR, "fig_w6_precision_ablation.png")
    plt.savefig(fig2_path, dpi=180)
    plt.close(fig)

    # 4. Figure 3: 5x5 Visual Overview of all 25 Unpaired Pairs
    cols_m, rows_m = 5, 5
    cell_w, cell_h = 312, 162  # each cell has 3 mini-panels (98x130) + header strip
    mosaic = Image.new("RGB", (cols_m * cell_w + 16, rows_m * cell_h + 62), (255, 255, 255))
    mdraw = ImageDraw.Draw(mosaic)
    font_m_title = get_pil_font(22, bold=True)
    font_m_lbl = get_pil_font(12, bold=True)
    mdraw.rectangle([(0, 0), (mosaic.width, 48)], fill=(27, 54, 93))
    mdraw.text((18, 11), "TỔNG HỢP TRỰC QUAN 25 CẶP THỬ ĐỒ HOÁN ĐỔI (UNPAIRED) CAT-VTON [NGƯỜI MẪU | ÁO ĐÍCH | KẾT QUẢ]", fill=(255, 255, 255), font=font_m_title)

    for idx, r in df.iterrows():
        pid = r["pair_id"]
        rr, cc = divmod(idx, cols_m)
        x0 = 8 + cc * cell_w
        y0 = 54 + rr * cell_h
        grade_str = BENCHMARK_AUDIT_DATA[pid]["grade"]
        score_num = extract_numeric_score(grade_str)
        badge_col = (4, 120, 87) if score_num >= 9.0 else ((180, 83, 9) if score_num >= 7.5 else (185, 28, 28))

        mdraw.rectangle([(x0 + 2, y0 + 2), (x0 + cell_w - 4, y0 + cell_h - 4)], outline=(203, 213, 225), width=1)
        mdraw.rectangle([(x0 + 2, y0 + 2), (x0 + cell_w - 4, y0 + 24)], fill=badge_col)
        mdraw.text((x0 + 8, y0 + 5), f"{pid} | SSIM {float(r['ssim_out_of_mask']):.3f} | {score_num:.1f}/10", fill=(255, 255, 255), font=font_m_lbl)

        tri = [
            os.path.join(ROOT, "datacard/test_img", str(r["person_image"])),
            os.path.join(ROOT, "datacard/test_color", str(r["cloth_image"])),
            os.path.join(RAW_LOGS_DIR, f"{pid}_profiled.png"),
        ]
        for ti, tp in enumerate(tri):
            if os.path.exists(tp):
                im = Image.open(tp).convert("RGB").resize((96, 128), Image.Resampling.LANCZOS)
                mosaic.paste(im, (x0 + 6 + ti * 100, y0 + 28))

    fig3_path = os.path.join(EVIDENCE_FIG_DIR, "fig_w6_25pairs_overview.jpg")
    mosaic.save(fig3_path, "JPEG", quality=90)

    # 5. Figure 4: Quality Distribution & Per-Pair SSIM
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13.2, 4.8), gridspec_kw={"width_ratios": [1, 1.85]})
    tier_labels = ["Xuất sắc / Rất tốt\n(>= 9.0 điểm)", "Tốt / Khá\n(7.5 - 8.9 điểm)", "Trung bình / Lỗi nặng\n(< 7.0 điểm)"]
    scores = [extract_numeric_score(BENCHMARK_AUDIT_DATA[r["pair_id"]]["grade"]) for _, r in df.iterrows()]
    tier_counts = [
        sum(1 for s in scores if s >= 9.0),
        sum(1 for s in scores if 7.0 <= s < 9.0),
        sum(1 for s in scores if s < 7.0),
    ]
    t_bars = ax1.bar(tier_labels, tier_counts, color=["#047857", "#D97706", "#DC2626"], width=0.52)
    ax1.set_ylabel("Số lượng cặp kiểm thử", fontsize=10)
    ax1.set_title("Phân bố xếp loại thị giác (25 cặp)", fontsize=11, fontweight="bold", color="#1B365D")
    ax1.set_ylim(0, max(tier_counts) + 3)
    ax1.grid(axis="y", linestyle="--", alpha=0.4)
    ax1.tick_params(axis="x", labelsize=8.6)
    for b, cnt in zip(t_bars, tier_counts):
        ax1.text(b.get_x() + b.get_width() / 2, cnt + 0.35, f"{cnt} cặp ({cnt*4}%)", ha="center", fontsize=9.5, fontweight="bold")

    pids = list(df["pair_id"])
    ssims = [float(x) for x in df["ssim_out_of_mask"]]
    upper_mean_val = float(df[df["category"] == "upper"]["ssim_out_of_mask"].mean())
    bar_cols = ["#047857" if s >= 9.0 else ("#D97706" if s >= 7.0 else "#DC2626") for s in scores]
    ax2.bar(pids, ssims, color=bar_cols, width=0.68)
    ax2.axhline(upper_mean_val, color="#1B365D", linestyle="--", linewidth=1.2, label=f"Trung bình nhóm upper ({upper_mean_val:.4f})")
    ax2.set_ylim(0.65, 1.02)
    ax2.set_ylabel("Chỉ số SSIM ngoài mặt nạ", fontsize=10)
    ax2.set_title("Chỉ số SSIM vùng ngoài mặt nạ và tương quan mức độ lỗi trên 25 cặp", fontsize=11, fontweight="bold", color="#1B365D")
    ax2.tick_params(axis="x", rotation=45, labelsize=8.2)
    ax2.grid(axis="y", linestyle="--", alpha=0.4)
    ax2.legend(loc="lower left", fontsize=8.8)

    plt.tight_layout()
    fig4_path = os.path.join(EVIDENCE_FIG_DIR, "fig_w6_quality_distribution.png")
    plt.savefig(fig4_path, dpi=180)
    plt.close(fig)

    # 6. Figure 5: Failure Taxonomy Visual Board (5 representative cases)
    fail_cases = [
        ("P-10", "Nhóm 1: Sót ống tay & gấu áo cũ khi đổi dài sang ngắn (5.8/10)"),
        ("P-03", "Nhóm 2: Tràn mặt nạ qua eo khi áo & quần đồng màu đen (6.8/10)"),
        ("P-17", "Nhóm 3: Suy biến đặc trưng khi áo trắng đặt trên nền trắng (4.8/10)"),
        ("P-12", "Nhóm 4: Biến đổi kết cấu ống tay thành mắt lưới & nhiễu eo (7.5/10)"),
        ("P-20", "Nhóm 5: Xung đột mặt nạ overall gây nhiễu hạt thân dưới (5.2/10)"),
    ]
    row_map = {r["pair_id"]: r for _, r in df.iterrows()}
    fw, fh = 195, 276
    left_col_w = 465
    board = Image.new("RGB", (fw * 3 + left_col_w + 15, (fh + 18) * len(fail_cases) + 56), (255, 255, 255))
    bdraw = ImageDraw.Draw(board)
    font_b_hdr = get_pil_font(20, bold=True)
    font_b_bold = get_pil_font(15, bold=True)
    font_b_txt = get_pil_font(13, bold=False)

    bdraw.rectangle([(0, 0), (board.width, 46)], fill=(27, 54, 93))
    bdraw.text((18, 11), "MINH CHỨNG TRỰC QUAN 5 NHÓM CƠ CHẾ LỖI ĐIỂN HÌNH TRÊN CAT-VTON", fill=(255, 255, 255), font=font_b_hdr)

    def wrap_text_chars(txt, max_chars):
        w_list = txt.split()
        out_lines, cur_ln = [], ""
        for w in w_list:
            if len(cur_ln) + len(w) + 1 <= max_chars:
                cur_ln = f"{cur_ln} {w}".strip()
            else:
                out_lines.append(cur_ln)
                cur_ln = w
        if cur_ln:
            out_lines.append(cur_ln)
        return out_lines

    for idx_c, (pid, title_c) in enumerate(fail_cases):
        r = row_map[pid]
        y = 52 + idx_c * (fh + 18)
        bdraw.rectangle([(8, y), (board.width - 8, y + fh + 10)], fill=(248, 250, 252), outline=(203, 213, 225))

        t_lines = wrap_text_chars(f"{pid} — {title_c}", 48)
        for ti_l, t_ln in enumerate(t_lines[:2]):
            bdraw.text((18, y + 12 + ti_l * 20), t_ln, fill=(185, 28, 28), font=font_b_bold)

        body_start_y = y + 14 + len(t_lines[:2]) * 21 + 4
        lines = wrap_text_chars(BENCHMARK_AUDIT_DATA[pid]["comment"], 54)
        for li, ln in enumerate(lines[:9]):
            bdraw.text((18, body_start_y + li * 19), ln, fill=(30, 41, 59), font=font_b_txt)

        bdraw.text((18, y + fh - 20), f"SSIM: {float(r['ssim_out_of_mask']):.4f} | PSNR: {float(r['psnr_db']):.2f} dB", fill=(71, 85, 105), font=font_b_bold)

        tri = [
            os.path.join(ROOT, "datacard/test_img", str(r["person_image"])),
            os.path.join(ROOT, "datacard/test_color", str(r["cloth_image"])),
            os.path.join(RAW_LOGS_DIR, f"{pid}_profiled.png"),
        ]
        for ti, tp in enumerate(tri):
            if os.path.exists(tp):
                im = Image.open(tp).convert("RGB").resize((fw - 8, fh - 8), Image.Resampling.LANCZOS)
                board.paste(im, (left_col_w + ti * fw, y + 9))

    fig5_path = os.path.join(EVIDENCE_FIG_DIR, "fig_w6_failure_taxonomy.jpg")
    board.save(fig5_path, "JPEG", quality=90)

    return {
        "fig1": fig1_path,
        "fig2": fig2_path,
        "fig3": fig3_path,
        "fig4": fig4_path,
        "fig5": fig5_path,
    }


def build_evidence_metadata_files(df):
    mean_prep = round(float(df["preprocess_time_s"].mean()), 3)
    mean_infer = round(float(df["inference_time_s"].mean()), 2)
    mean_post = round(float(df["postprocess_time_s"].mean()), 3)
    mean_e2e = round(float(df["e2e_latency_s"].mean()), 2)
    min_infer = round(float(df["inference_time_s"].min()), 2)
    max_infer = round(float(df["inference_time_s"].max()), 2)
    mean_ssim = round(float(df["ssim_out_of_mask"].mean()), 4)
    upper_ssim = round(float(df[df["category"] == "upper"]["ssim_out_of_mask"].mean()), 4)
    overall_ssim = round(float(df[df["category"] == "overall"]["ssim_out_of_mask"].mean()), 4)
    mean_psnr = round(float(df["psnr_db"].mean()), 2)
    scores = [extract_numeric_score(BENCHMARK_AUDIT_DATA[r["pair_id"]]["grade"]) for _, r in df.iterrows()]
    mean_score_10 = round(float(np.mean(scores)), 2)

    # 1. metrics.csv
    metrics_rows = [
        ("GPU Profiling (25 Pairs)", "CatVTON FP16 (20 steps)", "1x Tesla T4", "Cold_Start_Latency", 42.80, "seconds", "Thời gian khởi tạo pipeline và trọng số ban đầu"),
        ("GPU Profiling (25 Pairs)", "CatVTON FP16 (20 steps)", "1x Tesla T4", "Mean_Preprocess_Latency", mean_prep, "seconds", "Phân đoạn cơ thể DensePose + SCHP AutoMasker"),
        ("GPU Profiling (25 Pairs)", "CatVTON FP16 (20 steps)", "1x Tesla T4", "Mean_UNet_Inference_Latency", mean_infer, "seconds", "Suy diễn khuếch tán 20 bước DPM++ 2M Karras (768x1024)"),
        ("GPU Profiling (25 Pairs)", "CatVTON FP16 (20 steps)", "1x Tesla T4", "Min_UNet_Inference_Latency", min_infer, "seconds", "Thời gian suy diễn nhanh nhất (P-03)"),
        ("GPU Profiling (25 Pairs)", "CatVTON FP16 (20 steps)", "1x Tesla T4", "Max_UNet_Inference_Latency", max_infer, "seconds", "Thời gian suy diễn cao nhất (P-01)"),
        ("GPU Profiling (25 Pairs)", "CatVTON FP16 (20 steps)", "1x Tesla T4", "Mean_Postprocess_Latency", mean_post, "seconds", "Giải mã không gian tiềm ẩn qua VAE Decoder"),
        ("GPU Profiling (25 Pairs)", "CatVTON FP16 (20 steps)", "1x Tesla T4", "Mean_E2E_Latency", mean_e2e, "seconds", "Tổng độ trễ đầu-cuối qua đường hầm HTTP Multipart"),
        ("GPU Profiling (25 Pairs)", "CatVTON FP16 (20 steps)", "1x Tesla T4", "Steady_Peak_VRAM", 4.324, "GB", "Mức chiếm dụng bộ nhớ GPU ổn định khi suy diễn"),
        ("Precision Ablation", "FP32 Baseline (torch.float32)", "1x Tesla T4", "Mean_Inference_Latency", 157.56, "seconds", "Mốc tham chiếu độ chính xác đơn FP32 (VRAM đỉnh 6.57 GB)"),
        ("Precision Ablation", "FP16 Mixed Precision (torch.float16)", "1x Tesla T4", "Mean_Inference_Latency", 55.95, "seconds", "Tăng tốc 2.82x nhờ nhân Turing Tensor Cores (VRAM 6.26 GB, SSIM vs FP32 = 0.8903)"),
        ("Precision Ablation", "BF16 Emulation (torch.bfloat16)", "1x Tesla T4", "CUDA_OOM_Allocation", 36.00, "GB", "Không tương thích phần cứng kiến trúc Turing CC 7.5 (lỗi tràn VRAM)"),
        ("25 Unpaired Benchmark", "All 25 Cross-Try-On Pairs", "1x Tesla T4", "Mean_Out_Of_Mask_SSIM", mean_ssim, "score (0-1)", "Độ bảo toàn cấu trúc hậu cảnh trung bình toàn tập 25 cặp"),
        ("25 Unpaired Benchmark", "Upper Category (23 Pairs)", "1x Tesla T4", "Mean_Upper_SSIM", upper_ssim, "score (0-1)", "Độ bảo toàn cấu trúc nhóm trang phục thân trên (23 cặp)"),
        ("25 Unpaired Benchmark", "Overall Category (2 Pairs)", "1x Tesla T4", "Mean_Overall_SSIM", overall_ssim, "score (0-1)", "Suy giảm do xung đột mặt nạ toàn thân trên P-20 và P-25"),
        ("25 Unpaired Benchmark", "All 25 Cross-Try-On Pairs", "1x Tesla T4", "Mean_PSNR", mean_psnr, "dB", "Tỷ số tín hiệu trên nhiễu trung bình 25 cặp"),
        ("25 Unpaired Benchmark", "Direct Visual Inspection", "25 Pairs", "Mean_Visual_Quality_Score", mean_score_10, "score (0-10)", "Điểm kiểm định thị giác trực tiếp trung bình trên thang 10"),
        ("Frontend Quality Audit", "Grand Atelier UI System", "Chrome Multi-Viewport", "Audited_States_Passed", 37, "screens", "Kiểm thử thực tế trên Chrome ở 1440px, 1080px, 390px (48 tệp cập nhật)"),
    ]
    df_metrics = pd.DataFrame(metrics_rows, columns=["Execution_Domain", "Configuration", "Hardware", "Metric", "Measured_Value", "Unit", "Note"])
    df_metrics.to_csv(os.path.join(EVIDENCE_W6_DIR, "metrics.csv"), index=False, encoding="utf-8")

    # 2. test-results.json
    pair_records = []
    for _, r in df.iterrows():
        pid = r["pair_id"]
        audit = BENCHMARK_AUDIT_DATA[pid]
        res_file = os.path.join(EVIDENCE_RES_DIR, f"{pid}_result.png")
        pair_records.append({
            "pair_id": pid,
            "mode": str(r["mode"]),
            "person_image": str(r["person_image"]),
            "cloth_image": str(r["cloth_image"]),
            "category": str(r["category"]),
            "description": audit["desc"],
            "preprocess_time_s": round(float(r["preprocess_time_s"]), 3),
            "inference_time_s": round(float(r["inference_time_s"]), 2),
            "postprocess_time_s": round(float(r["postprocess_time_s"]), 3),
            "e2e_latency_s": round(float(r["e2e_latency_s"]), 2),
            "peak_vram_gb": round(float(r["peak_vram_gb"]), 3),
            "file_size_bytes": os.path.getsize(res_file) if os.path.exists(res_file) else 0,
            "ssim_out_of_mask": round(float(r["ssim_out_of_mask"]), 4),
            "psnr_db": round(float(r["psnr_db"]), 2),
            "visual_score_10": extract_numeric_score(audit["grade"]),
            "quality_grade": audit["grade"],
            "visual_inspection_comment": audit["comment"],
        })

    test_results_payload = {
        "benchmark_name": "Week 6 CatVTON GPU Profiling, Mixed Precision Ablation & 25 Unpaired Try-On Visual Audit",
        "evaluation_date": "2026-11-07",
        "git_tag": "w06",
        "endpoint_url": "https://aspire-traps-deserving.ngrok-free.dev/api/tryon",
        "pipeline_configuration": {
            "model": "zhengchong/CatVTON",
            "base_checkpoint": "booksforcharlie/stable-diffusion-inpainting",
            "scheduler": "DPM++ 2M Karras (20 steps)",
            "precision": "fp16 (torch.float16)",
            "resolution": [768, 1024],
            "hardware": "NVIDIA Tesla T4 GPU (16GB GDDR6, Compute Capability 7.5)",
            "output_directory": "Evidence/W06/results",
        },
        "precision_ablation_summary": [
            {"mode": "FP32", "dtype": "torch.float32", "mean_inference_s": 157.56, "peak_vram_gb": 6.57, "ssim_vs_fp32": 1.0, "psnr_vs_fp32": "inf", "status": "SUCCESS"},
            {"mode": "FP16", "dtype": "torch.float16", "mean_inference_s": 55.95, "peak_vram_gb": 6.26, "ssim_vs_fp32": 0.8903, "psnr_vs_fp32": 23.06, "status": "OPTIMAL_SPEEDUP_2.82X"},
            {"mode": "BF16", "dtype": "torch.bfloat16", "mean_inference_s": None, "peak_vram_gb": None, "ssim_vs_fp32": None, "psnr_vs_fp32": None, "status": "HARDWARE_OOM_INCOMPATIBLE_ON_TURING"},
        ],
        "summary_metrics": {
            "total_pairs_evaluated": 25,
            "unpaired_cross_tryon_pairs": 25,
            "paired_same_garment_pairs": 0,
            "mean_inference_seconds": mean_infer,
            "mean_e2e_latency_seconds": mean_e2e,
            "mean_ssim_out_of_mask_all": mean_ssim,
            "mean_ssim_upper_23_pairs": upper_ssim,
            "mean_ssim_overall_2_pairs": overall_ssim,
            "mean_psnr_db": mean_psnr,
            "mean_visual_score_10": mean_score_10,
            "quality_tier_counts": {
                "excellent_or_very_good": sum(1 for s in scores if s >= 9.0),
                "good_or_fair_minor_artifacts": sum(1 for s in scores if 7.0 <= s < 9.0),
                "moderate_or_severe_failure": sum(1 for s in scores if s < 7.0),
            },
        },
        "results": pair_records,
    }
    with open(os.path.join(EVIDENCE_W6_DIR, "test-results.json"), "w", encoding="utf-8") as fj:
        json.dump(test_results_payload, fj, ensure_ascii=False, indent=2)

    # 3. manifest.json
    manifest_payload = {
        "milestone": "Tuan6",
        "week": "W06",
        "date": "2026-11-07",
        "git_tag": "w06",
        "project": "Multimodal Fashion E-Commerce & Virtual Try-On System (GPU Optimization, 25 Unpaired Benchmark & Frontend Harmonization)",
        "institution": "Hoc vien Cong nghe Buu chinh Vien thong (PTIT)",
        "faculty": "Khoa Cong nghe Thong tin",
        "cohort": "D21",
        "deliverables_summary": {
            "gpu_profiling_and_ablation": "Phan ra do tre 4 pha GPU va doi sanh FP32 vs FP16 (tang toc 2.82x) vs BF16 (OOM tren Turing T4)",
            "benchmark_25_unpaired_pairs": "Kiem thu va nhan xet thi giac truc tiep 25 cap thu do hoan doi trang phuc khac biet (P-01 den P-25)",
            "frontend_grand_atelier_audit": "Xu ly phan hoi UI/UX va dong bo thiet ke Grand Atelier tren 48 tep React, kiem thu 37 trang thai tren Chrome (1440px, 1080px, 390px)",
        },
        "metrics_summary": test_results_payload["summary_metrics"],
        "files": {
            "README.md": "Bao cao tong hop minh chung tien do Tuan 6, phan cong nhiem vu, so lieu dinh luong va phan tich loi",
            "metrics.csv": "Bang chi so dinh luong Profiling 4 pha, Mixed Precision Ablation va Benchmark 25 cap Unpaired",
            "test-results.json": "Du lieu do luong chi tiet va nhan xet thi giac bang mat thuong cho tung cap P-01 den P-25",
            "results/": {
                "P-01_result.png -> P-25_result.png": "25 tep anh ket qua thu do hoan doi thuc te tu CatVTON FP16",
                "P-01_grid.jpg -> P-25_grid.jpg": "25 anh ghep ba khung [Nguoi mau goc | Trang phuc dich | Ket qua CatVTON]",
            },
            "figures/": {
                "fig_w6_latency_breakdown.png": "Bieu do phan ra thoi gian xu ly 4 pha GPU va truyen tai mang",
                "fig_w6_precision_ablation.png": "Bieu do doi sanh thoi gian suy dien va VRAM giua FP32, FP16 va BF16",
                "fig_w6_25pairs_overview.jpg": "Luoi anh tong hop truc quan toan bo 25 cap thu do hoan doi (5x5)",
                "fig_w6_quality_distribution.png": "Bieu do phan bo xep loai chat luong thi giac va chi so SSIM tren 25 cap",
                "fig_w6_failure_taxonomy.jpg": "Bang minh chung doi chieu truc quan 5 nhom co che loi thuc te",
            },
        },
    }
    with open(os.path.join(EVIDENCE_W6_DIR, "manifest.json"), "w", encoding="utf-8") as fm:
        json.dump(manifest_payload, fm, ensure_ascii=False, indent=2)

    # 4. Evidence/W06/README.md
    table_lines = []
    for _, r in df.iterrows():
        pid = r["pair_id"]
        audit = BENCHMARK_AUDIT_DATA[pid]
        table_lines.append(
            f"| **{pid}** | `{r['person_image']}` | `{r['cloth_image']}` | `{r['category']}` | {audit['desc']} | "
            f"{float(r['inference_time_s']):.2f}s | {float(r['ssim_out_of_mask']):.4f} | {float(r['psnr_db']):.2f} | **{audit['grade']}** |"
        )
    table_md = "\n".join(table_lines)

    readme_md = f"""# Minh chứng tiến độ tuần 6 (EVIDENCE / W06)

## Hệ thống thương mại điện tử thời trang đa phương thức và thử đồ ảo CatVTON

- **Đơn vị đào tạo**: Học viện Công nghệ Bưu chính Viễn thông (PTIT) – Khoa Công nghệ Thông tin (Khóa D21)
- **Mốc thời gian**: 01/11/2026 – 07/11/2026
- **Nhãn phiên bản Git**: `w06`
- **Báo cáo chi tiết đính kèm**:
  - `bao_cao_hang_tuan/Báo cáo tiến độ đồ án tốt nghiệp tuần 6.docx`
  - `bao_cao_hang_tuan/Báo cáo nghiên cứu phân rã hiệu năng và tối ưu hóa CatVTON GPU.docx`
  - `bao_cao_hang_tuan/Bao_cao_danh_gia_25_cap_thu_do_CatVTON_va_phan_tich_loi.xlsx`

---

## 1. Phân công nhiệm vụ và cấu trúc bàn giao tuần 6

| Thành viên | Nhiệm vụ kỹ thuật trọng tâm tuần 6 | Hiện vật bàn giao (Deliverables) |
| :--- | :--- | :--- |
| **Lê Như Tùng** | - Đo đạc phân rã độ trễ 4 pha GPU có đồng bộ phần cứng `torch.cuda.synchronize()`.<br>- Thực nghiệm đối sánh chế độ dấu phẩy động Mixed Precision (`FP32`, `FP16`, `BF16`) trên GPU NVIDIA Tesla T4.<br>- Vận hành máy chủ suy diễn trực tuyến phục vụ kiểm thử mở rộng 25 cặp hoán đổi. | - `research/vton-profiling-optimization/results/precision_ablation.csv`<br>- `research/vton-profiling-optimization/results/profiling_latency.csv`<br>- `Evidence/W06/figures/fig_w6_latency_breakdown.png`<br>- `Evidence/W06/figures/fig_w6_precision_ablation.png` |
| **Nguyễn Đình Tiến** | - Thiết kế và kiểm định thị giác trực tiếp toàn bộ 25 cặp thử đồ hoán đổi chéo (`Unpaired`, `P-01` đến `P-25`), lập bảng phân tích 5 nhóm lỗi thực tế.<br>- Khắc phục toàn diện phản hồi giao diện (`FeedbackFE`), đồng bộ hệ thống thiết kế Grand Atelier trên 48 tệp React và kiểm thử 37 trạng thái trên Chrome (`1440px`, `1080px`, `390px`). | - `bao_cao_hang_tuan/Bao_cao_danh_gia_25_cap_thu_do_CatVTON_va_phan_tich_loi.xlsx`<br>- `Evidence/W06/results/` (25 ảnh kết quả & 25 ảnh ghép)<br>- `frontend/src/` (48 tệp giao diện chuẩn hóa)<br>- `bao_cao_hang_tuan/Báo cáo tiến độ đồ án tốt nghiệp tuần 6.docx` |

---

## 2. Kết quả phân rã hiệu năng GPU và đối sánh Mixed Precision trên Tesla T4

### 2.1. Phân rã độ trễ các pha xử lý (trung bình trên 25 cặp hoán đổi)

| Pha xử lý | Thời gian đo đạc | Tỷ trọng E2E | Ghi chú cơ chế kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Khởi động nguội (Cold-start)** | `42.80s` | Khởi tạo 1 lần | Nạp trọng số SD-Inpainting, CatVTON Attention, DensePose và SCHP lên VRAM |
| **Tiền xử lý (Preprocessing)** | `{mean_prep:.2f}s` | `{(mean_prep/mean_e2e)*100:.1f}%` | Phân đoạn giải phẫu người và sinh mặt nạ tự động bằng AutoMasker |
| **Suy diễn khuếch tán (UNet Inference)** | `{mean_infer:.2f}s` | `{(mean_infer/mean_e2e)*100:.1f}%` | Thực thi 20 bước lấy mẫu DPM++ 2M Karras ở độ phân giải `768x1024` |
| **Hậu xử lý (Postprocessing)** | `{mean_post:.2f}s` | `{(mean_post/mean_e2e)*100:.1f}%` | Giải mã không gian tiềm ẩn qua bộ giải mã VAE và đóng gói PNG |
| **Tổng độ trễ đầu-cuối (E2E Latency)** | `{mean_e2e:.2f}s` | `100.0%` | Bao gồm thời gian truyền tải tệp đa phương tiện qua đường hầm HTTPS |

### 2.2. Kết quả đối sánh độ chính xác số học (Precision Ablation)

| Chế độ | Kiểu dữ liệu | Suy diễn trung bình | Peak VRAM | SSIM vs FP32 | PSNR vs FP32 | Kết luận tương thích trên Tesla T4 (CC 7.5) |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **FP32** | `torch.float32` | `157.56s` | `6.57 GB` | `1.0000` | `inf` | Mốc tham chiếu gốc trên nhân CUDA tiêu chuẩn, độ trễ cao |
| **FP16** | `torch.float16` | `55.95s` | `6.26 GB` | `0.8903` | `23.06 dB` | Tăng tốc `2.82x` nhờ nhân Turing Tensor Cores, duy trì cấu trúc thị giác ổn định |
| **BF16** | `torch.bfloat16` | Thất bại | OOM (`36 GiB`) | `N/A` | `N/A` | Kiến trúc Turing không hỗ trợ phần cứng BF16, gây tràn bộ nhớ khi cấp phát giả lập |

---

## 3. Bảng tổng hợp 25 cặp kiểm thử hoán đổi (Unpaired)

Toàn bộ 25 cặp kiểm thử trong `Evidence/W06/results/` đều sử dụng trang phục đích khác biệt rõ rệt với trang phục gốc của người mẫu và được chấm điểm thị giác trực tiếp trên từng ảnh:

| Mã cặp | Ảnh người mẫu | Ảnh trang phục | Danh mục | Mô tả ca hoán đổi thực tế | Suy diễn | SSIM | PSNR (dB) | Xếp loại thị giác |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
{table_md}

---

## 4. Phân loại 5 nhóm lỗi thị giác thực tế và hướng khắc phục

1. **Sót phần ống tay hoặc gấu áo cũ khi đổi dài sang ngắn (`P-06`, `P-10`, `P-23`, nhẹ ở `P-13`, `P-18`)**: Khi đổi từ áo dài tay tối màu sang áo cộc tay sáng màu, mặt nạ AutoMasker bỏ sót vòng cổ tay hoặc gấu áo trùm hông. Khắc phục bằng cách hợp nhất đầy đủ nhãn `upper_clothes` cũ của SCHP với vùng cánh tay DensePose.
2. **Tràn mặt nạ qua eo khi áo và quần đồng màu đen (`P-03`)**: Trang phục thân trên và quần thân dưới cùng màu đen làm SCHP gộp nhầm đùi trên vào thân áo (`SSIM = 0.7545`). Khắc phục bằng ngưỡng chặn dưới theo tọa độ khớp hông DensePose.
3. **Suy biến điều kiện hóa với trang phục trắng trên nền trắng (`P-17`, `P-25`)**: Áo trắng đặt trên nền ảnh trắng làm suy giảm đặc trưng biên trong Reference UNet, gây xám đục và vệt nhiễu dọc ngực (`P-17`) hoặc biến đổi sang đầm nâu xám (`P-25`). Khắc phục bằng tách mặt nạ tiền cảnh cho ảnh sản phẩm đầu vào.
4. **Nhiễu kết cấu bề mặt và nhòe chi tiết tần số cao (`P-02`, `P-04`, `P-07`, `P-08`, `P-11`, `P-12`, `P-19`)**: Nén không gian tiềm ẩn `8x` của VAE và 20 bước lấy mẫu làm nhòe chữ nhỏ vòng tròn hoặc khái quát hóa sai chất liệu ren/lưới.
5. **Xung đột mặt nạ danh mục `overall` (`P-20`, `P-25`)**: Kích hoạt cờ `overall` trên ảnh trang phục chỉ có thân trên làm xóa vùng quần/chân váy gốc và sinh nhiễu hạt ở thân dưới (`SSIM` giảm xuống `0.7756`).

---

## 5. Chuẩn hóa giao diện thương mại điện tử Grand Atelier (Frontend Audit)

- Đồng bộ hệ thống màu sắc và kiểu chữ kiến trúc **Grand Atelier** (`#FAF8F5`, `#161514`, `#C05A39`), loại bỏ toàn bộ bảng màu công cụ SaaS rời rạc và các thuật ngữ dịch máy thiếu tự nhiên trên `48` tệp mã nguồn trong `frontend/src/`.
- Khắc phục lỗi đường dẫn ảnh tĩnh nội bộ trong `resolveImageUrl`, sửa lỗi hiển thị giá và thao tác trong `CartDrawer`, chuẩn hóa thanh điều hướng đa điểm ngắt (`xl:` cho desktop, ngăn kéo cho màn hình nhỏ hơn `1280px`), sửa lệch chỉ số phân trang tìm kiếm và chuyển đổi hộp thoại sang phần tử gốc `<dialog>`.
- Kiểm chứng thực tế trên trình duyệt Chrome qua `37` trạng thái giao diện ở ba độ phân giải `1440px`, `1080px` và `390px`, bản dựng `npm run build` hoàn tất không phát sinh lỗi.
"""
    with open(os.path.join(EVIDENCE_W6_DIR, "README.md"), "w", encoding="utf-8") as fr:
        fr.write(readme_md)


# ── DOCX HELPERS ──────────────────────────────────────────────────────────────
def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=90, bottom=90, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)


def set_table_borders(table, color="CBD5E1"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)


def fmt_p(p, before=0, after=5, spacing=1.15):
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = spacing


def add_heading_bar(doc, text, level=1):
    p = doc.add_paragraph()
    fmt_p(p, before=12 if level == 1 else 8, after=5)
    r = p.add_run(text)
    r.font.name = "Times New Roman"
    r.font.bold = True
    r.font.size = Pt(13.5 if level == 1 else 12)
    r.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D) if level == 1 else RGBColor(0x1F, 0x29, 0x37)
    return p


def add_figure(doc, img_path, caption_text, width_in=6.2):
    if not os.path.exists(img_path):
        return
    p_img = doc.add_paragraph()
    fmt_p(p_img, before=6, after=2)
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.add_run().add_picture(img_path, width=Inches(width_in))

    p_cap = doc.add_paragraph()
    fmt_p(p_cap, before=0, after=8)
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cap = p_cap.add_run(caption_text)
    r_cap.font.size = Pt(10)
    r_cap.font.italic = True
    r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)


def style_table(doc, headers, rows_data, font_size=9.0, bold_cols=(0,)):
    tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl, "CBD5E1")

    for c_idx, h_text in enumerate(headers):
        cell = tbl.cell(0, c_idx)
        set_cell_background(cell, "1B365D")
        set_cell_margins(cell, 90, 90, 100, 100)
        p = cell.paragraphs[0]
        fmt_p(p, 0, 0, 1.05)
        r = p.add_run(h_text)
        r.font.bold = True
        r.font.size = Pt(font_size + 0.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for r_idx, row in enumerate(rows_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = tbl.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 70, 70, 95, 95)
            p = cell.paragraphs[0]
            fmt_p(p, 0, 0, 1.1)
            r = p.add_run(str(val))
            r.font.size = Pt(font_size)
            if c_idx in bold_cols:
                r.font.bold = True
    return tbl


def build_w6_docx_report(df, figs):
    os.makedirs(os.path.dirname(DOCX_OUT_PRIMARY), exist_ok=True)
    os.makedirs(os.path.dirname(DOCX_OUT_MIRROR), exist_ok=True)

    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    normal_style = doc.styles["Normal"]
    normal_style.font.name = "Times New Roman"
    normal_style.font.size = Pt(11.5)
    normal_style.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    # Title
    p_title = doc.add_paragraph()
    fmt_p(p_title, before=4, after=3)
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rt = p_title.add_run("BÁO CÁO TIẾN ĐỘ ĐỒ ÁN TỐT NGHIỆP TUẦN 6")
    rt.font.size = Pt(16.5)
    rt.font.bold = True
    rt.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_sub = doc.add_paragraph()
    fmt_p(p_sub, before=0, after=10)
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rs = p_sub.add_run(
        "Chủ đề: Phân rã hiệu năng GPU, tối ưu hóa Mixed Precision, kiểm thử 25 cặp thử đồ hoán đổi CatVTON "
        "và đồng bộ hóa giao diện thương mại điện tử Grand Atelier (01/11/2026 - 07/11/2026)"
    )
    rs.font.size = Pt(11)
    rs.font.italic = True
    rs.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Team assignment
    add_heading_bar(doc, "Phân chia công việc tuần 6 (01/11/2026 - 07/11/2026)", level=2)
    style_table(
        doc,
        ["Thành viên", "Nhiệm vụ kỹ thuật trọng tâm", "Hiện vật bàn giao (Git Tag: w06)"],
        [
            (
                "Lê Như Tùng",
                "- Thiết lập cơ chế đo lường đồng bộ phần cứng torch.cuda.synchronize() phân rã độ trễ 4 pha xử lý của CatVTON.\n"
                "- Thực hiện nghiên cứu bóc tách chế độ dấu phẩy động (FP32, FP16, BF16) trên kiến trúc GPU NVIDIA Tesla T4 (Turing CC 7.5).\n"
                "- Duy trì và giám sát máy chủ suy diễn FastAPI kết nối đường hầm bảo mật phục vụ thực nghiệm 25 cặp hoán đổi.",
                "- Báo cáo chuyên đề GPU Profiling (.docx)\n"
                "- Dữ liệu thực nghiệm: precision_ablation.csv, profiling_latency.csv\n"
                "- Biểu đồ phân rã độ trễ và đối sánh VRAM (Evidence/W06/figures/)"
            ),
            (
                "Nguyễn Đình Tiến",
                "- Thiết kế tập kiểm thử 25 cặp thử đồ hoán đổi khác biệt trang phục (Unpaired, P-01 đến P-25), kiểm tra trực quan từng ảnh và phân loại 5 nhóm lỗi thực tế.\n"
                "- Xử lý toàn bộ phản hồi giao diện (FeedbackFE), chuẩn hóa hệ thống thiết kế Grand Atelier trên 48 tệp React.\n"
                "- Kiểm thử thực tế trên trình duyệt Chrome qua 37 trạng thái ở 3 độ phân giải (1440px, 1080px, 390px).",
                "- Bảng tính 25 cặp có ảnh nhúng: Bao_cao_danh_gia_25_cap_thu_do_CatVTON_va_phan_tich_loi.xlsx\n"
                "- Thư mục minh chứng: Evidence/W06/ (25 ảnh kết quả, 25 ảnh ghép, JSON, CSV)\n"
                "- Nhánh giao diện: fix/frontend-feedback-w06 (48 tệp cập nhật)"
            ),
        ],
        font_size=9.5,
        bold_cols=(0,),
    )

    # Section I
    add_heading_bar(doc, "I. Mục tiêu và phạm vi công việc tuần 6", level=1)
    sec1_bullets = [
        ("Giải quyết bài toán phân tích điểm nghẽn hiệu năng GPU: ",
         "Đo lường chính xác thời gian khởi động nguội (cold-start), tiền xử lý (DensePose + SCHP), suy diễn khuếch tán UNet, hậu xử lý VAE và chi phí truyền tải mạng để xác định khâu tiêu tốn tài nguyên lớn nhất trên hạ tầng Tesla T4."),
        ("Đánh giá thực nghiệm Mixed Precision theo kiến trúc phần cứng: ",
         "Kiểm chứng định lượng tốc độ suy diễn, mức chiếm dụng VRAM và độ tương đồng cấu trúc ảnh sinh giữa ba chế độ số học FP32, FP16 và BF16 trên kiến trúc NVIDIA Turing (Compute Capability 7.5)."),
        ("Mở rộng tập kiểm thử lên 25 cặp hoán đổi trang phục thực tế: ",
         "Loại bỏ hoàn toàn hiện tượng ảnh trước và sau trùng trang phục của chế độ Paired, chuyển toàn bộ 25 cặp (P-01 đến P-25) sang kịch bản hoán đổi chéo Unpaired khác biệt rõ về màu sắc, kiểu tay và họa tiết, kết hợp đánh giá bằng mắt thường trên từng ảnh."),
        ("Đồng bộ hóa giao diện người dùng và quản trị trên trình duyệt thực tế: ",
         "Khắc phục triệt để các lỗi bố cục, đường dẫn ảnh tĩnh, ngăn giỏ hàng, hộp thoại và chuẩn hóa ngôn ngữ thiết kế Grand Atelier không còn dấu vết màu sắc công cụ SaaS rời rạc hay câu chữ dịch máy."),
    ]
    for b_lbl, b_txt in sec1_bullets:
        p = doc.add_paragraph(style="List Bullet")
        fmt_p(p, 1, 3)
        r1 = p.add_run(b_lbl)
        r1.font.bold = True
        p.add_run(b_txt)

    # Section II
    add_heading_bar(doc, "II. Phân rã độ trễ 4 pha GPU và thực nghiệm tối ưu hóa Mixed Precision", level=1)
    add_heading_bar(doc, "1. Kết quả đo lường phân rã độ trễ trên GPU NVIDIA Tesla T4", level=2)

    mean_prep = float(df["preprocess_time_s"].mean())
    mean_infer = float(df["inference_time_s"].mean())
    mean_post = float(df["postprocess_time_s"].mean())
    mean_net = float(df["network_transit_overhead_s"].mean())
    mean_internal = mean_prep + mean_infer + mean_post
    mean_e2e = float(df["e2e_latency_s"].mean())

    p_intro2 = doc.add_paragraph()
    fmt_p(p_intro2, 2, 5)
    p_intro2.add_run(
        "Do các phép toán nhân ma trận trên nhân CUDA thực thi bất đồng bộ với luồng CPU Python, hệ thống đo đạc tích hợp lệnh "
        "đồng bộ phần cứng torch.cuda.synchronize() tại ranh giới từng pha xử lý. Số liệu trung bình đo trực tiếp trên 25 lượt suy diễn được tổng hợp dưới đây:"
    )

    style_table(
        doc,
        ["Pha xử lý trong pipeline", "Thời gian trung bình", "Tỷ trọng E2E", "Cơ chế kỹ thuật thực thi"],
        [
            ("Khởi động nguội (Cold-start)", "42.80 giây", "1 lần đầu", "Nạp mô hình SD-Inpainting, CatVTON Attention, DensePose và SCHP lên VRAM"),
            ("Tiền xử lý (Preprocessing)", f"{mean_prep:.2f} giây / ảnh", f"{(mean_prep/mean_e2e)*100:.1f}%", "Trích xuất tọa độ DensePose IUV và nhãn ngữ nghĩa SCHP tạo mặt nạ AutoMasker"),
            ("Suy diễn mô hình (UNet Inference)", f"{mean_infer:.2f} giây / ảnh", f"{(mean_infer/mean_e2e)*100:.1f}%", "Thực thi 20 bước khử nhiễu DPM++ 2M Karras ở độ phân giải 768x1024 (FP16)"),
            ("Hậu xử lý (Postprocessing)", f"{mean_post:.2f} giây / ảnh", f"{(mean_post/mean_e2e)*100:.1f}%", "Giải mã tensor tiềm ẩn qua VAE Decoder và mã hóa luồng ảnh PNG"),
            ("Tổng tính toán nội bộ GPU", f"{mean_internal:.2f} giây / ảnh", f"{(mean_internal/mean_e2e)*100:.1f}%", "Tổng thời gian xử lý thuần túy trên thiết bị tính toán GPU Tesla T4"),
            ("Độ trễ truyền tải mạng", f"{mean_net:.2f} giây / ảnh", f"{(mean_net/mean_e2e)*100:.1f}%", "Truyền tải dữ liệu ảnh hai chiều qua giao thức HTTP Multipart TLS"),
            ("Tổng độ trễ đầu-cuối (E2E)", f"{mean_e2e:.2f} giây / ảnh", "100.0%", "Thời gian phản hồi toàn trình tính từ phía máy khách"),
        ],
        font_size=9.2,
        bold_cols=(0, 1),
    )

    add_figure(doc, figs["fig1"], "Hình 1: Phân rã thời gian xử lý trung bình các pha của CatVTON trên GPU NVIDIA Tesla T4", width_in=6.3)

    add_heading_bar(doc, "2. Thực nghiệm bóc tách chế độ dấu phẩy động (FP32, FP16 và BF16)", level=2)
    style_table(
        doc,
        ["Chế độ", "Kiểu dữ liệu PyTorch", "Thời gian suy diễn", "Peak VRAM", "SSIM vs FP32", "PSNR vs FP32", "Đánh giá tương thích phần cứng"],
        [
            ("FP32", "torch.float32", "157.56 giây", "6.57 GB", "1.0000", "inf", "Mốc tham chiếu gốc xử lý trên nhân CUDA FP32, tốc độ chậm"),
            ("FP16", "torch.float16", "55.95 giây", "6.26 GB", "0.8903", "23.06 dB", "Tăng tốc 2.82 lần nhờ nhân Turing Tensor Cores, tiết kiệm VRAM"),
            ("BF16", "torch.bfloat16", "Thất bại (OOM)", "36.00 GB (lỗi)", "N/A", "N/A", "Kiến trúc Turing (CC 7.5) không hỗ trợ BF16 phần cứng, gây tràn bộ nhớ"),
        ],
        font_size=9.0,
        bold_cols=(0, 2),
    )
    add_figure(doc, figs["fig2"], "Hình 2: Đối sánh tốc độ suy diễn và mức sử dụng bộ nhớ đồ họa đỉnh giữa FP32, FP16 và BF16", width_in=6.1)

    # Section III
    add_heading_bar(doc, "III. Thực nghiệm 25 cặp thử đồ hoán đổi (Unpaired) và phân tích lỗi thị giác", level=1)
    p_s3 = doc.add_paragraph()
    fmt_p(p_s3, 2, 5)
    p_s3.add_run(
        "Nhằm phản ánh đúng bài toán thử đồ ảo trong thương mại điện tử (người dùng mặc trang phục A và ướm thử trang phục B khác biệt), "
        "toàn bộ 25 cặp kiểm thử tuần 6 đều được thiết kế ở chế độ hoán đổi chéo Unpaired (23 cặp thân trên upper và 2 cặp danh mục overall). "
        "Mỗi ảnh kết quả đều được kiểm định trực quan bằng mắt thường để đối chiếu màu sắc, hoa văn, chữ in và ranh giới tiếp giáp da:"
    )

    add_figure(doc, figs["fig3"], "Hình 3: Lưới tổng hợp trực quan toàn bộ 25 cặp thử đồ hoán đổi [Người mẫu gốc | Trang phục đích | Kết quả CatVTON]", width_in=6.4)

    rows_25 = []
    for _, r in df.iterrows():
        pid = r["pair_id"]
        audit = BENCHMARK_AUDIT_DATA[pid]
        # Shorten comment slightly for compact Word table readability while preserving exact finding
        short_c = audit["comment"]
        if len(short_c) > 210:
            short_c = short_c[:207].rsplit(" ", 1)[0] + "..."
        rows_25.append((
            pid,
            f"{r['person_image']}\n-> {r['cloth_image']}",
            audit["desc"].replace("Hoán đổi: ", ""),
            f"{float(r['inference_time_s']):.2f}s",
            f"{float(r['ssim_out_of_mask']):.4f}",
            audit["grade"],
            short_c,
        ))

    add_heading_bar(doc, "1. Bảng kết quả đo lường và nhận xét thị giác chi tiết 25 cặp hoán đổi", level=2)
    style_table(
        doc,
        ["Mã", "Cặp tệp ảnh", "Kịch bản hoán đổi", "Suy diễn", "SSIM", "Xếp loại", "Nhận xét thị giác trực tiếp bằng mắt thường"],
        rows_25,
        font_size=8.0,
        bold_cols=(0, 5),
    )

    add_figure(doc, figs["fig4"], "Hình 4: Phân bố xếp loại chất lượng thị giác và biến thiên chỉ số SSIM ngoài mặt nạ trên 25 cặp", width_in=6.3)

    add_heading_bar(doc, "2. Phân loại 5 nhóm cơ chế lỗi thực tế và hướng khắc phục kỹ thuật", level=2)
    style_table(
        doc,
        ["Nhóm lỗi thị giác", "Hiện tượng ghi nhận trên ảnh", "Nguyên nhân kỹ thuật gốc rễ", "Giải pháp khắc phục"],
        [
            (
                "1. Sót ống tay / gấu áo cũ\n(P-06, P-10, P-23, P-13, P-18)",
                "Còn sót hai vòng cổ tay áo tối màu (P-06, P-23) hoặc sót cả mảng ống tay và gấu áo đỏ sẫm (P-10).",
                "Khi đổi từ áo dài tay tối màu sang áo cộc tay ngắn hơn, mặt nạ AutoMasker bỏ sót vùng cổ tay hẹp hoặc gấu áo trùm hông.",
                "Gộp đầy đủ toàn bộ vùng nhãn upper_clothes cũ của SCHP (kể cả cổ tay) với vùng da cánh tay DensePose."
            ),
            (
                "2. Tràn mặt nạ qua eo\n(P-03)",
                "Vạt áo hoa văn đỏ trắng kéo dài quá mức xuống ngang đùi đè lên quần đen (SSIM giảm còn 0.7545).",
                "Áo phông đen và quần đen ống rộng đồng màu làm mạng phân đoạn SCHP nhận nhầm phần đùi trên là thân áo.",
                "Áp dụng ngưỡng chặn dưới cho mặt nạ upper dựa theo tọa độ khớp hông (hip keypoints) từ DensePose."
            ),
            (
                "3. Suy biến trắng-trên-trắng\n(P-17, P-25)",
                "Áo trắng bị ngả xám đục kèm vệt nhiễu rách dọc giữa ngực (P-17) hoặc biến thành đầm nâu xám (P-25).",
                "Ảnh sản phẩm màu trắng tinh đặt trên nền trắng đồng nhất làm mất tương phản biên trong Reference UNet.",
                "Tách mặt nạ tiền cảnh nhị phân cho trang phục hoặc đổi nền đệm sang xám trung tính trước khi trích xuất đặc trưng."
            ),
            (
                "4. Nhiễu kết cấu & nhòe chữ nhỏ\n(P-02, P-04, P-07, P-11, P-12, P-19)",
                "Nhòe chữ vòng tròn nhỏ (P-07), moiré sọc mảnh (P-04), tay áo đen biến thành mắt lưới (P-12), ren lan toàn thân (P-11).",
                "Bộ mã hóa VAE nén không gian tỷ lệ 8x làm tiêu hao tần số không gian cao và khái quát hóa quá mức kết cấu cục bộ.",
                "Tăng bước lấy mẫu lên 25-30 bước với các mẫu có họa tiết vi mô và bổ sung điều kiện biên Canny/ Sobel nhẹ."
            ),
            (
                "5. Xung đột mặt nạ overall\n(P-20, P-25)",
                "Quần jeans và chân váy gốc bị xóa, thay bằng mảng hạt nâu cam nhiễu loạn ở thân dưới (SSIM trung bình 0.7756).",
                "Cờ category='overall' mở rộng mặt nạ xuống chân trong khi ảnh trang phục đầu vào từ tập VITON-HD chỉ có thân trên.",
                "Tự động kiểm tra tỷ lệ chiều dài khung bao trang phục đầu vào trước khi cho phép kích hoạt mặt nạ toàn thân overall."
            ),
        ],
        font_size=8.6,
        bold_cols=(0,),
    )
    add_figure(doc, figs["fig5"], "Hình 5: Đối chiếu trực quan 5 ca lỗi đại diện cho 5 nhóm cơ chế suy giảm chất lượng trên CatVTON", width_in=6.3)

    # Section IV
    add_heading_bar(doc, "IV. Đồng bộ hóa giao diện thương mại điện tử Grand Atelier và kiểm thử trình duyệt", level=1)
    p_s4 = doc.add_paragraph()
    fmt_p(p_s4, 2, 5)
    p_s4.add_run(
        "Song song với mảng nghiên cứu mô hình AI, phân hệ giao diện người dùng (Frontend React/Vite) đã được rà soát tổng thể dựa trên "
        "bảng phản hồi kiểm thử giao diện (FeedbackFE) và kiểm tra trực tiếp trên trình duyệt Google Chrome qua 37 trạng thái màn hình "
        "ở ba độ phân giải chuẩn (1440px desktop, 1080px laptop và 390px thiết bị di động), cập nhật đồng bộ 48 tệp mã nguồn:"
    )

    style_table(
        doc,
        ["Hạng mục giao diện", "Vấn đề phát hiện khi rà soát", "Giải pháp kỹ thuật đã triển khai"],
        [
            (
                "Hệ thống màu sắc & ngôn ngữ thương hiệu",
                "Các trang đăng nhập, lưu trữ và quản trị sử dụng bảng màu xanh tím SaaS bo góc lớn lệch tông với Storefront; xuất hiện các cụm từ dịch máy thiếu tự nhiên.",
                "Đồng bộ bảng màu kiến trúc Grand Atelier (#FAF8F5, #161514, #C05A39, viền #E5E0D8) trên toàn bộ 48 tệp; biên tập lại toàn bộ câu chữ sang tiếng Việt thương mại điện tử tự nhiên."
            ),
            (
                "Thanh điều hướng & đáp ứng đa khung nhìn",
                "Menu thả xuống bị che khuất, chữ nút ĐĂNG NHẬP bị cắt ở khung nhìn 1080px, ô tìm kiếm và nhãn giá thẻ sản phẩm bị chèn ép ở màn hình di động 390px.",
                "Chuyển điểm ngắt thanh điều hướng trung tâm sang xl: (1280px) kết hợp shrink-0 cho thương hiệu, tối ưu khoảng cách dòng giá trong ProductCard và ô tìm kiếm linh hoạt trong Catalog."
            ),
            (
                "Không gian tìm kiếm 3 phân hệ & đường dẫn ảnh",
                "Hàm resolveImageUrl ghi đè đường dẫn ảnh tĩnh nội bộ (/samples/...) sang cổng MinIO gây lỗi tải ảnh; lệch chỉ số phân trang pageIndex (0-based và 1-based).",
                "Cập nhật resolveImageUrl giữ nguyên tài nguyên tĩnh nội bộ, đồng bộ chỉ số trang trong searchResultsMock và chuẩn hóa khung làm việc tìm kiếm văn bản - hình ảnh - kết hợp."
            ),
            (
                "Ngăn giỏ hàng, lưu trữ & trang quản trị",
                "CartDrawer đọc sai cấu trúc phần tử gây hiển thị giá NaN; thông báo nổi che nút thanh toán; BookMark báo lỗi đỏ khi ngoại tuyến; thống kê doanh thu Admin hiển thị 0.",
                "Chuẩn hóa đọc phần tử giỏ hàng (item.product || item), dời thông báo nổi sang góc dưới trái, tích hợp WishlistContext vào BookMark và sửa công thức cộng doanh thu đơn hàng trong AdminDashboard."
            ),
            (
                "Chuẩn hóa hộp thoại & biểu mẫu xác thực",
                "Các hộp thoại tự dựng khóa cuộn trực tiếp trên thẻ body gây giật bố cục; ô mật khẩu đăng nhập gắn cứng autoComplete='new-password'.",
                "Chuyển toàn bộ hộp thoại chi tiết sang phần tử gốc <dialog> mở bằng showModal() hỗ trợ đóng khi nhấn vùng nền; cấu hình đúng thuộc tính tự động điền cho biểu mẫu đăng nhập và đăng ký."
            ),
        ],
        font_size=9.0,
        bold_cols=(0,),
    )

    # Section V
    add_heading_bar(doc, "V. Tổng kết bàn giao tuần 6 và kế hoạch tuần 7", level=1)
    sec5_items = [
        ("Hiện vật bàn giao hoàn chỉnh gắn nhãn phiên bản w06: ",
         "Bao gồm báo cáo tiến độ tuần 6 (.docx), báo cáo chuyên đề phân rã hiệu năng GPU (.docx), bảng tính đánh giá chi tiết 25 cặp hoán đổi có nhúng 75 ảnh đối chiếu (.xlsx), thư mục minh chứng chuẩn hóa Evidence/W06/ và nhánh mã nguồn giao diện fix/frontend-feedback-w06 đã kiểm thử bản dựng sản xuất thành công."),
        ("Định hướng kỹ thuật tuần 7: ",
         "Tích hợp quy tắc tiền xử lý cải tiến (tách nền trang phục trắng, chặn biên hông DensePose và xóa triệt để cổ tay áo dài cũ) vào dịch vụ suy diễn CatVTON; kết nối luồng đặt hàng, tìm kiếm đa phương thức và phòng thử đồ trực tuyến vận hành thông suốt đầu-cuối phục vụ kiểm thử tích hợp toàn hệ thống."),
    ]
    for b_lbl, b_txt in sec5_items:
        p = doc.add_paragraph(style="List Bullet")
        fmt_p(p, 1, 3)
        r1 = p.add_run(b_lbl)
        r1.font.bold = True
        p.add_run(b_txt)

    doc.save(DOCX_OUT_PRIMARY)
    doc.save(DOCX_OUT_MIRROR)
    print(f"Saved primary DOCX: {DOCX_OUT_PRIMARY}")
    print(f"Saved mirror DOCX:  {DOCX_OUT_MIRROR}")


def main():
    df = pd.read_csv(CSV_LATENCY)
    assert len(df) == 25, f"Expected 25 rows, got {len(df)}"
    figs = build_evidence_results_and_figures(df)
    build_evidence_metadata_files(df)
    build_w6_docx_report(df, figs)
    print("=== HOAN TAT TAO EVIDENCE/W06 VA BAO CAO TUAN 6 DOCX ===")


if __name__ == "__main__":
    main()
