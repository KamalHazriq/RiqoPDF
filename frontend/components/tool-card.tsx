import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools-catalog";

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = (Icons[tool.icon as keyof typeof Icons] as LucideIcon) ?? Icons.File;
  const isAvailable = tool.status === "available";

  const content = (
    <Card
      className={cn(
        "flex h-full flex-col gap-3 p-5 transition-[box-shadow,transform,border-color] duration-150 ease-out",
        isAvailable &&
          "group-hover:shadow-[var(--shadow-hover)] group-hover:-translate-y-0.5 group-hover:border-primary/30 group-focus-visible:shadow-[var(--shadow-hover)] group-focus-visible:-translate-y-0.5 group-focus-visible:border-primary group-focus-visible:ring-2 group-focus-visible:ring-primary/40 dark:group-hover:border-neutral-700 dark:group-focus-visible:border-neutral-700",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-tint text-primary-text dark:bg-neutral-900">
          <Icon size={20} />
        </div>
        {!isAvailable && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            Coming soon
          </span>
        )}
        {isAvailable && tool.local && (
          <span className="rounded-full bg-local-tint px-2 py-0.5 text-[11px] font-medium text-local-deep">
            In your browser
          </span>
        )}
      </div>
      <div>
        <h3 className="font-medium text-neutral-900 dark:text-white">{tool.name}</h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{tool.description}</p>
      </div>
    </Card>
  );

  if (!isAvailable) {
    return <div className="cursor-not-allowed opacity-60">{content}</div>;
  }

  return (
    <Link href={`/tools/${tool.slug}`} className="group block h-full focus-visible:outline-none">
      {content}
    </Link>
  );
}
