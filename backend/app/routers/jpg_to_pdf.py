from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import save_upload

router = APIRouter()

ALLOWED_EXT = (".jpg", ".jpeg", ".png")


@router.post("/jpg-to-pdf")
async def jpg_to_pdf(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(400, "Upload at least one image")
    for f in files:
        if not f.filename or not f.filename.lower().endswith(ALLOWED_EXT):
            raise HTTPException(400, "Only .jpg, .jpeg, .png files are accepted")

    job_dir = new_job_dir()
    try:
        images = []
        for i, upload in enumerate(files):
            img_path = job_dir / f"in_{i}{upload.filename[upload.filename.rfind('.'):]}"
            await save_upload(upload, img_path)
            img = Image.open(img_path).convert("RGB")
            images.append(img)

        out_path = job_dir / "converted.pdf"
        images[0].save(out_path, save_all=True, append_images=images[1:])
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not convert images to PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="converted.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
