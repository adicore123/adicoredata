import { Sparkles } from "lucide-react";
import { store } from "@/lib/store";
import PublicGallery from "@/components/PublicGallery";

export const dynamic = "force-dynamic";

export default async function PortfolioHome() {
  const works = await store.listPublished();
  const categories = new Set(works.map((w) => w.category).filter(Boolean));
  const mediaCount = works.reduce((sum, w) => sum + w.media.length, 0);

  return (
    <div className="space-y-12">
      {/* Hero עסקי — צורות מרחפות וכניסה מדורגת */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-bl from-mint-800 via-mint-600 to-mint-400 px-6 py-14 text-white sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="float-slow pointer-events-none absolute -start-24 -top-32 size-80 rounded-full bg-white/10 blur-[2px]"
        />
        <div
          aria-hidden
          className="float-slower pointer-events-none absolute -bottom-40 -end-16 size-96 rounded-full bg-mint-200/20"
        />
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

        <h1
          className="hero-in relative mt-6 max-w-2xl text-4xl font-black leading-[1.12] sm:text-6xl"
          style={{ animationDelay: "90ms" }}
        >
          עבודות שמדברות{" "}
          <span className="relative inline-block text-mint-200">
            בעד עצמן
            <svg
              aria-hidden
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              className="absolute -bottom-2 inset-x-0 h-3 w-full text-mint-300/70"
            >
              <path d="M2 9 C 60 -2, 140 -2, 198 8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p
          className="hero-in relative mt-5 max-w-xl text-base/relaxed text-mint-50/85 sm:text-lg"
          style={{ animationDelay: "180ms" }}
        >
          אוסף נבחר של אתרים, מערכות וחוויות דיגיטליות שתוכננו, עוצבו ונבנו בקפידה —
          כל פרויקט עם הסיפור, התמונות וההדגמות שלו.
        </p>

        <div className="hero-in relative mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "270ms" }}>
          <a
            href="#works"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-mint-700 shadow-lift transition hover:scale-[1.03] hover:bg-mint-50 active:scale-100"
          >
            לצפייה בעבודות
          </a>
          {works.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-2xl bg-white/15 px-4 py-3.5 text-sm font-bold backdrop-blur">
                {works.length} פרויקטים
              </span>
              {categories.size > 0 && (
                <span className="rounded-2xl bg-white/15 px-4 py-3.5 text-sm font-bold backdrop-blur">
                  {categories.size} קטגוריות
                </span>
              )}
              {mediaCount > 0 && (
                <span className="hidden rounded-2xl bg-white/15 px-4 py-3.5 text-sm font-bold backdrop-blur sm:inline-block">
                  {mediaCount} קבצי הדגמה
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <div id="works" className="scroll-mt-24">
        <PublicGallery works={works} />
      </div>
    </div>
  );
}
