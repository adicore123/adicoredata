"use client";

import { useRef, useState } from "react";
import { Loader2, Pause, Play, RotateCcw, RotateCw } from "lucide-react";

const RATES = [1, 1.25, 1.5, 2];

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** נגן אודיו מקצועי — נגינה/השהיה, דילוג ±10 שניות, גרירה על ציר הזמן ושליטה במהירות. */
export default function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);

  const seekFromPointer = (clientX: number) => {
    const bar = barRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setTime(audio.currentTime);
  };

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setLoading(true);
      try {
        await audio.play();
      } catch {
        /* ההשמעה נדחתה — ננסה שוב בלחיצה הבאה */
      } finally {
        setLoading(false);
      }
    } else {
      audio.pause();
    }
  };

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration || Infinity, audio.currentTime + delta));
    setTime(audio.currentTime);
  };

  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    // ציר הזמן בכיוון שמאל→ימין — המוסכמה האוניברסלית של נגני מדיה גם בממשקי RTL
    <div dir="ltr" className="mt-2.5 rounded-2xl border border-mint-100 bg-mint-50/70 px-3 py-2.5">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          e.currentTarget.playbackRate = rate;
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          aria-label={playing ? "השהיה" : "נגינה"}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-600 text-white shadow-soft transition hover:bg-mint-700"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : playing ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 fill-current" />
          )}
        </button>

        <button
          onClick={() => skip(-10)}
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
          onClick={() => skip(10)}
          aria-label="10 שניות קדימה"
          title="10 שניות קדימה"
          className="grid size-9 shrink-0 place-items-center rounded-full text-mint-700 transition hover:bg-mint-100"
        >
          <span className="flex items-center">
            <span className="text-[10px] font-extrabold">10</span>
            <RotateCw className="size-4" />
          </span>
        </button>

        <span className="shrink-0 tabular-nums text-xs font-bold text-mint-800">{fmt(time)}</span>

        <div
          ref={barRef}
          role="slider"
          aria-label="התקדמות ההקלטה"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          onPointerDown={(e) => {
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekFromPointer(e.clientX);
          }}
          onPointerMove={(e) => draggingRef.current && seekFromPointer(e.clientX)}
          onPointerUp={() => (draggingRef.current = false)}
          onPointerCancel={() => (draggingRef.current = false)}
          className="group relative h-2 flex-1 cursor-pointer touch-none rounded-full bg-mint-200/70"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-mint-500"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-mint-600 shadow transition-transform group-hover:scale-125"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        <span className="shrink-0 tabular-nums text-xs font-semibold text-mint-700">
          {fmt(duration)}
        </span>

        <button
          onClick={cycleRate}
          title="מהירות נגינה"
          className="shrink-0 rounded-full border border-mint-300 bg-white px-2.5 py-1 text-xs font-extrabold text-mint-700 transition hover:bg-mint-100"
        >
          {rate}×
        </button>
      </div>
    </div>
  );
}
