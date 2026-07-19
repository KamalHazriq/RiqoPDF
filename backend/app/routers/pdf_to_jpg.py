import zipfile

import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()


@router.post("/pdf-to-jpg")
async def pdf_to_jpg(file: UploadFile = File(...), dpi: int = Form(150)):
    require_pdf(file.filename)
    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        zoom = dpi / 72
        matrix = fitz.Matrix(zoom, zoom)
        image_paths = []
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=matrix)
            img_path = job_dir / f"page_{i + 1}.jpg"
            pix.save(str(img_path))
            image_paths.append(img_path)
        doc.close()

        if len(image_paths) == 1:
            out_path, media_type, filename = image_paths[0], "image/jpeg", "page_1.jpg"
        else:
            zip_path = job_dir / "pages.zip"
            with zipfile.ZipFile(zip_path, "w") as zf:
                for p in image_paths:
                    zf.write(p, arcname=p.name)
            out_path, media_type, filename = zip_path, "application/zip", "pages.zip"
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not convert PDF to images: {exc}") from exc

    return FileResponse(
        out_path,
        media_type=media_type,
        filename=filename,
        background=BackgroundTask(delete_job_dir, job_dir),
    )
