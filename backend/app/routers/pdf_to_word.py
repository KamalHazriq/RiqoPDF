import fitz  # PyMuPDF
from docx import Document
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()


@router.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    """Reflows extracted PDF text into an editable .docx (one paragraph per line, page breaks preserved)."""
    require_pdf(file.filename)
    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        docx_doc = Document()
        for i, page in enumerate(doc):
            for line in page.get_text().splitlines():
                if line.strip():
                    docx_doc.add_paragraph(line)
            if i < doc.page_count - 1:
                docx_doc.add_page_break()
        doc.close()

        out_path = job_dir / "converted.docx"
        docx_doc.save(out_path)
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not convert PDF to Word: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="converted.docx",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
