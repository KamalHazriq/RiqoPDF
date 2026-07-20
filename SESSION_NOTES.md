# Session Notes

Running log of build sessions: decisions made, debt discovered, and what to
pick up next. Newest session first.

---

## Session 1 — 2026-07-20 · From prompt to live site

### What shipped
- Full Phase 1–3 implementation plus extras: **24 working tools** (see
  `README.md` for the list), Next.js 15 frontend + FastAPI backend,
  Docker Compose, `ARCHITECTURE.md`.
- **GitHub Pages deployment, live at
  https://kamalhazriq.github.io/RiqoPDF/** — the frontend static-exports,
  and 8 tools run entirely in the browser via pdf-lib/JSZip (no server,
  files never leave the device). Tool cards carry an "In your browser"
  badge; backend-only tools show a clear notice on the static site.

### Architectural decisions (and why)
1. **No database** (per the prompt's addendum). Every request is
   upload → process → download; job dirs live in temp storage and are
   deleted after the response, with a 10-minute TTL sweeper as backstop.
   Revisit when Phase 4 (AI/auth/limits) starts.
2. **One FastAPI service, one router per tool.** Microservice split
   deferred until a tool actually needs independent scaling; the router
   boundary keeps that door open.
3. **Two conversion code paths.** Office→PDF and PDF→HTML go through
   headless LibreOffice (each call gets its own `UserInstallation`
   profile so concurrent conversions don't collide). PDF→Office does
   *not* — LibreOffice's headless PDF import can't reflow text — so those
   rebuild the target format from PyMuPDF-extracted text/tables/page
   images (python-docx / openpyxl / python-pptx).
4. **Compression is Ghostscript-first with a PyMuPDF fallback**, so the
   feature works even without the system binary installed.
5. **Browser-side engines mirror the backend contract.** Client
   implementations receive the same FormData the backend route would and
   return a `Response` with the same headers, so tool pages needed zero
   changes. Engines return `null` to fall through to the backend (e.g.
   image watermark). This satisfied the prompt's "prefer browser-side
   processing" privacy requirement almost for free.
6. **Numeric/percentage placement instead of a visual canvas** for sign,
   forms, crop, watermark — consistent with page-range specs used
   elsewhere; a drag-and-drop canvas editor is deliberately deferred.
7. **Redaction is true removal** (PyMuPDF redaction annotations), verified
   by re-extracting text — not a cosmetic black box.

### Incidents worth remembering
- **GitHub Actions `startup_failure` on every run** — even `echo ok` and
  GitHub's own Pages pipeline. Root cause was account-level (billing/
  verification), not the workflow; fixed by the owner, after which the
  same workflow deployed cleanly. Diagnostic shortcut for next time: a
  minimal smoke workflow separates "my YAML is bad" from "the account is
  blocked" in one run.
- Sandbox LibreOffice was missing Writer/Calc/Impress components
  (`libreoffice-core` only) — conversions fail with "source file could not
  be loaded" until they're installed. The backend Dockerfile installs them
  explicitly.
- PyMuPDF `insert_textbox`/`insert_image` only accept 90° rotation steps;
  the watermark UI constrains rotation accordingly.

### Technical debt
1. ~~CORS origin hardcoded~~ **Fixed same session**: `CORS_ORIGINS` env var
   (comma-separated) in `backend/app/config.py`, defaults to
   `http://localhost:3000` for local dev.
2. **No rate limiting / abuse protection** on the backend (100 MB upload
   cap exists, nothing else).
3. **No automated test suite.** Everything was verified by curl +
   Playwright during development, but none of it is committed as CI-run
   tests. A pytest suite hitting each router with fixture PDFs would be
   cheap and high-value.
4. **Client/server drift risk**: the 8 browser engines duplicate backend
   logic (page-spec parsing, validation). A shared test fixture set would
   catch divergence.
5. `unlock-pdf` router has a redundant `except HTTPException: raise`
   before the general handler ordering — harmless but worth a tidy.
6. Split "every page" builds the zip in memory client-side; very large
   PDFs could spike memory in the browser.

### Follow-up ideas
- Drag-to-reorder page thumbnails for Merge/Organize (spec asks for it).
- PDF→JPG in the browser via pdf.js (drops another backend dependency).
- Compare PDF (PyMuPDF, no new deps) and PDF/A (Ghostscript) — the last
  two non-AI "coming soon" tiles.
- Phase 4: OCR (Tesseract: eng/msa/chi/jpn per spec), AI summarizer/
  translate/chat — needs an LLM key and is the natural point to introduce
  a database + auth.
- ~~Deploy the backend~~ **Prepped same session, not completed** — see below.

### Backend deploy: prepped, blocked on account access
Everything code-side is ready for a one-click backend deploy
(`DEPLOY.md`, `render.yaml`, `railway.json`, env-configurable CORS,
`$PORT` support in `backend/Dockerfile`, and a `NEXT_PUBLIC_API_BASE`
repo variable already wired into `deploy-pages.yml`). What's *not* done:
actually creating a Render or Railway account and clicking deploy — that
requires the repo owner's credentials, which the agent doesn't have and
can't create. No Render/Railway MCP connector was available in this
session either.

### Tomorrow's first task
**Follow `DEPLOY.md`**: create a Render (or Railway) account, connect the
repo, deploy `riqopdf-backend` (~5 min, mostly LibreOffice install time),
then set the `NEXT_PUBLIC_API_BASE` repository variable (Settings → Secrets
and variables → Actions → Variables) to the resulting URL and re-run the
Pages workflow. Verify with `curl <url>/api/health` and by running Compress
PDF on the live site. This is the single remaining step to make all 24
tools live — everything else is done.
