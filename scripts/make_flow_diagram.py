import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def make_preprocessing_flow():
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 50)
    ax.axis('off')
    
    # Title
    ax.text(50, 47, "QUY TRÌNH CHUẨN HÓA TIỀN XỬ LÝ VÀ TINH CHỈNH MẶT NẠ (PREPROCESSING PIPELINE)", 
            ha='center', va='center', fontsize=11, fontweight='bold', color='#1E293B')
    
    # Steps
    # Step 1: Input Images
    rect1 = patches.FancyBboxPatch((2, 28), 18, 14, boxstyle="round,pad=0.5", fc="#EFF6FF", ec="#3B82F6", lw=1.5)
    ax.add_patch(rect1)
    ax.text(11, 38, "1. Chuẩn hóa ảnh", ha='center', va='center', fontsize=9, fontweight='bold', color='#1E40AF')
    ax.text(11, 33, "- Person: resize & crop\n  về (768, 1024)\n- Cloth: resize & padding\n  về (768, 1024)", ha='center', va='center', fontsize=7.5, color='#1E293B')
    
    # Arrow 1->2
    ax.annotate('', xy=(24, 35), xytext=(20.5, 35), arrowprops=dict(facecolor='#3B82F6', edgecolor='#3B82F6', width=1.5, headwidth=6))
    
    # Step 2: AutoMasker Base
    rect2 = patches.FancyBboxPatch((24.5, 28), 24, 14, boxstyle="round,pad=0.5", fc="#F0FDF4", ec="#10B981", lw=1.5)
    ax.add_patch(rect2)
    ax.text(36.5, 38, "2. AutoMasker đa nhãn", ha='center', va='center', fontsize=9, fontweight='bold', color='#065F46')
    ax.text(36.5, 33, "- DensePose: 24 vùng IUV\n- SCHP-ATR: 18 nhãn trang phục\n- SCHP-LIP: 20 nhãn chi tiết\n- Hợp nhất 8 bước B1->B8", ha='center', va='center', fontsize=7.5, color='#1E293B')
    
    # Arrow 2->3
    ax.annotate('', xy=(53, 35), xytext=(49, 35), arrowprops=dict(facecolor='#10B981', edgecolor='#10B981', width=1.5, headwidth=6))
    
    # Step 3: Refine Mask
    rect3 = patches.FancyBboxPatch((53.5, 28), 24, 14, boxstyle="round,pad=0.5", fc="#FEF3C7", ec="#F59E0B", lw=1.5)
    ax.add_patch(rect3)
    ax.text(65.5, 38, "3. refine_mask cải tiến", ha='center', va='center', fontsize=9, fontweight='bold', color='#92400E')
    ax.text(65.5, 33, "- KEEP_BELT: Trừ nhãn Belt ATR\n- KEEP_HANDS: Trừ bàn tay DensePose\n- KEEP_LEGS: Trừ đùi/cẳng chân\n- Chỉ trừ pixel, không thêm", ha='center', va='center', fontsize=7.5, color='#1E293B')
    
    # Arrow 3->4
    ax.annotate('', xy=(82, 35), xytext=(78, 35), arrowprops=dict(facecolor='#F59E0B', edgecolor='#F59E0B', width=1.5, headwidth=6))
    
    # Step 4: Mask Smoothing & Inpainting
    rect4 = patches.FancyBboxPatch((82.5, 28), 15.5, 14, boxstyle="round,pad=0.5", fc="#FDF2F8", ec="#EC4899", lw=1.5)
    ax.add_patch(rect4)
    ax.text(90.25, 38, "4. Inpainting", ha='center', va='center', fontsize=9, fontweight='bold', color='#9D174D')
    ax.text(90.25, 33, "- VAE blur=9\n- DPM++ 2M\n  (20 steps)\n- Guidance 3.5", ha='center', va='center', fontsize=7.5, color='#1E293B')
    
    # Down arrow from 4 to 5
    ax.annotate('', xy=(90.25, 22), xytext=(90.25, 27.5), arrowprops=dict(facecolor='#EC4899', edgecolor='#EC4899', width=1.5, headwidth=6))
    
    # Step 5: Post-processing Repainting Blend
    rect5 = patches.FancyBboxPatch((15, 6), 70, 15, boxstyle="round,pad=0.5", fc="#F3F4F6", ec="#4B5563", lw=1.5)
    ax.add_patch(rect5)
    ax.text(50, 17, "5. Hậu xử lý: Dán lại ảnh gốc ngoài vùng mask (Out-of-mask Repainting Alpha-Blend)", 
            ha='center', va='center', fontsize=9.5, fontweight='bold', color='#111827')
    ax.text(50, 10.5, "Công thức: Output = alpha × Image_generated + (1 − alpha) × Image_original\nTrong đó alpha được tạo từ mặt nạ mở rộng (dilate 8 px) rồi làm mờ biên Gaussian (blur 6 px).\nGiúp bảo toàn 100% chi tiết khuôn mặt, mắt kính, kiểu tóc, hình xăm và hậu cảnh gốc không bị suy hao chất lượng do VAE.", 
            ha='center', va='center', fontsize=8, color='#374151')
    
    plt.tight_layout()
    fig.savefig('docs/images_w5/fig_w5_preprocessing_flow.png', dpi=200)
    plt.close()
    print("Created fig_w5_preprocessing_flow.png")

make_preprocessing_flow()

