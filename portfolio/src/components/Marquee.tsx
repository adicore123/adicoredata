"use client";

import { Sparkle } from "lucide-react";

const ITEMS = ["אתרים", "מערכות ניהול", "חנויות אונליין", "אינטגרציית וואטסאפ", "חוויות 3D", "UI/UX"];

/** סרט יכולות אינסופי בפיל זכוכית קפואה עם מסכות גרדיאנט בקצוות */
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="relative rounded-full border border-slate-200/80 bg-white/70 py-3 shadow-soft backdrop-blur-xl">
      <div
        aria-hidden
        className="marquee-track relative overflow-hidden"
      >
        <div className="marquee-move flex w-max items-center gap-8 px-6">
          {row.map((item, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap text-sm font-bold text-emerald-800/70">
              {item}
              <Sparkle className="size-3.5 text-emerald-400" />
            </span>
          ))}
        </div>
        {/* מסכות גרדיאנט — דהייה בשני הקצוות */}
        <span className="pointer-events-none absolute inset-y-0 start-0 w-20 bg-gradient-to-l from-transparent to-white/80" />
        <span className="pointer-events-none absolute inset-y-0 end-0 w-20 bg-gradient-to-r from-transparent to-white/80" />
      </div>
    </div>
  );
}
