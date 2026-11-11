"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Play, Search, Star } from "lucide-react";
import type { Work } from "@/lib/types";
import { coverOf, isVideo } from "@/lib/types";
import MediaLightbox from "@/components/MediaLightbox";
import Reveal from "@/components/Reveal";
import Tilt3D from "@/components/Tilt3D";

/** תיק העבודות — פס Spotlight כהה, Bento-grid אסימטרי, וידאו בריחוף וחשיפה בגלילה */
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
    return [...out].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [works, category, query]);

  const playHover = (el: HTMLElement | null, play: boolean) => {
    const video = el?.querySelector("video");
    if (!video) return;
    if (play) video.play().catch(() => {});
    else video.pause();
  };

  return (
    <section className="noise relative overflow-hidden rounded-[2rem] bg-mint-900 px-5 py-10 sm:px-8 sm:py-14">
      {/* זוהר עדין מלמעלה */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(126,214,183,0.14),transparent)]"
      />

      <Reveal className="relative">
        <p className="text-sm font-bold tracking-wide text-mint-300">— תיק העבודות</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-black text-white sm:text-4xl">עבודות נבחרות</h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-mint-200">
            {filtered.length} פרויקטים
          </span>
        </div>
      </Reveal>

      {(categories.length > 0 || works.length > 3) && (
        <Reveal delay={80} className="relative mt-6 flex flex-wrap items-center gap-3">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory("")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  !category
                    ? "bg-mint-400 text-mint-900 shadow-soft"
                    : "border border-white/20 bg-white/5 text-white/70 hover:border-mint-300/60 hover:text-white"
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
                      ? "bg-mint-400 text-mint-900 shadow-soft"
                      : "border border-white/20 bg-white/5 text-white/70 hover:border-mint-300/60 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {works.length > 3 && (
            <label className="relative ms-auto min-w-44 flex-1 sm:max-w-64">
              <Search className="absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש עבודה…"
                className="w-full rounded-2xl border border-white/20 bg-white/5 py-2.5 ps-10 pe-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-mint-300/60 focus:ring-2 focus:ring-mint-400/30"
              />
            </label>
          )}
        </Reveal>
      )}

      {filtered.length === 0 ? (
        <div className="relative mt-10 grid place-items-center rounded-3xl border-2 border-dashed border-white/15 px-6 py-16 text-center">
          <p className="text-lg font-bold text-white/80">עדיין אין עבודות להצגה</p>
          <p className="mt-1 max-w-sm text-sm text-white/50">העבודות יופיעו כאן ברגע שיפורסמו.</p>
        </div>
      ) : (
        <div className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {filtered.map((work, idx) => {
            const cover = coverOf(work);
            const big = idx === 0; // העבודה הראשונה (המודגשת) — תא כפול
            const span = big
              ? works.length === 1
                ? "lg:col-span-6"
                : "lg:col-span-4"
              : "lg:col-span-2";
            return (
              <Reveal
                key={work.id}
                delay={Math.min(idx, 6) * 70}
                className={span}
              >
                <Tilt3D className="h-full">
                  <article
                    onMouseEnter={(e) => playHover(e.currentTarget, true)}
                    onMouseLeave={(e) => playHover(e.currentTarget, false)}
                    className={`group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-mint-800/40 shadow-soft transition-all duration-500 hover:border-mint-300/50 hover:shadow-[0_24px_60px_-20px_rgba(69,194,151,0.45)] ${
                      big ? "aspect-[16/10] lg:aspect-auto" : "aspect-[4/3]"
                    } lg:h-full`}
                  >
                  <Link
                    href={`/portfolio/work/${work.id}`}
                    className="absolute inset-0"
                    aria-label={work.title}
                  >
                    {cover ? (
                      isVideo(cover) ? (
                        <>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video
                            src={`/api/files/${cover.id}`}
                            preload="metadata"
                            muted
                            loop
                            playsInline
                            className="size-full object-cover transition duration-700 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 grid place-items-center bg-slate-900/25 transition group-hover:bg-slate-900/10">
                            <span className="grid size-12 place-items-center rounded-full bg-white/90 text-mint-700 shadow-lift transition duration-300 group-hover:scale-110">
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
                        <span className="grid size-full place-items-center bg-mint-800 text-4xl">📄</span>
                      )
                    ) : (
                      <span className="grid size-full place-items-center bg-mint-800 text-4xl">🗂️</span>
                    )}

                    <span className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                    {work.featured && (
                      <span className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-amber-400 shadow-soft backdrop-blur">
                        <Star className="size-4 fill-current" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                      <span className="flex items-center gap-2">
                        {work.category && (
                          <span className="rounded-full bg-mint-400/25 px-2.5 py-0.5 text-[11px] font-bold text-mint-100 backdrop-blur">
                            {work.category}
                          </span>
                        )}
                        {work.year && <span className="text-[11px] font-semibold text-white/60">{work.year}</span>}
                      </span>
                      <span
                        className={`mt-1.5 block font-bold leading-snug drop-shadow-sm ${
                          big ? "text-xl sm:text-2xl" : "text-base"
                        }`}
                      >
                        {work.title}
                      </span>
                      {work.client && (
                        <span className="mt-0.5 block truncate text-xs text-white/70">{work.client}</span>
                      )}
                    </span>
                  </Link>
                  {work.media.length > 1 && (
                    <button
                      onClick={() => setPreview({ work, index: 0 })}
                      className="absolute bottom-4 start-4 z-10 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white shadow-soft backdrop-blur transition hover:scale-105 hover:bg-white/25"
                      title="תצוגה מקדימה מהירה"
                    >
                      תצוגה מקדימה ({work.media.length})
                    </button>
                  )}
                  </article>
                </Tilt3D>
              </Reveal>
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
    </section>
  );
}
