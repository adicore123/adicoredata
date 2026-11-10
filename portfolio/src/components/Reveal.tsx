"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Variant = "up" | "blur" | "scale";

const hidden: Record<Variant, string> = {
  up: "opacity-0 translate-y-6",
  blur: "opacity-0 blur-[6px]",
  scale: "opacity-0 scale-[0.96]",
};

/** חשיפה בגלילה: מרים/מטשטש/מגדיל כשהאלמנט נכנס למסך, עם הפרש מדורג */
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  variant?: Variant;
  /** אלפיות שנייה */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] will-change-transform ${
        shown ? "opacity-100 translate-y-0 blur-0 scale-100" : hidden[variant]
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
