"use client";

import { useEffect, useRef, useState } from "react";

/** סמן מותאם — נקודה מהירה + טבעת עוקבת רכה; דסקטופ בלבד, מתרחב על אינטראקציות */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);

    const pos = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let raf = 0;
    let hovering = false;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const target = e.target as Element | null;
      hovering = !!target?.closest("a, button, input, textarea, [role='slider'], label");
    };

    const loop = () => {
      ring.x += (pos.x - ring.x) * 0.16;
      ring.y += (pos.y - ring.y) * 0.16;
      if (dotRef.current) dotRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px) scale(${hovering ? 1.8 : 1})`;
        ringRef.current.style.opacity = hovering ? "0.9" : "0.55";
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      <div ref={ringRef} className="absolute -top-4 -start-4 size-8 rounded-full border-2 border-mint-500 transition-opacity duration-200" />
      <div ref={dotRef} className="absolute -top-[3px] -start-[3px] size-1.5 rounded-full bg-mint-600" />
    </div>
  );
}
