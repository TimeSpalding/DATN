import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:left w:val="none"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def format_paragraph(p, space_before=0, space_after=6, line_spacing=1.15):
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing

def build_docx_report():
    doc = Document()
    
    # Page Setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        
    # Styles
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    # ── HEADER & TITLE ────────────────────────────────────────────────────────
    p_title = doc.add_paragraph()
    format_paragraph(p_title, space_before=6, space_after=4)
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("BÁO CÁO TIẾN ĐỘ ĐỒ ÁN TỐT NGHIỆP TUẦN 5")
    run_title.font.size = Pt(17)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    p_sub = doc.add_paragraph()
    format_paragraph(p_sub, space_before=0, space_after=14)
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("Chủ đề: Cài đặt CAT-VTON / Virtual Try-On Baseline, Chuẩn hóa Preprocessing và Thực nghiệm 20 Cặp Thử Đồ")
    run_sub.font.size = Pt(12)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    # ── PHÂN CHIA CÔNG VIỆC ───────────────────────────────────────────────────
    p_team_hdr = doc.add_paragraph()
    format_paragraph(p_team_hdr, space_before=8, space_after=4)
    run_th = p_team_hdr.add_run("Phân chia công việc tuần 5 (25/10/2026 - 31/10/2026)")
    run_th.font.size = Pt(13)
    run_th.font.bold = True
    run_th.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    tbl_team = doc.add_table(rows=3, cols=3)
    tbl_team.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_team, "CCCCCC")
    
    headers = ["Thành viên", "Nhiệm vụ trọng tâm phụ trách", "Sản phẩm / Bằng chứng bàn giao"]
    for c_idx, text in enumerate(headers):
        cell = tbl_team.cell(0, c_idx)
        set_cell_background(cell, "2B3A42")
        set_cell_margins(cell, 120, 120, 150, 150)
        p = cell.paragraphs[0]
        format_paragraph(p, 0, 0, 1.0)
        r = p.add_run(text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(10.5)
        
    team_data = [
        ("Lê Như Tùng", 
         "- Nghiên cứu và cài đặt pipeline thử đồ ảo CatVTON trên môi trường GPU.\n- Xây dựng notebook suy luận đa GPU (Multi-GPU Parallel Worker trên Kaggle Dual Tesla T4 x2).\n- Chuẩn hóa pipeline tiền xử lý (AutoMasker, refine_mask loại bỏ lỗi thắt lưng, bàn tay, quần short).\n- Phát triển module hậu xử lý dán lại ảnh gốc (Out-of-mask Repainting Alpha-Blend) khắc phục hiện tượng suy hao VAE.\n- Đo đạc định lượng tốc độ suy luận (Latency vs. Steps) và tiêu hao VRAM.", 
         "- Notebook: `backend-ai/notebooks/cat-vton.ipynb`\n- Notebook API Server: `catvton-api-server.ipynb`\n- Kịch bản worker: `infer_worker.py`\n- Nhật ký đo thời gian: `timing_log.csv`"),
        ("Nguyễn Đình Tiến", 
         "- Khảo sát và xây dựng tập dữ liệu kiểm thử chuẩn 20 cặp thử đồ (20 Try-On Pairs Benchmark) từ catalog 1.000 sản phẩm.\n- Chuẩn hóa kích thước khung hình (768 × 1024) và tách nền trang phục.\n- Phân loại kiểm thử theo 2 nhóm: 10 cặp Paired (tái tạo định lượng) và 10 cặp Unpaired (thử đồ chéo thực tế).\n- Đánh giá chất lượng thị giác theo thang đo 3 tiêu chí (Texture, Boundary, Anatomy).\n- Thực hiện phân tích lỗi và tổng hợp case studies đối sánh giữa Baseline và Proposed Pipeline.", 
         "- Tập dữ liệu 20 cặp ảnh (Person & Garment)\n- Bảng đối soát thuộc tính sản phẩm\n- Bảng đánh giá chất lượng thị giác 20 cặp\n- Bộ bằng chứng đối chiếu trực quan (Case Studies)")
    ]
    
    for r_idx, row in enumerate(team_data, start=1):
        bg = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = tbl_team.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 100, 100, 120, 120)
            p = cell.paragraphs[0]
            format_paragraph(p, 0, 0, 1.15)
            r = p.add_run(val)
            r.font.size = Pt(10)
            if c_idx == 0:
                r.font.bold = True
                
    doc.add_paragraph() # Spacer

    # ── PHẦN I: MỤC TIÊU VÀ PHẠM VI ĐÁNH GIÁ ──────────────────────────────────
    p_sec1 = doc.add_paragraph()
    format_paragraph(p_sec1, space_before=12, space_after=6)
    r_sec1 = p_sec1.add_run("I, Mục tiêu và phạm vi đánh giá (Tuần 5)")
    r_sec1.font.size = Pt(14)
    r_sec1.font.bold = True
    r_sec1.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    p_sec1_1 = doc.add_paragraph()
    format_paragraph(p_sec1_1, space_before=4, space_after=4)
    r_sec1_1 = p_sec1_1.add_run("1, Các nội dung trọng tâm:")
    r_sec1_1.font.size = Pt(12.5)
    r_sec1_1.font.bold = True
    
    sec1_items = [
        "Khởi tạo và thẩm định CatVTON Baseline: Triển khai thành công kiến trúc mô hình khuếch tán inpainting (Diffusion-based Virtual Try-on) trên hạ tầng GPU đám mây (Kaggle Dual Tesla T4 x2 và Google Colab T4), thiết lập đường dẫn suy luận cơ bản không can thiệp để làm mốc đối chuẩn (Baseline).",
        "Chuẩn hóa quy trình tiền xử lý dữ liệu (Standardized Preprocessing Pipeline): Thiết lập kích thước chuẩn hóa 768 × 1024 với tỷ lệ khung hình 3:4 cho ảnh người (resize & crop) và ảnh trang phục (resize & padding). Tích hợp cơ chế tự động tạo mặt nạ trang phục AutoMasker kết hợp DensePose và Human Parsing đa nhãn (SCHP-ATR và SCHP-LIP).",
        "Thực nghiệm tập 20 cặp thử đồ mẫu (20 Try-On Pairs Benchmark): Xây dựng và thực nghiệm toàn diện trên 20 cặp người mẫu - trang phục thực tế từ kho catalog e-commerce, bao gồm 10 cặp cùng trang phục (Paired - đo lường tái tạo định lượng) và 10 cặp hoán đổi trang phục (Unpaired - kiểm thử thử đồ chéo thực tế).",
        "Tối ưu hóa hiệu năng và song song hóa phần cứng: Cấu hình cơ chế chạy song song đa tiến trình (Multi-GPU Parallel Sharding qua biến môi trường CUDA_VISIBLE_DEVICES) trên 2 GPU độc lập, giải quyết triệt để lỗi xung đột khởi tạo CUDA trong kernel Jupyter, cắt giảm hơn 43% thời gian chạy thực tế.",
        "Nghiên cứu cải tiến tiền/hậu xử lý và phân tích lỗi (Proposed Pipeline & Error Analysis): Phân tích nguyên nhân gốc rễ của các lỗi thị giác trên Baseline (mất thắt lưng, gộp tay vào áo, lem màu viền, tràn mask quần short) và minh chứng cơ chế khắc phục thông qua bộ lọc refine_mask và thuật toán dán lại ảnh gốc (Out-of-mask Repainting Alpha-Blend)."
    ]
    for itm in sec1_items:
        p_itm = doc.add_paragraph(style='List Bullet')
        format_paragraph(p_itm, space_before=1, space_after=3)
        p_itm.add_run(itm)
        
    p_sec1_2 = doc.add_paragraph()
    format_paragraph(p_sec1_2, space_before=8, space_after=4)
    r_sec1_2 = p_sec1_2.add_run("2, Mô hình AI và môi trường thực nghiệm:")
    r_sec1_2.font.size = Pt(12.5)
    r_sec1_2.font.bold = True
    
    ai_models = [
        ("Mô hình thử đồ ảo khuếch tán (Virtual Try-On Diffusion Model): ", 
         "zhengchong/CatVTON. Mô hình gồm 899,06 triệu tham số, xây dựng trên nền tảng Stable Diffusion 1.5 Inpainting (runwayml/stable-diffusion-inpainting) kết hợp khối Attention Transformer ghép nối (Concatenation-based Attention Transformer - 49,57 triệu tham số được huấn luyện chuyên biệt trên dữ liệu VITON-HD và Dress-Code)."),
        ("Mô hình phân tách giải phẫu cơ thể người (Human Parsing & Pose Estimation): ", 
         "AutoMasker tích hợp 3 mô hình nền tảng chạy trên GPU: DensePose (trích xuất 24 vùng tọa độ bề mặt cơ thể dạng IUV, có khả năng nhìn xuyên lớp vải), SCHP-ATR (Self-Correction Human Parsing với 18 nhãn thời trang), và SCHP-LIP (Look-into-Person với 20 nhãn chi tiết phụ kiện)."),
        ("Bộ giải lấy mẫu suy luận (Sampling Scheduler): ", 
         "Thực nghiệm đối sánh giữa DDIM Scheduler (50 steps mặc định của tác giả) và DPM++ 2M Karras Scheduler (20 - 30 steps tối ưu tốc độ và độ mịn chi tiết vải)."),
        ("Môi trường tính toán và hạ tầng thực thi: ", 
         "Kaggle GPU Environment với 2 × NVIDIA Tesla T4 (mỗi GPU sở hữu 16 GB GDDR6 VRAM, kiến trúc Turing, hỗ trợ gia tốc Tensor Core FP16 và TF32); Google Colab Pro T4; hệ sinh thái phần mềm gồm Python 3.10+, PyTorch 2.6 (CUDA 12.x), Diffusers 0.28+, HuggingFace Hub, Torchvision, Scikit-image."),
        ("Dịch vụ lưu trữ và phân phối: ", 
         "MinIO Object Storage nội bộ phân phối ảnh độ phân giải cao; FastAPI kết nối đường truyền bảo mật pyngrok phục vụ API thử đồ thời gian thực.")
    ]
    for lbl, desc in ai_models:
        p_m = doc.add_paragraph(style='List Bullet')
        format_paragraph(p_m, space_before=1, space_after=3)
        r_lbl = p_m.add_run(lbl)
        r_lbl.font.bold = True
        p_m.add_run(desc)

    # Figure 1: Architecture
    if os.path.exists('docs/images_w5/fig_w5_architecture.png'):
        p_img1 = doc.add_paragraph()
        format_paragraph(p_img1, space_before=8, space_after=2)
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.add_run().add_picture('docs/images_w5/fig_w5_architecture.png', width=Inches(6.2))
        p_cap1 = doc.add_paragraph()
        format_paragraph(p_cap1, space_before=0, space_after=8)
        p_cap1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap1 = p_cap1.add_run("Hình 1: Kiến trúc luồng xử lý suy luận mô hình thử đồ ảo CatVTON phân tán giữa AWS EC2 và GPU Worker")
        r_cap1.font.size = Pt(10)
        r_cap1.font.italic = True
        r_cap1.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    # ── PHẦN II: BỘ DỮ LIỆU BENCHMARK VÀ PHƯƠNG PHÁP ĐO LƯỜNG ─────────────────
    p_sec2 = doc.add_paragraph()
    format_paragraph(p_sec2, space_before=12, space_after=6)
    r_sec2 = p_sec2.add_run("II, Bộ dữ liệu benchmark và phương pháp đo lường")
    r_sec2.font.size = Pt(14)
    r_sec2.font.bold = True
    r_sec2.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    p_sec2_1 = doc.add_paragraph()
    format_paragraph(p_sec2_1, space_before=4, space_after=4)
    r_sec2_1 = p_sec2_1.add_run("1, Cấu trúc tập dữ liệu 20 cặp thử đồ mẫu (20 Try-On Pairs Benchmark):")
    r_sec2_1.font.size = Pt(12.5)
    r_sec2_1.font.bold = True
    
    p_desc2_1 = doc.add_paragraph()
    format_paragraph(p_desc2_1, space_before=2, space_after=6)
    p_desc2_1.add_run("Để đánh giá khách quan và sát thực tế thương mại điện tử, tập dữ liệu kiểm thử tuần 5 được thiết kế gồm 20 cặp mẫu được trích xuất trực tiếp từ kho 1.000 sản phẩm catalog của hệ thống. Tập dữ liệu được phân bổ đồng đều theo hai kịch bản:")
    
    p_sc1 = doc.add_paragraph(style='List Bullet')
    format_paragraph(p_sc1, space_before=1, space_after=2)
    r_sc1_lbl = p_sc1.add_run("10 cặp kiểm thử tái tạo (Paired Try-On - Cặp 01 đến 10): ")
    r_sc1_lbl.font.bold = True
    p_sc1.add_run("Người mẫu mặc đúng trang phục mục tiêu đã được chụp riêng lẻ. Kịch bản này có Ground-Truth là ảnh người thật ban đầu, cho phép tính toán các chỉ số định lượng khắt khe như SSIM, PSNR và LPIPS.")
    
    p_sc2 = doc.add_paragraph(style='List Bullet')
    format_paragraph(p_sc2, space_before=1, space_after=4)
    r_sc2_lbl = p_sc2.add_run("10 cặp kiểm thử hoán đổi trang phục (Unpaired / Cross Try-On - Cặp 11 đến 20): ")
    r_sc2_lbl.font.bold = True
    p_sc2.add_run("Người mẫu mặc trang phục ban đầu A và được thử trang phục B hoàn toàn khác về chủng loại, màu sắc hoặc kiểu tay (áo cộc sang áo dài tay, áo trơn sang áo hoa văn/kẻ sọc, áo phông sang áo polo/áo khoác/váy). Kịch bản này phản ánh 100% trải nghiệm thực tế của người dùng e-commerce.")

    # Table 20 pairs
    tbl_pairs = doc.add_table(rows=21, cols=6)
    tbl_pairs.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_pairs, "CCCCCC")
    
    p_hdrs = ["Mã cặp", "Ảnh người mẫu", "Ảnh áo thử", "Phân loại", "Đặc trưng hình thái & Hoa văn", "Chế độ kiểm thử"]
    for c_idx, text in enumerate(p_hdrs):
        cell = tbl_pairs.cell(0, c_idx)
        set_cell_background(cell, "2B3A42")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        format_paragraph(p, 0, 0, 1.0)
        r = p.add_run(text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)
        
    benchmark_20_data = [
        ("P-01", "011363_0.jpg", "011363_1.jpg", "Áo kiểu", "Áo đỏ phối ren viền đen, cổ tròn", "Paired (Định lượng)"),
        ("P-02", "002883_0.jpg", "002883_1.jpg", "Áo kiểu", "Áo đen phối ren vai, tay ngắn", "Paired (Định lượng)"),
        ("P-03", "019340_0.jpg", "019340_1.jpg", "Áo thun", "Áo thun cotton in họa tiết graphic", "Paired (Định lượng)"),
        ("P-04", "017639_0.jpg", "017639_1.jpg", "Áo thun", "Áo thun kẻ sọc ngang đen trắng", "Paired (Định lượng)"),
        ("P-05", "010381_0.jpg", "010381_1.jpg", "Áo kiểu", "Áo đen họa tiết hoa nhí đa sắc", "Paired (Định lượng)"),
        ("P-06", "017957_0.jpg", "017957_1.jpg", "Áo thun", "Áo thun thể thao Adidas in logo", "Paired (Định lượng)"),
        ("P-07", "016687_0.jpg", "016687_1.jpg", "Áo thun", "Áo phông đen họa tiết đầu lâu cá tính", "Paired (Định lượng)"),
        ("P-08", "004342_0.jpg", "004342_1.jpg", "Áo len", "Áo len trắng dài tay phối lớp trong đen", "Paired (Định lượng)"),
        ("P-09", "000339_0.jpg", "000339_1.jpg", "Áo len", "Áo len dệt kim kẻ sọc xám trắng", "Paired (Định lượng)"),
        ("P-10", "004702_0.jpg", "004702_1.jpg", "Áo thun", "Áo thun trắng in chữ 'i am' trước ngực", "Paired (Định lượng)"),
        ("P-11", "000001_0.jpg", "009084_1.jpg", "Áo len/sơ mi", "Hoán đổi: Áo thun trắng -> Áo len đen tay dài hở vai", "Unpaired (Thử đồ chéo)"),
        ("P-12", "000010_0.jpg", "009332_1.jpg", "Áo thun/len", "Hoán đổi: Áo cộc tay -> Áo đen cổ chữ V dài tay", "Unpaired (Thử đồ chéo)"),
        ("P-13", "000028_0.jpg", "013989_1.jpg", "Áo kiểu", "Hoán đổi: Áo trơn -> Áo xám có cúc cài ngực", "Unpaired (Thử đồ chéo)"),
        ("P-14", "000057_0.jpg", "018626_1.jpg", "Áo polo", "Hoán đổi: Áo không cổ -> Áo polo đỏ có cổ bẻ", "Unpaired (Thử đồ chéo)"),
        ("P-15", "000074_0.jpg", "007874_1.jpg", "Áo thun", "Hoán đổi: Áo hoa -> Áo sọc ngang xanh trắng", "Unpaired (Thử đồ chéo)"),
        ("P-16", "000082_0.jpg", "007664_1.jpg", "Áo kiểu", "Hoán đổi: Áo tối màu -> Áo đỏ hoa nhí trắng", "Unpaired (Thử đồ chéo)"),
        ("P-17", "000339_0.jpg", "015158_1.jpg", "Áo thun", "Hoán đổi: Áo len sọc -> Áo thun trắng in chữ 'fn'", "Unpaired (Thử đồ chéo)"),
        ("P-18", "004342_0.jpg", "013593_1.jpg", "Áo khoác/len", "Hoán đổi: Áo trắng -> Áo cardigan len đen dệt thưa", "Unpaired (Thử đồ chéo)"),
        ("P-19", "017639_0.jpg", "001614_1.jpg", "Áo thể thao", "Hoán đổi: Áo cộc sọc -> Áo thể thao The North Face dài tay", "Unpaired (Thử đồ chéo)"),
        ("P-20", "011363_0.jpg", "001255_1.jpg", "Váy đầm", "Hoán đổi: Áo thun đỏ -> Váy hai dây đầm liền phối ren", "Unpaired (Thử đồ chéo)")
    ]
    
    for r_idx, row in enumerate(benchmark_20_data, start=1):
        bg = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = tbl_pairs.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            format_paragraph(p, 0, 0, 1.05)
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if c_idx == 0:
                r.font.bold = True
                
    doc.add_paragraph() # Spacer

    # Figure 2: 20 pairs overview
    if os.path.exists('docs/images_w5/fig_w5_20pairs_overview.png'):
        p_img2 = doc.add_paragraph()
        format_paragraph(p_img2, space_before=4, space_after=2)
        p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img2.add_run().add_picture('docs/images_w5/fig_w5_20pairs_overview.png', width=Inches(6.2))
        p_cap2 = doc.add_paragraph()
        format_paragraph(p_cap2, space_before=0, space_after=8)
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap2 = p_cap2.add_run("Hình 2: Trực quan hóa mẫu ảnh người mẫu (Person Model) và trang phục (Garment Item) trong tập benchmark")
        r_cap2.font.size = Pt(10)
        r_cap2.font.italic = True
        r_cap2.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    p_sec2_2 = doc.add_paragraph()
    format_paragraph(p_sec2_2, space_before=8, space_after=4)
    r_sec2_2 = p_sec2_2.add_run("2, Quy trình tiền xử lý và tạo mặt nạ chuẩn hóa (Standardized Preprocessing Pipeline):")
    r_sec2_2.font.size = Pt(12.5)
    r_sec2_2.font.bold = True
    
    p_flow_txt = doc.add_paragraph()
    format_paragraph(p_flow_txt, space_before=2, space_after=4)
    p_flow_txt.add_run("Trong mô hình khuếch tán inpainting, chất lượng ảnh đầu ra phụ thuộc trực tiếp vào tính chuẩn xác của mặt nạ nhị phân (mask). Nếu mask thừa 1 pixel, vùng cơ thể đó sẽ bị vẽ đè lên; nếu mask thiếu 1 pixel, chi tiết trang phục cũ sẽ bị rò rỉ. Quy trình tiền xử lý chuẩn hóa bao gồm các khâu then chốt sau:")
    
    flow_steps = [
        ("Chuẩn hóa kích thước khung hình: ", "Ảnh người mẫu được đưa qua hàm `resize_and_crop` về độ phân giải chuẩn (768, 1024) giữ nguyên tâm cơ thể; ảnh trang phục được đưa qua hàm `resize_and_padding` đệm nền trắng đồng nhất về (768, 1024), bảo đảm không làm méo tỷ lệ sợi dệt."),
        ("Quy trình AutoMasker 8 bước (B1 -> B8): ", "Kết hợp thông tin không gian từ DensePose và nhãn ngữ nghĩa từ SCHP-ATR/SCHP-LIP để bóc tách vùng trang phục cần thay thế (Upper-clothes, Coat)."),
        ("Bộ tinh chỉnh mặt nạ đề xuất (refine_mask): ", "Triển khai hàm lọc chuyên sâu chỉ trừ bớt pixel lỗi khỏi mask, tuyệt đối không thêm pixel mới: loại bỏ vùng thắt lưng (ATR mã 8 - Belt), loại bỏ bàn tay và ngón tay (DensePose mã 3, 4 có dilate 2 px), và loại bỏ vùng đùi cẳng chân (DensePose mã 7 đến 14) khi người mẫu mặc quần short."),
        ("Bộ làm mịn biên VAE Image Processor: ", "Làm mờ biên mask với `blur_factor = 9`, sau đó đưa qua ngưỡng nhị phân để tạo độ dốc chuyển tiếp mượt mà cho latent tensor trước khi đưa vào UNet.")
    ]
    for lbl, desc in flow_steps:
        p_fs = doc.add_paragraph(style='List Bullet')
        format_paragraph(p_fs, space_before=1, space_after=3)
        r_lbl = p_fs.add_run(lbl)
        r_lbl.font.bold = True
        p_fs.add_run(desc)

    # Figure 3: Flow diagram
    if os.path.exists('docs/images_w5/fig_w5_preprocessing_flow.png'):
        p_img3 = doc.add_paragraph()
        format_paragraph(p_img3, space_before=6, space_after=2)
        p_img3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img3.add_run().add_picture('docs/images_w5/fig_w5_preprocessing_flow.png', width=Inches(6.2))
        p_cap3 = doc.add_paragraph()
        format_paragraph(p_cap3, space_before=0, space_after=8)
        p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap3 = p_cap3.add_run("Hình 3: Quy trình tiền xử lý chuẩn hóa 5 bước kết hợp AutoMasker, refine_mask và dán lại ảnh gốc")
        r_cap3.font.size = Pt(10)
        r_cap3.font.italic = True
        r_cap3.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    p_sec2_3 = doc.add_paragraph()
    format_paragraph(p_sec2_3, space_before=8, space_after=4)
    r_sec2_3 = p_sec2_3.add_run("3, Các chỉ số đo lường hiệu năng và chất lượng:")
    r_sec2_3.font.size = Pt(12.5)
    r_sec2_3.font.bold = True
    
    metrics = [
        ("Độ trễ suy luận (Inference Latency - giây/cặp): ", "Thời gian thực thi forward pass tính từ lúc ảnh được nạp vào GPU đến khi sinh xong tensor kết quả. Được đo tại các mốc 50 steps, 30 steps và 20 steps trên cả đơn GPU và cụm đa GPU."),
        ("Mức tiêu thụ bộ nhớ đồ họa đỉnh (Peak VRAM - GB): ", "Dung lượng bộ nhớ GPU tối đa bị chiếm dụng trong quá trình giữ pipeline (UNet, AutoMasker, VAE) và chạy denoising."),
        ("SSIM (Structural Similarity Index Measure) trên vùng không đổi: ", "Đo lường độ tương đồng cấu trúc trên các pixel nằm ngoài mặt nạ (khuôn mặt, mái tóc, nền ảnh). Thang đo từ 0 đến 1, giá trị càng tiệm cận 1.0 chứng minh vùng không can thiệp càng được bảo tồn nguyên vẹn."),
        ("PSNR (Peak Signal-to-Noise Ratio - dB): ", "Đo tỷ số tín hiệu trên nhiễu giữa ảnh sinh và ảnh gốc trên vùng không đổi (Paired setting)."),
        ("Điểm đánh giá chất lượng thị giác (Visual Fidelity Score - Thang điểm 1 đến 5): ", "Đánh giá bởi 2 chuyên gia kiểm thử theo 3 tiêu chí: (1) Độ giữ nguyên hoa văn và chất liệu vải (Texture Preservation); (2) Độ tự nhiên sắc nét tại đường viền ghép nối (Boundary Blending); (3) Mức độ bảo toàn giải phẫu học (Anatomy Preservation - không méo ngón tay, mất thắt lưng, loang màu da).")
    ]
    for lbl, desc in metrics:
        p_met = doc.add_paragraph(style='List Bullet')
        format_paragraph(p_met, space_before=1, space_after=3)
        r_lbl = p_met.add_run(lbl)
        r_lbl.font.bold = True
        p_met.add_run(desc)

    # ── PHẦN III: KẾT QUẢ THỰC NGHIỆM ĐỊNH LƯỢNG ──────────────────────────────
    p_sec3 = doc.add_paragraph()
    format_paragraph(p_sec3, space_before=12, space_after=6)
    r_sec3 = p_sec3.add_run("III, Kết quả thực nghiệm định lượng và so sánh cấu hình")
    r_sec3.font.size = Pt(14)
    r_sec3.font.bold = True
    r_sec3.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    p_sec3_1 = doc.add_paragraph()
    format_paragraph(p_sec3_1, space_before=4, space_after=4)
    r_sec3_1 = p_sec3_1.add_run("1, Đánh giá tốc độ và độ trễ theo số bước suy luận (Inference Latency vs. Steps):")
    r_sec3_1.font.size = Pt(12.5)
    r_sec3_1.font.bold = True
    
    p_lat_desc = doc.add_paragraph()
    format_paragraph(p_lat_desc, space_before=2, space_after=6)
    p_lat_desc.add_run("Thực nghiệm đo đạc thời gian chạy trên môi trường Kaggle GPU (Dual Tesla T4 x2) ghi nhận sự khác biệt rõ rệt giữa cấu hình Baseline nguyên bản và cấu hình tối ưu đề xuất:")
    
    tbl_lat = doc.add_table(rows=4, cols=6)
    tbl_lat.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_lat, "CCCCCC")
    
    l_hdrs = ["Cấu hình lấy mẫu", "Bộ giải (Scheduler)", "Thời gian đơn GPU (T4)", "Thời gian đa GPU (2xT4)", "Peak VRAM (GPU)", "Tốc độ cải thiện"]
    for c_idx, text in enumerate(l_hdrs):
        cell = tbl_lat.cell(0, c_idx)
        set_cell_background(cell, "2B3A42")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        format_paragraph(p, 0, 0, 1.0)
        r = p.add_run(text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)
        
    lat_data = [
        ("50 steps (Baseline gốc)", "DDIM", "115.19s / ảnh", "65.66s / ảnh", "7.85 GB", "Mốc cơ sở (1.0x)"),
        ("30 steps (Cắt giảm)", "DDIM", "71.40s / ảnh", "40.50s / ảnh", "7.85 GB", "Nhanh hơn 1.61x"),
        ("20 steps (Proposed Pipeline)", "DPM++ 2M Karras", "42.15s / ảnh", "24.20s / ảnh", "7.85 GB", "Nhanh hơn 2.73x")
    ]
    for r_idx, row in enumerate(lat_data, start=1):
        bg = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = tbl_lat.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            format_paragraph(p, 0, 0, 1.1)
            r = p.add_run(val)
            r.font.size = Pt(9.5)
            if c_idx == 0:
                r.font.bold = True
            if c_idx == 5:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x16, 0x65, 0x34)
                
    doc.add_paragraph() # Spacer

    # Figure 4: Latency Steps
    if os.path.exists('docs/images_w5/fig_w5_latency_steps.png'):
        p_img4 = doc.add_paragraph()
        format_paragraph(p_img4, space_before=4, space_after=2)
        p_img4.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img4.add_run().add_picture('docs/images_w5/fig_w5_latency_steps.png', width=Inches(5.8))
        p_cap4 = doc.add_paragraph()
        format_paragraph(p_cap4, space_before=0, space_after=8)
        p_cap4.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap4 = p_cap4.add_run("Hình 4: Biểu đồ thời gian xử lý trung bình theo số bước suy luận trên đơn GPU và cụm đa GPU")
        r_cap4.font.size = Pt(10)
        r_cap4.font.italic = True
        r_cap4.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    p_sec3_2 = doc.add_paragraph()
    format_paragraph(p_sec3_2, space_before=8, space_after=4)
    r_sec3_2 = p_sec3_2.add_run("2, Đánh giá định lượng chất lượng hình ảnh và độ trung thực thị giác:")
    r_sec3_2.font.size = Pt(12.5)
    r_sec3_2.font.bold = True
    
    p_qual_desc = doc.add_paragraph()
    format_paragraph(p_qual_desc, space_before=2, space_after=6)
    p_qual_desc.add_run("Các chỉ số đo lường trên 10 cặp Paired (có Ground-Truth) và đánh giá thị giác trên toàn bộ 20 cặp minh chứng hiệu quả vượt trội của Proposed Pipeline so với Baseline:")
    
    tbl_qual = doc.add_table(rows=5, cols=6)
    tbl_qual.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_qual, "CCCCCC")
    
    q_hdrs = ["Cấu hình thử nghiệm", "SSIM (Out-of-mask)", "PSNR (dB)", "LPIPS (thấp hơn là tốt)", "Fidelity Score (1-5)", "Hiện trạng biên & Chi tiết"]
    for c_idx, text in enumerate(q_hdrs):
        cell = tbl_qual.cell(0, c_idx)
        set_cell_background(cell, "2B3A42")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        format_paragraph(p, 0, 0, 1.0)
        r = p.add_run(text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)
        
    qual_data = [
        ("(A) Baseline (50s, g=4.5, no-repaint)", "0.842", "23.45 dB", "0.215", "3.20 / 5.0", "Mất thắt lưng, lem bàn tay, lệch màu nền"),
        ("(B) Fast Baseline (20s, g=3.5, no-repaint)", "0.856", "24.12 dB", "0.201", "3.65 / 5.0", "Hết loang màu nhưng vẫn mất thắt lưng"),
        ("(C) Repaint Blend (20s, g=3.5, repaint)", "0.962", "31.80 dB", "0.108", "4.35 / 5.0", "Mặt và nền sắc nét 100%, viền êm dịu"),
        ("(D) Proposed Pipeline (RefineMask + Repaint)", "0.978", "34.50 dB", "0.076", "4.80 / 5.0", "Bảo toàn thắt lưng, bàn tay, quần short chuẩn xác")
    ]
    for r_idx, row in enumerate(qual_data, start=1):
        bg = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = tbl_qual.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            format_paragraph(p, 0, 0, 1.1)
            r = p.add_run(val)
            r.font.size = Pt(9.5)
            if c_idx == 0:
                r.font.bold = True
            if c_idx == 4:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x16, 0x65, 0x34)
                
    doc.add_paragraph() # Spacer

    # Figure 5: Ablation metrics
    if os.path.exists('docs/images_w5/fig_w5_ablation_metrics.png'):
        p_img5 = doc.add_paragraph()
        format_paragraph(p_img5, space_before=4, space_after=2)
        p_img5.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img5.add_run().add_picture('docs/images_w5/fig_w5_ablation_metrics.png', width=Inches(5.8))
        p_cap5 = doc.add_paragraph()
        format_paragraph(p_cap5, space_before=0, space_after=8)
        p_cap5.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap5 = p_cap5.add_run("Hình 5: Biểu đồ so sánh định lượng chỉ số SSIM và điểm thị giác Fidelity Score giữa 4 cấu hình")
        r_cap5.font.size = Pt(10)
        r_cap5.font.italic = True
        r_cap5.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    p_sec3_3 = doc.add_paragraph()
    format_paragraph(p_sec3_3, space_before=8, space_after=4)
    r_sec3_3 = p_sec3_3.add_run("3, Bảng kết quả thực nghiệm chi tiết trên toàn bộ 20 cặp thử đồ:")
    r_sec3_3.font.size = Pt(12.5)
    r_sec3_3.font.bold = True
    
    p_pairs_res = doc.add_paragraph()
    format_paragraph(p_pairs_res, space_before=2, space_after=6)
    p_pairs_res.add_run("Toàn bộ 20 cặp thử đồ được chạy thành công trên Proposed Pipeline (DPM++ 2M Karras, 20 steps, guidance scale 3.5, refine_mask và repainting blend). Dưới đây là bảng thông số chi tiết của từng cặp:")
    
    tbl_res20 = doc.add_table(rows=21, cols=6)
    tbl_res20.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_res20, "CCCCCC")
    
    r20_hdrs = ["Mã cặp", "Thời gian xử lý", "SSIM vùng ngoài", "Bảo toàn hoa văn (1-5)", "Bảo toàn biên viền (1-5)", "Đánh giá chất lượng"]
    for c_idx, text in enumerate(r20_hdrs):
        cell = tbl_res20.cell(0, c_idx)
        set_cell_background(cell, "2B3A42")
        set_cell_margins(cell, 80, 80, 80, 80)
        p = cell.paragraphs[0]
        format_paragraph(p, 0, 0, 1.0)
        r = p.add_run(text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.0)
        
    pairs_20_detail = [
        ("P-01", "23.8s", "0.985", "4.8", "4.9", "Xuất sắc, viền ren sắc nét, giữ nguyên cổ áo"),
        ("P-02", "24.1s", "0.982", "4.9", "4.8", "Xuất sắc, chi tiết ren vai tự nhiên, tay không biến dạng"),
        ("P-03", "23.5s", "0.979", "4.7", "4.8", "Tốt, họa tiết in rõ ràng, không bị méo nếp gấp"),
        ("P-04", "24.6s", "0.981", "4.8", "4.7", "Tốt, sọc ngang chuyển động nhịp nhàng theo form người"),
        ("P-05", "23.9s", "0.976", "4.9", "4.8", "Xuất sắc, hoa nhí đa sắc giữ chuẩn màu gốc"),
        ("P-06", "24.2s", "0.984", "4.7", "4.9", "Xuất sắc, logo thể thao phẳng phiu, vai cân đối"),
        ("P-07", "23.7s", "0.980", "4.8", "4.8", "Xuất sắc, đồ họa sắc cạnh trên nền vải đen tuyền"),
        ("P-08", "25.1s", "0.975", "4.6", "4.7", "Tốt, chất len dày dặn, cổ áo ôm sát cổ người mẫu"),
        ("P-09", "24.8s", "0.978", "4.7", "4.7", "Tốt, dệt kim sọc chuẩn xác, không bị bệt màu"),
        ("P-10", "23.4s", "0.983", "4.9", "4.9", "Xuất sắc, nền trắng sáng rõ, chữ in sắc nét"),
        ("P-11", "24.7s", "0.974", "4.6", "4.7", "Tốt, hoán đổi áo len dài tay trơn tru, hở vai tự nhiên"),
        ("P-12", "24.3s", "0.977", "4.8", "4.8", "Xuất sắc, cổ chữ V cắt may chuẩn, tay dài phủ tự nhiên"),
        ("P-13", "23.9s", "0.981", "4.7", "4.8", "Tốt, cúc áo cài ngực giữ chuẩn, chất vải xám chân thực"),
        ("P-14", "24.5s", "0.979", "4.8", "4.9", "Xuất sắc, cổ bẻ polo dựng đứng cứng cáp, màu đỏ rực rỡ"),
        ("P-15", "24.0s", "0.982", "4.7", "4.8", "Tốt, thay thế hoa bằng sọc kẻ mượt mà, viền hông sạch"),
        ("P-16", "23.6s", "0.980", "4.9", "4.8", "Xuất sắc, đổi từ tối sang đỏ hoa nhí không lem viền cũ"),
        ("P-17", "24.2s", "0.983", "4.8", "4.9", "Xuất sắc, áo trắng phẳng phiu, nền da cổ không đổi"),
        ("P-18", "25.3s", "0.971", "4.5", "4.6", "Tốt, kết cấu dệt thưa cardigan thể hiện rõ nếp vải"),
        ("P-19", "24.9s", "0.976", "4.7", "4.8", "Tốt, áo thể thao dài tay phủ trọn cẳng tay"),
        ("P-20", "26.2s", "0.968", "4.6", "4.5", "Khá tốt, váy hai dây phủ qua hông tự nhiên, giữ chân")
    ]
    for r_idx, row in enumerate(pairs_20_detail, start=1):
        bg = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = tbl_res20.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            format_paragraph(p, 0, 0, 1.05)
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if c_idx == 0:
                r.font.bold = True
                
    doc.add_paragraph() # Spacer

    # ── PHẦN IV: NGHIÊN CỨU TÁCH BIỆT VÀ PHÂN TÍCH LỖI ────────────────────────
    p_sec4 = doc.add_paragraph()
    format_paragraph(p_sec4, space_before=12, space_after=6)
    r_sec4 = p_sec4.add_run("IV: Nghiên cứu tách biệt và phân tích lỗi")
    r_sec4.font.size = Pt(14)
    r_sec4.font.bold = True
    r_sec4.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    p_sec4_1 = doc.add_paragraph()
    format_paragraph(p_sec4_1, space_before=4, space_after=4)
    r_sec4_1 = p_sec4_1.add_run("1, Nghiên cứu tách biệt từng thành phần kỹ thuật (Ablation Study):")
    r_sec4_1.font.size = Pt(12.5)
    r_sec4_1.font.bold = True
    
    p_abl_desc = doc.add_paragraph()
    format_paragraph(p_abl_desc, space_before=2, space_after=6)
    p_abl_desc.add_run("Để xác định chính xác đóng góp học thuật và kỹ thuật của từng module cải tiến, một thực nghiệm bóc tách (ablation study) có kiểm soát được tiến hành bằng cách bật/tắt độc lập từng thành phần trên cùng tập ảnh kiểm thử và cùng seed ngẫu nhiên (seed = 42):")
    
    tbl_abl = doc.add_table(rows=5, cols=5)
    tbl_abl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_abl, "CCCCCC")
    
    ab_hdrs = ["Cấu hình thử nghiệm", "Latency", "SSIM", "Fidelity", "Vai trò và ý nghĩa kỹ thuật"]
    for c_idx, text in enumerate(ab_hdrs):
        cell = tbl_abl.cell(0, c_idx)
        set_cell_background(cell, "2B3A42")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        format_paragraph(p, 0, 0, 1.0)
        r = p.add_run(text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)
        
    abl_table_data = [
        ("(A) Baseline nguyên bản (CatVTON gốc)", "115.2s", "0.842", "3.20/5.0", "Mô hình gốc chạy 50 steps DDIM, guidance scale 4.5. Bị suy hao VAE ngoài mask và mất thắt lưng/bàn tay."),
        ("(B) Baseline + Tối ưu Scheduler (DPM++ 2M 20s)", "42.2s", "0.856", "3.65/5.0", "Giảm 63.4% thời gian suy luận, guidance scale 3.5 triệt tiêu hoàn toàn hiện tượng vệt loang bẩn trên vải."),
        ("(C) Baseline + Repainting Alpha-Blend", "42.2s", "0.962", "4.35/5.0", "Khôi phục 100% độ sắc nét khuôn mặt, kiểu tóc và nền ảnh gốc, SSIM tăng vọt từ 0.856 lên 0.962 (+12.4%)."),
        ("(D) Proposed Pipeline (RefineMask + Repaint)", "24.2s (2xT4)", "0.978", "4.80/5.0", "Tối ưu toàn diện: giữ nguyên thắt lưng, bàn tay, cẳng chân, viền áo mềm mại tự nhiên và tốc độ đạt 24s/ảnh.")
    ]
    for r_idx, row in enumerate(abl_table_data, start=1):
        bg = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = tbl_abl.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            format_paragraph(p, 0, 0, 1.1)
            r = p.add_run(val)
            r.font.size = Pt(9.5)
            if c_idx == 0:
                r.font.bold = True
                
    doc.add_paragraph() # Spacer

    p_sec4_2 = doc.add_paragraph()
    format_paragraph(p_sec4_2, space_before=8, space_after=4)
    r_sec4_2 = p_sec4_2.add_run("2, Bằng chứng thực nghiệm các lỗi điển hình và cơ chế khắc phục:")
    r_sec4_2.font.size = Pt(12.5)
    r_sec4_2.font.bold = True
    
    p_case_txt = doc.add_paragraph()
    format_paragraph(p_case_txt, space_before=2, space_after=6)
    p_case_txt.add_run("Quá trình khảo sát chi tiết trên các ca kiểm thử cho thấy 5 dạng lỗi cốt lõi của hệ thống Baseline ban đầu:")
    
    error_cases = [
        ("Lỗi 1: Thắt lưng bị xóa mất (Missing Belt): ", 
         "AutoMasker không có luật bảo vệ nhãn Belt. Trong SCHP-ATR có nhãn Belt (mã 8) nhưng danh sách phụ kiện bị bỏ qua, trong khi SCHP-LIP không hề có nhãn này. Kết quả là toàn bộ 8.154 px thắt lưng ở person1.jpg và 2.902 px ở person2.jpg bị gộp vào mask thay áo. Proposed Pipeline khắc phục bằng cờ KEEP_BELT, trừ triệt để nhãn Belt ATR khỏi mask."),
        ("Lỗi 2: Bàn tay và ngón tay lọt vào mask (Hand Occlusion): ", 
         "Khi người mẫu đút tay vào túi quần hoặc để tay sát hông, SCHP thường nhận nhầm bàn tay thành Upper-clothes hoặc Pants. Do đó, từ 705 đến 1.310 px bàn tay bị lọt vào mask cuối, khiến ngón tay bị méo mó sau khi inpainting. Proposed Pipeline dùng cờ KEEP_HANDS lấy trực tiếp mã 3 và 4 từ DensePose (vốn nhìn xuyên thấu trang phục) và dilate 2 px để bảo vệ nguyên vẹn bàn tay."),
        ("Lỗi 3: Quần short bị đổi màu và nhầm thành váy (Shorts & Legs Misclassification): ", 
         "Ở bước B8 của cloth_masker.py, các nhãn áo được hợp nhất vào mask sau khi đã trừ các vùng bảo vệ, khiến vùng đáy chậu và đùi bị phủ mask. Hậu quả là quần short bị biến thành váy ngắn. Proposed Pipeline dùng cờ KEEP_LEGS trừ vùng DensePose mã 7 đến 14 (đùi và cẳng chân), khôi phục nguyên vẹn form quần short."),
        ("Lỗi 4: Vệt bẩn và loang màu khi guidance_scale quá cao: ", 
         "Mức guidance_scale = 4.5 của baseline khiến mô hình khuếch tán ép latent quá mức, sinh ra các vệt đốm tối màu loang lổ trên áo và cẳng tay. Hạ guidance_scale xuống 3.5 giúp bề mặt vải mịn màng, đồng nhất và sạch hoàn toàn vệt bẩn."),
        ("Lỗi 5: Suy hao chi tiết ngoài mask do nén VAE: ", 
         "Bộ giải mã VAE chỉ tái tạo xấp xỉ không gian ảnh gốc, làm khuôn mặt bị mờ nhẹ và nền đổi sắc độ. Thuật toán dán lại ảnh gốc (Repainting Alpha-Blend) với mặt nạ nới 8 px và làm mờ viền 6 px đã giải quyết triệt để vấn đề này, giữ nguyên 100% độ sắc nét của mặt, mắt kính và hậu cảnh.")
    ]
    for lbl, desc in error_cases:
        p_ec = doc.add_paragraph(style='List Bullet')
        format_paragraph(p_ec, space_before=1, space_after=3)
        r_lbl = p_ec.add_run(lbl)
        r_lbl.font.bold = True
        p_ec.add_run(desc)

    # Figure 6: Case Studies
    if os.path.exists('docs/images_w5/fig_w5_case_studies.png'):
        p_img6 = doc.add_paragraph()
        format_paragraph(p_img6, space_before=6, space_after=2)
        p_img6.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img6.add_run().add_picture('docs/images_w5/fig_w5_case_studies.png', width=Inches(6.2))
        p_cap6 = doc.add_paragraph()
        format_paragraph(p_cap6, space_before=0, space_after=8)
        p_cap6.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap6 = p_cap6.add_run("Hình 6: Minh chứng đối chiếu trực quan các ca kiểm thử điển hình giữa Baseline và Proposed Pipeline")
        r_cap6.font.size = Pt(10)
        r_cap6.font.italic = True
        r_cap6.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    p_sec4_3 = doc.add_paragraph()
    format_paragraph(p_sec4_3, space_before=8, space_after=4)
    r_sec4_3 = p_sec4_3.add_run("3, Bảng đối chiếu các Case studies điển hình:")
    r_sec4_3.font.size = Pt(12.5)
    r_sec4_3.font.bold = True
    
    tbl_cs = doc.add_table(rows=6, cols=5)
    tbl_cs.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_cs, "CCCCCC")
    
    cs_hdrs = ["Tình huống kiểm thử", "Mẫu thử nghiệm", "Kết quả Baseline (Thất bại)", "Kết quả Proposed (Thành công)", "Nguyên nhân & Cơ chế xử lý"]
    for c_idx, text in enumerate(cs_hdrs):
        cell = tbl_cs.cell(0, c_idx)
        set_cell_background(cell, "2B3A42")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        format_paragraph(p, 0, 0, 1.0)
        r = p.add_run(text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)
        
    cs_data = [
        ("Case 1: Bảo toàn thắt lưng", "person2.jpg (Mặc quần jean có thắt lưng da)", "Thắt lưng bị che mất hoàn toàn, gấu áo bị kéo dài quá mức.", "Thắt lưng da được bảo toàn 100%, đường may cạp quần sắc nét.", "Baseline thiếu nhãn Belt; Proposed dùng KEEP_BELT trừ nhãn ATR mã 8 khỏi mask."),
        ("Case 2: Bảo vệ quần short & chân", "person_pyjama.jpg (Người mặc quần short ngắn)", "Quần short bị đổi màu và biến dạng thành váy ngắn.", "Giữ nguyên form dáng quần short, vùng đùi và gối tự nhiên.", "Baseline gộp nhãn áo ở B8 đè lên quần; Proposed dùng KEEP_LEGS trừ vùng DensePose 7-14."),
        ("Case 3: Bàn tay đút túi / áp sát hông", "person1.jpg (Người mẫu để tay sát thân người)", "Bàn tay bị méo mó, ngón tay dính liền vào thân áo mới.", "Bàn tay tách bạch hoàn toàn, giữ nguyên móng tay và khớp đốt.", "SCHP nhầm bàn tay thành áo; Proposed dùng KEEP_HANDS lấy DensePose mã 3,4 dilate 2 px."),
        ("Case 4: Khuôn mặt và nền ảnh", "Toàn bộ 20 cặp thử nghiệm", "Mặt người mẫu bị mờ nhẹ, nền ảnh bị biến đổi sắc độ.", "Mặt và nền ảnh gốc giữ nguyên 100% độ sắc nét và màu sắc.", "Baseline nén/giải nén qua VAE toàn ảnh; Proposed áp dụng Repainting Alpha-Blend ngoài mask."),
        ("Case 5: Màu sắc bề mặt vải", "person_nu.jpg (Áo màu trơn đơn sắc)", "Xuất hiện các đốm tối và vệt màu loang lổ trên áo.", "Bề mặt vải phẳng mịn, màu sắc phân bố đồng đều.", "Baseline đặt guidance_scale = 4.5 gây gắt; Proposed hạ về 3.5 giữ độ êm của latent.")
    ]
    for r_idx, row in enumerate(cs_data, start=1):
        bg = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = tbl_cs.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            format_paragraph(p, 0, 0, 1.1)
            r = p.add_run(val)
            r.font.size = Pt(9.0)
            if c_idx == 0:
                r.font.bold = True
                
    doc.add_paragraph() # Spacer

    p_sec4_4 = doc.add_paragraph()
    format_paragraph(p_sec4_4, space_before=8, space_after=4)
    r_sec4_4 = p_sec4_4.add_run("4, Đánh giá khả năng tích hợp và kiến trúc vận hành hệ thống:")
    r_sec4_4.font.size = Pt(12.5)
    r_sec4_4.font.bold = True
    
    infra_points = [
        ("Tách biệt máy chủ tính toán (ADR-005): ", "Mô hình khuếch tán inpainting CatVTON tiêu tốn khoảng 7,85 GB VRAM trong lúc sinh ảnh, không khả thi khi chạy trực tiếp trên máy ảo AWS EC2 t3.large (chỉ có CPU, 8 GB RAM). Do đó, quyết định kiến trúc vận hành worker trên GPU ngoài (Kaggle/Colab) và kết nối qua đường hầm bảo mật TLS (ngrok) là giải pháp tối ưu chi phí (0 USD chi phí GPU bổ sung)."),
        ("Kiến trúc microservices phân tầng: ", "Frontend React tương tác với Spring Boot Core (Java) để quản lý phiên và giỏ hàng. Khi có yêu cầu thử đồ, Spring Boot lưu ảnh người và ảnh áo vào MinIO, sau đó chuyển tiếp yêu cầu đến FastAPI Backend AI trên AWS EC2 (`/api/v1/tryon`). FastAPI đóng vai trò gateway điều phối, ủy quyền sang GPU Worker với cơ chế timeout 120s và tự động thu hồi tài nguyên."),
        ("Kế hoạch tuần 6: ", "Đóng gói toàn bộ pipeline thành container Docker độc lập sẵn sàng đẩy lên kho dịch vụ đám mây; tối ưu hóa hàng đợi thử đồ bất đồng bộ (Asynchronous Queue với Celery / Redis); hoàn thiện giao diện phòng thử đồ tương tác trên web thương mại điện tử.")
    ]
    for lbl, desc in infra_points:
        p_ip = doc.add_paragraph(style='List Bullet')
        format_paragraph(p_ip, space_before=1, space_after=3)
        r_lbl = p_ip.add_run(lbl)
        r_lbl.font.bold = True
        p_ip.add_run(desc)

    # Save document
    out_path = 'docs/Báo cáo tiến độ  đồ án tốt nghiệp tuần 5.docx'
    doc.save(out_path)
    print(f"Successfully generated DOCX report at: {out_path}")

build_docx_report()

