from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..office import convert_with_libreoffice
from ..storage import delete_job_dir, new_job_dir
from ..utils import require_extension, save_upload

router = APIRouter()

MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "html": "text/html",
}


async def _run_office_conversion(
    file: UploadFile, accept_exts: tuple[str, ...], target_ext: str, out_filename: str
):
    require_extension(file.filename, accept_exts)
    job_dir = new_job_dir()
    # preserve the uploaded file's real extension so LibreOffice picks the right import filter
    ext = file.filename.rsplit(".", 1)[-1].lower()
    src = job_dir / f"in.{ext}"
    await save_upload(file, src)

    try:
        out_path = convert_with_libreoffice(src, target_ext, job_dir)
    except HTTPException:
        delete_job_dir(job_dir)
        raise

    return FileResponse(
        out_path,
        media_type=MEDIA_TYPES.get(target_ext, "application/octet-stream"),
        filename=out_filename,
        background=BackgroundTask(delete_job_dir, job_dir),
    )


@router.post("/word-to-pdf")
async def word_to_pdf(file: UploadFile = File(...)):
    return await _run_office_conversion(file, ("docx", "doc"), "pdf", "converted.pdf")


@router.post("/excel-to-pdf")
async def excel_to_pdf(file: UploadFile = File(...)):
    return await _run_office_conversion(file, ("xlsx", "xls"), "pdf", "converted.pdf")


@router.post("/powerpoint-to-pdf")
async def powerpoint_to_pdf(file: UploadFile = File(...)):
    return await _run_office_conversion(file, ("pptx", "ppt"), "pdf", "converted.pdf")


@router.post("/pdf-to-html")
async def pdf_to_html(file: UploadFile = File(...)):
    return await _run_office_conversion(file, ("pdf",), "html", "converted.html")
