import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()


@router.post("/protect-pdf")
async def protect_pdf(file: UploadFile = File(...), password: str = Form(...)):
    require_pdf(file.filename)
    if len(password) < 4:
        raise HTTPException(400, "Password must be at least 4 characters")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        out_path = job_dir / "protected.pdf"
        doc.save(
            out_path,
            encryption=fitz.PDF_ENCRYPT_AES_256,
            owner_pw=password,
            user_pw=password,
        )
        doc.close()
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not protect PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="protected.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )


@router.post("/unlock-pdf")
async def unlock_pdf(file: UploadFile = File(...), password: str = Form(...)):
    require_pdf(file.filename)
    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        if doc.needs_pass and not doc.authenticate(password):
            doc.close()
            delete_job_dir(job_dir)
            raise HTTPException(403, "Incorrect password")
        out_path = job_dir / "unlocked.pdf"
        doc.save(out_path, encryption=fitz.PDF_ENCRYPT_NONE)
        doc.close()
    except HTTPException:
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not unlock PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="unlocked.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
