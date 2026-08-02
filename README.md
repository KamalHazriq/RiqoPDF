# RiqoPDF

A free, privacy-first PDF toolkit — "One place for every PDF task." See
`PROJECT_PROMPT.md` for the full product spec and `ARCHITECTURE.md` for the
system design. This repo currently implements:

- **Phase 1:** Merge (drag to reorder files before combining), Split,
  Compress (3 presets, plus a custom target-size mode that iteratively
  compresses until the file fits), Rotate, Organize (delete pages),
  JPG→PDF, and PDF→JPG.
- **Phase 2:** Word/Excel/PowerPoint→PDF, PDF→Word/Excel/PowerPoint,
  PDF→HTML, PDF→Markdown.
- **Phase 3:** Watermark, Sign PDF, Redact PDF, PDF Forms, and a full
  visual **Edit PDF** (add text, highlights, rectangles, and images by
  clicking/dragging on the page — runs entirely in the browser).
- **Extras:** Protect PDF (AES-256), Unlock PDF, Crop PDF, Page Numbers.
- **OCR PDF:** scanned/image PDF → searchable PDF via Tesseract (English,
  Malay, Chinese, Japanese), run through `ocrmypdf`. CPU-only by design —
  see `SESSION_NOTES.md` for why a GPU OCR model wasn't used instead.

PDF→PowerPoint rebuilds real, editable text boxes and preserves embedded
images at their original positions instead of flattening each page into
one picture per slide.

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
PDF→Markdown) don't need it. OCR PDF requires `tesseract-ocr` (plus the
`eng`/`msa`/`chi-sim`/`jpn` language packs) and `qpdf` on PATH — see
`backend/Dockerfile` for exact package names.

See `SESSION_NOTES.md` for per-session decisions, technical debt, and
next steps.

**Frontend** (Next.js 15):

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The frontend expects the backend at
`NEXT_PUBLIC_API_BASE` (defaults to `http://localhost:8000`).

## Live demo (GitHub Pages)

Pushing to `master` auto-deploys a static build to GitHub Pages via
`.github/workflows/deploy-pages.yml`:

**https://kamalhazriq.github.io/RiqoPDF/**

The site is live. On it there is no backend, so tools marked **“In your
browser”** run entirely on your device via pdf-lib: Merge, Split, Rotate, Organize,
JPG→PDF, Crop, Page Numbers, Edit PDF, and text Watermark. Files never leave
your machine for those tools. Backend-dependent tools (compression, office
conversion, OCR PDF, etc.) show a notice pointing to the Docker setup below —
see `DEPLOY.md` to host the backend too and light up all remaining tools on
the live site.

## Docker Compose

```bash
docker compose up --build
```

Frontend on http://localhost:3000, backend on http://localhost:8000.

## Roadmap

See "Development Roadmap" in `ARCHITECTURE.md` for Phase 4 (AI features —
summarizer, translate, chat-with-PDF — OCR shipped ahead of schedule via
Tesseract), the last non-AI "coming soon" tools (Compare PDF, PDF/A), and
technical debt in `SESSION_NOTES.md`.
