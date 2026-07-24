# Session Notes

Running log of build sessions: decisions made, debt discovered, and what to
pick up next. Newest session first.

---

## Session 3 — 2026-07-25 · Local clone recovery, design system, OCR PDF

### What shipped
- **Local clone was stuck at the very first commit** (`f1e9d48`, before any
  real work landed) — a fresh `git clone` had apparently never been updated
  against `origin/master`. Fixed with `git fetch --all` + fast-forward;
  `claude/project-prompt-ramwlq` reset to `origin/master` per the working
  convention. No code was lost, just a stale local checkout.
- **Favicon confirmed** (it's the real logo — silver "riqo" wordmark, red
  flag accent, olive/yellow/blue block behind "q"/"o") and the browser tab
  title trimmed to plain "RiqoPDF" (was "RiqoPDF — Every PDF tool you need").
- **Impeccable design tool installed** (`npx impeccable install`) and run
  through its full `init` → `document` flow: `PRODUCT.md` and `DESIGN.md`
  now exist at the repo root, plus `.impeccable/design.json`. Chosen
  direction: "The Friendly Workbench" — warmer/rounder than a strict Linear
  look, soft resting shadow on every card (not just hover), one accent color
  (**Riqo Blue**, `#004cc0`, sampled directly from the logo's "o" ring —
  extracted via a small hand-rolled PNG pixel-sampler since neither Python
  nor Node had an image lib installed) plus the pre-existing local-signal
  green kept **exclusively** for the "In your browser" badge (never mixed
  with the brand accent — see DESIGN.md's "Green Means Local" rule).
  Implemented across `globals.css` tokens, `Button`, `Card`, `ToolCard`,
  `ThemeToggle`, `Uploader`, `ProcessFlow`, and the homepage hero.
- **OCR PDF shipped** (`backend/app/routers/ocr.py`, `frontend/app/tools/ocr-pdf/`)
  using Tesseract via `ocrmypdf`, not a GPU vision-language model — see
  "Decision: OCR model choice" below. Supports the spec's four languages
  (English, Malay, Chinese, Japanese). Catalog entry flipped from
  "coming-soon" to "available".

### Decision: OCR model choice
Considered `lightonai/LightOnOCR-2-1B` (a strong, modern VLM-based OCR
model) but rejected it for this deployment: Render's free tier has **no
GPU**, and a 1B-parameter vision-language model would be unusably slow (or
OOM) on free-tier CPU/RAM. Tesseract (via `ocrmypdf`, which also handles the
"embed an invisible searchable text layer over the original scan" part
correctly, including skip-if-already-has-text and encrypted-PDF detection)
is CPU-only and matches what the original `PROJECT_PROMPT.md` spec asked
for. Revisit LightOnOCR only if the backend ever moves to a GPU-backed host.

### Incidents worth remembering
- **Tailwind v4's shadow-composition CSS treats the bare keyword `none` as
  an invalid item inside its internal `--tw-shadow` chain.** Setting
  `--shadow-resting: none;` in `.dark` silently made the *entire* `box-shadow`
  declaration fail at compute time (CSS drops the whole property when any
  one item in a var-composed list is invalid) — dark mode kept showing the
  light-mode shadow. Fixed by using `0 0 #0000` (a real, invisible,
  zero-value shadow) instead of the keyword. If a custom `--shadow-*` token
  needs a "none" state and gets fed into any Tailwind arbitrary
  `shadow-[var(--x)]` utility, always use `0 0 #0000`, never `none`.
- **This sandbox's Browser-pane preview does not composite/paint frames**
  (screenshots time out with "the Browser pane is not displayed"). Custom
  CSS *property values* (`getComputedStyle(...).getPropertyValue('--x')`)
  read reliably regardless, but *final painted* longhand values (computed
  `box-shadow`, `border-color`) gave inconsistent/contradictory readings
  across repeated identical tests — almost certainly because paint-only
  style recalculation is throttled/skipped for a non-visible tab, not a
  real cross-browser bug. Trust custom-property-level checks and contrast
  math in this environment; don't trust repeated box-shadow/border-color
  snapshots as proof either way. A real screenshot or the user's own eyes
  are the only way to fully close the loop on visual (not token-level) design
  verification here.
- `npm --prefix <path-with-spaces>` fails on Windows when invoked through
  this harness's `preview_start` (`'C:\Program' is not recognized...` even
  though the space was in a *different* part of the path than "Program
  Files" — likely npm.cmd's own install path). Fixed by using the Windows
  8.3 short path (`C:\Users\KAMALH~1\...`, obtainable via
  `(New-Object -ComObject Scripting.FileSystemObject).GetFolder(path).ShortPath`
  in PowerShell) in `.claude/launch.json`'s `runtimeArgs`.
- `preview_start`/`.claude/launch.json` resolve relative to the **fixed
  primary working directory** for the whole Claude Code session, not
  wherever `Bash`/`cd` last pointed. A `launch.json` written inside the
  RiqoPDF repo itself was silently ignored; the entry had to go into the
  primary directory's own `.claude/launch.json` instead (using an absolute
  `--prefix` path to point at RiqoPDF's frontend).
- Frontend `node_modules` had never been installed in this fresh clone
  (`npm run dev` failed with `'next' is not recognized`) — plain `npm install`
  fixed it. `npm audit` reports 3 high-severity vulnerabilities, not yet
  triaged (new tech debt item below).

### Technical debt (new)
9. **npm audit reports 3 high-severity vulnerabilities** in frontend
   dependencies — not triaged this session, should be checked with
   `npm audit fix` (or manually, if fix requires a breaking upgrade) before
   the next deploy.
10. **OCR PDF has no local runtime verification** — `ocrmypdf`/Tesseract
    aren't installed in this local dev environment (Windows, no system
    Tesseract), so the route was only syntax-checked (`py_compile`) and
    structurally verified via the frontend page rendering correctly against
    a mocked/absent backend. It follows the exact same router pattern as
    `compress.py`/`repair.py`; first real test should be a `curl` against a
    scanned test PDF once deployed (or once Tesseract is installed locally).
11. Carried over from Session 1: #2 (rate limiting), #3 (no automated test
    suite), #4 (client/server logic drift risk), #5 (`unlock-pdf` redundant
    exception ordering), #6 (in-memory zip on large splits). Carried over
    from Session 2: #7 (`AnnotationView` discriminated-union narrowing),
    #8 (Edit PDF resize handles / undo-redo).

### Follow-up ideas (carried over + new)
- Triage the 3 `npm audit` high-severity vulnerabilities.
- Verify OCR PDF end-to-end on a real deploy (Render) or a machine with
  Tesseract installed locally — this session could only verify it
  structurally, not by actually OCR-ing a file.
- Everything else carried over from Session 2 (drag-to-reorder pages,
  client-side PDF→JPG, Compare PDF, PDF/A, Phase 4 AI features, Edit PDF
  resize handles/undo-redo) is still open and unchanged.

### Tomorrow's first task
**Triage the `npm audit` high-severity findings**, then **verify OCR PDF
against a real scanned PDF** (either on the Render deploy once redeployed,
or locally after installing `tesseract-ocr`/`qpdf`/`ghostscript` via a
package manager) — this session shipped the code and confirmed it compiles
and the UI renders, but never actually ran Tesseract against a file.
Alternatively, if design feedback comes back from the owner's own visual
check of the new "Friendly Workbench" system, start there instead.

---

## Session 2 — 2026-07-21 · Backend live, PDF editor, PowerPoint fix

### What shipped
- **Backend deployed to Render** (free tier) at
  https://riqopdf-backend.onrender.com, confirmed working end-to-end by the
  repo owner on the live site (Compress PDF succeeded after a cold-start
  wait). `CORS_ORIGINS` and the `NEXT_PUBLIC_API_BASE` repo variable are
  both set. All 24 backend tools are now reachable from
  https://kamalhazriq.github.io/RiqoPDF/, not just the 8 browser-only ones.
- **PDF to PowerPoint fixed** — it previously rasterized each page into one
  full-slide image (text became an unselectable picture, a real complaint).
  `backend/app/routers/pdf_to_powerpoint.py` now rebuilds each page from
  PyMuPDF's per-line text layout into real, editable pptx text boxes (font
  size + color preserved), and separately embeds the page's actual images
  at their original bbox — no more full-page rasterization. Verified with
  python-pptx that output shapes are `TEXTBOX`, not `PICTURE`.
- **Edit PDF shipped** — a genuine client-side visual editor, the one
  deliberately-deferred piece from Session 1. `pdfjs-dist` renders each
  page to a `<canvas>`; an absolutely-positioned overlay div handles
  click/drag placement of text, rectangles, highlights, and images
  (percentage-of-page geometry, top-left origin); `pdf-lib` bakes
  everything into the real PDF on export (flipping to bottom-left origin).
  Runs entirely in the browser — added to the 8 browser-only tools (now 9).
  This is the one tool that breaks from the rest of the app's
  numeric-input convention by design, since "editor" means WYSIWYG.

### Incidents worth remembering
- **`pdfjs-dist@6.1.200`'s bundled worker silently failed to render** —
  threw `this[#methodPromises].getOrInsertComputed is not a function`, a
  brand-new JS engine method not yet reliably available, even in a recent
  Chromium build. The canvas stayed blank with no visible error unless you
  checked the console. **Pinned to `pdfjs-dist@4.10.38`** (mature, widely
  deployed) and it rendered correctly first try. Lesson: don't reach for
  the newest major of a rendering/engine-adjacent library without an
  actual render test — a clean `npm install` and build both succeeded
  while the feature was completely broken.
- **This sandbox cannot make outbound requests to arbitrary external
  domains at all** — `curl`, `WebFetch`, and a full Playwright browser all
  failed identically (403 / `ERR_TUNNEL_CONNECTION_FAILED`) against both
  `kamalhazriq.github.io` and `riqopdf-backend.onrender.com`. Could not
  verify the live Render integration directly; had to ask the repo owner
  to test in their own browser and report back. Workarounds that did
  work from inside the sandbox: rebuilding the frontend locally with the
  exact env vars CI uses and grepping the bundle for the baked-in value;
  serving a static export locally via a `<root>/RiqoPDF/...` symlink
  structure so `basePath` matches (serving from bare root 404s every JS
  asset and looks exactly like a broken file-upload bug if you don't
  check the console — burned real time on this before finding the cause).
- **The container restarted mid-session and silently reset the git
  working tree to a stale commit** — missing two already-merged PRs
  worth of changes (the `local` catalog field, CORS env var, etc.). First
  symptom was a confusing TypeScript error ("`local` does not exist on
  type `Tool`") that looked like this session's own new code was wrong,
  when the actual cause was the branch base being behind `origin/master`.
  Fixed with `git stash -u`, `git checkout -B <branch> origin/master`,
  `git stash pop` (one expected conflict in `tools-catalog.ts`, resolved
  by keeping master's content and re-applying just the one intended
  line). Lesson: if a change you're sure you made isn't in the working
  tree, check `git log` / `git diff origin/master` before assuming the
  new code is the problem.
- Wrote a full handover prompt (mid-session, before the restart) meant
  for a fresh session with no memory of this one — worth reusing that
  pattern for any future long-running session, restart or not.

### Technical debt (carried over, still open)
See Session 1 for the full list. #2 (rate limiting), #3 (no automated
test suite), #4 (client/server logic drift risk), #5 (`unlock-pdf`
redundant exception ordering), #6 (in-memory zip on large splits) are
all still open. New item:
7. **`AnnotationView` in `pdf-editor.tsx` has a slightly awkward
   discriminated-union narrowing workaround** (`ann.type === "image" ?
   ann.dataUrl : ""` instead of clean exhaustive narrowing) — TypeScript
   wasn't narrowing `ShapeAnnotation | ImageAnnotation` correctly across
   sequential early-return `if` checks on a union where one member's
   `type` field is itself a union (`"rectangle" | "highlight"`). Works
   correctly at runtime, just not the prettiest; a `switch` on
   `ann.type` would likely narrow cleaner if revisited.
8. **Edit PDF has no resize handles** — image/rectangle/highlight
   annotations are placed and moved but not resized after creation
   (rectangles/highlights get their size from the initial drag; images
   get a fixed default size). No undo, no multi-select, no page-rotation
   awareness. Scoped this way deliberately to ship a working v1; revisit
   if users want more control.

### Follow-up ideas (carried over + new)
- Drag-to-reorder page thumbnails for Merge/Organize (spec asks for it).
- PDF→JPG in the browser via pdf.js (drops another backend dependency) —
  now that pdfjs-dist is already a dependency for the editor, this is
  cheaper to add than it was in Session 1.
- Compare PDF (PyMuPDF, no new deps) and PDF/A (Ghostscript) — the last
  two non-AI "coming soon" tiles.
- Phase 4: OCR (Tesseract: eng/msa/chi/jpn per spec), AI summarizer/
  translate/chat — needs an LLM key and is the natural point to introduce
  a database + auth.
- Edit PDF resize handles + undo/redo (see tech debt #8).

### Tomorrow's first task
**Add resize handles to Edit PDF's image/rectangle/highlight annotations**
(tech debt #8) — the most-requested-feeling gap in the just-shipped
editor, and a bounded, well-scoped piece of work (drag a corner handle,
update `wPct`/`hPct` the same way move-drag already updates `xPct`/`yPct`).
Alternatively, if the product priority has shifted, Compare PDF is the
next fastest pure-backend win with no new dependencies.

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
