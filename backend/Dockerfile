FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    qpdf \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-msa \
    tesseract-ocr-chi-sim \
    tesseract-ocr-jpn \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000
# Render/Railway inject $PORT and expect the app to bind to it; default to
# 8000 for docker-compose / local `docker run` where it isn't set.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
