"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, File, Images, Play, Search, Star } from "lucide-react";
import { coverOf, isImage, isVideo, type Work } from "@/lib/types";
import MediaLightbox from "@/components/MediaLightbox";
import Reveal from "@/components/Reveal";
import Tilt3D from "@/components/Tilt3D";

function ProjectCard({ work, prominent, onPreview }: { work: Work; prominent: boolean; onPreview: () => void }) {
  const cover = coverOf(work);
  return (
    <Tilt3D className="h-full">
      <article
        className="group relative flex h-full flex-col rounded-3xl border border-studio-100/80 bg-white/85 p-2 shadow-soft backdrop-blur-xl"
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          event.currentTarget.querySelector("video")?.play().catch(() => {});
        }}
        onPointerLeave={(event) => event.currentTarget.querySelector("video")?.pause()}
      >
        <Link
          href={`/portfolio/work/${work.id}`}
          className="flex grow flex-col rounded-[1.15rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studio-600"
        >
          <div className={`relative grid place-items-center overflow-hidden rounded-[1.1rem] bg-[linear-gradient(135deg,#ded3fb,#f3eefe_61%,#e8deff)] px-5 pt-5 sm:px-8 sm:pt-8 ${prominent ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
            {cover && (isImage(cover) || isVideo(cover)) ? (
              <div className="relative h-full w-full max-w-4xl overflow-hidden rounded-t-xl border border-white/70 bg-white shadow-[0_8px_32px_#33415538] motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-[1.035]">
                <div aria-hidden className="flex h-5 items-center gap-1 border-b border-studio-100/80 bg-slate-50 px-2" dir="ltr">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                  <span className="size-1.5 rounded-full bg-slate-300" />
                  <span className="size-1.5 rounded-full bg-slate-300" />
                </div>
                {isVideo(cover) ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={`/api/files/${cover.id}`} preload="metadata" muted loop playsInline className="absolute inset-x-0 top-5 h-[calc(100%-1.25rem)] w-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center transition-opacity group-hover:opacity-0">
                      <span className="grid size-12 place-items-center rounded-full bg-white/95 text-studio-700 shadow-lg">
                        <Play aria-hidden className="size-5 fill-current" />
                      </span>
                    </span>
                  </>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={`/api/files/${cover.id}`} alt="" loading="lazy" className="absolute inset-x-0 top-5 h-[calc(100%-1.25rem)] w-full object-cover object-top" />
                )}
              </div>
            ) : (
              <File aria-hidden className="size-10 text-studio-500" />
            )}
            {work.featured && (
              <span title="עבודה מודגשת" className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-white text-amber-600 shadow-sm">
                <Star aria-hidden className="size-4 fill-current" />
                <span className="sr-only">עבודה מודגשת</span>
              </span>
            )}
          </div>
          <div className="flex grow items-center justify-between gap-3 px-3 pb-3 pt-4 sm:px-4">
            <div className="min-w-0">
              {(work.category || work.year) && (
                <p className="mb-1 font-copy text-sm font-bold text-studio-700">{[work.category, work.year].filter(Boolean).join(" · ")}</p>
              )}
              <h3 className={`break-words font-bold leading-snug text-ink ${prominent ? "text-xl sm:text-2xl" : "text-lg"}`}>{work.title}</h3>
              {work.client && <p className="mt-1 font-copy text-base text-muted">{work.client}</p>}
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-studio-100 bg-white text-studio-700 transition-colors group-hover:border-studio-200 group-hover:bg-studio-50">
              <ArrowUpLeft aria-hidden className="size-4" />
            </span>
          </div>
        </Link>
        {work.media.length > 1 && (
          <button type="button" onClick={onPreview} className="mb-2 ms-3 inline-flex min-h-10 w-fit items-center gap-2 rounded-xl bg-studio-50 px-3 text-sm font-semibold text-studio-800 transition-colors hover:bg-studio-100 focus-visible:outline-2 focus-visible:outline-studio-600 sm:ms-4">
            <Images aria-hidden className="size-4" />
            תצוגה מקדימה ({work.media.length})
          </button>
        )}
      </article>
    </Tilt3D>
  );
}

export default function PublicGallery({ works }: { works: Work[] }) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<{ work: Work; index: number } | null>(null);
  const categories = useMemo(() => [...new Set(works.map((work) => work.category).filter(Boolean))], [works]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return works.filter((work) => (
      (!category || work.category === category) &&
      (!term || `${work.title} ${work.description} ${work.tags.join(" ")}`.toLowerCase().includes(term))
    )).sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [works, category, query]);

  return (
    <section aria-labelledby="work-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-studio-100 pb-5">
        <h2 id="work-title" className="text-[clamp(2rem,4.2vw,3.25rem)] font-extrabold tracking-[-0.045em] text-ink">עבודות נבחרות</h2>
        {works.length > 0 && <span className="font-copy text-base text-muted" aria-live="polite">{filtered.length} {filtered.length === 1 ? "פרויקט" : "פרויקטים"}</span>}
      </div>

      {(categories.length > 0 || works.length > 3) && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="סינון לפי קטגוריה" role="group">
              {["", ...categories].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className="min-h-10 rounded-full border border-studio-100 bg-white px-4 text-sm font-semibold text-muted transition-colors hover:border-studio-300 aria-pressed:border-studio-600 aria-pressed:bg-studio-600 aria-pressed:text-white"
                >
                  {item || "הכול"}
                </button>
              ))}
            </div>
          )}
          {works.length > 3 && (
            <label className="relative ms-auto min-w-44 flex-1 sm:max-w-64">
              <Search aria-hidden className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <span className="sr-only">חיפוש עבודה</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש עבודה…" className="w-full rounded-xl border border-studio-100 bg-white py-2.5 pe-4 ps-9 text-sm focus-visible:outline-2 focus-visible:outline-studio-600" />
            </label>
          )}
        </div>
      )}

      {filtered.length ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
          {filtered.map((work, index) => (
            <Reveal
              key={work.id}
              delay={Math.min(index, 4) * 55}
              className={index === 0 ? (filtered.length === 1 ? "sm:col-span-2 lg:col-span-5" : "lg:col-span-4") : "lg:col-span-2"}
            >
              <ProjectCard work={work} prominent={index === 0} onPreview={() => setPreview({ work, index: 0 })} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-studio-100 bg-white px-6 py-12 text-center">
          <p className="font-bold text-muted">{works.length ? "לא נמצאו עבודות שמתאימות לחיפוש" : "עדיין אין עבודות להצגה"}</p>
          {works.length > 0 && <button type="button" onClick={() => { setQuery(""); setCategory(""); }} className="mt-3 font-semibold text-studio-700 underline">איפוס סינון</button>}
        </div>
      )}

      {preview && (
        <MediaLightbox
          items={preview.work.media}
          index={preview.index}
          title={preview.work.title}
          onIndex={(index) => setPreview({ work: preview.work, index })}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
