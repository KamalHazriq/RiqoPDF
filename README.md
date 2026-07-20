# RiqoPDF

A free, privacy-first PDF toolkit — "One place for every PDF task." See
`PROJECT_PROMPT.md` for the full product spec and `ARCHITECTURE.md` for the
system design. This repo currently implements:

- **Phase 1:** Merge, Split, Compress, Rotate, Organize (delete pages),
  JPG→PDF, and PDF→JPG.
- **Phase 2:** Word/Excel/PowerPoint→PDF, PDF→Word/Excel/PowerPoint,
  PDF→HTML, PDF→Markdown.

No database, no accounts — every request is upload → process → download,
with uploaded files deleted immediately after processing (and swept after
10 minutes as a safety net either way).

## Local development

**Backend** (FastAPI):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Compression uses Ghostscript when available on the system (`gs` on PATH);
otherwise it falls back to a PyMuPDF-based re-save with image downsampling.
Word/Excel/PowerPoint→PDF and PDF→HTML require LibreOffice
(`libreoffice-writer`, `libreoffice-calc`, `libreoffice-impress`) on PATH
as `soffice`; the reverse conversions (PDF→Word/Excel/PowerPoint,
PDF→Markdown) don't need it.

**Frontend** (Next.js 15):

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The frontend expects the backend at
`NEXT_PUBLIC_API_BASE` (defaults to `http://localhost:8000`).

## Docker Compose

```bash
docker compose up --build
```

Frontend on http://localhost:3000, backend on http://localhost:8000.

## Roadmap

See "Development Roadmap" in `ARCHITECTURE.md` for Phases 2–4 (office
conversion, editing tools, AI features).
