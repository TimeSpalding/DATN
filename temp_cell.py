#3
import nest_asyncio
import uvicorn
from pyngrok import ngrok
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OUTPUT_DIR = "/kaggle/working/outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/api/tryon")
async def tryon_api(person_image: UploadFile = File(...), cloth_image: UploadFile = File(...), category: str = Form("upper")):
    person_bytes = await person_image.read()
    cloth_bytes = await cloth_image.read()
    person_img = Image.open(io.BytesIO(person_bytes)).convert("RGB")
    cloth_img = Image.open(io.BytesIO(cloth_bytes)).convert("RGB")
    
    WIDTH, HEIGHT = 768, 1024
    person_img = resize_and_padding(person_img, (WIDTH, HEIGHT))
    cloth_img = resize_and_padding(cloth_img, (WIDTH, HEIGHT))
    
    mask = automasker(person_img, category)["mask"]
    mask = mask_processor.blur(mask, blur_factor=4)
    
    result = pipeline(image=person_img, condition_image=cloth_img, mask=mask, num_inference_steps=30, guidance_scale=3.5)[0]
    out_path = os.path.join(OUTPUT_DIR, f"result_{int(time.time())}.png")
    result.save(out_path)
    return FileResponse(out_path, media_type="image/png")

# ĐIỀN STATIC DOMAIN VÀ TOKEN NGROK CỦA BẠN VÀO ĐÂY
ngrok.set_auth_token("3B91485xasWPb3CYuMwP0qb76S7_7vgxKozCzYTYdnDCtaCFY")
public_url = ngrok.connect(8000, domain="cactaceous-tatum-semiadhesively.ngrok-free.dev").public_url
print(f"API SẴN SÀNG TẠI: {public_url}/api/tryon")

config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info")
server = uvicorn.Server(config)
await server.serve()