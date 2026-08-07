import os
import tempfile

JOB_ROOT = os.path.join(tempfile.gettempdir(), "riqopdf")
JOB_TTL_SECONDS = 10 * 60  # auto-delete anything older than this
MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB per file

# Per-IP request budget for /api/tools/*. Generous enough for a real user
# batch-processing several files, low enough to blunt scripted abuse on a
# free-tier host with no other quota. Override via env for tuning without
# a code change.
RATE_LIMIT = os.environ.get("RATE_LIMIT", "30/minute")

# Comma-separated list of allowed frontend origins, e.g.
# "https://kamalhazriq.github.io,https://riqopdf.vercel.app".
# Defaults to local dev only.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

os.makedirs(JOB_ROOT, exist_ok=True)
