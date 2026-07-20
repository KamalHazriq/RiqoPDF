import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Tool } from "@/lib/tools-catalog";

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = (Icons[tool.icon as keyof typeof Icons] as LucideIcon) ?? Icons.File;
  const isAvailable = tool.status === "available";

  const content = (
    <Card className="group flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-md hover:shadow-neutral-900/5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white">
          <Icon size={20} />
        </div>
        {!isAvailable && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            Coming soon
          </span>
        )}
        {isAvailable && tool.local && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
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
    <Link href={`/tools/${tool.slug}`} className="block h-full">
      {content}
    </Link>
  );
}
