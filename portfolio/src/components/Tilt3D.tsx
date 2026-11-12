"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import styles from "./Tilt3D.module.css";

export default function Tilt3D({ children, className = "" }: { children: ReactNode; className?: string }) {
  const surface = useRef<HTMLDivElement>(null);
  const enabled = useRef(false);
  const frame = useRef(0);

  function reset() {
    cancelAnimationFrame(frame.current);
    const style = surface.current?.style;
    for (const name of ["--tilt-x", "--tilt-y", "--light-x", "--light-y", "--light-opacity"]) {
      style?.removeProperty(name);
    }
  }

  useEffect(() => {
    const query = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => {
      enabled.current = query.matches;
      if (!query.matches) reset();
    };
    update();
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!enabled.current || event.pointerType === "touch") return;
    const target = event.currentTarget;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      // Measure the stationary wrapper so rotation cannot feed back into its own input.
      const rect = target.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)));
      const style = surface.current?.style;
      style?.setProperty("--tilt-x", `${(0.5 - y) * 8}deg`);
      style?.setProperty("--tilt-y", `${(x - 0.5) * 9}deg`);
      style?.setProperty("--light-x", `${x * 100}%`);
      style?.setProperty("--light-y", `${y * 100}%`);
      style?.setProperty("--light-opacity", "1");
    });
  }

  return (
    <div className={className} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
      <div ref={surface} className={styles.surface}>
        {children}
        <span className={styles.sheen} aria-hidden />
      </div>
    </div>
  );
}
