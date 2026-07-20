"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function PdfToJpgPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell title="PDF to JPG" description="Convert every page of your PDF into a JPG image.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="pages.zip"
          runLabel="Convert to JPG"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            return callTool("pdf-to-jpg", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
