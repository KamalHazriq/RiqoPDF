import fitz  # PyMuPDF
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pptx import Presentation
from pptx.util import Emu
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()

EMU_PER_POINT = 12700  # 1 pt = 1/72 inch = 12700 EMU


@router.post("/pdf-to-powerpoint")
async def pdf_to_powerpoint(file: UploadFile = File(...)):
    """Renders each PDF page as a full-slide image — preserves layout exactly, not editable text."""
    require_pdf(file.filename)
    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        prs = Presentation()
        blank_layout = prs.slide_layouts[6]

        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_path = job_dir / f"page_{i}.png"
            pix.save(str(img_path))

            width_emu = Emu(int(page.rect.width * EMU_PER_POINT))
            height_emu = Emu(int(page.rect.height * EMU_PER_POINT))
            if i == 0:
                prs.slide_width = width_emu
                prs.slide_height = height_emu

            slide = prs.slides.add_slide(blank_layout)
            slide.shapes.add_picture(str(img_path), 0, 0, width=prs.slide_width, height=prs.slide_height)
        doc.close()

        out_path = job_dir / "converted.pptx"
        prs.save(out_path)
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not convert PDF to PowerPoint: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename="converted.pptx",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
