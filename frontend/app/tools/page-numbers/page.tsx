"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

const POSITIONS = [
  "bottom-center",
  "bottom-left",
  "bottom-right",
  "top-center",
  "top-left",
  "top-right",
] as const;

export default function PageNumbersPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [position, setPosition] = useState<(typeof POSITIONS)[number]>("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [template, setTemplate] = useState("{n}");
  const [fontSize, setFontSize] = useState(11);

  return (
    <ToolPageShell
      title="Page Numbers"
      description="Stamp page numbers on every page. Use {n} for the page number and {total} for the page count."
    >
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-sm font-medium">Position</p>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as (typeof POSITIONS)[number])}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p.replace("-", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Start at</p>
          <input
            type="number"
            min={0}
            value={startAt}
            onChange={(e) => setStartAt(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Format</p>
          <input
            type="text"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="e.g. Page {n} of {total}"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Font size: {fontSize}pt</p>
          <input
            type="range"
            min={6}
            max={36}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1 && template.includes("{n}")}
          fallbackFilename="numbered.pdf"
          runLabel="Add page numbers"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("position", position);
            formData.append("start_at", String(startAt));
            formData.append("template", template);
            formData.append("font_size", String(fontSize));
            return callTool("page-numbers", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
