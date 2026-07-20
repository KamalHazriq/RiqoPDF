"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function ExcelToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell title="Excel to PDF" description="Convert a spreadsheet into a PDF.">
      <Uploader
        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        files={files}
        onFilesChange={setFiles}
        label="Drag & drop a spreadsheet, or click to upload"
      />

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="converted.pdf"
          runLabel="Convert to PDF"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            return callTool("excel-to-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
