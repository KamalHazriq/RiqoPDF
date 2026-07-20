"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function RotatePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [degrees, setDegrees] = useState(90);
  const [pages, setPages] = useState("");

  return (
    <ToolPageShell title="Rotate PDF" description="Rotate all pages, or just the ones you select.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium">Rotation</p>
          <div className="flex gap-2">
            {[90, 180, 270].map((d) => (
              <Button key={d} variant={degrees === d ? "default" : "outline"} size="sm" onClick={() => setDegrees(d)}>
                {d}°
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Pages (leave empty for all pages)</p>
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
          canRun={files.length === 1}
          fallbackFilename="rotated.pdf"
          runLabel="Rotate PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("degrees", String(degrees));
            if (pages.trim()) formData.append("pages", pages);
            return callTool("rotate-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
