import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import parse_page_indices, require_pdf, save_upload

router = APIRouter()


@router.post("/redact-pdf")
async def redact_pdf(
    file: UploadFile = File(...),
    search_text: str = Form(...),
    pages: str = Form(""),  # empty = search every page
):
    require_pdf(file.filename)
    if not search_text.strip():
        raise HTTPException(400, "Provide the text to redact")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        page_count = doc.page_count
        target_indices = set(parse_page_indices(pages, page_count)) if pages else set(range(page_count))

        match_count = 0
        for i, page in enumerate(doc):
            if i not in target_indices:
                continue
            hits = page.search_for(search_text)
            for rect in hits:
                page.add_redact_annot(rect, fill=(0, 0, 0))
            match_count += len(hits)
            if hits:
                page.apply_redactions()

        if match_count == 0:
            delete_job_dir(job_dir)
            raise HTTPException(404, f'No matches found for "{search_text}"')

        out_path = job_dir / "redacted.pdf"
        doc.save(out_path)
        doc.close()
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not redact PDF: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="redacted.pdf",
        headers={
            "X-Redaction-Count": str(match_count),
            "Access-Control-Expose-Headers": "X-Redaction-Count",
        },
        background=BackgroundTask(delete_job_dir, job_dir),
    )
