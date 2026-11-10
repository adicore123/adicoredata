"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FolderOpen,
  ImageUp,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { Work, MediaItem } from "@/lib/types";
import { coverOf, isImage, isVideo } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import WorkForm from "@/components/WorkForm";

export default function AdminDashboard({
  initialWorks,
  categories,
}: {
  initialWorks: Work[];
  categories: string[];
}) {
  const router = useRouter();
  const [works, setWorks] = useState(initialWorks);
  const [editing, setEditing] = useState<Work | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = async () => {
    const res = await fetch("/api/works?all=1");
    setWorks(await res.json());
    startTransition(() => router.refresh());
  };

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    await fetch(`/api/works/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    await refresh();
    setBusyId(null);
  }

  async function remove(id: string) {
    setBusyId(id);
    await fetch(`/api/works/${id}`, { method: "DELETE" });
    setConfirmId(null);
    setBusyId(null);
    await refresh();
  }

  async function move(w: Work, dir: -1 | 1) {
    // החלפת סדר עם השכן ברשימה
    const sorted = [...works];
    const idx = sorted.findIndex((x) => x.id === w.id);
    const neighbor = sorted[idx + dir];
    if (!neighbor) return;
    await Promise.all([
      fetch(`/api/works/${w.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order: neighbor.order }),
      }),
      fetch(`/api/works/${neighbor.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order: w.order }),
      }),
    ]);
    await refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  if (editing) {
    return (
      <WorkForm
        work={editing === "new" ? null : editing}
        categories={categories}
        onCancel={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ניהול עבודות</h1>
          <p className="text-sm text-slate-500">{works.length} עבודות · {works.filter((w) => w.published).length} מפורסמות</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-2xl bg-mint-600 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-mint-700"
          >
            <Plus className="size-4" /> עבודה חדשה
          </button>
          <button
            onClick={logout}
            title="התנתקות"
            className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-soft transition hover:text-red-600"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      {works.length === 0 ? (
        <div className="card grid place-items-center border-dashed border-2 px-6 py-16 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-mint-500/10 text-mint-600">
            <FolderOpen className="size-8" />
          </span>
          <h3 className="mt-4 text-lg font-bold">עדיין אין עבודות</h3>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            צרו את העבודה הראשונה — תמונות, סרטונים ותיאור — והיא תופיע באתר הציבורי אחרי פרסום.
          </p>
          <button
            onClick={() => setEditing("new")}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-mint-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-mint-700"
          >
            <Plus className="size-4" /> יצירת עבודה
          </button>
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {works.map((w) => {
            const cover = coverOf(w);
            const busy = busyId === w.id;
            return (
              <li key={w.id} className={`flex items-center gap-3 p-3.5 ${busy ? "opacity-60" : ""}`}>
                <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-mint-50">
                  {cover ? (
                    isVideo(cover) ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={`/api/files/${cover.id}`} preload="metadata" muted playsInline className="size-full object-cover" />
                    ) : isImage(cover) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={`/api/files/${cover.id}`} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-xl">📄</span>
                    )
                  ) : (
                    <span className="text-xl">🗂️</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {w.title}
                    {w.featured && <Star className="ms-1.5 inline size-3.5 fill-current text-amber-400" />}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {[w.category, w.client, w.year].filter(Boolean).join(" · ") || "ללא פרטים"} ·{" "}
                    {w.media.length} קבצים · {w.views} צפיות
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-slate-100/70 p-0.5">
                  <button
                    onClick={() => patch(w.id, { published: !w.published })}
                    title={w.published ? "מפורסם — לחצו להסתרה" : "מוסתר — לחצו לפרסום"}
                    className={`grid size-8 place-items-center rounded-lg transition ${
                      w.published ? "text-mint-600 hover:bg-mint-100" : "text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {w.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    onClick={() => patch(w.id, { featured: !w.featured })}
                    title={w.featured ? "מודגש — בטל הדגשה" : "הדגשה"}
                    className={`grid size-8 place-items-center rounded-lg transition ${
                      w.featured ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    <Star className={`size-4 ${w.featured ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={() => move(w, -1)}
                    title="הזזה מוקדם"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-200"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    onClick={() => move(w, 1)}
                    title="הזזה מאוחר"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-200"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    onClick={() => setEditing(w)}
                    title="עריכה"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:text-mint-700"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setConfirmId(w.id)}
                    title="מחיקה"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-xs text-slate-400">
        קישור לאתר הציבורי:{" "}
        <Link href="/" className="font-semibold text-mint-600 underline underline-offset-4">
          AdiCore
        </Link>
      </p>

      {confirmId && (
        <div className="fade-in fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <button aria-label="סגירה" onClick={() => setConfirmId(null)} className="absolute inset-0" />
          <div className="card relative w-full max-w-sm p-5">
            <h3 className="text-base font-bold">מחיקת עבודה</h3>
            <p className="mt-2 text-sm text-slate-500">
              למחוק את "{works.find((w) => w.id === confirmId)?.title}"? כל הקבצים שלה יימחקו סופית.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => remove(confirmId)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                {busyId === confirmId && <Loader2 className="size-4 animate-spin" />} מחיקה סופית
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
