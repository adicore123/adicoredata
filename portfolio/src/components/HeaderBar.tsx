"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";

/** כותרת שמסתתרת בגלילה למטה וחוזרת בגלילה למעלה */
export default function HeaderBar() {
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
      className={`sticky top-0 z-30 border-b border-slate-200/60 bg-app/80 backdrop-blur-xl transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 sm:px-6">
        <Link href="/portfolio" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-soft">
            <Layers className="size-5" />
          </span>
          <span className="text-lg font-black tracking-tight">AdiCore</span>
        </Link>
      </div>
    </header>
  );
}
