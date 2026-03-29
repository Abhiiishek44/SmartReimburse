"""
OCR Route — POST /ocr
Accepts a receipt image and returns structured expense data.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.dependencies import get_current_user
from app.models import User
from app.services import ocr_service

router = APIRouter(tags=["ocr"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/ocr")
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a receipt image (JPG/PNG) and get back extracted expense fields.

    Returns:
        {
            "amount": float | null,
            "date": "YYYY-MM-DD" | null,
            "vendor": str | null,
            "description": str,
            "category": str
        }
    """
    # ── Validate file type ────────────────────────────────────────────────────
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are supported for OCR scanning."
        )

    # ── Validate file size ────────────────────────────────────────────────────
    image_bytes = await file.read()
    if len(image_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File size must be 5 MB or less."
        )
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── Run OCR ───────────────────────────────────────────────────────────────
    try:
        result = ocr_service.parse_receipt(image_bytes, file.content_type)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(e)}"
        )

    # ── Guard: nothing extracted ──────────────────────────────────────────────
    if not result.get("raw_text"):
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the image. Try a clearer photo."
        )

    # Return without raw_text (internal detail)
    return {
        "amount":      result["amount"],
        "date":        result["date"],
        "vendor":      result["vendor"],
        "description": result["description"],
        "category":    result["category"],
    }
