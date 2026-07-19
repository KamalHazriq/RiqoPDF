from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pypdf import PdfReader, PdfWriter
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import parse_page_indices, require_pdf, save_upload

router = APIRouter()


@router.post("/rotate-pdf")
async def rotate_pdf(
    file: UploadFile = File(...),
    degrees: int = Form(90),
    pages: str = Form(""),  # empty = all pages, e.g. '1,3,5-7' = selected pages
):
    require_pdf(file.filename)
    if degrees % 90 != 0:
        raise HTTPException(400, "degrees must be a multiple of 90")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        reader = PdfReader(str(src))
        page_count = len(reader.pages)
        target_indices = set(parse_page_indices(pages, page_count)) if pages else set(range(page_count))

        writer = PdfWriter()
        for i, page in enumerate(reader.pages):
            if i in target_indices:
                page.rotate(degrees)
            writer.add_page(page)

        out_path = job_dir / "rotated.pdf"
        with open(out_path, "wb") as f:
            writer.write(f)
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not rotate PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="rotated.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
