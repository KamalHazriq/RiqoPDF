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


def compress_with_pymupdf_params(src: str, out: str, dpi_target: int, jpeg_quality: int) -> None:
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


def compress_with_pymupdf(src: str, out: str, level: str) -> None:
    dpi_target, jpeg_quality = LEVELS.get(level, LEVELS["recommended"])
    compress_with_pymupdf_params(src, out, dpi_target, jpeg_quality)


# (dpi, jpeg quality) steps from best-quality to most-aggressive, used to search
# for a "custom size" target. Ghostscript's 3 presets aren't granular enough for
# this, so custom-size mode always uses the PyMuPDF path.
TARGET_SIZE_STEPS = [
    (300, 90), (200, 80), (150, 70), (120, 60),
    (100, 50), (90, 40), (72, 30), (72, 20), (50, 12),
]


def compress_to_target(src: str, out: str, target_bytes: int, job_dir) -> bool:
    """Tries each step from best quality down until the result fits under
    target_bytes; keeps the smallest attempt if none do. Returns whether the
    target was actually met."""
    best_path = None
    best_size = None
    for i, (dpi, quality) in enumerate(TARGET_SIZE_STEPS):
        attempt = job_dir / f"attempt_{i}.pdf"
        compress_with_pymupdf_params(src, str(attempt), dpi, quality)
        size = attempt.stat().st_size
        if best_size is None or size < best_size:
            best_path, best_size = attempt, size
        if size <= target_bytes:
            shutil.copyfile(attempt, out)
            return True
    shutil.copyfile(best_path, out)
    return False


@router.post("/compress-pdf")
async def compress_pdf(
    file: UploadFile = File(...),
    level: str = Form("recommended"),
    target_size_kb: int | None = Form(None),
):
    require_pdf(file.filename)
    if level != "custom" and level not in LEVELS:
        raise HTTPException(400, "level must be one of: extreme, recommended, low, custom")
    if level == "custom" and (not target_size_kb or target_size_kb <= 0):
        raise HTTPException(400, "target_size_kb must be a positive number for custom compression")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    out_path = job_dir / "compressed.pdf"
    await save_upload(file, src)

    target_met: bool | None = None
    try:
        if level == "custom":
            target_met = compress_to_target(str(src), str(out_path), target_size_kb * 1024, job_dir)
        else:
            ok = compress_with_ghostscript(str(src), str(out_path), level)
            if not ok:
                compress_with_pymupdf(str(src), str(out_path), level)
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not compress PDF: {exc}") from exc

    original_size = src.stat().st_size
    compressed_size = out_path.stat().st_size
    reduction_pct = round((1 - compressed_size / original_size) * 100, 1) if original_size else 0

    headers = {
        "X-Original-Size": str(original_size),
        "X-Compressed-Size": str(compressed_size),
        "X-Reduction-Percent": str(reduction_pct),
    }
    expose = "X-Original-Size, X-Compressed-Size, X-Reduction-Percent"
    if target_met is not None:
        headers["X-Target-Met"] = "true" if target_met else "false"
        expose += ", X-Target-Met"
    headers["Access-Control-Expose-Headers"] = expose

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="compressed.pdf",
        headers=headers,
        background=BackgroundTask(delete_job_dir, job_dir),
    )
