"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { SignaturePad } from "@/components/signature-pad";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left", "center"] as const;

export default function SignPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [drawnSignature, setDrawnSignature] = useState<File | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<File[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [position, setPosition] = useState<(typeof POSITIONS)[number]>("bottom-right");
  const [widthPercent, setWidthPercent] = useState(25);

  const signatureFile = mode === "draw" ? drawnSignature : uploadedSignature[0] ?? null;

  return (
    <ToolPageShell title="Sign PDF" description="Draw or upload a signature and place it on a page.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex gap-2">
          {(["draw", "upload"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                mode === m
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              {m} signature
            </button>
          ))}
        </div>

        {mode === "draw" ? (
          <SignaturePad onChange={setDrawnSignature} />
        ) : (
          <Uploader accept="image/png,image/jpeg" files={uploadedSignature} onFilesChange={setUploadedSignature} label="Upload a signature image" />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">Page number</p>
            <input
              type="number"
              min={1}
              value={pageNumber}
              onChange={(e) => setPageNumber(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
            />
          </div>
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
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Size: {widthPercent}% of page width</p>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={widthPercent}
            onChange={(e) => setWidthPercent(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1 && signatureFile !== null}
          fallbackFilename="signed.pdf"
          runLabel="Sign PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("signature", signatureFile as File);
            formData.append("page_number", String(pageNumber));
            formData.append("position", position);
            formData.append("width_percent", String(widthPercent));
            return callTool("sign-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
