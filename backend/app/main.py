import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    compress,
    crop_pages,
    convert,
    forms,
    jpg_to_pdf,
    merge,
    organize,
    page_numbers,
    pdf_to_excel,
    pdf_to_jpg,
    pdf_to_markdown,
    pdf_to_powerpoint,
    pdf_to_word,
    protect,
    redact,
    rotate,
    sign,
    split,
    watermark,
)
from .storage import sweeper_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(sweeper_loop())
    yield
    task.cancel()


app = FastAPI(title="RiqoPDF API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(merge.router, prefix="/api/tools", tags=["merge"])
app.include_router(split.router, prefix="/api/tools", tags=["split"])
app.include_router(compress.router, prefix="/api/tools", tags=["compress"])
app.include_router(rotate.router, prefix="/api/tools", tags=["rotate"])
app.include_router(organize.router, prefix="/api/tools", tags=["organize"])
app.include_router(jpg_to_pdf.router, prefix="/api/tools", tags=["jpg-to-pdf"])
app.include_router(pdf_to_jpg.router, prefix="/api/tools", tags=["pdf-to-jpg"])
app.include_router(convert.router, prefix="/api/tools", tags=["convert"])
app.include_router(pdf_to_markdown.router, prefix="/api/tools", tags=["pdf-to-markdown"])
app.include_router(pdf_to_word.router, prefix="/api/tools", tags=["pdf-to-word"])
app.include_router(pdf_to_excel.router, prefix="/api/tools", tags=["pdf-to-excel"])
app.include_router(pdf_to_powerpoint.router, prefix="/api/tools", tags=["pdf-to-powerpoint"])
app.include_router(watermark.router, prefix="/api/tools", tags=["watermark"])
app.include_router(redact.router, prefix="/api/tools", tags=["redact"])
app.include_router(sign.router, prefix="/api/tools", tags=["sign"])
app.include_router(forms.router, prefix="/api/tools", tags=["forms"])
app.include_router(protect.router, prefix="/api/tools", tags=["protect"])
app.include_router(crop_pages.router, prefix="/api/tools", tags=["crop"])
app.include_router(page_numbers.router, prefix="/api/tools", tags=["page-numbers"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
