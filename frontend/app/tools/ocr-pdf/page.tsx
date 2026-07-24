"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

const LANGUAGES = [
  { value: "eng", label: "English" },
  { value: "msa", label: "Malay" },
  { value: "chi_sim", label: "Chinese" },
  { value: "jpn", label: "Japanese" },
] as const;

export default function OcrPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]["value"]>("eng");

  return (
    <ToolPageShell
      title="OCR PDF"
      description="Turn a scanned or image-only PDF into one you can search, select, and copy text from."
    >
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a scanned PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Document language</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LANGUAGES.map((l) => (
            <label
              key={l.value}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-tint dark:border-neutral-800"
            >
              <input
                type="radio"
                className="accent-primary"
                checked={language === l.value}
                onChange={() => setLanguage(l.value)}
              />
              {l.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="searchable.pdf"
          runLabel="Run OCR"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("language", language);
            return callTool("ocr-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
