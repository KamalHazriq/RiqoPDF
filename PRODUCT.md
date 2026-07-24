# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General-purpose audience with no particular lean toward consumers or professionals —
anyone who needs to do something to a PDF (students, job seekers, freelancers, small
business/office workers) and would otherwise hit a paywall, ad wall, or account
requirement on a competitor like iLovePDF.

## Product Purpose

"One place for every PDF task." A free, privacy-first PDF toolkit: convert, edit,
compress, organize, and secure PDFs with no account required. Every request is a
one-shot upload → process → download; nothing is stored permanently.

## Positioning

Completely free where the category leader (iLovePDF) gates tools behind ads,
paywalls, or accounts, and privacy-first where competitors upload files to servers
by default: 9 of 25 tools run entirely in the browser (files never leave the
device), and every backend-processed file is deleted immediately after the
response (10-minute TTL sweeper as backstop). No database, no login, no tracking
of document contents.

## Operating Context

- Tool marketplace–style dashboard, categorized: Organize PDF, Optimize PDF,
  Convert PDF, Edit PDF, PDF Security, Document Scanning (planned), AI features
  (planned).
- Per-tool page flow: upload → configure options → processing → preview/download.
- Two execution paths per tool: client-side (pdf-lib/pdfjs-dist, badged "In your
  browser") or backend (FastAPI + PyMuPDF/LibreOffice/Ghostscript, badged
  otherwise on the static-export deploy).
- Deployed as: frontend static-exported to GitHub Pages
  (https://kamalhazriq.github.io/RiqoPDF/), backend on Render free tier
  (https://riqopdf-backend.onrender.com — cold-starts after ~15 min idle,
  30-60s+ first request).

## Capabilities and Constraints

- 25 tools shipped across Organize (Merge, Split, Organize, Rotate, Crop, Page
  Numbers), Optimize (Compress, Repair), Convert (PDF↔Word/Excel/PowerPoint,
  PDF→JPG, JPG→PDF, PDF→HTML, PDF→Markdown), Edit (visual Edit PDF, Watermark,
  Redact, Forms, Sign), and Security (Protect, Unlock).
- No database, no accounts, no auth — upload/process/download only.
- 100 MB upload cap; no rate limiting yet (known gap).
- OCR PDF is shipped, using Tesseract via `ocrmypdf` (not a GPU-dependent
  VLM), specifically to stay deployable on Render's free, GPU-less tier —
  matches the original spec's language list (English, Malay, Chinese,
  Japanese).
- Compare PDF and PDF/A conversion are scoped ("coming soon") but not built.
- Undecided: Phase 4 AI features (summarize/translate/chat) will need an LLM
  API key and are the natural point a database/auth gets introduced — not
  committed to yet.

## Brand Commitments

- Name: RiqoPDF. Real logo shipped as favicon/app icons (wordmark "riqo" over
  the tool category, primary colors red/green/blue/yellow blocks on a light
  card mark).
- Explicitly must NOT copy iLovePDF's branding, logo, or exact design.
- Visual inspiration (not literal copying): Linear, Vercel, Notion, Microsoft
  365 — modern enterprise SaaS restraint, not a consumer/marketing look.
- Manual light/dark theme toggle is a committed feature (defaults to system
  preference, persisted to localStorage).

## Evidence on Hand

- Real logo/icon assets at `frontend/app/{favicon.ico,icon.png,apple-icon.png}`.
- No testimonials, case studies, press, or usage-metric claims exist — none
  should be fabricated in future copy.

## Product Principles

1. Free and account-free is the product, not a pricing tier — never gate a
   tool behind login, payment, or a watermark upsell.
2. Prefer browser-side processing wherever feasible; it is the privacy
   guarantee, not a performance optimization.
3. Ship the numeric/percentage-driven interaction pattern (page ranges,
   position %, opacity, rotation) consistently across tools; Edit PDF's
   WYSIWYG canvas is a deliberate, disclosed exception, not the new norm.
4. Every tool must degrade honestly on the static (GitHub Pages) deploy —
   backend-dependent tools say so, they don't silently fail.
5. Don't build ahead of a phase (spec's own Phase 1–4 ordering) — Compare PDF
   and PDF/A are next before any AI feature.

## Accessibility & Inclusion

Target WCAG 2.1 AA: contrast ratios, keyboard navigation, and screen-reader
labels are a real requirement for audit/polish passes, not a nice-to-have.
