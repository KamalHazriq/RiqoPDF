import asyncio
import shutil
import time
import uuid
from pathlib import Path

from .config import JOB_ROOT, JOB_TTL_SECONDS


def new_job_dir() -> Path:
    job_dir = Path(JOB_ROOT) / uuid.uuid4().hex
    job_dir.mkdir(parents=True, exist_ok=True)
    return job_dir


def delete_job_dir(job_dir: Path) -> None:
    shutil.rmtree(job_dir, ignore_errors=True)


def sweep_expired_jobs() -> None:
    now = time.time()
    root = Path(JOB_ROOT)
    if not root.exists():
        return
    for entry in root.iterdir():
        try:
            if now - entry.stat().st_mtime > JOB_TTL_SECONDS:
                shutil.rmtree(entry, ignore_errors=True)
        except FileNotFoundError:
            continue


async def sweeper_loop(interval_seconds: int = 60) -> None:
    while True:
        sweep_expired_jobs()
        await asyncio.sleep(interval_seconds)
