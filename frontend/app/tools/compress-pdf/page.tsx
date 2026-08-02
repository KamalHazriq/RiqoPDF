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
  { value: "custom", label: "Custom size", hint: "Compress until it fits your target" },
] as const;

const UNITS = { KB: 1, MB: 1024 } as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<(typeof LEVELS)[number]["value"]>("recommended");
  const [targetValue, setTargetValue] = useState("1");
  const [targetUnit, setTargetUnit] = useState<keyof typeof UNITS>("MB");

  const targetSizeKb = Math.round((parseFloat(targetValue) || 0) * UNITS[targetUnit]);
  const isCustom = level === "custom";
  const canRun = files.length === 1 && (!isCustom || targetSizeKb > 0);

  return (
    <ToolPageShell title="Compress PDF" description="Reduce file size while keeping the document usable.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-2">
        {LEVELS.map((l) => (
          <label
            key={l.value}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-tint dark:border-neutral-800"
          >
            <span>
              <span className="font-medium">{l.label}</span>
              <span className="ml-2 text-neutral-400">{l.hint}</span>
            </span>
            <input type="radio" className="accent-primary" checked={level === l.value} onChange={() => setLevel(l.value)} />
          </label>
        ))}

        {isCustom && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-tint px-4 py-3 text-sm">
            <span className="text-neutral-600 dark:text-neutral-300">Target size:</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-20 rounded border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <select
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value as keyof typeof UNITS)}
              className="rounded border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </select>
            <span className="text-xs text-neutral-400">
              We&apos;ll try progressively stronger compression until it fits, or get as close as possible.
            </span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={canRun}
          fallbackFilename="compressed.pdf"
          runLabel="Compress PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("level", level);
            if (isCustom) formData.append("target_size_kb", String(targetSizeKb));
            return callTool("compress-pdf", formData);
          }}
          renderResultInfo={(res) => {
            const original = Number(res.headers.get("x-original-size"));
            const compressed = Number(res.headers.get("x-compressed-size"));
            const reduction = res.headers.get("x-reduction-percent");
            const targetMet = res.headers.get("x-target-met");
            if (!original || !compressed) return null;
            return (
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-neutral-500">
                  {formatBytes(original)} → {formatBytes(compressed)} ({reduction}% smaller)
                </p>
                {targetMet === "false" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Couldn&apos;t reach your target without unusable quality — this is the smallest we could get it.
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </ToolPageShell>
  );
}
