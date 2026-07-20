import fitz  # PyMuPDF
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()


@router.post("/repair-pdf")
async def repair_pdf(file: UploadFile = File(...)):
    """Rebuilds the PDF structure (xref, streams) via MuPDF's lenient parser,
    recovering whatever pages remain readable in a damaged file."""
    require_pdf(file.filename)
    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        if doc.page_count == 0:
            raise HTTPException(400, "No readable pages could be recovered")
        out_path = job_dir / "repaired.pdf"
        doc.save(out_path, garbage=4, deflate=True, clean=True)
        recovered = doc.page_count
        doc.close()
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not repair PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="repaired.pdf",
        headers={
            "X-Recovered-Pages": str(recovered),
            "Access-Control-Expose-Headers": "X-Recovered-Pages",
        },
        background=BackgroundTask(delete_job_dir, job_dir),
    )
