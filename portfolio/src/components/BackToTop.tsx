"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** כפתור חזרה לראש העמוד — מופיע אחרי גלילה של יותר ממסך */
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="חזרה לראש העמוד"
      title="חזרה לראש"
      className={`fixed bottom-6 end-6 z-40 grid size-12 place-items-center rounded-full bg-studio-600 text-white shadow-lift transition-all duration-300 hover:scale-110 hover:bg-studio-700 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
