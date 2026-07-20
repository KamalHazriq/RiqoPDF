"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

const POSITIONS = ["center", "top-left", "top-right", "bottom-left", "bottom-right"] as const;
const ROTATIONS = [0, 90, 180, 270] as const;

export default function WatermarkPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [position, setPosition] = useState<(typeof POSITIONS)[number]>("center");
  const [opacity, setOpacity] = useState(0.4);
  const [rotation, setRotation] = useState<(typeof ROTATIONS)[number]>(0);
  const [tile, setTile] = useState(false);

  const canRun = files.length === 1 && (type === "text" ? text.trim().length > 0 : imageFiles.length === 1);

  return (
    <ToolPageShell title="Watermark" description="Stamp a text or image watermark onto every page.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex gap-2">
          {(["text", "image"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                type === t
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {type === "text" ? (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Watermark text"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        ) : (
          <Uploader accept="image/png,image/jpeg" files={imageFiles} onFilesChange={setImageFiles} label="Upload a watermark image" />
        )}

        {!tile && (
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
        )}

        {type === "text" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tile} onChange={(e) => setTile(e.target.checked)} />
            Tile across the page
          </label>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Opacity: {Math.round(opacity * 100)}%</p>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Rotation</p>
          <div className="flex gap-2">
            {ROTATIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRotation(r)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  rotation === r
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {r}°
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProcessFlow
          canRun={canRun}
          fallbackFilename="watermarked.pdf"
          runLabel="Add watermark"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            formData.append("watermark_type", type);
            if (type === "text") formData.append("text", text);
            else formData.append("image", imageFiles[0]);
            formData.append("position", position);
            formData.append("opacity", String(opacity));
            formData.append("rotation", String(rotation));
            formData.append("tile", String(tile && type === "text"));
            return callTool("watermark", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
