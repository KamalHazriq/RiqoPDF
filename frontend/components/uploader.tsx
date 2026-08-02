"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Reorder } from "framer-motion";
import { FileText, GripVertical, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPdfThumbnail } from "@/lib/pdf-thumbnail";

interface UploaderProps {
  accept: string;
  multiple?: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  label?: string;
  /** Let the user drag list items to reorder them (e.g. Merge PDF's file order). */
  sortable?: boolean;
  /** Render a page-1 thumbnail per PDF instead of just the filename. */
  thumbnails?: boolean;
}

function FileThumbnail({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPdfThumbnail(file).then((result) => {
      if (!cancelled) setUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <FileText size={14} className="text-neutral-400" />
      )}
    </div>
  );
}

export function Uploader({
  accept,
  multiple = false,
  files,
  onFilesChange,
  label,
  sortable = false,
  thumbnails = false,
}: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    onFilesChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  const itemClass =
    "flex items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm dark:border-neutral-800";

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragActive
            ? "border-primary bg-primary-tint"
            : "border-neutral-200 hover:border-primary/50 dark:border-neutral-800 dark:hover:border-neutral-600",
        )}
      >
        <UploadCloud className={cn(dragActive ? "text-primary-text" : "text-neutral-400")} size={28} />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {label ?? "Drag & drop or click to upload"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && sortable && (
        <Reorder.Group
          as="ul"
          axis="y"
          values={files}
          onReorder={onFilesChange}
          className="flex flex-col gap-2"
        >
          {files.map((file, i) => (
            <Reorder.Item as="li" key={`${file.name}-${file.size}-${i}`} value={file} className={cn(itemClass, "cursor-grab active:cursor-grabbing")}>
              <GripVertical size={14} className="shrink-0 text-neutral-300 dark:text-neutral-600" />
              {thumbnails && <FileThumbnail file={file} />}
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-auto shrink-0 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                aria-label={`Remove ${file.name}`}
              >
                <X size={16} />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {files.length > 0 && !sortable && (
        <ul className="flex flex-col gap-2">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className={itemClass}>
              {thumbnails && <FileThumbnail file={file} />}
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-auto shrink-0 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                aria-label={`Remove ${file.name}`}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
