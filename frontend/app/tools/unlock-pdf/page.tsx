"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function UnlockPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");

  return (
    <ToolPageShell title="Unlock PDF" description="Remove the password from a PDF you own — you'll need the current password.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Current password</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter the PDF's password"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
        />
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1 && password.length > 0}
          fallbackFilename="unlocked.pdf"
          runLabel="Unlock PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("password", password);
            return callTool("unlock-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
