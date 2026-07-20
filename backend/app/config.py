import os
import tempfile

JOB_ROOT = os.path.join(tempfile.gettempdir(), "riqopdf")
JOB_TTL_SECONDS = 10 * 60  # auto-delete anything older than this
MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB per file

# Comma-separated list of allowed frontend origins, e.g.
# "https://kamalhazriq.github.io,https://riqopdf.vercel.app".
# Defaults to local dev only.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

os.makedirs(JOB_ROOT, exist_ok=True)
