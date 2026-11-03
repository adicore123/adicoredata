"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import type { Item } from "@/lib/types";
import { usePlayer } from "@/components/PlayerProvider";
import Waveform from "@/components/Waveform";
import { loadProgress } from "@/lib/playback";
import { getPeaks } from "@/lib/waveform";

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** בקר ההאזנה שעל כרטיס ההקלטה — מנוהל על ידי הנגן הגלובלי, כולל גל סאונד והמשך האזנה */
export default function AudioPlayer({ item }: { item: Item }) {
  const player = usePlayer();
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [saved, setSaved] = useState(() => loadProgress(item.id));
  const rootRef = useRef<HTMLDivElement | null>(null);

  const active = player.item?.id === item.id;
  const time = active ? player.time : (saved?.t ?? 0);
  const duration = active ? player.duration : (saved?.d ?? 0);
  const progress = duration ? Math.min(1, time / duration) : 0;

  // גל הסאונד מחושב בטעינה עצלה — רק כשהכרטיס נכנס למסך
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      getPeaks(item.id, `/api/files/${item.id}`).then(setPeaks);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          getPeaks(item.id, `/api/files/${item.id}`).then(setPeaks);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [item.id]);

  // כשעוזבים את ההקלטה — מרעננים את ההתקדמות השמורה לתצוגה
  useEffect(() => {
    if (!active) setSaved(loadProgress(item.id));
  }, [active, item.id]);

  const seekFraction = (frac: number) => {
    if (active && duration) player.seek(frac * player.duration);
    else player.play(item); // הנגינה תמשיך אוטומטית מהמקום השמור
  };

  return (
    // ציר הזמן בכיוון שמאל→ימין — המוסכמה האוניברסלית של נגני מדיה גם בממשקי RTL
    <div ref={rootRef} dir="ltr" className="mt-2.5 rounded-2xl border border-mint-100 bg-mint-50/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => (active ? player.toggle() : player.play(item))}
          aria-label={active && player.playing ? "השהיה" : "נגינה"}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-600 text-white shadow-soft transition hover:bg-mint-700"
        >
          {active && player.loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : active && player.playing ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 fill-current" />
          )}
        </button>

        <button
          onClick={() => (active ? player.skip(-10) : player.play(item))}
          aria-label="10 שניות אחורה"
          title="10 שניות אחורה"
          className="grid size-9 shrink-0 place-items-center rounded-full text-mint-700 transition hover:bg-mint-100"
        >
          <span className="flex items-center">
            <RotateCcw className="size-4" />
            <span className="text-[10px] font-extrabold">10</span>
          </span>
        </button>
        <button
          onClick={() => (active ? player.skip(10) : player.play(item))}
          aria-label="10 שניות קדימה"
          title="10 שניות קדימה"
          className="grid size-9 shrink-0 place-items-center rounded-full text-mint-700 transition hover:bg-mint-100"
        >
          <span className="flex items-center">
            <span className="text-[10px] font-extrabold">10</span>
            <RotateCw className="size-4" />
          </span>
        </button>

        <span className="w-10 shrink-0 tabular-nums text-xs font-bold text-mint-800">{fmt(time)}</span>

        <Waveform peaks={peaks} progress={progress} onSeekFraction={seekFraction} />

        <span className="w-10 shrink-0 text-end tabular-nums text-xs font-semibold text-mint-700">
          {fmt(duration)}
        </span>

        <button
          onClick={player.cycleRate}
          title="מהירות נגינה"
          className="shrink-0 rounded-full border border-mint-300 bg-white px-2.5 py-1 text-xs font-extrabold text-mint-700 transition hover:bg-mint-100"
        >
          {player.rate}×
        </button>
      </div>
    </div>
  );
}
