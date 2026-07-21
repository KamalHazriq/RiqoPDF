import { ShieldCheck } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { CATEGORIES } from "@/lib/tools-catalog";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">RiqoPDF</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <ShieldCheck size={16} />
              Files auto-deleted after processing
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Every PDF tool you need. <span className="text-neutral-400">Completely free.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-500 dark:text-neutral-400">
          One place for every PDF task — convert, edit, compress, organize, and secure your
          documents. Tools marked{" "}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">In your browser</span>{" "}
          process files entirely on your device; the rest use a server that deletes everything
          after processing.
        </p>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24">
        {CATEGORIES.map((category) => (
          <section key={category.name} className="mb-12">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-400">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-400 dark:border-neutral-800">
        RiqoPDF — a free, privacy-first PDF toolkit.
      </footer>
    </div>
  );
}
