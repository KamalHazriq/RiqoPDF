import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-surface shadow-[var(--shadow-resting)] dark:border-neutral-800",
        className,
      )}
      {...props}
    />
  );
}
