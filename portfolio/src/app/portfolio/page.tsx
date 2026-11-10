import { Sparkles } from "lucide-react";
import { store } from "@/lib/store";
import PublicGallery from "@/components/PublicGallery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const works = await store.listPublished();

  return (
    <div className="space-y-10">
      {/* Hero עסקי */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-mint-700 via-mint-600 to-mint-500 px-6 py-12 text-white sm:px-10 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -start-16 -top-24 size-72 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 start-40 size-72 rounded-full bg-white/10" />
        <p className="flex items-center gap-2 text-sm font-semibold text-mint-50/90">
          <Sparkles className="size-4" /> AdiCore — פתרונות דיגיטליים
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
          עבודות שמדברות בעד עצמן
        </h1>
        <p className="mt-4 max-w-xl text-sm/relaxed text-mint-50/85 sm:text-base">
          אוסף נבחר של אתרים, מערכות וחוויות דיגיטליות שתוכננו, עוצבו ונבנו בקפידה —
          כל פרויקט עם הסיפור, התמונות וההדגמות שלו.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="#works"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-mint-700 shadow-lift transition hover:bg-mint-50"
          >
            לצפייה בעבודות
          </a>
          <span className="rounded-2xl bg-white/15 px-4 py-3.5 text-sm font-medium backdrop-blur">
            {works.length > 0 ? `${works.length} פרויקטים` : "הפרויקטים הראשונים בדרך"}
          </span>
        </div>
      </section>

      <PublicGallery works={works} />
    </div>
  );
}
