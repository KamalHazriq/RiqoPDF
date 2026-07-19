"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function OrganizePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [deletePages, setDeletePages] = useState("");

  return (
    <ToolPageShell title="Organize PDF" description="Delete pages you don't need. Reordering is supported via the API for advanced use.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Pages to delete</p>
        <input
          type="text"
          value={deletePages}
          onChange={(e) => setDeletePages(e.target.value)}
          placeholder="e.g. 2,4-5"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
        />
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1 && deletePages.trim().length > 0}
          fallbackFilename="organized.pdf"
          runLabel="Delete pages"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("delete_pages", deletePages);
            return callTool("organize-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
