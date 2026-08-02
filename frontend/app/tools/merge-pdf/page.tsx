"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell title="Merge PDF" description="Combine multiple PDFs into one document. Drag the list below to arrange the order.">
      <Uploader
        accept="application/pdf"
        multiple
        sortable
        thumbnails
        files={files}
        onFilesChange={setFiles}
        label="Drag & drop PDFs, or click to upload"
      />
      <div className="mt-6">
        <ProcessFlow
          canRun={files.length >= 2}
          fallbackFilename="merged.pdf"
          runLabel={files.length < 2 ? "Add at least 2 PDFs" : `Merge ${files.length} PDFs`}
          run={() => {
            const formData = new FormData();
            files.forEach((f) => formData.append("files", f));
            return callTool("merge-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
