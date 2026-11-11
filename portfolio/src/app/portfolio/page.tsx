import { Boxes, Code2, Cpu, MoveLeft, Sparkles } from "lucide-react";
import { store } from "@/lib/store";
import PublicGallery from "@/components/PublicGallery";
import Marquee from "@/components/Marquee";
import CountUp from "@/components/CountUp";
import Parallax from "@/components/Parallax";
import Magnetic from "@/components/Magnetic";
import Hero3DLoader from "@/components/Hero3DLoader";

export const dynamic = "force-dynamic";

/** מילה בודדת בכותרת — עולה מתוך מסכה */
function Word({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="word-mask">
      <span className="word-up" style={{ animationDelay: `${delay}ms` }}>
        {children}
      </span>
    </span>
  );
}

/** תגי יכולת — כשהמספרים עוד נמוכים, מציגים סטטוס ולא ספירה */
const CAPABILITIES = [
  { icon: Code2, label: "פיתוח Full-Stack" },
  { icon: Cpu, label: "מערכות CRM ואוטומציה" },
  { icon: Boxes, label: "חוויות 3D & UI/UX" },
];

export default async function PortfolioHome() {
  const works = await store.listPublished();
  const categories = new Set(works.map((w) => w.category).filter(Boolean));
  const mediaCount = works.reduce((sum, w) => sum + w.media.length, 0);
  const established = works.length >= 3; // מעל 3 עבודות — מציגים מונים חיים

  return (
    <div className="space-y-0">
      {/* Hero — זכוכית פנינה: טקסט 55% ימין, במת פסל 3D 45% שמאל */}
      <section className="hero-glass noise relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 sm:py-20">
        <Parallax speed={0.18} className="!absolute inset-0">
          <div aria-hidden className="float-slow pointer-events-none absolute -start-20 -top-24 size-72 rounded-full bg-emerald-200/30 blur-3xl" />
        </Parallax>
        <Parallax speed={-0.1} className="!absolute inset-0">
          <div aria-hidden className="float-slower pointer-events-none absolute -bottom-32 -end-12 size-80 rounded-full bg-teal-100/50 blur-3xl" />
        </Parallax>

        <div className="relative grid items-center gap-10 lg:grid-cols-[55%_45%]">
          {/* טור הטקסט — נקי מהפסל */}
          <div className="min-w-0">
            <p
              className="hero-in flex w-fit items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-4 py-1.5 text-sm font-bold text-emerald-700 shadow-soft backdrop-blur"
              style={{ animationDelay: "0ms" }}
            >
              <Sparkles className="size-4 text-emerald-500" />
              AdiCore — פתרונות דיגיטליים
            </p>

            <Parallax speed={-0.04}>
              <h1 className="mt-6 max-w-xl text-[clamp(2.3rem,6vw,4.2rem)] font-black leading-[1.1] tracking-tight text-emerald-950">
                <Word delay={120}>עבודות</Word> <Word delay={200}>שמדברות</Word>{" "}
                <span className="word-mask">
                  <span className="word-up relative inline-block text-emerald-600" style={{ animationDelay: "280ms" }}>
                    בעד עצמן
                    <svg
                      aria-hidden
                      viewBox="0 0 200 12"
                      preserveAspectRatio="none"
                      className="underline-draw absolute -bottom-2 inset-x-0 h-3 w-full text-emerald-400/80"
                    >
                      <path
                        d="M2 9 C 60 -2, 140 -2, 198 8"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </span>
              </h1>
            </Parallax>

            <p
              className="hero-in mt-5 max-w-md text-base/relaxed text-emerald-900/60 sm:text-lg/relaxed"
              style={{ animationDelay: "180ms" }}
            >
              אוסף נבחר של אתרים, מערכות וחוויות דיגיטליות שתוכננו, עוצבו ונבנו בקפידה —
              כל פרויקט עם הסיפור, התמונות וההדגמות שלו.
            </p>

            {/* Pills — יכולות כשמתחילים, מונים חיים כשיש נפח */}
            <div className="hero-in mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "270ms" }}>
              <Magnetic>
                <a
                  href="#works"
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-emerald-700 px-7 py-4 text-sm font-bold text-white shadow-[0_10px_36px_-10px_rgba(4,120,87,0.55)] transition-all duration-300 hover:bg-emerald-800 hover:shadow-[0_14px_44px_-10px_rgba(4,120,87,0.7)] active:scale-100"
                >
                  לצפייה בעבודות
                  <MoveLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
                </a>
              </Magnetic>

              {established ? (
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-baseline gap-1.5 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm font-bold text-emerald-900 shadow-soft backdrop-blur">
                    <CountUp to={works.length} />
                    <span className="font-medium text-emerald-700/70">פרויקטים</span>
                  </span>
                  {categories.size > 0 && (
                    <span className="flex items-baseline gap-1.5 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm font-bold text-emerald-900 shadow-soft backdrop-blur">
                      <CountUp to={categories.size} duration={900} />
                      <span className="font-medium text-emerald-700/70">קטגוריות</span>
                    </span>
                  )}
                  {mediaCount > 0 && (
                    <span className="hidden items-baseline gap-1.5 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm font-bold text-emerald-900 shadow-soft backdrop-blur sm:flex">
                      <CountUp to={mediaCount} duration={1300} />
                      <span className="font-medium text-emerald-700/70">קבצי הדגמה</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {CAPABILITIES.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-white/75 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-soft backdrop-blur"
                    >
                      <Icon className="size-3.5 text-emerald-500" />
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* במת הפסל — 45% ייעודיים */}
          <div className="relative h-[300px] sm:h-[380px] lg:h-[480px]">
            <div className="absolute inset-0 lg:static lg:h-full lg:w-full">
              <Hero3DLoader />
            </div>
          </div>
        </div>
      </section>

      {/* סרט מילות שירות */}
      <div className="mt-6 rounded-[2rem]">
        <Marquee />
      </div>

      {/* אזור העבודות */}
      <div id="works" className="scroll-mt-24 pt-10">
        <PublicGallery works={works} />
      </div>
    </div>
  );
}
