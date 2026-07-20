"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function SplitPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"every-page" | "pages">("every-page");
  const [pages, setPages] = useState("");

  const canRun = files.length === 1 && (mode === "every-page" || pages.trim().length > 0);

  return (
    <ToolPageShell title="Split PDF" description="Extract selected pages, or split every page into its own file.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={mode === "every-page"} onChange={() => setMode("every-page")} />
          Split every page into a separate PDF
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={mode === "pages"} onChange={() => setMode("pages")} />
          Extract specific pages
        </label>
        {mode === "pages" && (
          <input
            type="text"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="e.g. 1,3,5-7"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        )}
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={canRun}
          fallbackFilename={mode === "every-page" ? "split_pages.zip" : "split.pdf"}
          runLabel="Split PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("mode", mode);
            if (mode === "pages") formData.append("pages", pages);
            return callTool("split-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
