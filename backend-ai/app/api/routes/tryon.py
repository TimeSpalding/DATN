import io
import os
import logging
import httpx

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tryon", tags=["Try-On"])

# URL của Kaggle AI Service (qua ngrok), đọc từ env
CATVTON_SERVICE_URL = os.environ.get(
    "CATVTON_SERVICE_URL",
    "https://cactaceous-tatum-semiadhesively.ngrok-free.dev/api/tryon"
)

# Timeout dài vì CatVTON xử lý ~30-60s
CATVTON_TIMEOUT_SECONDS = int(os.environ.get("CATVTON_TIMEOUT_SECONDS", "120"))


@router.post("")
async def try_on(
    person_image: UploadFile = File(..., description="Ảnh người mẫu"),
    cloth_image: UploadFile = File(..., description="Ảnh trang phục"),
    category: str = Form("overall", description="Loại trang phục: upper | lower | overall"),
):
    """
    Nhận ảnh người + ảnh trang phục, forward sang Kaggle CatVTON service,
    trả về ảnh kết quả thử đồ dạng binary PNG.
    """
    if not person_image.content_type or not person_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="person_image phải là file ảnh")
    if not cloth_image.content_type or not cloth_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="cloth_image phải là file ảnh")

    valid_categories = {"upper", "lower", "overall"}
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"category phải là một trong: {valid_categories}")

    logger.info(
        f"[TryOn] Nhận request: person={person_image.filename}, "
        f"cloth={cloth_image.filename}, category={category}"
    )
    logger.info(f"[TryOn] Đang forward sang CatVTON service: {CATVTON_SERVICE_URL}")

    person_bytes = await person_image.read()
    cloth_bytes = await cloth_image.read()

    try:
        async with httpx.AsyncClient(timeout=CATVTON_TIMEOUT_SECONDS) as client:
            response = await client.post(
                CATVTON_SERVICE_URL,
                headers={"ngrok-skip-browser-warning": "69420"},
                files={
                    "person_image": (person_image.filename, person_bytes, person_image.content_type),
                    "cloth_image": (cloth_image.filename, cloth_bytes, cloth_image.content_type),
                },
                data={"category": category},
            )

        if response.status_code != 200:
            logger.error(f"[TryOn] CatVTON service trả lỗi: status={response.status_code}")
            raise HTTPException(
                status_code=502,
                detail=f"CatVTON AI service trả lỗi (HTTP {response.status_code}). "
                       "Kiểm tra Kaggle notebook còn đang chạy không."
            )

        content_type = response.headers.get("content-type", "image/png")
        logger.info(f"[TryOn] CatVTON xử lý thành công, content-type={content_type}")

        # Trả về raw image bytes để Java backend upload lên MinIO
        return Response(content=response.content, media_type="image/png")

    except httpx.TimeoutException:
        logger.error(f"[TryOn] Timeout sau {CATVTON_TIMEOUT_SECONDS}s khi gọi CatVTON")
        raise HTTPException(
            status_code=504,
            detail=f"CatVTON AI service timeout sau {CATVTON_TIMEOUT_SECONDS}s. "
                   "Model đang bận hoặc Kaggle session đã hết."
        )
    except httpx.RequestError as e:
        logger.error(f"[TryOn] Không kết nối được CatVTON: {e}")
        raise HTTPException(
            status_code=503,
            detail="Không thể kết nối đến CatVTON AI service. Kiểm tra ngrok URL còn hoạt động không."
        )
