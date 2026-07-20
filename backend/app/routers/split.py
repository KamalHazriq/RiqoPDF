import zipfile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pypdf import PdfReader, PdfWriter
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import parse_page_indices, require_pdf, save_upload

router = APIRouter()


@router.post("/split-pdf")
async def split_pdf(
    file: UploadFile = File(...),
    mode: str = Form("every-page"),  # "every-page" | "pages"
    pages: str = Form(""),
):
    require_pdf(file.filename)
    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        reader = PdfReader(str(src))
        page_count = len(reader.pages)

        if mode == "pages":
            if not pages:
                raise HTTPException(400, "Provide a page range, e.g. '1,3,5-7'")
            indices = parse_page_indices(pages, page_count)
            writer = PdfWriter()
            for idx in indices:
                writer.add_page(reader.pages[idx])
            out_path = job_dir / "split.pdf"
            with open(out_path, "wb") as f:
                writer.write(f)
            media_type, filename = "application/pdf", "split.pdf"
        else:
            zip_path = job_dir / "split_pages.zip"
            with zipfile.ZipFile(zip_path, "w") as zf:
                for i in range(page_count):
                    writer = PdfWriter()
                    writer.add_page(reader.pages[i])
                    page_path = job_dir / f"page_{i + 1}.pdf"
                    with open(page_path, "wb") as f:
                        writer.write(f)
                    zf.write(page_path, arcname=f"page_{i + 1}.pdf")
            out_path = zip_path
            media_type, filename = "application/zip", "split_pages.zip"
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not split PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type=media_type,
        filename=filename,
        background=BackgroundTask(delete_job_dir, job_dir),
    )
