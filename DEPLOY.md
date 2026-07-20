# Deploying the backend

The frontend is already live on GitHub Pages, but Pages only serves static
files — it can't run the FastAPI backend, so 16 of the 24 tools (anything
needing Ghostscript, LibreOffice, or server-side PyMuPDF processing) show a
"backend not reachable" message there. Deploying the backend anywhere that
runs Docker fixes that. Below are the two free options; either works, `render.yaml`
and `railway.json` are prepped for both.

This step needs an account on the hosting platform — I can prepare every file,
but the account connection and the "click deploy" step have to happen on your
side.

## Option A — Render (recommended: simpler free-tier Docker support)

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New** →
   **Blueprint** → connect the `KamalHazriq/RiqoPDF` repo.
2. Render reads `render.yaml` from the repo root automatically. Confirm the
   `riqopdf-backend` service it proposes, then **Apply**.
3. First build takes several minutes (installs LibreOffice + Ghostscript).
   Once live, copy the service URL — it looks like
   `https://riqopdf-backend-xxxx.onrender.com`.
4. **Free-tier note:** the service spins down after ~15 minutes idle and
   takes ~30-60s to wake on the next request — expect a slow first request
   after a quiet period.

### If you'd rather click through the UI instead of using the blueprint
- **New → Web Service** → connect the repo.
- **Root Directory:** `backend`
- **Runtime:** Docker (Render auto-detects `Dockerfile` once Root Directory is set)
- **Instance Type:** Free
- **Environment Variable:** `CORS_ORIGINS` = `https://kamalhazriq.github.io`

## Option B — Railway

1. Go to [railway.app/new](https://railway.app/new) → **Deploy from GitHub
   repo** → select `KamalHazriq/RiqoPDF`.
2. Open the created service's **Settings → Source** and set **Root
   Directory** to `backend`. This step is required — without it, Railway
   builds from the repo root and the Docker build will fail. `railway.json`
   handles the rest (Dockerfile builder) once Root Directory is set.
3. **Settings → Networking → Generate Domain** to get a public URL, e.g.
   `https://riqopdf-backend.up.railway.app`.
4. **Settings → Variables** → add `CORS_ORIGINS` =
   `https://kamalhazriq.github.io`.
5. Railway's free trial credit covers light usage; after that it's
   pay-as-you-go (no free always-on tier like Render, but no cold-start
   sleep either).

## After either option: point the live frontend at it

Once you have the backend URL, tell me (or edit directly):

```yaml
# .github/workflows/deploy-pages.yml, in the "Build static export" step
env:
  STATIC_EXPORT: "1"
  NEXT_PUBLIC_BASE_PATH: /RiqoPDF
  NEXT_PUBLIC_API_BASE: https://your-backend-url-here
```

Push to `master` (or re-run the workflow) and all 24 tools go live on
https://kamalhazriq.github.io/RiqoPDF/ — the 8 browser tools keep processing
locally as before; the rest now reach your deployed backend instead of
`localhost:8000`.

## Verifying it worked

```bash
curl https://your-backend-url-here/api/health
# {"status":"ok"}
```

Then on the live site, try **Compress PDF** (a backend-only tool) — it
should succeed instead of showing the "backend not reachable" notice.
