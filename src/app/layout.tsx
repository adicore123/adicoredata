import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import PlayerProvider from "@/components/PlayerProvider";
import PwaRegister from "@/components/PwaRegister";

const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik" });

export const metadata: Metadata = {
  title: { default: "Adidata", template: "%s | Adidata" },
  description: "ניהול הקלטות, תמונות ומסמכים — כולל שיתוף ישירות מוואטסאפ",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Adidata" },
};

export const viewport: Viewport = {
  themeColor: "#1fa87e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} min-h-dvh font-sans text-slate-900 antialiased`}>
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
