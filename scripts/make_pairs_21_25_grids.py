import os
from PIL import Image, ImageDraw, ImageFont

def make_grid(pid, p_name, c_name, out_dir="research/vton-profiling-optimization/figures"):
    os.makedirs(out_dir, exist_ok=True)
    p_path = os.path.join("datacard/test_img", p_name)
    c_path = os.path.join("datacard/test_color", c_name)
    r_path = os.path.join("research/vton-profiling-optimization/results/raw_logs", f"{pid}_profiled.png")
    
    if not (os.path.exists(p_path) and os.path.exists(c_path) and os.path.exists(r_path)):
        return None
        
    p_im = Image.open(p_path).convert("RGB").resize((768, 1024))
    c_im = Image.open(c_path).convert("RGB").resize((768, 1024))
    r_im = Image.open(r_path).convert("RGB").resize((768, 1024))
    
    header_h = 80
    canvas = Image.new("RGB", (768 * 3 + 40, 1024 + header_h + 20), (245, 247, 250))
    draw = ImageDraw.Draw(canvas)
    
    # Paste images
    canvas.paste(p_im, (10, header_h + 10))
    canvas.paste(c_im, (768 + 20, header_h + 10))
    canvas.paste(r_im, (768 * 2 + 30, header_h + 10))
    
    # Draw header bar
    draw.rectangle([(0, 0), (canvas.width, header_h)], fill=(27, 54, 93))
    draw.text((30, 25), f"CatVTON Benchmark Pair: {pid} | Person: {p_name} | Garment: {c_name}", fill=(255, 255, 255))
    
    # Sub-labels
    draw.text((20, header_h - 30), "1. Person Image (Original)", fill=(200, 220, 255))
    draw.text((768 + 30, header_h - 30), "2. Target Garment (Input)", fill=(200, 220, 255))
    draw.text((768 * 2 + 40, header_h - 30), f"3. CatVTON Output ({pid})", fill=(200, 220, 255))
    
    out_file = os.path.join(out_dir, f"{pid}_comparison_grid.png")
    canvas.save(out_file, "JPEG", quality=90)
    print(f"Generated grid: {out_file}")
    return out_file

def main():
    pairs = [
        ("P-21", "000395_0.jpg", "000370_1.jpg"),
        ("P-22", "000129_0.jpg", "000347_1.jpg"),
        ("P-23", "000001_0.jpg", "000048_1.jpg"),
        ("P-24", "000109_0.jpg", "000303_1.jpg"),
        ("P-25", "000020_0.jpg", "000274_1.jpg"),
    ]
    for pid, p, c in pairs:
        make_grid(pid, p, c)

if __name__ == "__main__":
    main()

