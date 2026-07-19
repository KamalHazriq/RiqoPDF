import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import compress, jpg_to_pdf, merge, organize, pdf_to_jpg, rotate, split
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


@app.get("/api/health")
def health():
    return {"status": "ok"}
