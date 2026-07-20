import fitz  # PyMuPDF
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from ..storage import delete_job_dir, new_job_dir
from ..utils import require_pdf, save_upload

router = APIRouter()


def _page_to_markdown(page: fitz.Page) -> str:
    blocks = page.get_text("dict")["blocks"]
    lines: list[str] = []
    body_size = _median_font_size(blocks)

    for block in blocks:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text:
                continue
            max_size = max((span["size"] for span in line["spans"]), default=body_size)
            if max_size >= body_size + 4:
                lines.append(f"## {text}")
            elif max_size >= body_size + 2:
                lines.append(f"### {text}")
            else:
                lines.append(text)
    return "\n\n".join(lines)


def _median_font_size(blocks: list) -> float:
    sizes = [
        span["size"]
        for block in blocks
        if block.get("type") == 0
        for line in block.get("lines", [])
        for span in line["spans"]
    ]
    if not sizes:
        return 10.0
    sizes.sort()
    return sizes[len(sizes) // 2]


@router.post("/pdf-to-markdown")
async def pdf_to_markdown(file: UploadFile = File(...)):
    require_pdf(file.filename)
    job_dir = new_job_dir()
    src = job_dir / "in.pdf"
    await save_upload(file, src)

    try:
        doc = fitz.open(str(src))
        pages_md = [_page_to_markdown(page) for page in doc]
        doc.close()
        markdown = "\n\n---\n\n".join(p for p in pages_md if p)
        out_path = job_dir / "converted.md"
        out_path.write_text(markdown, encoding="utf-8")
    except Exception as exc:
        delete_job_dir(job_dir)
        raise HTTPException(400, f"Could not convert PDF to Markdown: {exc}") from exc

    return FileResponse(
        out_path,
        media_type="text/markdown",
        filename="converted.md",
        background=BackgroundTask(delete_job_dir, job_dir),
    )
