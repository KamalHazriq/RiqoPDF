from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pypdf import PdfWriter
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()


@router.post("/merge-pdf")
async def merge_pdf(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(400, "Upload at least 2 PDF files to merge")
    for f in files:
        require_pdf(f.filename)

    job_dir = new_job_dir()
    writer = PdfWriter()
    try:
        for i, upload in enumerate(files):
            src = job_dir / f"in_{i}.pdf"
            await save_upload(upload, src)
            writer.append(str(src))

        out_path = job_dir / "merged.pdf"
        with open(out_path, "wb") as f:
            writer.write(f)
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not merge PDFs: {exc}") from exc
    finally:
        writer.close()

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="merged.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
