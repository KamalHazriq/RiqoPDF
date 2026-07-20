"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

const MARGINS = [
  ["top", "Top"],
  ["bottom", "Bottom"],
  ["left", "Left"],
  ["right", "Right"],
] as const;

export default function CropPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [pages, setPages] = useState("");

  const anyMargin = Object.values(margins).some((v) => v > 0);

  return (
    <ToolPageShell title="Crop PDF" description="Trim margins from all pages or just the ones you select.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 grid grid-cols-2 gap-4">
        {MARGINS.map(([key, label]) => (
          <div key={key}>
            <p className="mb-2 text-sm font-medium">
              {label}: {margins[key]}%
            </p>
            <input
              type="range"
              min={0}
              max={45}
              step={1}
              value={margins[key]}
              onChange={(e) => setMargins((m) => ({ ...m, [key]: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">Pages (leave empty for all pages)</p>
        <input
          type="text"
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          placeholder="e.g. 1,3,5-7"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
        />
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1 && anyMargin}
          fallbackFilename="cropped.pdf"
          runLabel="Crop PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("top_percent", String(margins.top));
            formData.append("bottom_percent", String(margins.bottom));
            formData.append("left_percent", String(margins.left));
            formData.append("right_percent", String(margins.right));
            if (pages.trim()) formData.append("pages", pages);
            return callTool("crop-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
