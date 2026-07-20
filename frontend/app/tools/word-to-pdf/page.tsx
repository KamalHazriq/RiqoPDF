"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function WordToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell title="Word to PDF" description="Convert a Word document into a PDF.">
      <Uploader
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        files={files}
        onFilesChange={setFiles}
        label="Drag & drop a Word document, or click to upload"
      />

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="converted.pdf"
          runLabel="Convert to PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            return callTool("word-to-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
