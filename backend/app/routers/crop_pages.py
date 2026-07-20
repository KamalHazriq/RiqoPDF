import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import parse_page_indices, require_pdf, save_upload

router = APIRouter()


@router.post("/crop-pdf")
async def crop_pdf(
    file: UploadFile = File(...),
    top_percent: float = Form(0),
    bottom_percent: float = Form(0),
    left_percent: float = Form(0),
    right_percent: float = Form(0),
    pages: str = Form(""),  # empty = all pages
):
    require_pdf(file.filename)
    for v in (top_percent, bottom_percent, left_percent, right_percent):
        if not 0 <= v < 50:
            raise HTTPException(400, "Each margin must be between 0 and 50 percent")
    if not any((top_percent, bottom_percent, left_percent, right_percent)):
        raise HTTPException(400, "Set at least one margin to crop")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        target = set(parse_page_indices(pages, doc.page_count)) if pages else set(range(doc.page_count))
        for i, page in enumerate(doc):
            if i not in target:
                continue
            r = page.rect
            new_box = fitz.Rect(
                r.x0 + r.width * left_percent / 100,
                r.y0 + r.height * top_percent / 100,
                r.x1 - r.width * right_percent / 100,
                r.y1 - r.height * bottom_percent / 100,
            )
            page.set_cropbox(new_box)
        out_path = job_dir / "cropped.pdf"
        doc.save(out_path)
        doc.close()
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not crop PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="cropped.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
