"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, downloadBlob, filenameFromDisposition } from "@/lib/api";

type Stage = "idle" | "processing" | "done" | "error";

interface ProcessFlowProps {
  canRun: boolean;
  run: () => Promise<Response>;
  fallbackFilename: string;
  runLabel?: string;
  /** Extra info to render once the result is ready, e.g. compression stats. */
  renderResultInfo?: (res: Response) => React.ReactNode;
}

export function ProcessFlow({
  canRun,
  run,
  fallbackFilename,
  runLabel = "Process",
  renderResultInfo,
}: ProcessFlowProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string; response: Response } | null>(null);

  async function handleRun() {
    setStage("processing");
    setError(null);
    try {
      const res = await run();
      const blob = await res.blob();
      setResult({ blob, filename: filenameFromDisposition(res, fallbackFilename), response: res });
      setStage("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setStage("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button size="lg" disabled={!canRun} onClick={handleRun} className="w-full">
              {runLabel}
            </Button>
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 p-8 dark:border-neutral-800"
          >
            <Loader2 className="animate-spin text-neutral-500" size={28} />
            <p className="text-sm text-neutral-500">Processing your file…</p>
          </motion.div>
        )}

        {stage === "done" && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 rounded-xl border border-neutral-200 p-8 dark:border-neutral-800"
          >
            <CheckCircle2 className="text-green-600" size={32} />
            <p className="text-sm font-medium">Your file is ready</p>
            {renderResultInfo?.(result.response)}
            <Button onClick={() => downloadBlob(result.blob, result.filename)}>
              <Download size={16} />
              Download {result.filename}
            </Button>
            <button
              type="button"
              onClick={() => setStage("idle")}
              className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Run again
            </button>
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950"
          >
            <XCircle className="text-red-600" size={28} />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button variant="outline" onClick={() => setStage("idle")}>
              Try again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
