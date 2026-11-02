"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, Share2, Sparkles, Upload, X } from "lucide-react";
import { MODULES } from "@/lib/modules";
import { MODULE_IDS } from "@/lib/types";

function useLinks() {
  const pathname = usePathname();
  return [
    { href: "/", label: "ראשי", icon: LayoutDashboard },
    ...MODULE_IDS.map((id) => ({ href: `/${id}`, label: MODULES[id].label, icon: MODULES[id].icon })),
  ].map((link) => ({ ...link, active: pathname === link.href }));
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const links = useLinks();
  return (
    <div className="flex h-full flex-col gap-6">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 px-1">
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-soft">
          <Sparkles className="size-5" />
        </span>
        <span>
          <span className="block text-lg leading-tight font-black tracking-tight">Adidata</span>
          <span className="block text-xs text-slate-500">הקלטות · תמונות · מסמכים</span>
        </span>
      </Link>

      <nav className="space-y-1.5">
        {links.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              active
                ? "bg-mint-600 text-white shadow-soft"
                : "text-slate-600 hover:bg-mint-50 hover:text-mint-700"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-mint-100 bg-gradient-to-br from-mint-50 to-white p-4 text-xs leading-relaxed text-mint-900">
          <p className="flex items-center gap-1.5 font-bold">
            <Share2 className="size-3.5" /> שיתוף מוואטסאפ
          </p>
          <p className="mt-1.5 text-mint-800/80">
            אחרי התקנת האפליקציה: שתפו קובץ מוואטסאפ ← בחרו "Adidata", והוא ייפתח כאן להעלאה.
          </p>
        </div>
        <Link
          href="/upload"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <Upload className="size-4" /> העלאת קבצים
        </Link>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="lg:ps-72">
      {/* סיידבאר — דסקטופ */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 flex-col border-e border-slate-200/70 bg-white/80 px-5 py-6 backdrop-blur-xl lg:flex">
        <SidebarContent />
      </aside>

      {/* סרגל עליון — מובייל */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-app/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="פתיחת תפריט"
          className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-soft transition hover:text-mint-700"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-mint-400 to-mint-600 text-white">
            <Sparkles className="size-4" />
          </span>
          <span className="text-base font-black tracking-tight">Adidata</span>
        </Link>
        <Link
          href="/upload"
          aria-label="העלאת קבצים"
          className="grid size-10 place-items-center rounded-xl bg-mint-600 text-white shadow-soft transition hover:bg-mint-700"
        >
          <Upload className="size-5" />
        </Link>
      </header>

      {/* מגירה — מובייל */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="סגירת תפריט"
            onClick={() => setOpen(false)}
            className="fade-in absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="drawer-panel absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col border-e border-slate-200 bg-white px-5 py-6 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="סגירה"
              className="absolute end-4 top-5 grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">{children}</main>
    </div>
  );
}
