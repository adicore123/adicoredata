"use client";

import { useRef } from "react";

/**
 * גל סאונד ניתן ללחיצה/גרירה: הפסים שכבר הושמעו נצבעים כהה.
 * peaks=null → ברים אחידים עדינים (עד שהפענוח מסתיים או אם נכשל).
 */
export default function Waveform({
  peaks,
  progress,
  onSeekFraction,
  height = "h-10",
}: {
  peaks: number[] | null;
  /** 0–1 */
  progress: number;
  onSeekFraction: (frac: number) => void;
  height?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const bars = peaks ?? Array.from({ length: 72 }, (_, i) => 0.25 + 0.2 * Math.abs(Math.sin(i / 3)));

  const seekFromPointer = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onSeekFraction(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)));
  };

  const playedIdx = Math.floor(progress * bars.length);

  return (
    <div
      ref={ref}
      dir="ltr"
      role="slider"
      aria-label="ציר הזמן של ההקלטה"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        seekFromPointer(e.clientX);
      }}
      onPointerMove={(e) => draggingRef.current && seekFromPointer(e.clientX)}
      onPointerUp={() => (draggingRef.current = false)}
      onPointerCancel={() => (draggingRef.current = false)}
      className={`group flex w-full cursor-pointer touch-none items-center gap-[2px] ${height}`}
    >
      {bars.map((p, i) => (
        <span
          key={i}
          className={`flex-1 rounded-full transition-colors ${
            i < playedIdx ? "bg-mint-600" : peaks ? "bg-mint-300/70" : "bg-mint-200"
          }`}
          style={{ height: `${Math.max(8, p * 100)}%` }}
        />
      ))}
    </div>
  );
}
