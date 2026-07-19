import shutil
import subprocess

import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()

# (image DPI target, JPEG quality) per level
LEVELS = {
    "extreme": (72, 40),
    "recommended": (120, 65),
    "low": (200, 85),
}


def compress_with_ghostscript(src: str, out: str, level: str) -> bool:
    if not shutil.which("gs"):
        return False
    setting = {
        "extreme": "/screen",
        "recommended": "/ebook",
        "low": "/printer",
    }.get(level, "/ebook")
    result = subprocess.run(
        [
            "gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={setting}", "-dNOPAUSE", "-dBATCH", "-dQUIET",
            f"-sOutputFile={out}", src,
        ],
        capture_output=True,
    )
    return result.returncode == 0


def compress_with_pymupdf(src: str, out: str, level: str) -> None:
    dpi_target, jpeg_quality = LEVELS.get(level, LEVELS["recommended"])
    doc = fitz.open(src)
    for page in doc:
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            pix = fitz.Pixmap(doc, xref)
            if pix.n - pix.alpha >= 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            scale = min(1.0, dpi_target / 150)
            if scale < 1.0:
                pix = fitz.Pixmap(pix, int(pix.width * scale), int(pix.height * scale), None)
            doc.update_stream(xref, pix.tobytes("jpeg", jpg_quality=jpeg_quality))
            pix = None
    doc.save(out, garbage=4, deflate=True, clean=True)
    doc.close()


@router.post("/compress-pdf")
async def compress_pdf(file: UploadFile = File(...), level: str = Form("recommended")):
    require_pdf(file.filename)
    if level not in LEVELS:
        raise HTTPException(400, "level must be one of: extreme, recommended, low")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    out_path = job_dir / "compressed.pdf"
    await save_upload(file, src)

    try:
        ok = compress_with_ghostscript(str(src), str(out_path), level)
        if not ok:
            compress_with_pymupdf(str(src), str(out_path), level)
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not compress PDF: {exc}") from exc

    original_size = src.stat().st_size
    compressed_size = out_path.stat().st_size
    reduction_pct = round((1 - compressed_size / original_size) * 100, 1) if original_size else 0

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="compressed.pdf",
        headers={
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(compressed_size),
            "X-Reduction-Percent": str(reduction_pct),
            "Access-Control-Expose-Headers": "X-Original-Size, X-Compressed-Size, X-Reduction-Percent",
        },
        background=BackgroundTask(delete_job_dir, job_dir),
    )
