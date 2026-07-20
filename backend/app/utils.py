from pathlib import Path

from fastapi import HTTPException, UploadFile

from .config import MAX_UPLOAD_BYTES


async def save_upload(upload: UploadFile, dest: Path) -> Path:
    size = 0
    with open(dest, "wb") as f:
        while chunk := await upload.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                raise HTTPException(413, "File too large (max 100MB)")
            f.write(chunk)
    return dest


def require_pdf(filename: str | None) -> None:
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only .pdf files are accepted")


def require_extension(filename: str | None, allowed: tuple[str, ...]) -> None:
    if not filename or filename.lower().rsplit(".", 1)[-1] not in allowed:
        allowed_list = ", ".join(f".{e}" for e in allowed)
        raise HTTPException(400, f"Only {allowed_list} files are accepted")


def parse_page_indices(pages_spec: str, page_count: int) -> list[int]:
    """Parse a 1-based spec like '1,3,5-7' into 0-based sorted unique indices."""
    indices: set[int] = set()
    for part in pages_spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start, end = part.split("-", 1)
            start_i, end_i = int(start), int(end)
            if start_i > end_i:
                start_i, end_i = end_i, start_i
            for p in range(start_i, end_i + 1):
                indices.add(p - 1)
        else:
            indices.add(int(part) - 1)
    for idx in indices:
        if idx < 0 or idx >= page_count:
            raise HTTPException(400, f"Page {idx + 1} is out of range (1-{page_count})")
    return sorted(indices)
