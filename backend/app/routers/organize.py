from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pypdf import PdfReader, PdfWriter
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import parse_page_indices, require_pdf, save_upload

router = APIRouter()


@router.post("/organize-pdf")
async def organize_pdf(
    file: UploadFile = File(...),
    delete_pages: str = Form(""),  # e.g. '2,4-5'
    order: str = Form(""),  # explicit new page order, e.g. '3,1,2'; overrides delete_pages if set
):
    require_pdf(file.filename)
    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        reader = PdfReader(str(src))
        page_count = len(reader.pages)
        writer = PdfWriter()

        if order:
            new_order = parse_page_indices(order, page_count)
            if len(new_order) != page_count:
                raise HTTPException(400, "order must include every page exactly once")
            for idx in new_order:
                writer.add_page(reader.pages[idx])
        else:
            to_delete = set(parse_page_indices(delete_pages, page_count)) if delete_pages else set()
            if len(to_delete) == page_count:
                raise HTTPException(400, "Cannot delete every page")
            for i, page in enumerate(reader.pages):
                if i not in to_delete:
                    writer.add_page(page)

        out_path = job_dir / "organized.pdf"
        with open(out_path, "wb") as f:
            writer.write(f)
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not organize PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="organized.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
