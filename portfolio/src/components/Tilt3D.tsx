"use client";

import { useRef, type ReactNode } from "react";

/**
 * הטיית כרטיס תלת-ממדית: הכרטיס נוטה לעבר הסמן (עד ~8°) עם זוהר
 * שמלווה את העכבר — תחושת "כרטיס חי ביד". דסקטופ בלבד.
 */
export default function Tilt3D({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useRef<boolean | null>(null);
  const raf = useRef(0);

  const onMove = (e: React.PointerEvent) => {
    // זיהוי יכולת פעם אחת בתנועה הראשונה — הטיה לדסקטופ, זוהר לכולם (כולל מגע)
    if (enabled.current === null) {
      enabled.current =
        window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    raf.current = requestAnimationFrame(() => {
      if (enabled.current) {
        const rotateY = (px - 0.5) * 9;
        const rotateX = (0.5 - py) * 9;
        el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
      // זוהר עוקב — גם באצבע במובייל
      el.style.setProperty("--glare-x", `${px * 100}%`);
      el.style.setProperty("--glare-y", `${py * 100}%`);
      el.style.setProperty("--glare-opacity", "1");
    });
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    el.style.setProperty("--glare-opacity", "0");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ "--glare-opacity": "0" } as React.CSSProperties}
      className={`group/tilt relative transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
      {/* זוהר שמלווה את הסמן */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-3xl opacity-[var(--glare-opacity)] transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(420px circle at var(--glare-x) var(--glare-y), rgba(126,214,183,0.22), transparent 55%)",
        }}
      />
    </div>
  );
}
