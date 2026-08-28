from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class TryOnRequest(BaseModel):
    person_image_url: str
    garment_image_url: str
    seed: int = 42

@router.post("/tryon")
async def tryon_api(request: TryOnRequest):
    # TODO: Fetch images from URLs
    # TODO: Run CatVTON model
    # TODO: Upload result to MinIO
    return {
        "status": "success",
        "result_image_url": "mock_result_url.jpg",
        "processing_time": 0.0
    }
