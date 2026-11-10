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
          <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 sm:px-6">
            <Link href="/portfolio" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-soft">
                <Layers className="size-5" />
              </span>
              <span className="text-lg font-black tracking-tight">AdiCore</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 sm:px-6">{children}</main>
        <footer className="border-t border-slate-200/60 py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1.5 px-4 text-center sm:px-6">
            <p className="flex items-center gap-2 text-sm font-black tracking-tight">
              <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-mint-400 to-mint-600 text-white">
                <Layers className="size-3.5" />
              </span>
              AdiCore
            </p>
            <p className="text-xs text-slate-400">אתרים, מערכות וחוויות דיגיטליות</p>
            <p className="text-xs text-slate-300">© {new Date().getFullYear()} — כל העבודות שמורות</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
