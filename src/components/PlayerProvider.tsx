"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Loader2, Mic, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import type { Item } from "@/lib/types";
import { loadProgress, saveProgress, clearProgress } from "@/lib/playback";

const RATES = [1, 1.25, 1.5, 2];

interface PlayerApi {
  item: Item | null;
  playing: boolean;
  loading: boolean;
  time: number;
  duration: number;
  rate: number;
  play: (item: Item) => void;
  toggle: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  cycleRate: () => void;
  close: () => void;
}

const Ctx = createContext<PlayerApi | null>(null);

export function usePlayer(): PlayerApi {
  const value = useContext(Ctx);
  if (!value) throw new Error("usePlayer must be used within PlayerProvider");
  return value;
}

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * נגן אודיו גלובלי: אלמנט audio אחד ברמת השורש שלא נעלם בניווט,
 * שמירת מקום ההאזנה אוטומטית לכל קובץ, ומיני-נגן צף בתחתית המסך.
 */
export default function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const lastSaveRef = useRef(0);
  const resumeRef = useRef<{ t: number; d: number } | null>(null);

  // מהירות נגינה — נשמרת בין ההפעלות
  useEffect(() => {
    const saved = parseFloat(localStorage.getItem("adidata:rate") ?? "1");
    if (RATES.includes(saved)) setRate(saved);
  }, []);

  const saveNow = useCallback(() => {
    const a = audioRef.current;
    if (!a || !item || !a.duration || !Number.isFinite(a.duration)) return;
    if (a.currentTime >= a.duration - 5) clearProgress(item.id);
    else saveProgress(item.id, a.currentTime, a.duration);
  }, [item]);

  // שמירה אחרונה גם בסגירת הלשונית
  useEffect(() => {
    const handler = () => saveNow();
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      handler();
    };
  }, [saveNow]);

  const play = useCallback(
    (next: Item) => {
      const a = audioRef.current;
      if (!a) return;
      if (item?.id !== next.id) {
        saveNow();
        resumeRef.current = loadProgress(next.id);
        setItem(next);
        setTime(resumeRef.current?.t ?? 0);
        setDuration(resumeRef.current?.d ?? 0);
        a.src = `/api/files/${next.id}`;
        a.playbackRate = rate;
      }
      setLoading(true);
      a.play().catch(() => setLoading(false));
    },
    [item, rate, saveNow],
  );

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !item) return;
    if (a.paused) play(item);
    else {
      a.pause();
      saveNow();
    }
  }, [item, play, saveNow]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration)) return;
    a.currentTime = Math.max(0, Math.min(a.duration, t));
    setTime(a.currentTime);
  }, []);

  const skip = useCallback((delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || Infinity, a.currentTime + delta));
    setTime(a.currentTime);
  }, []);

  const cycleRate = useCallback(() => {
    setRate((prev) => {
      const next = RATES[(RATES.indexOf(prev) + 1) % RATES.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      try {
        localStorage.setItem("adidata:rate", String(next));
      } catch {}
      return next;
    });
  }, []);

  const close = useCallback(() => {
    saveNow();
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setItem(null);
    setPlaying(false);
    setTime(0);
    setDuration(0);
  }, [saveNow]);

  const api: PlayerApi = { item, playing, loading, time, duration, rate, play, toggle, seek, skip, cycleRate, close };

  return (
    <Ctx.Provider value={api}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        className="hidden"
        onPlay={() => {
          setPlaying(true);
          setLoading(false);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          if (item) clearProgress(item.id);
        }}
        onTimeUpdate={(e) => {
          setTime(e.currentTarget.currentTime);
          const now = Date.now();
          if (now - lastSaveRef.current > 2000) {
            lastSaveRef.current = now;
            if (item) saveProgress(item.id, e.currentTarget.currentTime, e.currentTarget.duration);
          }
        }}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          setDuration(a.duration);
          a.playbackRate = rate;
          // המשך האזנה — מהשנייה שבה עצרנו בפעם הקודמת
          const saved = resumeRef.current;
          resumeRef.current = null;
          if (saved && saved.t >= 1 && saved.t < a.duration - 5) {
            a.currentTime = saved.t;
            setTime(saved.t);
          }
        }}
      />
      <MiniPlayer />
    </Ctx.Provider>
  );
}

/** פס נגן צף בתחתית — ממשיך לנגן בכל ניווט בין עמודי המערכת */
function MiniPlayer() {
  const { item, playing, loading, time, duration, rate, toggle, seek, skip, cycleRate, close } = usePlayer();
  if (!item) return null;

  const progress = duration ? (time / duration) * 100 : 0;

  const seekFromPointer = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    seek(frac * duration);
  };

  return (
    <div className="fade-in fixed inset-x-0 bottom-0 z-40 border-t border-mint-100 bg-white/90 shadow-lift backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint-500/10 text-mint-600">
          <Mic className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{item.title}</p>
          <div
            dir="ltr"
            role="slider"
            aria-label="התקדמות ההאזנה"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              seekFromPointer(e.clientX, e.currentTarget);
            }}
            onPointerMove={(e) =>
              e.currentTarget.hasPointerCapture(e.pointerId) && seekFromPointer(e.clientX, e.currentTarget)
            }
            className="group relative mt-1 h-2 w-full cursor-pointer touch-none rounded-full bg-mint-200/70"
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-mint-500" style={{ width: `${progress}%` }} />
            <div
              className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-mint-600 shadow transition-transform group-hover:scale-125"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
        </div>
        <span className="hidden shrink-0 tabular-nums text-xs font-semibold text-mint-700 sm:block">
          {fmt(time)} / {fmt(duration)}
        </span>
        <button
          onClick={() => skip(-10)}
          aria-label="10 שניות אחורה"
          className="grid size-9 shrink-0 place-items-center rounded-full text-mint-700 transition hover:bg-mint-100"
        >
          <span className="flex items-center">
            <RotateCcw className="size-4" />
            <span className="text-[10px] font-extrabold">10</span>
          </span>
        </button>
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
          onClick={() => skip(10)}
          aria-label="10 שניות קדימה"
          className="grid size-9 shrink-0 place-items-center rounded-full text-mint-700 transition hover:bg-mint-100"
        >
          <span className="flex items-center">
            <span className="text-[10px] font-extrabold">10</span>
            <RotateCw className="size-4" />
          </span>
        </button>
        <button
          onClick={cycleRate}
          title="מהירות נגינה"
          className="hidden shrink-0 rounded-full border border-mint-300 bg-white px-2.5 py-1 text-xs font-extrabold text-mint-700 transition hover:bg-mint-100 sm:block"
        >
          {rate}×
        </button>
        <button
          onClick={close}
          aria-label="סגירת הנגן"
          className="grid size-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}
