import { Sparkles } from "lucide-react";
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

export default async function PortfolioHome() {
  const works = await store.listPublished();
  const categories = new Set(works.map((w) => w.category).filter(Boolean));
  const mediaCount = works.reduce((sum, w) => sum + w.media.length, 0);

  return (
    <div className="space-y-0">
      {/* Hero — טיפוגרפיה קינטית, צורות מרחפות, טקסטורת רעש וקו מצויר שמצטייר */}
      <section className="noise relative overflow-hidden rounded-[2rem] bg-gradient-to-bl from-mint-800 via-mint-600 to-mint-400 px-6 py-14 text-white sm:px-12 sm:py-20">
        {/* סצנת 3D — זכוכית-מנטה עם חלקיקים */}
        <Hero3DLoader />
        <Parallax speed={0.22} className="!absolute inset-0">
          <div
            aria-hidden
            className="float-slow pointer-events-none absolute -start-24 -top-32 size-80 rounded-full bg-white/10 blur-[2px]"
          />
        </Parallax>
        <Parallax speed={-0.12} className="!absolute inset-0">
          <div
            aria-hidden
            className="float-slower pointer-events-none absolute -bottom-40 -end-16 size-96 rounded-full bg-mint-200/20"
          />
        </Parallax>
        <div
          aria-hidden
          className="pointer-events-none absolute start-1/3 top-8 size-24 rounded-full border border-white/15"
        />

        <p
          className="hero-in relative flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold text-mint-50 backdrop-blur"
          style={{ animationDelay: "0ms" }}
        >
          <Sparkles className="size-4" />
          AdiCore — פתרונות דיגיטליים
        </p>

        <Parallax speed={-0.04}>
          <h1 className="relative mt-6 max-w-3xl text-[clamp(2.4rem,7vw,4.6rem)] font-black leading-[1.08] tracking-tight">
            <Word delay={120}>עבודות</Word>{" "}
            <Word delay={200}>שמדברות</Word>{" "}
            <span className="word-mask">
              <span className="word-up relative inline-block text-mint-200" style={{ animationDelay: "280ms" }}>
                בעד עצמן
                <svg
                  aria-hidden
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="underline-draw absolute -bottom-2 inset-x-0 h-3 w-full text-mint-300/80"
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
          className="hero-in relative mt-5 max-w-xl text-base/relaxed text-mint-50/85 sm:text-lg"
          style={{ animationDelay: "180ms" }}
        >
          אוסף נבחר של אתרים, מערכות וחוויות דיגיטליות שתוכננו, עוצבו ונבנו בקפידה —
          כל פרויקט עם הסיפור, התמונות וההדגמות שלו.
        </p>

        <div className="hero-in relative mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "270ms" }}>
          <Magnetic>
            <a
              href="#works"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-mint-700 shadow-lift transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-100"
            >
              לצפייה בעבודות
            </a>
          </Magnetic>
          {works.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="flex items-baseline gap-1.5 rounded-2xl bg-white/15 px-4 py-3.5 text-sm font-bold backdrop-blur">
                <CountUp to={works.length} />
                <span className="font-medium text-mint-50/80">פרויקטים</span>
              </span>
              {categories.size > 0 && (
                <span className="flex items-baseline gap-1.5 rounded-2xl bg-white/15 px-4 py-3.5 text-sm font-bold backdrop-blur">
                  <CountUp to={categories.size} duration={900} />
                  <span className="font-medium text-mint-50/80">קטגוריות</span>
                </span>
              )}
              {mediaCount > 0 && (
                <span className="hidden items-baseline gap-1.5 rounded-2xl bg-white/15 px-4 py-3.5 text-sm font-bold backdrop-blur sm:flex">
                  <CountUp to={mediaCount} duration={1300} />
                  <span className="font-medium text-mint-50/80">קבצי הדגמה</span>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* סרט מילות שירות */}
      <div className="mt-6 rounded-[2rem]">
        <Marquee />
      </div>

      {/* פס Spotlight כהה עם העבודות */}
      <div id="works" className="scroll-mt-24 pt-10">
        <PublicGallery works={works} />
      </div>
    </div>
  );
}
