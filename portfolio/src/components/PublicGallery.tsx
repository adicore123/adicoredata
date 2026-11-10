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
                className="card-in group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <Link
                  href={`/portfolio/work/${work.id}`}
                  className="block aspect-[4/3] overflow-hidden bg-mint-50"
                  aria-label={work.title}
                >
                  <span className="relative block size-full">
                    {cover ? (
                      isVideo(cover) ? (
                        <>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video
                            src={`/api/files/${cover.id}`}
                            preload="metadata"
                            muted
                            playsInline
                            className="size-full object-cover transition duration-700 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 grid place-items-center bg-slate-900/25 transition group-hover:bg-slate-900/15">
                            <span className="grid size-12 place-items-center rounded-full bg-white/90 text-mint-700 shadow-lift transition group-hover:scale-110">
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
                          className="size-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-4xl">📄</span>
                      )
                    ) : (
                      <span className="grid size-full place-items-center text-4xl">🗂️</span>
                    )}

                    {/* שכבת גרדיאנט + תוכן על התמונה */}
                    <span className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-transparent" />
                    {work.featured && (
                      <span className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-amber-400 shadow-soft backdrop-blur">
                        <Star className="size-4 fill-current" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                      <span className="flex items-center gap-2">
                        {work.category && (
                          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur">
                            {work.category}
                          </span>
                        )}
                        {work.year && <span className="text-[11px] font-semibold text-white/70">{work.year}</span>}
                      </span>
                      <span className="mt-1.5 block text-base font-bold leading-snug drop-shadow-sm">{work.title}</span>
                      {work.client && (
                        <span className="mt-0.5 block truncate text-xs text-white/70">{work.client}</span>
                      )}
                    </span>
                  </span>
                </Link>
                {work.media.length > 1 && (
                  <button
                    onClick={() => setPreview({ work, index: 0 })}
                    className="absolute bottom-4 start-4 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-mint-700 shadow-soft backdrop-blur transition hover:scale-105 hover:bg-white"
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
