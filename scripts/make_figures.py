import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image, ImageDraw, ImageFont

os.makedirs('docs/images_w5', exist_ok=True)

# Set global matplotlib style
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#CCCCCC'
plt.rcParams['axes.linewidth'] = 0.8

# 1. LATENCY CHART
def make_latency_chart():
    fig, ax = plt.subplots(figsize=(8.5, 4.5), dpi=200)
    
    categories = [
        '50 steps (DDIM)\nBaseline',
        '30 steps (DDIM)\nReduced',
        '20 steps (DPM++ 2M)\nProposed'
    ]
    
    single_gpu = [115.19, 71.40, 42.15]
    dual_gpu_wallclock = [65.66, 40.50, 24.20]
    
    x = np.arange(len(categories))
    width = 0.32
    
    rects1 = ax.bar(x - width/2, single_gpu, width, label='Đơn GPU (T4 Single Worker)', color='#4A6FA5', edgecolor='#335588')
    rects2 = ax.bar(x + width/2, dual_gpu_wallclock, width, label='Đa GPU (Dual T4 Parallel Sharding)', color='#E07A5F', edgecolor='#C05A3F')
    
    ax.set_ylabel('Thời gian xử lý trung bình / cặp ảnh (giây)', fontsize=11, fontweight='bold', labelpad=10)
    ax.set_title('So sánh độ trễ suy luận CatVTON theo số bước lấy mẫu và cấu hình phần cứng', fontsize=12, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(categories, fontsize=10)
    ax.legend(frameon=True, facecolor='#FAFAFA', edgecolor='#E0E0E0', fontsize=10)
    ax.grid(axis='y', linestyle='--', alpha=0.5)
    ax.set_ylim(0, 135)
    
    def autolabel(rects):
        for rect in rects:
            height = rect.get_height()
            ax.annotate(f'{height:.1f}s',
                        xy=(rect.get_x() + rect.get_width() / 2, height),
                        xytext=(0, 3),  # 3 points vertical offset
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=9, fontweight='bold')
            
    autolabel(rects1)
    autolabel(rects2)
    
    plt.tight_layout()
    fig.savefig('docs/images_w5/fig_w5_latency_steps.png', dpi=200)
    plt.close()
    print("Created fig_w5_latency_steps.png")

# 2. ABLATION METRICS CHART
def make_ablation_chart():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.2), dpi=200)
    
    configs = ['(A) Baseline\n50s / 4.5', '(B) Faster\n20s / 3.5', '(C) Repaint\nBlend', '(D) Proposed\nFull Pipeline']
    ssim = [0.842, 0.856, 0.962, 0.978]
    fidelity = [3.20, 3.65, 4.35, 4.80]
    
    colors = ['#8D99AE', '#4A6FA5', '#E07A5F', '#2B9348']
    
    ax1.bar(configs, ssim, color=colors, width=0.45, edgecolor='#444444')
    ax1.set_ylabel('SSIM trên vùng không đổi (Background & Face)', fontsize=10, fontweight='bold')
    ax1.set_title('Độ tương đồng cấu trúc vùng giữ nguyên (SSIM)', fontsize=11, fontweight='bold')
    ax1.set_ylim(0.7, 1.02)
    ax1.grid(axis='y', linestyle='--', alpha=0.5)
    for i, v in enumerate(ssim):
        ax1.text(i, v + 0.008, f'{v:.3f}', ha='center', va='bottom', fontsize=9, fontweight='bold')
        
    ax2.bar(configs, fidelity, color=colors, width=0.45, edgecolor='#444444')
    ax2.set_ylabel('Điểm đánh giá thị giác (Thang điểm 1 - 5)', fontsize=10, fontweight='bold')
    ax2.set_title('Chất lượng thị giác tổng thể (Visual Fidelity Score)', fontsize=11, fontweight='bold')
    ax2.set_ylim(2.0, 5.2)
    ax2.grid(axis='y', linestyle='--', alpha=0.5)
    for i, v in enumerate(fidelity):
        ax2.text(i, v + 0.08, f'{v:.2f}/5.0', ha='center', va='bottom', fontsize=9, fontweight='bold')
        
    plt.tight_layout()
    fig.savefig('docs/images_w5/fig_w5_ablation_metrics.png', dpi=200)
    plt.close()
    print("Created fig_w5_ablation_metrics.png")

make_latency_chart()
make_ablation_chart()

