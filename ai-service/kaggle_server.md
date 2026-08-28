# Hướng dẫn chạy AI Server trên Kaggle

Bạn hãy mở một Notebook Kaggle mới (hoặc dùng luôn cái cũ), và chạy lần lượt 3 Cell dưới đây. Đây chính là "Đầu dây API" của chúng ta.

## Cell 1: Cài đặt thư viện
```python
import os
os.chdir("/kaggle/working")

if not os.path.isdir("/kaggle/working/CatVTON"):
    !git clone https://github.com/Zheng-Chong/CatVTON.git

%cd /kaggle/working/CatVTON
!grep -vi '^gradio' requirements.txt > requirements_notebook.txt
!pip install -q -r requirements_notebook.txt
!pip install -q huggingface_hub
!pip install -q fvcore iopath yacs pycocotools omegaconf cloudpickle av

# Sửa lỗi GPU
!pip install -q --force-reinstall torch==2.3.1 torchvision==0.18.1 --index-url https://download.pytorch.org/whl/cu121

# Cài thêm các tool làm API
!pip install -q fastapi uvicorn python-multipart pyngrok nest-asyncio

print(">>> Cài xong! Nhớ Restart Kernel nhé!")
```

## Cell 2: Tải Mô hình vào RAM (Chỉ chạy 1 lần)
```python
import os, time, io
import torch
from PIL import Image
from diffusers.image_processor import VaeImageProcessor
from huggingface_hub import snapshot_download

from model.cloth_masker import AutoMasker
from model.pipeline import CatVTONPipeline
from utils import init_weight_dtype, resize_and_crop, resize_and_padding

# Tải model CatVTON
repo_path = snapshot_download(repo_id="zhengchong/CatVTON")

pipeline = CatVTONPipeline(
    base_ckpt="booksforcharlie/stable-diffusion-inpainting",
    attn_ckpt=repo_path,
    attn_ckpt_version="mix",
    weight_dtype=init_weight_dtype("fp16"),
    use_tf32=True,
    device="cuda",
)

mask_processor = VaeImageProcessor(
    vae_scale_factor=8, do_normalize=False, do_binarize=True, do_convert_grayscale=True
)
automasker = AutoMasker(
    densepose_ckpt=os.path.join(repo_path, "DensePose"),
    schp_ckpt=os.path.join(repo_path, "SCHP"),
    device="cuda",
)

print(">>> Trái tim AI đã nổ máy! Sẵn sàng nhận lệnh.")
```

## Cell 3: Bật Server API & Ngrok (Chạy liên tục)
Trước khi chạy, bạn cần lên trang [ngrok.com](https://ngrok.com/), đăng ký 1 tài khoản miễn phí, vào mục **Your Authtoken** để lấy dải mã token bí mật của bạn và dán vào dòng `NGROK_TOKEN` bên dưới nhé.

```python
import nest_asyncio
import uvicorn
from pyngrok import ngrok
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Bật CORS để cho phép Web ở Localhost gọi lên không bị chặn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = "/kaggle/working/outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/api/tryon")
async def tryon_api(person_image: UploadFile = File(...), cloth_image: UploadFile = File(...)):
    print(f"\n[+] Đang nhận đơn hàng: Người ({person_image.filename}) - Áo ({cloth_image.filename})")
    
    # 1. Đọc ảnh từ mạng gửi sang
    person_bytes = await person_image.read()
    cloth_bytes = await cloth_image.read()
    person_img = Image.open(io.BytesIO(person_bytes)).convert("RGB")
    cloth_img = Image.open(io.BytesIO(cloth_bytes)).convert("RGB")
    
    # 2. Xử lý ảnh
    WIDTH, HEIGHT = 768, 1024
    person_img = resize_and_crop(person_img, (WIDTH, HEIGHT))
    cloth_img = resize_and_padding(cloth_img, (WIDTH, HEIGHT))
    
    # 3. Chế tạo mặt nạ
    print("    -> Đang lấy số đo...")
    mask = automasker(person_img, "upper")["mask"]
    mask = mask_processor.blur(mask, blur_factor=9)
    
    # 4. Gọi AI ghép đồ
    print("    -> Đang may áo... (Chờ khoảng 40s)")
    result = pipeline(
        image=person_img,
        condition_image=cloth_img,
        mask=mask,
        num_inference_steps=25, # Đã giảm xuống 25 steps để chạy nhanh gấp đôi
        guidance_scale=2.5,
    )[0]
    
    # 5. Lưu và trả hàng
    out_path = os.path.join(OUTPUT_DIR, f"result_{int(time.time())}.png")
    result.save(out_path)
    print("    -> Hoàn tất! Đang gửi ảnh về cho Web.")
    
    return FileResponse(out_path, media_type="image/png")


# ======== KẾT NỐI NGROK ========
NGROK_TOKEN = "ĐIỀN_TOKEN_NGROK_CỦA_BẠN_VÀO_ĐÂY"
ngrok.set_auth_token(NGROK_TOKEN)

# Đóng các tunnel cũ nếu có
for tunnel in ngrok.get_tunnels():
    ngrok.disconnect(tunnel.public_url)

public_url = ngrok.connect(8000).public_url
print("="*60)
print(f"🚀 API CỦA BẠN ĐÃ SẴN SÀNG TẠI: {public_url}/api/tryon")
print(f"👉 Copy nguyên cái link {public_url} này dán vào Web Local nhé!")
print("="*60)

# Chạy server
nest_asyncio.apply()
uvicorn.run(app, host="0.0.0.0", port=8000)
```
