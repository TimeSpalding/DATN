"""Tao bieu do tong hop tu so lieu thuc nghiem W08 (results_v1 va results_v2)."""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
V1_DIR = os.path.join(ROOT_DIR, "Evidence", "W08", "results_v1")
V2_DIR = os.path.join(ROOT_DIR, "Evidence", "W08", "results_v2")
FIG_DIR = os.path.join(ROOT_DIR, "Evidence", "W08", "figures")
os.makedirs(FIG_DIR, exist_ok=True)

plt.rcParams.update({
    "font.size": 10,
    "axes.titlesize": 11,
    "axes.labelsize": 10,
    "axes.grid": True,
    "grid.alpha": 0.3,
    "figure.facecolor": "white",
})


def plot_reproducibility():
    df = pd.read_csv(os.path.join(V1_DIR, "reproducibility_check.csv"))
    order = ["Det_RunA_vs_Det_RunB_GPU0", "Det_RunA_GPU0_vs_Det_RunC_GPU1", "Det_RunA_vs_NoSeed_RunD_GPU0"]
    labels = ["Deterministic\nSame GPU (cuda:0)", "Deterministic\nCross GPU (0 vs 1)", "Non-deterministic\n(No seed)"]
    pairs = ["S01", "M01", "O01"]

    fig, axes = plt.subplots(1, 2, figsize=(11.5, 4.3))
    x = np.arange(len(pairs))
    width = 0.25

    colors = ["#1f77b4", "#2ca02c", "#d62728"]
    for i, (comp, lbl, col) in enumerate(zip(order, labels, colors)):
        sub = df[df["comparison"] == comp].set_index("pair_id").reindex(pairs)
        axes[0].bar(x + (i - 1) * width, sub["mae_px"].values, width, label=lbl, color=col)
        axes[1].bar(x + (i - 1) * width, sub["ssim"].values, width, label=lbl, color=col)
        for j, val in enumerate(sub["mae_px"].values):
            axes[0].text(x[j] + (i - 1) * width, val + 0.35, f"{val:.2f}", ha="center", va="bottom", fontsize=8)
        for j, s_val in enumerate(sub["ssim"].values):
            axes[1].text(x[j] + (i - 1) * width, min(1.03, s_val + 0.012), f"{s_val:.3f}", ha="center", va="bottom", fontsize=8)

    axes[0].set_title("Sai lech pixel trung binh (MAE, px) giua 2 lan chay")
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(pairs)
    axes[0].set_ylabel("MAE pixel (0 = trung khop hoan toan)")
    axes[0].set_ylim(0, 19.0)

    axes[1].set_title("Do tuong dong SSIM giua 2 lan chay")
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(pairs)
    axes[1].set_ylabel("SSIM (1.0 = trung khop hoan toan)")
    axes[1].set_ylim(0.70, 1.09)
    axes[1].legend(loc="lower right", fontsize=8.5, framealpha=0.92)

    fig.suptitle("Kiem chung tinh tai lap CatVTON tren 2x Tesla T4 (Issue #19)", fontweight="bold")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "fig_repro_comparison.png"), dpi=160)
    plt.close(fig)


def plot_latency_quality_tradeoff():
    df_v1 = pd.read_csv(os.path.join(V1_DIR, "summary_by_config.csv"))
    df_v2 = pd.read_csv(os.path.join(V2_DIR, "summary_by_config.csv"))

    fig, axes = plt.subplots(1, 2, figsize=(12.2, 4.6))

    # Trai: Danh doi thoi gian & chat luong tren toan bo cau hinh v1 (20 cap cho C0/C1/C2, 8 cap cho C3/C4)
    c_labels_v1 = {
        "C0_baseline_s20_g45": "C0 Base (20s, g4.5)",
        "C1_refined_s20_g45": "C1 Ref-v1 (20s, g4.5)",
        "C2_refined_s12_g25": "C2 Ref-v1 (12s, g2.5)",
        "C3_refined_s15_g10": "C3 NoCFG* (15s, g1.0)",
        "C4_refined_512_s20": "C4 512px* (20s, g4.5)",
    }
    cols = ["#4c78a8", "#f58518", "#54a24b", "#e45756", "#b279a2"]
    for idx, row in df_v1.iterrows():
        name = row["exp_name"]
        axes[0].scatter(row["t_total_s"], row["clip_gain"], s=110, color=cols[idx], zorder=4)
        axes[0].annotate(
            f"{c_labels_v1.get(name, name)}\n(LPIPS_out={row['lpips_out_unified']:.3f})",
            (row["t_total_s"], row["clip_gain"]),
            textcoords="offset points",
            xytext=(0, 10 if idx != 3 else -24),
            ha="center",
            fontsize=8,
        )
    axes[0].set_title("Khao sat 5 cau hinh v1 (*8 cap phan tang)")
    axes[0].set_xlabel("Tong thoi gian xu ly trung binh (s)")
    axes[0].set_ylabel("CLIP cloth gain (cao hon = bam ao tot hon)")
    axes[0].set_xlim(10, 62)
    axes[0].set_ylim(0.025, 0.080)

    # Phai: So sanh truc tiep 3 cau hinh chinh v2 tren du 20 cap
    short = ["C0 Base\n(20s, g4.5)", "C1 Ref-v2\n(20s, g4.5)", "C2 Ref-v2\n(12s, g2.5)"]
    x = np.arange(len(short))
    w = 0.25
    b1 = axes[1].bar(x - w, df_v2["t_total_s"].values / 50.0, w, label="Thoi gian / 50s", color="#4c78a8")
    b2 = axes[1].bar(x, df_v2["clip_gain"].values * 10.0, w, label="CLIP gain x10", color="#54a24b")
    b3 = axes[1].bar(x + w, df_v2["dino_gain"].values * 5.0, w, label="DINO gain x5", color="#f58518")
    for bars, vals, fmt in [
        (b1, df_v2["t_total_s"].values, "{:.1f}s"),
        (b2, df_v2["clip_gain"].values, "{:+.3f}"),
        (b3, df_v2["dino_gain"].values, "{:+.3f}"),
    ]:
        for bar, v in zip(bars, vals):
            axes[1].text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02, fmt.format(v), ha="center", va="bottom", fontsize=7.8)

    axes[1].set_title("So sanh C0 vs Ref-v2 (20 cap day du)")
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(short)
    axes[1].set_ylabel("Gia tri quy chuan de hien thi song song")
    axes[1].set_ylim(0, 1.05)
    axes[1].legend(loc="upper right", fontsize=8.5)

    fig.suptitle("Danh doi do tre suy dien va do bam trang phuc (Issue #20)", fontweight="bold")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "fig_latency_quality_tradeoff.png"), dpi=160)
    plt.close(fig)


def plot_group_comparison():
    df_g = pd.read_csv(os.path.join(V2_DIR, "summary_by_group.csv"))
    groups = ["standard", "mask_boundary", "occlusion", "pose_overall"]
    confs = ["C0_baseline_s20_g45", "C1_refined_s20_g45", "C2_refined_s12_g25"]
    conf_names = ["C0 Baseline (20s)", "C1 Ref-v2 (20s)", "C2 Ref-v2 (12s)"]
    cols = ["#4c78a8", "#f58518", "#54a24b"]

    fig, axes = plt.subplots(1, 3, figsize=(13.5, 4.3))
    metrics = [
        ("lpips_out_unified", "LPIPS ngoai mask (thap hon = it lem)", (0, 0.085)),
        ("clip_gain", "CLIP cloth gain (cao hon = bam ao tot)", (0, 0.11)),
        ("dino_gain", "DINO cloth gain (cao hon = giu chi tiet)", (0, 0.21)),
    ]
    x = np.arange(len(groups))
    w = 0.25

    for ax, (mcol, title, ylim) in zip(axes, metrics):
        for i, (cf, cn, col) in enumerate(zip(confs, conf_names, cols)):
            sub = df_g[df_g["exp_name"] == cf].set_index("group").reindex(groups)
            bars = ax.bar(x + (i - 1) * w, sub[mcol].values, w, label=cn, color=col)
            for b, v in zip(bars, sub[mcol].values):
                ax.text(b.get_x() + b.get_width() / 2, v + ylim[1] * 0.015, f"{v:.3f}", ha="center", va="bottom", fontsize=7.2, rotation=45)
        ax.set_title(title)
        ax.set_xticks(x)
        ax.set_xticklabels(groups, rotation=15)
        ax.set_ylim(*ylim)

    axes[0].legend(loc="upper left", fontsize=8)
    fig.suptitle("Phan tach hieu qua theo 4 nhom anh kiem thu v2 (5 cap/nhom)", fontweight="bold")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "fig_group_comparison.png"), dpi=160)
    plt.close(fig)


def plot_protected_savings():
    df_p = pd.read_csv(os.path.join(V2_DIR, "protected_region_analysis.csv"))
    df_p = df_p.sort_values("saved_region_pct", ascending=False).head(10)

    fig, axes = plt.subplots(1, 2, figsize=(12.0, 4.3))
    y = np.arange(len(df_p))

    axes[0].barh(y, df_p["saved_region_pct"].values, color="#2b8cbe")
    axes[0].set_yticks(y)
    axes[0].set_yticklabels(df_p["pair_id"].values)
    axes[0].invert_yaxis()
    axes[0].set_xlabel("Dien tich vung duoc Ref-v2 bao ve (% anh)")
    axes[0].set_title("Top 10 cap tiet kiem dien tich vung bao ve")
    for i, v in enumerate(df_p["saved_region_pct"].values):
        axes[0].text(v + 0.3, i, f"{v:.2f}%", va="center", fontsize=8)
    axes[0].set_xlim(0, 24.5)

    h = 0.35
    axes[1].barh(y - h / 2, df_p["ssim_saved_c0_baseline"].values, h, label="C0 Baseline", color="#d95f02")
    axes[1].barh(y + h / 2, df_p["ssim_saved_c1_refined"].values, h, label="C1 Ref-v2", color="#1b9e77")
    axes[1].set_yticks(y)
    axes[1].set_yticklabels(df_p["pair_id"].values)
    axes[1].invert_yaxis()
    axes[1].set_xlabel("SSIM tai vung tiet kiem (cao hon = giu nguyen anh goc)")
    axes[1].set_title("Chat luong bao toan SSIM tren vung tranh duoc mask")
    axes[1].set_xlim(0, 1.08)
    axes[1].legend(loc="lower right", fontsize=8.5)

    fig.suptitle("Hieu qua bao ve quan toi mau va vat che chan cua Ref-v2", fontweight="bold")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG_DIR, "fig_protected_region_savings.png"), dpi=160)
    plt.close(fig)


if __name__ == "__main__":
    plot_reproducibility()
    plot_latency_quality_tradeoff()
    plot_group_comparison()
    plot_protected_savings()
    print("Generated figures in:", FIG_DIR)
