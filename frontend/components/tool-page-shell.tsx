import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

export function ToolPageShell({
  title,
  description,
  wide,
  children,
}: {
  title: string;
  description: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className={cn("mx-auto flex items-center justify-between px-6 py-4", wide ? "max-w-5xl" : "max-w-2xl")}>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            All tools
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className={cn("mx-auto w-full flex-1 px-6 py-12", wide ? "max-w-5xl" : "max-w-2xl")}>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">{description}</p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
