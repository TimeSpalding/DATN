import os
from PIL import Image, ImageDraw, ImageFont
import pandas as pd

os.makedirs('docs/images_w5', exist_ok=True)

def create_case_study_figure():
    # Load extracted images
    img1 = Image.open('scripts/extracted_images/img_1.png').convert('RGB')
    img2 = Image.open('scripts/extracted_images/img_2.png').convert('RGB')
    img3 = Image.open('scripts/extracted_images/img_3.png').convert('RGB')
    img7 = Image.open('scripts/extracted_images/img_7.png').convert('RGB')
    
    # Target height for each row: 360 px
    def resize_h(im, target_h):
        w, h = im.size
        target_w = int(w * (target_h / h))
        return im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    r_img1 = resize_h(img1, 340)
    r_img2 = resize_h(img2, 340)
    r_img3 = resize_h(img3, 340)
    r_img7 = resize_h(img7, 340)
    
    # Canvas: 2 rows, each row has Baseline vs Proposed with headers
    canvas_w = 780
    canvas_h = 820
    canvas = Image.new('RGB', (canvas_w, canvas_h), '#FFFFFF')
    draw = ImageDraw.Draw(canvas)
    
    try:
        font_title = ImageFont.truetype("arial.ttf", 18)
        font_sub = ImageFont.truetype("arial.ttf", 14)
        font_label = ImageFont.truetype("arial.ttf", 13)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_label = ImageFont.load_default()
        
    # Top header
    draw.rectangle([(0, 0), (canvas_w, 45)], fill='#2B3A42')
    draw.text((20, 12), "BẰNG CHỨNG THỰC NGHIỆM ĐỐI CHIẾU: BASELINE VS. PROPOSED PIPELINE", fill='#FFFFFF', font=font_title)
    
    # Section 1: Belt
    y1 = 60
    draw.text((20, y1), "Ca kiểm thử 1: Bảo toàn thắt lưng và ranh giới hông (KEEP_BELT)", fill='#1F2937', font=font_sub)
    draw.rectangle([(20, y1 + 25), (380, y1 + 375)], fill='#F9FAFB', outline='#E5E7EB')
    draw.rectangle([(400, y1 + 25), (760, y1 + 375)], fill='#F0FDF4', outline='#DCFCE7')
    
    # Paste Case 1
    # Center images
    x_c1 = 20 + (360 - r_img1.width) // 2
    canvas.paste(r_img1, (x_c1, y1 + 30))
    x_c2 = 400 + (360 - r_img2.width) // 2
    canvas.paste(r_img2, (x_c2, y1 + 30))
    
    draw.rectangle([(20, y1 + 345), (380, y1 + 375)], fill='#FEE2E2')
    draw.text((30, y1 + 352), "Baseline: Mất thắt lưng, tràn viền áo", fill='#991B1B', font=font_label)
    draw.rectangle([(400, y1 + 345), (760, y1 + 375)], fill='#DCFCE7')
    draw.text((410, y1 + 352), "Proposed: Khôi phục thắt lưng hoàn chỉnh", fill='#166534', font=font_label)
    
    # Section 2: Shorts / Legs
    y2 = 445
    draw.text((20, y2), "Ca kiểm thử 2: Bảo toàn quần short và chi tiết cẳng chân (KEEP_LEGS)", fill='#1F2937', font=font_sub)
    draw.rectangle([(20, y2 + 25), (380, y2 + 375)], fill='#F9FAFB', outline='#E5E7EB')
    draw.rectangle([(400, y2 + 25), (760, y2 + 375)], fill='#F0FDF4', outline='#DCFCE7')
    
    x_c3 = 20 + (360 - r_img3.width) // 2
    canvas.paste(r_img3, (x_c3, y2 + 30))
    x_c4 = 400 + (360 - r_img7.width) // 2
    canvas.paste(r_img7, (x_c4, y2 + 30))
    
    draw.rectangle([(20, y2 + 345), (380, y2 + 375)], fill='#FEE2E2')
    draw.text((30, y2 + 352), "Baseline: Đổi màu quần, nhầm thành váy", fill='#991B1B', font=font_label)
    draw.rectangle([(400, y2 + 345), (760, y2 + 375)], fill='#DCFCE7')
    draw.text((410, y2 + 352), "Proposed: Giữ nguyên form quần và màu vải", fill='#166534', font=font_label)
    
    canvas.save('docs/images_w5/fig_w5_case_studies.png')
    print("Created fig_w5_case_studies.png")

def create_20pairs_overview():
    # Load 6 representative pairs from datacard
    # Pair items: 000001, 000010, 000028, 000057, 000074, 000082
    items = ['000001', '000010', '000028', '000057', '000074', '000082']
    
    w_box = 120
    h_box = 160
    
    canvas_w = 800
    canvas_h = 420
    canvas = Image.new('RGB', (canvas_w, canvas_h), '#FFFFFF')
    draw = ImageDraw.Draw(canvas)
    
    try:
        font_title = ImageFont.truetype("arial.ttf", 15)
        font_label = ImageFont.truetype("arial.ttf", 11)
        font_bold = ImageFont.truetype("arialbd.ttf", 11)
    except:
        font_title = ImageFont.load_default()
        font_label = ImageFont.load_default()
        font_bold = ImageFont.load_default()
        
    draw.rectangle([(0, 0), (canvas_w, 40)], fill='#1F2937')
    draw.text((20, 10), "MINH HỌA MẪU DỮ LIỆU TẬP 20 CẶP THỬ ĐỒ (PERSON - GARMENT PAIRS)", fill='#FFFFFF', font=font_title)
    
    start_x = 20
    spacing = 128
    
    # Row 1: Person (test_img)
    draw.text((start_x, 50), "Ảnh người mẫu (Person Model):", fill='#374151', font=font_bold)
    for i, itm in enumerate(items):
        p_path = f"datacard/test_img/{itm}_0.jpg"
        if os.path.exists(p_path):
            im = Image.open(p_path).convert('RGB').resize((w_box, h_box), Image.Resampling.LANCZOS)
            canvas.paste(im, (start_x + i * spacing, 75))
            draw.rectangle([(start_x + i * spacing, 75), (start_x + i * spacing + w_box, 75 + h_box)], outline='#D1D5DB')
            draw.text((start_x + i * spacing + 15, 75 + h_box + 4), f"Model #{itm}", fill='#4B5563', font=font_label)
            
    # Row 2: Garment (test_color)
    draw.text((start_x, 260), "Ảnh trang phục tương ứng (Garment Item):", fill='#374151', font=font_bold)
    for i, itm in enumerate(items):
        c_path = f"datacard/test_color/{itm}_1.jpg"
        if os.path.exists(c_path):
            im = Image.open(c_path).convert('RGB').resize((w_box, h_box - 40), Image.Resampling.LANCZOS)
            canvas.paste(im, (start_x + i * spacing, 285))
            draw.rectangle([(start_x + i * spacing, 285), (start_x + i * spacing + w_box, 285 + h_box - 40)], outline='#D1D5DB')
            draw.text((start_x + i * spacing + 15, 285 + h_box - 40 + 4), f"Cloth #{itm}", fill='#4B5563', font=font_label)
            
    canvas.save('docs/images_w5/fig_w5_20pairs_overview.png')
    print("Created fig_w5_20pairs_overview.png")

def create_system_architecture_diagram():
    # Create clean system architecture diagram
    w, h = 820, 360
    img = Image.new('RGB', (w, h), '#FFFFFF')
    draw = ImageDraw.Draw(img)
    
    try:
        f_title = ImageFont.truetype("arialbd.ttf", 15)
        f_box = ImageFont.truetype("arialbd.ttf", 12)
        f_sub = ImageFont.truetype("arial.ttf", 10)
    except:
        f_title = ImageFont.load_default()
        f_box = ImageFont.load_default()
        f_sub = ImageFont.load_default()
        
    draw.rectangle([(0, 0), (w, 38)], fill='#1E293B')
    draw.text((20, 10), "KIẾN TRÚC HỆ THỐNG THỬ ĐỒ ẢO VIRTUAL TRY-ON (END-TO-END WORKFLOW)", fill='#FFFFFF', font=f_title)
    
    # Box 1: Client
    draw.rectangle([(20, 60), (140, 320)], fill='#F8FAFC', outline='#94A3B8', width=2)
    draw.text((35, 75), "CLIENT TIER", fill='#0F172A', font=f_box)
    draw.text((30, 110), "- Web React Demo", fill='#334155', font=f_sub)
    draw.text((30, 130), "- Try-On Page", fill='#334155', font=f_sub)
    draw.text((30, 150), "- Upload Person", fill='#334155', font=f_sub)
    draw.text((30, 170), "- Select Garment", fill='#334155', font=f_sub)
    draw.text((30, 190), "- Polling Result", fill='#334155', font=f_sub)
    
    # Arrow 1
    draw.line([(140, 180), (180, 180)], fill='#3B82F6', width=3)
    draw.polygon([(180, 180), (172, 175), (172, 185)], fill='#3B82F6')
    draw.text((145, 160), "HTTP/REST", fill='#2563EB', font=f_sub)
    
    # Box 2: Spring Boot
    draw.rectangle([(180, 60), (340, 320)], fill='#EFF6FF', outline='#3B82F6', width=2)
    draw.text((195, 75), "BACKEND JAVA CORE", fill='#1E3A8A', font=f_box)
    draw.text((195, 95), "Spring Boot 3.3.4 (AWS EC2)", fill='#1E40AF', font=f_sub)
    draw.text((190, 125), "- TryOnController", fill='#1E293B', font=f_sub)
    draw.text((190, 145), "- TryOnService (ACID)", fill='#1E293B', font=f_sub)
    draw.text((190, 165), "- MinIO Object Upload", fill='#1E293B', font=f_sub)
    draw.text((190, 185), "- TryOnHistory DB log", fill='#1E293B', font=f_sub)
    draw.text((190, 205), "- Presigned URL gen", fill='#1E293B', font=f_sub)
    draw.text((190, 225), "- Fallback & Timeout", fill='#1E293B', font=f_sub)
    
    # Arrow 2
    draw.line([(340, 180), (380, 180)], fill='#3B82F6', width=3)
    draw.polygon([(380, 180), (372, 175), (372, 185)], fill='#3B82F6')
    draw.text((345, 160), "Internal", fill='#2563EB', font=f_sub)
    
    # Box 3: FastAPI Gateway
    draw.rectangle([(380, 60), (530, 320)], fill='#F0FDF4', outline='#10B981', width=2)
    draw.text((395, 75), "BACKEND AI GATEWAY", fill='#064E3B', font=f_box)
    draw.text((395, 95), "FastAPI / Python (AWS)", fill='#047857', font=f_sub)
    draw.text((390, 125), "- /api/v1/tryon route", fill='#1E293B', font=f_sub)
    draw.text((390, 145), "- Multipart parsing", fill='#1E293B', font=f_sub)
    draw.text((390, 165), "- Category validation", fill='#1E293B', font=f_sub)
    draw.text((390, 185), "- Ngrok tunnel proxy", fill='#1E293B', font=f_sub)
    draw.text((390, 205), "- 120s Async timeout", fill='#1E293B', font=f_sub)
    draw.text((390, 225), "- Error recovery", fill='#1E293B', font=f_sub)
    
    # Arrow 3
    draw.line([(530, 180), (570, 180)], fill='#10B981', width=3)
    draw.polygon([(570, 180), (562, 175), (562, 185)], fill='#10B981')
    draw.text((532, 160), "Ngrok TLS", fill='#059669', font=f_sub)
    
    # Box 4: GPU Worker
    draw.rectangle([(570, 60), (800, 320)], fill='#FEF3C7', outline='#F59E0B', width=2)
    draw.text((585, 75), "GPU WORKER (CAT-VTON)", fill='#78350F', font=f_box)
    draw.text((585, 95), "Kaggle Dual T4 / Colab GPU", fill='#B45309', font=f_sub)
    draw.text((580, 125), "- AutoMasker (DensePose + SCHP)", fill='#1E293B', font=f_sub)
    draw.text((580, 145), "- RefineMask (Belt/Hands/Legs)", fill='#1E293B', font=f_sub)
    draw.text((580, 165), "- CatVTONPipeline (UNet Inpaint)", fill='#1E293B', font=f_sub)
    draw.text((580, 185), "- DPM++ 2M Karras (20 steps)", fill='#1E293B', font=f_sub)
    draw.text((580, 205), "- Out-of-mask Repainting Blend", fill='#1E293B', font=f_sub)
    draw.text((580, 225), "- Dual-GPU Parallel Worker", fill='#1E293B', font=f_sub)
    
    img.save('docs/images_w5/fig_w5_architecture.png')
    print("Created fig_w5_architecture.png")

create_case_study_figure()
create_20pairs_overview()
create_system_architecture_diagram()

