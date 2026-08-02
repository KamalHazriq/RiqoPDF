import type { NextConfig } from "next";

// STATIC_EXPORT=1 produces a fully static build (frontend/out) for GitHub
// Pages; NEXT_PUBLIC_BASE_PATH (e.g. /RiqoPDF) prefixes routes when the site
// is served from a repo subpath. Neither is set for local dev or Docker.
const nextConfig: NextConfig = {
  output: process.env.STATIC_EXPORT ? "export" : undefined,
  trailingSlash: Boolean(process.env.STATIC_EXPORT),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
  // An unrelated package-lock.json can exist in a parent directory on a dev
  // machine; pin the trace root so Next doesn't guess the wrong workspace.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
