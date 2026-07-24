import ocrmypdf
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()

# Tesseract language codes, matching the product spec's supported OCR languages.
LANGUAGES = {
    "eng": "English",
    "msa": "Malay",
    "chi_sim": "Chinese",
    "jpn": "Japanese",
}


@router.post("/ocr-pdf")
async def ocr_pdf(file: UploadFile = File(...), language: str = Form("eng")):
    """Runs Tesseract (via ocrmypdf) over a scanned/image PDF and embeds an
    invisible, searchable text layer — CPU-only, no GPU dependency, so it
    stays deployable on Render's free tier."""
    require_pdf(file.filename)
    if language not in LANGUAGES:
        allowed = ", ".join(LANGUAGES)
        raise HTTPException(400, f"language must be one of: {allowed}")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    out_path = job_dir / "searchable.pdf"
    await save_upload(file, src)

    try:
        ocrmypdf.ocr(
            src,
            out_path,
            language=language,
            skip_text=True,
            output_type="pdf",
            progress_bar=False,
        )
    except ocrmypdf.exceptions.PriorOcrFoundError:
        delete_job_dir(job_dir)
        raise HTTPException(400, "This PDF already has a text layer on every page.")
    except ocrmypdf.exceptions.EncryptedPdfError:
        delete_job_dir(job_dir)
        raise HTTPException(400, "This PDF is password-protected. Unlock it first.")
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not OCR this PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="searchable.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
