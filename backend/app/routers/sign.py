import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()

MARGIN = 36


@router.post("/sign-pdf")
async def sign_pdf(
    file: UploadFile = File(...),
    signature: UploadFile = File(...),
    page_number: int = Form(1),
    position: str = Form("bottom-right"),
    width_percent: float = Form(25),
):
    require_pdf(file.filename)
    if not 0 < width_percent <= 100:
        raise HTTPException(400, "width_percent must be between 0 and 100")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    sig_path = job_dir / "signature"
    await save_upload(file, src)
    await save_upload(signature, sig_path)

    try:
        doc = fitz.open(str(src))
        if not 1 <= page_number <= doc.page_count:
            raise HTTPException(400, f"page_number must be between 1 and {doc.page_count}")
        page = doc[page_number - 1]

        img = fitz.Pixmap(str(sig_path))
        aspect = img.height / img.width if img.width else 0.4
        rect = page.rect
        sig_w = rect.width * (width_percent / 100)
        sig_h = sig_w * aspect

        positions = {
            "bottom-right": (rect.x1 - sig_w - MARGIN, rect.y1 - sig_h - MARGIN),
            "bottom-left": (rect.x0 + MARGIN, rect.y1 - sig_h - MARGIN),
            "top-right": (rect.x1 - sig_w - MARGIN, rect.y0 + MARGIN),
            "top-left": (rect.x0 + MARGIN, rect.y0 + MARGIN),
            "center": ((rect.x1 - sig_w) / 2, (rect.y1 - sig_h) / 2),
        }
        x, y = positions.get(position, positions["bottom-right"])
        box = fitz.Rect(x, y, x + sig_w, y + sig_h)
        page.insert_image(box, filename=str(sig_path), keep_proportion=True, overlay=True)

        out_path = job_dir / "signed.pdf"
        doc.save(out_path)
        doc.close()
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not sign PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="signed.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
