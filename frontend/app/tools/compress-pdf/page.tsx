"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

const LEVELS = [
  { value: "extreme", label: "Extreme", hint: "Smallest size, lower quality" },
  { value: "recommended", label: "Recommended", hint: "Good balance of size and quality" },
  { value: "low", label: "Low compression", hint: "Best quality, larger size" },
] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<(typeof LEVELS)[number]["value"]>("recommended");

  return (
    <ToolPageShell title="Compress PDF" description="Reduce file size while keeping the document usable.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-2">
        {LEVELS.map((l) => (
          <label
            key={l.value}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
          >
            <span>
              <span className="font-medium">{l.label}</span>
              <span className="ml-2 text-neutral-400">{l.hint}</span>
            </span>
            <input type="radio" checked={level === l.value} onChange={() => setLevel(l.value)} />
          </label>
        ))}
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="compressed.pdf"
          runLabel="Compress PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("level", level);
            return callTool("compress-pdf", formData);
          }}
          renderResultInfo={(res) => {
            const original = Number(res.headers.get("x-original-size"));
            const compressed = Number(res.headers.get("x-compressed-size"));
            const reduction = res.headers.get("x-reduction-percent");
            if (!original || !compressed) return null;
            return (
              <p className="text-sm text-neutral-500">
                {formatBytes(original)} → {formatBytes(compressed)} ({reduction}% smaller)
              </p>
            );
          }}
        />
      </div>
    </ToolPageShell>
  );
}
