import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ToolPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            All tools
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">{description}</p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
