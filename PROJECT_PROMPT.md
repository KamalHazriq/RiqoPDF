# RiqoPDF — Project Prompt

> This is the source prompt for the project. Not yet implemented — for review before build starts.

## Base Prompt

```
You are a senior full-stack SaaS engineer.

I want to build a completely free alternative to iLovePDF.

Reference:
https://www.ilovepdf.com/

The product should be a modern PDF productivity platform with ALL major PDF tools.

Do not copy iLovePDF branding, logo, or exact design.

Create an original premium UI inspired by:
- Linear
- Vercel
- Notion
- Microsoft 365
- Modern enterprise SaaS applications


================================================

PRODUCT VISION

Create:

"One place for every PDF task."

A privacy-first PDF toolkit where users can:

- Convert PDFs
- Edit PDFs
- Compress PDFs
- Organize PDFs
- Secure PDFs
- Analyze PDFs
- Use AI on PDFs


================================================

TECH STACK

Frontend:
- Next.js 15
- TypeScript
- Tailwind CSS
- Shadcn UI
- Framer Motion
- Responsive design

Backend:
Choose the best architecture:

Option:
- Node.js
- Python FastAPI microservices

PDF processing libraries:

Python:
- PyMuPDF
- pypdf
- pdfplumber
- Pillow
- OCR libraries

Additional:
- LibreOffice headless conversion
- Ghostscript compression
- Tesseract OCR


Deployment:

Support:

Local:
- Docker Compose

Online:
- Vercel frontend
- Backend VPS / Railway / Render


================================================

MAIN DASHBOARD

Create a tool marketplace style dashboard.

Categories:

1. Workflows
2. Organize PDF
3. Optimize PDF
4. Convert PDF
5. Edit PDF
6. PDF Security
7. PDF Intelligence


Each tool should have:

- Icon
- Name
- Description
- Upload button
- Processing page
- Result download


================================================

FEATURE LIST

Implement architecture for ALL:

## PDF ORGANIZATION

### Merge PDF
- Combine multiple PDFs
- Drag reorder pages

### Split PDF
- Extract selected pages
- Split every page

### Organize PDF
- Delete pages
- Rearrange pages
- Duplicate pages


### Rotate PDF
- Rotate selected pages


### Crop PDF
- Crop margins
- Crop selected pages


### Page Numbers
- Add customizable page numbers


================================================

## PDF OPTIMIZATION

### Compress PDF
Compression levels:

- Extreme
- Recommended
- Low compression


Show:

Original size
Compressed size
Percentage reduction


### Repair PDF

Attempt:

- Fix corrupted PDFs
- Recover readable pages


### PDF/A Conversion

Convert PDFs into archival PDF/A format.


================================================

## PDF CONVERSION


### PDF To Word

Convert:
PDF -> DOCX


### PDF To Excel

Convert:
PDF -> XLSX


### PDF To PowerPoint

Convert:
PDF -> PPTX


### Word To PDF


### Excel To PDF


### PowerPoint To PDF


### PDF To JPG

Convert pages into images


### JPG To PDF


### PDF To HTML


### PDF To Markdown


================================================

## PDF EDITING


### Edit PDF

Allow:

- Add text
- Add images
- Draw shapes
- Highlight
- Add annotations


### Watermark

Options:

- Text watermark
- Image watermark
- Position
- Opacity
- Rotation


### Redact PDF

Permanent removal of:

- Text
- Images
- Sensitive information


### PDF Forms

Create:

- Fillable fields
- Checkboxes
- Text inputs


### Sign PDF

Allow:

- Draw signature
- Upload signature
- Place signature


================================================

## PDF SECURITY


### Protect PDF

Add password encryption


### Unlock PDF

Remove password if user owns password


### Compare PDF

Compare two PDFs:

- Highlight changes
- Show differences


================================================

## DOCUMENT SCANNING


### Scan To PDF

Allow:

- Camera upload
- Image cleanup
- Convert scans


### OCR PDF

Convert scanned PDF:

Image PDF -> Searchable PDF

Support:

- English
- Malay
- Chinese
- Japanese


================================================

## AI FEATURES


### AI PDF Summarizer

Upload PDF:

Generate:

- Summary
- Key points
- Important sections


### Translate PDF

Translate:

- Text
- Maintain formatting


Future ready:

- Chat with PDF
- Ask questions about documents
- Extract information


================================================

## PRIVACY REQUIREMENTS


Important:

User documents are sensitive.

Implement:

- Temporary file storage only
- Automatic deletion after processing
- No permanent document storage
- Clear privacy notice


Prefer browser-side processing where possible.


================================================

## USER EXPERIENCE


Homepage:

Hero:

"Every PDF tool you need. Completely free."


Tool cards:

Example:


Merge PDF

Combine multiple PDFs into one document.


Upload workflow:

1. Upload file
2. Configure options
3. Processing animation
4. Preview result
5. Download


================================================

## DEVELOPMENT PLAN


Do NOT build everything immediately.


Phase 1 MVP:

Build:

1. Merge PDF
2. Split PDF
3. Compress PDF
4. JPG to PDF
5. PDF to JPG
6. Rotate PDF
7. Delete pages


Phase 2:

Conversion:

- Word
- Excel
- PowerPoint
- HTML


Phase 3:

Editing:

- Watermark
- Sign
- Redact
- Forms


Phase 4:

AI:

- OCR
- Summarizer
- Translate
- Chat PDF


================================================

Before coding:

Explain:

1. System architecture
2. Database requirement
3. Folder structure
4. Required dependencies
5. Development roadmap


After that start implementing Phase 1.

Also suggest:
"Anything else you think should be added to make this product better."
```

## Addendum — MVP Architecture Note

One thing to add: don't use a database initially.

For this type of app, MVP architecture:

```
User
 |
Next.js Website
 |
Upload PDF
 |
Temporary Processing Server
 |
Delete file after 10 minutes
 |
Download result
```
