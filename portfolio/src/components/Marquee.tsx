"use client";

import { Sparkle } from "lucide-react";

const ITEMS = ["אתרים", "מערכות ניהול", "חנויות אונליין", "אינטגרציית וואטסאפ", "חוויות דיגיטליות", "UI/UX"];

/** סרט אינסופי של מילות שירות — אנימציית CSS טהורה, נעצר ב-reduced-motion */
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div
      aria-hidden
      className="marquee-track relative overflow-hidden border-y border-mint-100 bg-white/70 py-3.5"
    >
      <div className="marquee-move flex w-max items-center gap-8 px-4">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap text-sm font-bold text-mint-800/70">
            {item}
            <Sparkle className="size-3.5 text-mint-400" />
          </span>
        ))}
      </div>
      {/* הדהיה בקצוות */}
      <span className="pointer-events-none absolute inset-y-0 start-0 w-16 bg-gradient-to-l from-transparent to-app" />
      <span className="pointer-events-none absolute inset-y-0 end-0 w-16 bg-gradient-to-r from-transparent to-app" />
    </div>
  );
}
