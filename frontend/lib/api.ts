export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {}

export async function callTool(path: string, formData: FormData): Promise<Response> {
  const res = await fetch(`${API_BASE}/api/tools/${path}`, {
    method: "POST",
    body: formData,
  });

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
