"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";

/** כותרת שמסתתרת בגלילה למטה וחוזרת בגלילה למעלה */
export default function HeaderBar() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastYRef.current && y > 90;
      const goingUp = y < lastYRef.current - 8;
      if (goingDown) setHidden(true);
      else if (goingUp) setHidden(false);
      lastYRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b border-studio-100/70 bg-app/90 backdrop-blur-xl motion-safe:transition-transform motion-safe:duration-300 ${
        hidden ? "motion-safe:-translate-y-full focus-within:translate-y-0" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-8">
        <Link href="/portfolio" className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-studio-600">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-studio-500 to-studio-700 text-white shadow-soft">
            <Layers className="size-5" />
          </span>
          <span className="text-lg font-black tracking-tight">AdiCore</span>
        </Link>
        {pathname === "/portfolio" && (
          <nav aria-label="ניווט בתיק העבודות" className="flex items-center gap-1 text-xs font-semibold text-muted sm:gap-4 sm:text-sm">
            <a href="#works" className="rounded-lg px-2 py-2 hover:bg-studio-50 hover:text-studio-800 focus-visible:outline-2 focus-visible:outline-studio-600">עבודות</a>
            <a href="#process" className="rounded-lg px-2 py-2 hover:bg-studio-50 hover:text-studio-800 focus-visible:outline-2 focus-visible:outline-studio-600">תהליך העבודה</a>
          </nav>
        )}
      </div>
    </header>
  );
}
