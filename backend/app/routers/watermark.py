import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()

MARGIN = 36  # points


def _anchor_rect(page_rect: fitz.Rect, box_w: float, box_h: float, position: str) -> fitz.Rect:
    x0, y0, x1, y1 = page_rect
    positions = {
        "center": ((x1 - box_w) / 2, (y1 - box_h) / 2),
        "top-left": (x0 + MARGIN, y0 + MARGIN),
        "top-right": (x1 - box_w - MARGIN, y0 + MARGIN),
        "bottom-left": (x0 + MARGIN, y1 - box_h - MARGIN),
        "bottom-right": (x1 - box_w - MARGIN, y1 - box_h - MARGIN),
    }
    x, y = positions.get(position, positions["center"])
    return fitz.Rect(x, y, x + box_w, y + box_h)


@router.post("/watermark")
async def watermark_pdf(
    file: UploadFile = File(...),
    watermark_type: str = Form("text"),  # "text" | "image"
    text: str = Form(""),
    image: UploadFile | None = File(None),
    position: str = Form("center"),
    opacity: float = Form(0.4),
    rotation: int = Form(0),
    tile: bool = Form(False),
):
    require_pdf(file.filename)
    if watermark_type == "text" and not text.strip():
        raise HTTPException(400, "Provide watermark text")
    if watermark_type == "image" and image is None:
        raise HTTPException(400, "Upload a watermark image")
    if not 0 < opacity <= 1:
        raise HTTPException(400, "opacity must be between 0 and 1")
    if rotation % 90 != 0:
        raise HTTPException(400, "rotation must be a multiple of 90")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))

        img_path = None
        if watermark_type == "image" and image is not None:
            img_path = job_dir / "watermark_img"
            await save_upload(image, img_path)

        for page in doc:
            rect = page.rect
            if watermark_type == "text":
                if tile:
                    box_w, box_h = 220, 80
                    for gx in range(0, int(rect.width), int(box_w)):
                        for gy in range(0, int(rect.height), int(box_h)):
                            box = fitz.Rect(gx, gy, gx + box_w, gy + box_h)
                            page.insert_textbox(
                                box, text, fontsize=20, color=(0.5, 0.5, 0.5),
                                rotate=rotation, align=1, fill_opacity=opacity,
                            )
                else:
                    box_w, box_h = min(rect.width - 2 * MARGIN, 320), 80
                    box = _anchor_rect(rect, box_w, box_h, position)
                    page.insert_textbox(
                        box, text, fontsize=28, color=(0.5, 0.5, 0.5),
                        rotate=rotation, align=1, fill_opacity=opacity,
                    )
            else:
                img_w, img_h = rect.width * 0.3, rect.height * 0.3
                box = _anchor_rect(rect, img_w, img_h, position)
                page.insert_image(box, filename=str(img_path), alpha=opacity, rotate=rotation, keep_proportion=True)

        out_path = job_dir / "watermarked.pdf"
        doc.save(out_path)
        doc.close()
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not add watermark: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="watermarked.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
