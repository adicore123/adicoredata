"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** כפתור מגנטי — נמשך לעבר הסמן בקרבתו וחוזר בעזיבה; דסקטופ בלבד */
export default function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const STRENGTH = 0.35;
    const MAX = 9;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      // מגיבים רק בקרבת הכפתור (עד פי 2.2 מגודלו)
      const near = Math.abs(dx) < rect.width * 1.1 && Math.abs(dy) < rect.height * 1.6;
      if (near) {
        const x = Math.max(-MAX, Math.min(MAX, dx * STRENGTH));
        const y = Math.max(-MAX, Math.min(MAX, dy * STRENGTH));
        el.style.transform = `translate(${x}px, ${y}px)`;
      } else {
        el.style.transform = "";
      }
    };
    const onLeave = () => (el.style.transform = "");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="inline-block will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
      {children}
    </div>
  );
}
