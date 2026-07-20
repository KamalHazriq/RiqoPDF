import json

import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()


class FieldSpec(BaseModel):
    name: str
    type: str = Field(pattern="^(text|checkbox)$")
    page: int = 1
    x_percent: float = Field(ge=0, le=100)
    y_percent: float = Field(ge=0, le=100)
    width_percent: float = Field(gt=0, le=100, default=25)
    height_percent: float = Field(gt=0, le=100, default=4)


@router.post("/pdf-forms")
async def pdf_forms(file: UploadFile = File(...), fields: str = Form(...)):
    require_pdf(file.filename)
    try:
        field_specs = [FieldSpec(**f) for f in json.loads(fields)]
    except Exception as exc:
        raise HTTPException(400, f"Invalid fields payload: {exc}") from exc
    if not field_specs:
        raise HTTPException(400, "Add at least one field")

    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        for spec in field_specs:
            if not 1 <= spec.page <= doc.page_count:
                raise HTTPException(400, f"Page {spec.page} is out of range (1-{doc.page_count})")
            page = doc[spec.page - 1]
            rect = page.rect
            x0 = rect.x0 + rect.width * (spec.x_percent / 100)
            y0 = rect.y0 + rect.height * (spec.y_percent / 100)
            w = rect.width * (spec.width_percent / 100)
            h = rect.height * (spec.height_percent / 100)

            widget = fitz.Widget()
            widget.field_name = spec.name
            widget.rect = fitz.Rect(x0, y0, x0 + w, y0 + h)
            if spec.type == "checkbox":
                widget.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
            else:
                widget.field_type = fitz.PDF_WIDGET_TYPE_TEXT
                widget.text_fontsize = 11
            page.add_widget(widget)

        out_path = job_dir / "form.pdf"
        doc.save(out_path)
        doc.close()
    except HTTPException:
        delete_job_dir(job_dir)
        raise
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not add form fields: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="application/pdf",
        filename="form.pdf",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
