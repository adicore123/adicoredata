"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Undo2 } from "lucide-react";
import type { Item } from "@/lib/types";
import { MODULES } from "@/lib/modules";
import { formatBytes, formatDate } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysLeft(deletedAt: string): number {
  return Math.max(0, Math.ceil((new Date(deletedAt).getTime() + 30 * DAY_MS - Date.now()) / DAY_MS));
}

export default function TrashView({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<Item | null>(null);
  const [wiping, setWiping] = useState(false);

  const refresh = () => startTransition(() => router.refresh());

  async function restore(id: string) {
    setBusyId(id);
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    setBusyId(null);
    refresh();
  }

  async function wipe(id: string) {
    setWiping(true);
    await fetch(`/api/items/${id}?permanent=1`, { method: "DELETE" });
    setWiping(false);
    setConfirmItem(null);
    refresh();
  }

  if (!items.length) {
    return (
      <div className="card grid place-items-center border-dashed border-2 px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-3xl bg-mint-500/10 text-mint-600">
          <Trash2 className="size-8" />
        </span>
        <h3 className="mt-4 text-lg font-bold">הסל ריק</h3>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          קבצים שתמחקו מהמודולים יופיעו כאן ותוכלו לשחזר אותם עד 30 יום.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${pending ? "opacity-60" : ""}`}>
      <ul className="card divide-y divide-slate-100">
        {items.map((item) => {
          const Icon = MODULES[item.module].icon;
          const busy = busyId === item.id;
          return (
            <li key={item.id} className="flex items-center gap-3 p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint-500/10 text-mint-600">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{item.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {MODULES[item.module].label} · {formatBytes(item.size)} · נמחק {formatDate(item.createdAt)}
                </p>
              </div>
              <span className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:block">
                נשארו {daysLeft(item.deletedAt!)} ימים
              </span>
              <button
                onClick={() => restore(item.id)}
                disabled={busy}
                aria-label={`שחזור ${item.title}`}
                title="שחזור"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint-50 text-mint-700 transition hover:bg-mint-100 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
              </button>
              <button
                onClick={() => setConfirmItem(item)}
                aria-label={`מחיקה סופית של ${item.title}`}
                title="מחיקה לצמיתות"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {confirmItem && (
        <div className="fixed inset-0 z-60 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm fade-in">
          <button aria-label="סגירה" onClick={() => setConfirmItem(null)} className="absolute inset-0" />
          <div className="card relative w-full max-w-sm p-5">
            <h3 className="text-base font-bold">מחיקה לצמיתות</h3>
            <p className="mt-2 text-sm text-slate-500">
              למחוק את "{confirmItem.title}" לצמיתות? לא ניתן יהיה לשחזר אותו.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => wipe(confirmItem.id)}
                disabled={wiping}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {wiping && <Loader2 className="size-4 animate-spin" />}
                מחיקה סופית
              </button>
              <button
                onClick={() => setConfirmItem(null)}
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
