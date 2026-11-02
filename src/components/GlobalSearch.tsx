"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, SearchX } from "lucide-react";
import type { Item } from "@/lib/types";
import { MODULES } from "@/lib/modules";
import { MODULE_IDS } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/format";

export default function GlobalSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setItems(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items?q=${encodeURIComponent(q)}`);
        setItems(await res.json());
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const groups = MODULE_IDS.map((id) => ({
    id,
    meta: MODULES[id],
    items: (items ?? []).filter((i) => i.module === id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <label className="relative block">
        <Search className="absolute top-1/2 start-4 size-5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="מה לחפש? למשל: שיעור, סיכום, IMG-2026…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 ps-12 pe-4 text-base shadow-soft outline-none transition placeholder:text-slate-400 focus:border-mint-400 focus:ring-2 focus:ring-mint-200"
        />
      </label>

      {loading && (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" /> מחפש…
        </p>
      )}

      {!loading && query.trim() && items !== null && items.length === 0 && (
        <div className="card grid place-items-center border-dashed border-2 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-mint-500/10 text-mint-600">
            <SearchX className="size-7" />
          </span>
          <h3 className="mt-3 font-bold">לא נמצאו תוצאות עבור "{query.trim()}"</h3>
          <p className="mt-1 text-sm text-slate-500">נסו מילה קצרה יותר או חלק משם הקובץ.</p>
        </div>
      )}

      {!loading &&
        groups.map((group) => {
          const Icon = group.meta.icon;
          return (
            <section key={group.id} className="card overflow-hidden">
              <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
                <Icon className="size-4 text-mint-600" />
                {group.meta.label}
                <span className="rounded-full bg-mint-50 px-2 py-0.5 text-xs font-bold text-mint-700">
                  {group.items.length}
                </span>
              </h2>
              <ul className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/${item.module}?q=${encodeURIComponent(item.title)}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-mint-50/60"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint-500/10 text-mint-600">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {item.name} · {formatBytes(item.size)} · {formatDate(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
