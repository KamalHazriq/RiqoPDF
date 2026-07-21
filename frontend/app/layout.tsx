import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiqoPDF — Every PDF tool you need",
  description: "A free, privacy-first PDF toolkit. Convert, edit, compress, organize, and secure PDFs — no account required.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Runs before paint so the manual theme choice (or system preference) applies with no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        {children}
      </body>
    </html>
  );
}
