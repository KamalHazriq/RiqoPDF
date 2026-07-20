"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function RepairPdfPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell
      title="Repair PDF"
      description="Rebuild a damaged PDF's internal structure and recover whatever pages remain readable."
    >
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="repaired.pdf"
          runLabel="Repair PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            return callTool("repair-pdf", formData);
          }}
          renderResultInfo={(res) => {
            const pages = res.headers.get("x-recovered-pages");
            if (!pages) return null;
            return <p className="text-sm text-neutral-500">{pages} page(s) recovered</p>;
          }}
        />
      </div>
    </ToolPageShell>
  );
}
