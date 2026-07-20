import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiqoPDF — Every PDF tool you need",
  description: "A free, privacy-first PDF toolkit. Convert, edit, compress, organize, and secure PDFs — no account required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        {children}
      </body>
    </html>
  );
}
