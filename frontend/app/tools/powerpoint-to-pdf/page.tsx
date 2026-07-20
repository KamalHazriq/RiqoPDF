"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function PowerpointToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell title="PowerPoint to PDF" description="Convert a presentation into a PDF.">
      <Uploader
        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        files={files}
        onFilesChange={setFiles}
        label="Drag & drop a presentation, or click to upload"
      />

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="converted.pdf"
          runLabel="Convert to PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            return callTool("powerpoint-to-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
