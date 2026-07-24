import subprocess
import uuid
from pathlib import Path

from fastapi import HTTPException

CONVERT_TIMEOUT_SECONDS = 120


def convert_with_libreoffice(src: Path, target_ext: str, job_dir: Path) -> Path:
    """Convert src to target_ext using headless LibreOffice.

    Each call gets its own LibreOffice user profile dir so concurrent
    conversions never collide on the same lock file.
    """
    profile_dir = job_dir / f"lo-profile-{uuid.uuid4().hex}"
    result = subprocess.run(
        [
            "soffice",
            "--headless",
            "--norestore",
            f"-env:UserInstallation={profile_dir.as_uri()}",
            "--convert-to", target_ext,
            "--outdir", str(job_dir),
            str(src),
        ],
        capture_output=True,
        timeout=CONVERT_TIMEOUT_SECONDS,
    )

    out_path = job_dir / f"{src.stem}.{target_ext}"
    if result.returncode != 0 or not out_path.exists():
        stderr = result.stderr.decode(errors="ignore")
        raise HTTPException(400, f"Conversion failed: {stderr[:500] or 'unknown LibreOffice error'}")

    return out_path
