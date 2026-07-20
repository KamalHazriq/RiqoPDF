"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { Button } from "@/components/ui/button";
import { callTool } from "@/lib/api";

interface FieldRow {
  id: number;
  name: string;
  type: "text" | "checkbox";
  page: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

let nextId = 1;

function newRow(): FieldRow {
  return {
    id: nextId++,
    name: `field_${nextId}`,
    type: "text",
    page: 1,
    xPercent: 10,
    yPercent: 10,
    widthPercent: 30,
    heightPercent: 5,
  };
}

export default function PdfFormsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<FieldRow[]>([newRow()]);

  function updateRow(id: number, patch: Partial<FieldRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const canRun = files.length === 1 && rows.length > 0 && rows.every((r) => r.name.trim());

  return (
    <ToolPageShell
      title="PDF Forms"
      description="Add fillable text fields and checkboxes. Position each field as a percentage of the page — 0% is the top-left corner."
    >
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
                placeholder="Field name"
                className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
              />
              <select
                value={row.type}
                onChange={(e) => updateRow(row.id, { type: e.target.value as "text" | "checkbox" })}
                className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <option value="text">Text</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                disabled={rows.length === 1}
                className="text-neutral-400 hover:text-red-600 disabled:opacity-30"
                aria-label="Remove field"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs">
              <label className="flex flex-col gap-1">
                Page
                <input
                  type="number"
                  min={1}
                  value={row.page}
                  onChange={(e) => updateRow(row.id, { page: Number(e.target.value) })}
                  className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
                />
              </label>
              <label className="flex flex-col gap-1">
                X %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={row.xPercent}
                  onChange={(e) => updateRow(row.id, { xPercent: Number(e.target.value) })}
                  className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
                />
              </label>
              <label className="flex flex-col gap-1">
                Y %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={row.yPercent}
                  onChange={(e) => updateRow(row.id, { yPercent: Number(e.target.value) })}
                  className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
                />
              </label>
              <label className="flex flex-col gap-1">
                Width %
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={row.widthPercent}
                  onChange={(e) => updateRow(row.id, { widthPercent: Number(e.target.value) })}
                  className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
                />
              </label>
              <label className="flex flex-col gap-1">
                Height %
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={row.heightPercent}
                  onChange={(e) => updateRow(row.id, { heightPercent: Number(e.target.value) })}
                  className="rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
                />
              </label>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, newRow()])} className="self-start">
          <Plus size={14} />
          Add field
        </Button>
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={canRun}
          fallbackFilename="form.pdf"
          runLabel="Add form fields"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append(
              "fields",
              JSON.stringify(
                rows.map((r) => ({
                  name: r.name,
                  type: r.type,
                  page: r.page,
                  x_percent: r.xPercent,
                  y_percent: r.yPercent,
                  width_percent: r.widthPercent,
                  height_percent: r.heightPercent,
                })),
              ),
            );
            return callTool("pdf-forms", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
