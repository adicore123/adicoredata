"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Play, Search, Star } from "lucide-react";
import type { Work } from "@/lib/types";
import { coverOf, isVideo } from "@/lib/types";
import MediaLightbox from "@/components/MediaLightbox";

/** גלריית העבודות הציבורית: סינון קטגוריות, חיפוש, כרטיסים ותצוגה מקדימה מתקדמת */
export default function PublicGallery({ works }: { works: Work[] }) {
  const [category, setCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<{ work: Work; index: number } | null>(null);

  const categories = useMemo(
    () => [...new Set(works.map((w) => w.category).filter(Boolean))],
    [works],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = works;
    if (category) out = out.filter((w) => w.category === category);
    if (q) out = out.filter((w) => `${w.title} ${w.description} ${w.tags.join(" ")}`.toLowerCase().includes(q));
    // מודגשות ראשונות
    return [...out].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [works, category, query]);

  return (
    <section id="works" className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">העבודות</h2>
        <span className="rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-700">
          {filtered.length}
        </span>
        <label className="relative ms-auto min-w-44 flex-1 sm:max-w-72">
          <Search className="absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש עבודה…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm shadow-soft outline-none transition placeholder:text-slate-400 focus:border-mint-400 focus:ring-2 focus:ring-mint-200"
          />
        </label>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              !category ? "bg-mint-600 text-white shadow-soft" : "bg-white text-slate-500 border border-slate-200 hover:border-mint-300"
            }`}
          >
            הכול
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? "" : c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                category === c
                  ? "bg-mint-600 text-white shadow-soft"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-mint-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card grid place-items-center border-dashed border-2 px-6 py-16 text-center">
          <p className="text-lg font-bold">עדיין אין עבודות להצגה</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            העבודות יופיעו כאן ברגע שיפורסמו מאזור הניהול.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((work, idx) => {
            const cover = coverOf(work);
            return (
              <article
                key={work.id}
                style={{ animationDelay: `${Math.min(idx, 9) * 60}ms` }}
                className="card-in card group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-4 top-0 z-10 h-px bg-gradient-to-l from-transparent via-mint-400/60 to-transparent"
                />
                <Link href={`/work/${work.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-mint-50">
                    {cover ? (
                      isVideo(cover) ? (
                        <>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video
                            src={`/api/files/${cover.id}`}
                            preload="metadata"
                            muted
                            playsInline
                            className="size-full object-cover"
                          />
                          <span className="absolute inset-0 grid place-items-center bg-slate-900/20">
                            <span className="grid size-12 place-items-center rounded-full bg-white/90 text-mint-700 shadow-lift">
                              <Play className="size-6 fill-current" />
                            </span>
                          </span>
                        </>
                      ) : cover.mime.startsWith("image/") ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={`/api/files/${cover.id}`}
                          alt={work.title}
                          loading="lazy"
                          className="size-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-4xl">📄</span>
                      )
                    ) : (
                      <span className="grid size-full place-items-center text-4xl">🗂️</span>
                    )}
                    {work.featured && (
                      <span className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-amber-400 shadow-soft backdrop-blur">
                        <Star className="size-4 fill-current" />
                      </span>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="min-w-0 truncate text-base font-bold">{work.title}</h3>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                        <Eye className="size-3.5" /> {work.views}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      {work.category && (
                        <span className="rounded-md bg-mint-50 px-1.5 py-0.5 font-bold text-mint-700">
                          {work.category}
                        </span>
                      )}
                      {work.client && <span>{work.client}</span>}
                      {work.year && <span>· {work.year}</span>}
                    </div>
                    {work.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {work.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
                {work.media.length > 1 && (
                  <button
                    onClick={() => setPreview({ work, index: 0 })}
                    className="absolute bottom-4 start-4 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-mint-700 shadow-soft backdrop-blur transition hover:bg-white"
                    title="תצוגה מקדימה מהירה"
                  >
                    תצוגה מקדימה ({work.media.length})
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {preview && preview.work.media.length > 0 && (
        <MediaLightbox
          items={preview.work.media}
          index={preview.index}
          title={preview.work.title}
          onIndex={(i) => setPreview({ work: preview.work, index: i })}
          onClose={() => setPreview(null)}
        />
      )}

      <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-slate-400">
        לוחצים על עבודה לעמוד המלא
        <ArrowLeft className="size-3.5" />
      </p>
    </section>
  );
}
