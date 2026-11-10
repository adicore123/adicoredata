"use client";

import { useEffect, useRef } from "react";

/** פס התקדמות גלילה דק בראש העמוד */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      el.style.transform = `scaleX(${progress})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[80] h-[3px]">
      <div
        ref={ref}
        className="h-full w-full origin-right bg-gradient-to-l from-mint-300 via-mint-500 to-mint-700"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
