"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import type { Work } from "@/lib/types";
import { isVideo } from "@/lib/types";
import MediaLightbox from "@/components/MediaLightbox";

/** גלריית Masonry של מדיית העבודה + תצוגה מקדימה מתקדמת */
export default function WorkGallery({ work }: { work: Work }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!work.media.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">גלריית הפרויקט</h2>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {work.media.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setIndex(i)}
            aria-label={`תצוגה של ${m.name}`}
            style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
            className="card-in group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            {isVideo(m) ? (
              <span className="relative block">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={`/api/files/${m.id}`} preload="metadata" muted playsInline className="w-full" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-11 place-items-center rounded-full bg-mint-600/90 text-white shadow-lift backdrop-blur">
                    <Play className="size-5 fill-current" />
                  </span>
                </span>
              </span>
            ) : m.mime.startsWith("image/") ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/api/files/${m.id}`}
                alt={m.name}
                loading="lazy"
                className="w-full transition duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <span className="grid aspect-[4/3] w-full place-items-center bg-mint-50 text-sm font-bold text-mint-700">
                {m.ext.replace(".", "").toUpperCase()}
              </span>
            )}
          </button>
        ))}
      </div>

      {index !== null && work.media[index] && (
        <MediaLightbox
          items={work.media}
          index={index}
          title={work.title}
          onIndex={setIndex}
          onClose={() => setIndex(null)}
        />
      )}
    </section>
  );
}
