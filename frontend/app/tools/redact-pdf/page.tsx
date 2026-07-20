"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function RedactPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [searchText, setSearchText] = useState("");
  const [pages, setPages] = useState("");

  return (
    <ToolPageShell
      title="Redact PDF"
      description="Permanently remove every occurrence of a piece of text — the underlying content is deleted, not just covered."
    >
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium">Text to redact</p>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="e.g. Social Security Number"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Pages (leave empty to search every page)</p>
          <input
            type="text"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="e.g. 1,3,5-7"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1 && searchText.trim().length > 0}
          fallbackFilename="redacted.pdf"
          runLabel="Redact PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("search_text", searchText);
            if (pages.trim()) formData.append("pages", pages);
            return callTool("redact-pdf", formData);
          }}
          renderResultInfo={(res) => {
            const count = res.headers.get("x-redaction-count");
            if (!count) return null;
            return <p className="text-sm text-neutral-500">{count} occurrence(s) redacted</p>;
          }}
        />
      </div>
    </ToolPageShell>
  );
}
