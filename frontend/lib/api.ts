export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export class ApiError extends Error {}

export async function callTool(path: string, formData: FormData): Promise<Response> {
  // Privacy-first: tools with a browser-side implementation run entirely
  // locally — the file never leaves the user's machine. Engines return null
  // to fall through to the backend (e.g. image watermark).
  const { clientEngines } = await import("./client-tools");
  const engine = clientEngines[path];
  if (engine) {
    const local = await engine(formData);
    if (local) return local;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/tools/${path}`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError(
      "This tool needs the RiqoPDF backend server, which isn't available on this site. Tools marked “In your browser” (Merge, Split, Rotate, Organize, Crop, Page Numbers, JPG to PDF, text Watermark) work right here with no server — for everything else, run the app locally with Docker Compose.",
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.detail ?? message;
    } catch {
      // ignore — non-JSON error body
    }
    throw new ApiError(message);
  }

  return res;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function filenameFromDisposition(res: Response, fallback: string): string {
  const disposition = res.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/);
  return match?.[1] ?? fallback;
}
