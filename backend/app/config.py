import os
import tempfile

JOB_ROOT = os.path.join(tempfile.gettempdir(), "riqopdf")
JOB_TTL_SECONDS = 10 * 60  # auto-delete anything older than this
MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB per file

os.makedirs(JOB_ROOT, exist_ok=True)
