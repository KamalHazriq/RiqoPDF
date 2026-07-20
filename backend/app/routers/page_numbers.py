import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()

MARGIN = 28


@router.post("/page-numbers")
async def page_numbers(
    file: UploadFile = File(...),
    position: str = Form("bottom-center"),  # bottom-left|bottom-center|bottom-right|top-left|top-center|top-right
    start_at: int = Form(1),
    template: str = Form("{n}"),  # e.g. "{n}", "Page {n}", "{n} / {total}"
    font_size: int = Form(11),
):
    require_pdf(file.filename)
    if not 6 <= font_size <= 36:
        raise HTTPException(400, "font_size must be between 6 and 36")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        total = doc.page_count
        vert, _, horiz = position.partition("-")
        align = {"left": 0, "center": 1, "right": 2}.get(horiz, 1)

        for i, page in enumerate(doc):
            label = template.replace("{n}", str(start_at + i)).replace("{total}", str(total))
            r = page.rect
            box_h = font_size + 8
            y0 = r.y0 + MARGIN if vert == "top" else r.y1 - MARGIN - box_h
            box = fitz.Rect(r.x0 + MARGIN, y0, r.x1 - MARGIN, y0 + box_h)
            page.insert_textbox(box, label, fontsize=font_size, color=(0.2, 0.2, 0.2), align=align)

        out_path = job_dir / "numbered.pdf"
        doc.save(out_path)
        doc.close()
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not add page numbers: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="numbered.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
