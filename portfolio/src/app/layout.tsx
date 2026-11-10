import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Rubik } from "next/font/google";
import { Layers } from "lucide-react";
import "./globals.css";

const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik" });

export const metadata: Metadata = {
  title: { default: "AdiCore — תיק עבודות", template: "%s | AdiCore" },
  description: "עבודות נבחרות — אתרים, מערכות וחוויות דיגיטליות",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0d8a66",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} min-h-dvh font-sans text-slate-900 antialiased`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-app/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-soft">
                <Layers className="size-5" />
              </span>
              <span className="text-lg font-black tracking-tight">AdiCore</span>
            </Link>
            <Link
              href="/admin"
              title="ניהול עבודות"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-500 shadow-soft transition hover:border-mint-300 hover:text-mint-700"
            >
              ניהול
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 sm:px-6">{children}</main>
        <footer className="border-t border-slate-200/60 py-6 text-center text-xs text-slate-400">
          AdiCore © {new Date().getFullYear()} — כל העבודות שמורות
        </footer>
      </body>
    </html>
  );
}
