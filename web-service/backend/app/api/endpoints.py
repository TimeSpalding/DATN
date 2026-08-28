from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import Response
import requests

router = APIRouter()

# Dán cái link Ngrok của bạn vào đây! Đừng quên đuôi /api/tryon
AI_SERVICE_URL = "https://cactaceous-tatum-semiadhesively.ngrok-free.dev/api/tryon"

@router.get("/catalog")
async def get_catalog():
    # TODO: Fetch from DB, currently returning mock data
    return [
        {"id": 1, "name": "Áo Thun Đen", "image_url": "/static/shirt1.jpg"},
        {"id": 2, "name": "Áo Sơ Mi Trắng", "image_url": "/static/shirt2.jpg"}
    ]

@router.post("/tryon")
async def request_tryon(person_image: UploadFile = File(...), cloth_image: UploadFile = File(...)):
    print(f"[Backend] Đã nhận ảnh từ Web: {person_image.filename}, {cloth_image.filename}")
    print("[Backend] Đang gửi sang Kaggle AI Service...")
    
    # 1. Đọc nội dung file ảnh
    person_bytes = await person_image.read()
    cloth_bytes = await cloth_image.read()
    
    # 2. Đóng gói lại thành form-data để gửi sang Kaggle
    files = {
        'person_image': (person_image.filename, person_bytes, person_image.content_type),
        'cloth_image': (cloth_image.filename, cloth_bytes, cloth_image.content_type)
    }
    
    try:
        # Gọi sang API của Kaggle (chờ ~40s)
        response = requests.post(AI_SERVICE_URL, files=files)
        
        if response.status_code == 200:
            print("[Backend] Kaggle đã trả kết quả thành công!")
            # Trả thẳng bức ảnh về cho React dưới dạng nhị phân
            return Response(content=response.content, media_type="image/png")
        else:
            print(f"[Backend] Lỗi từ Kaggle: {response.text}")
            raise HTTPException(status_code=500, detail="Lỗi xử lý AI")
            
    except requests.exceptions.RequestException as e:
        print(f"[Backend] Không gọi được Kaggle: {e}")
        raise HTTPException(status_code=500, detail="Không thể kết nối đến AI Service")
