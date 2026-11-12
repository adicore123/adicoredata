import type { Metadata, Viewport } from "next";
import { Assistant, Rubik } from "next/font/google";
import { Layers } from "lucide-react";
import "./globals.css";
import ScrollProgress from "@/components/ScrollProgress";
import Preloader from "@/components/Preloader";
import HeaderBar from "@/components/HeaderBar";
import BackToTop from "@/components/BackToTop";

const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", display: "swap" });
const assistant = Assistant({ subsets: ["hebrew", "latin"], variable: "--font-assistant", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AdiCore — תיק עבודות", template: "%s | AdiCore" },
  description: "עבודות נבחרות — אתרים, מערכות וחוויות דיגיטליות",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#f8f7fc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} ${assistant.variable} min-h-dvh font-sans text-ink antialiased`}>
        <Preloader />
        <ScrollProgress />
        <HeaderBar />
        <main className="w-full pb-24">{children}</main>
        <BackToTop />
        <footer className="border-t border-slate-200/60 py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1.5 px-4 text-center sm:px-6">
            <p className="flex items-center gap-2 text-sm font-black tracking-tight">
              <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-studio-500 to-studio-700 text-white">
                <Layers className="size-3.5" />
              </span>
              AdiCore
            </p>
            <p className="font-copy text-sm text-muted">אתרים, מערכות וחוויות דיגיטליות</p>
            <p className="font-copy text-sm text-muted">© {new Date().getFullYear()} — כל העבודות שמורות</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
