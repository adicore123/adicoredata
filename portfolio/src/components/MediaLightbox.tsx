"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Minus, Plus, RotateCw, X } from "lucide-react";
import type { MediaItem } from "@/lib/types";
import WhatsAppShare from "@/components/WhatsAppShare";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** תצוגה מקדימה מתקדמת: ניווט, זום (גלגלת/צביצה/לחיצה כפולה), סיבוב, החלפה בהחלקה, וידאו */
export default function MediaLightbox({
  items,
  index,
  title,
  onIndex,
  onClose,
}: {
  items: MediaItem[];
  index: number;
  title: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const isVideo = item.mime.startsWith("video");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistRef = useRef(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndexSafe(index + 1);
      if (e.key === "ArrowRight") setIndexSafe(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const setIndexSafe = (i: number) => {
    if (items.length <= 1) return;
    onIndex((i + items.length) % items.length);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchDistRef.current = Math.hypot(a.x - b.x, a.y - b.y);
    } else if (pointersRef.current.size === 1) {
      swipeStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistRef.current > 0) setZoom((z) => clamp(z * (dist / pinchDistRef.current), 1, 5));
      pinchDistRef.current = dist;
      swipeStartRef.current = null;
    } else if (pointersRef.current.size === 1 && zoom > 1) {
      const start = swipeStartRef.current ?? { x: e.clientX, y: e.clientY };
      setPan({ x: e.clientX - start.x, y: e.clientY - start.y });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasSingle = pointersRef.current.size === 1;
    const start = swipeStartRef.current;
    pointersRef.current.delete(e.pointerId);
    pinchDistRef.current = 0;
    if (wasSingle && start && zoom === 1) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0 ? setIndexSafe(index + 1) : setIndexSafe(index - 1);
      }
    }
    swipeStartRef.current = null;
    if (zoom === 1) setPan({ x: 0, y: 0 });
  };

  return (
    <div className="fade-in fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 p-3 text-white sm:p-4">
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <WhatsAppShare media={item} title={title} />
          <a
            href={`/api/files/${item.id}`}
            download={item.name}
            aria-label="הורדה"
            title="הורדה"
            className="grid size-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Download className="size-4" />
          </a>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="grid size-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div
        className="flex flex-1 touch-none items-center justify-center overflow-hidden px-2"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setZoom((z) => (z === 1 ? 2.5 : 1))}
        onWheel={(e) => setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.15 : 0.87), 1, 5))}
      >
        {isVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            key={item.id}
            src={`/api/files/${item.id}`}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-2xl bg-black shadow-2xl"
          />
        ) : item.mime.startsWith("image/") ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={item.id}
            src={`/api/files/${item.id}`}
            alt={title}
            draggable={false}
            className="max-h-full max-w-full select-none rounded-2xl object-contain shadow-2xl transition-transform duration-100"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
              cursor: zoom > 1 ? "grab" : "default",
            }}
          />
        ) : (
          <div className="card max-w-md p-8 text-center">
            <p className="text-sm text-slate-600">{item.name}</p>
            <a
              href={`/api/files/${item.id}`}
              download={item.name}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-mint-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-mint-700"
            >
              <Download className="size-4" /> הורדת הקובץ
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 p-3 text-white sm:gap-2 sm:p-4">
        <button
          onClick={() => setIndexSafe(index - 1)}
          disabled={items.length <= 1}
          aria-label="הקודם"
          className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>

        {!isVideo && item.mime.startsWith("image/") && (
          <>
            <button
              onClick={() => setZoom((z) => clamp(z - 0.5, 1, 5))}
              aria-label="הקטנה"
              className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-12 text-center text-xs font-bold tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => clamp(z + 0.5, 1, 5))}
              aria-label="הגדלה"
              className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <Plus className="size-4" />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              aria-label="סיבוב"
              title="סיבוב"
              className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <RotateCw className="size-4" />
            </button>
          </>
        )}

        {items.length > 1 && (
          <span className="mx-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tabular-nums">
            {index + 1} / {items.length}
          </span>
        )}

        <button
          onClick={() => setIndexSafe(index + 1)}
          disabled={items.length <= 1}
          aria-label="הבא"
          className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>
    </div>
  );
}
