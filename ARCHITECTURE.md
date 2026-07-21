# RiqoPDF — Architecture

This answers the five questions the project prompt asks for before coding starts
(see `PROJECT_PROMPT.md`), then Phase 1 is implemented on top of it.

## 1. System Architecture

```
                     ┌─────────────────────┐
                     │   Browser (User)     │
                     └──────────┬───────────┘
                                │ HTTPS
                     ┌──────────▼───────────┐
                     │  Next.js 15 Frontend  │
                     │  (App Router, TS,     │
                     │   Tailwind, shadcn)   │
                     └──────────┬───────────┘
                                │ REST (multipart upload / JSON)
                     ┌──────────▼───────────┐
                     │  FastAPI Backend      │
                     │  - /api/tools/*       │
                     │  - PDF processing     │
                     │    (pypdf, PyMuPDF,   │
                     │     Pillow, Ghostscript)
                     └──────────┬───────────┘
                                │
                     ┌──────────▼───────────┐
                     │  Temp storage         │
                     │  /tmp/riqopdf/<job-id>│
                     │  auto-deleted after   │
                     │  processing / TTL     │
                     └───────────────────────┘
```

- The frontend never persists uploaded files itself — it streams them straight
  through to the backend and only ever holds the processed result in memory /
  browser download.
- The backend is a single FastAPI service for Phase 1 (one process, one
  container). Each tool is its own router module under
  `backend/app/routers/`, so later phases (conversion, editing, AI) can be
  split out into separate microservices behind the same `/api` gateway
  without touching the frontend contract.
- Every processing job gets a UUID job folder under a temp directory. Files
  are deleted immediately after the result is streamed back, and a
  background sweeper removes anything older than 10 minutes as a safety net
  (crash / abandoned upload).

## 2. Database Requirement

**None for Phase 1 (per the addendum in `PROJECT_PROMPT.md`).** There are no
user accounts, no saved documents, no history — every request is
stateless: upload → process → download → delete. This keeps privacy
guarantees simple (nothing to leak because nothing is stored) and removes an
entire category of infra (migrations, backups, auth) from the MVP.

A database becomes relevant starting Phase 4 (AI features, "chat with PDF",
usage limits/auth) — at that point a lightweight Postgres for
users/sessions and an object-store-backed job table would be introduced,
not before.

## 3. Folder Structure

```
RiqoPDF/
├── ARCHITECTURE.md
├── PROJECT_PROMPT.md
├── README.md
├── docker-compose.yml
├── frontend/                       # Next.js 15 app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # dashboard / tool marketplace
│   │   └── tools/
│   │       ├── merge-pdf/page.tsx
│   │       ├── split-pdf/page.tsx
│   │       ├── compress-pdf/page.tsx
│   │       ├── rotate-pdf/page.tsx
│   │       ├── organize-pdf/page.tsx   # delete pages
│   │       ├── jpg-to-pdf/page.tsx
│   │       └── pdf-to-jpg/page.tsx
│   ├── components/
│   │   ├── ui/                      # shadcn-style primitives
│   │   ├── tool-card.tsx
│   │   ├── uploader.tsx
│   │   ├── process-flow.tsx         # upload -> options -> processing -> result
│   │   └── pdf-editor.tsx           # visual editor: pdf.js canvas + overlay
│   ├── lib/
│   │   ├── api.ts                   # fetch wrappers to backend
│   │   ├── client-tools.ts          # browser-side tool engines (pdf-lib)
│   │   ├── pdf-editor-types.ts      # Annotation model shared by editor + export
│   │   ├── pdf-editor-export.ts     # bakes annotations into the PDF via pdf-lib
│   │   └── tools-catalog.ts         # single source of truth for all tools/categories
│   └── ...
└── backend/                         # FastAPI service
    ├── app/
    │   ├── main.py
    │   ├── config.py
    │   ├── storage.py               # temp job dirs + TTL sweeper
    │   └── routers/
    │       ├── merge.py
    │       ├── split.py
    │       ├── compress.py
    │       ├── rotate.py
    │       ├── organize.py          # delete pages
    │       ├── jpg_to_pdf.py
    │       ├── pdf_to_jpg.py
    │       ├── convert.py           # office <-> pdf, pdf -> html (LibreOffice)
    │       ├── pdf_to_word.py       # pdf -> docx (PyMuPDF + python-docx)
    │       ├── pdf_to_excel.py      # pdf -> xlsx (PyMuPDF + openpyxl)
    │       ├── pdf_to_powerpoint.py # pdf -> pptx: real per-line text boxes
    │       │                       # + embedded images at original position
    │       │                       # (PyMuPDF text/image extraction + python-pptx),
    │       │                       # not a full-page raster per slide
    │       ├── pdf_to_markdown.py
    │       ├── watermark.py         # text/image watermark, tiled or anchored
    │       ├── redact.py            # true text removal (PyMuPDF redaction annots)
    │       ├── sign.py              # place a signature image on a page
    │       └── forms.py             # fillable text/checkbox widgets
    ├── office.py                    # shared LibreOffice headless helper
    ├── requirements.txt
    └── Dockerfile
```

## 4. Required Dependencies

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
primitives, Framer Motion, pdf-lib (client-side tools + PDF editor export),
pdfjs-dist (PDF editor page rendering — pinned to 4.x; 6.x's worker relies
on a JS engine method not yet reliably available, which silently blanked
the canvas during testing).

**Backend:** FastAPI, uvicorn, pypdf, PyMuPDF (fitz), Pillow,
python-multipart, python-docx, openpyxl, python-pptx. Ghostscript is used
for compression in the containerized deployment (`backend/Dockerfile`);
locally, when the `gs` binary isn't available, compression falls back to a
PyMuPDF-based re-save with image downsampling so the feature still works
without the system dependency. LibreOffice (`libreoffice-writer`,
`-calc`, `-impress`) drives Word/Excel/PowerPoint → PDF and PDF → HTML;
the reverse office conversions (PDF → Word/Excel/PowerPoint) don't use
LibreOffice — its PDF import isn't text-reflow capable in a headless
install — and instead reconstruct the target format directly from
PyMuPDF-extracted text/tables/page-images.

## 5. Development Roadmap

- **Phase 1 (done):** Merge, Split, Compress, JPG→PDF, PDF→JPG,
  Rotate, Delete pages — end-to-end (frontend tool pages + backend routes),
  no database, temp-file-only storage.
- **Phase 2 (done):** Office format conversion — Word/Excel/PowerPoint →
  PDF and PDF → HTML via LibreOffice headless; PDF → Word/Excel/PowerPoint
  and PDF → Markdown via PyMuPDF-based reconstruction (see dependency notes
  above for why these don't share one code path).
- **Phase 3 (done):** Watermark (text/image, tiled or anchored), Sign PDF
  (draw-on-canvas or upload a signature image), Redact PDF (true removal via
  PyMuPDF redaction annotations, not just a black box overlay), PDF Forms
  (text/checkbox widgets placed by percentage coordinates), and **Edit PDF**
  — a real client-side visual editor (pdf.js renders each page to a canvas,
  an absolutely-positioned overlay handles click/drag placement of text,
  rectangles, highlights, and images as percentage-of-page geometry, and
  pdf-lib bakes them into the actual PDF on export). This is the one tool
  that breaks from the rest of the app's numeric/percentage-input pattern
  by design — "editor" means WYSIWYG placement, not a form. Runs entirely
  in the browser like the other client-side tools.
- **Phase 4:** AI features (OCR, summarizer, translate, chat-with-PDF) —
  first phase that plausibly needs a database (auth, usage limits, job
  history) and external LLM/OCR calls.

---

### Anything else worth adding?

- Rate limiting / max upload size per job (abuse protection) before this
  goes anywhere public.
- A simple job-status endpoint (`GET /api/jobs/{id}`) once processing time
  grows beyond a synchronous request (e.g. OCR in Phase 4) — Phase 1 tools
  are fast enough to stay synchronous.
