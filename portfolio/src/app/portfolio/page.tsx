import { Code2, LayoutTemplate, ListChecks, MoveLeft, Rocket } from "lucide-react";
import { store } from "@/lib/store";
import PublicGallery from "@/components/PublicGallery";
import Marquee from "@/components/Marquee";
import Magnetic from "@/components/Magnetic";
import Hero3DLoader from "@/components/Hero3DLoader";
import GyroChip from "@/components/GyroChip";
import Reveal from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/WhatsAppShare";
import styles from "./studio.module.css";

export const dynamic = "force-dynamic";
const processSteps = [
  { icon: ListChecks, title: "אפיון", text: "מגדירים את הקהל, היעדים והפעולות שהמוצר צריך לאפשר." },
  { icon: LayoutTemplate, title: "עיצוב", text: "בונים אבטיפוס בעברית ובודקים את חוויית השימוש במובייל ובמחשב." },
  { icon: Code2, title: "פיתוח", text: "מחברים את הממשק לנתונים ובודקים ביצועים, נגישות ותרחישי שימוש." },
  { icon: Rocket, title: "השקה", text: "מעלים לאוויר ומוודאים שהתהליכים המרכזיים עובדים בסביבת הייצור." },
];

export default async function PortfolioHome() {
  const works = await store.listPublished();
  const contactNumber = process.env.PORTFOLIO_WHATSAPP_NUMBER?.trim();
  const contactUrl = contactNumber && /^[1-9]\d{7,14}$/.test(contactNumber)
    ? `https://wa.me/${contactNumber}`
    : null;

  return (
    <div className="text-ink">
      <section className={styles.hero} aria-labelledby="portfolio-title">
        <div className="hero-in min-w-0">
          <p className={styles.eyebrow}>סטודיו לעיצוב ופיתוח דיגיטלי</p>
          <h1 id="portfolio-title" className={styles.headline}>
            עבודות שמדברות <span>בעד עצמן.</span>
          </h1>
          <p className="mt-6 max-w-[29rem] font-copy text-xl leading-[1.55] text-muted sm:text-2xl">
            אתרים, מערכות וחוויות דיגיטליות שעיצבתי ובניתי. כאן אפשר לראות את הפרויקטים מקרוב.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Magnetic>
              <a
                href="#works"
                className={`group ${styles.primary}`}
              >
                לצפייה בעבודות
                <MoveLeft aria-hidden className="size-4 motion-safe:transition-transform motion-safe:group-hover:-translate-x-1" />
              </a>
            </Magnetic>
            {contactUrl && <a href={contactUrl} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-studio-100 bg-white/80 px-4 font-bold text-studio-700 hover:border-studio-300">בוא נדבר על הפרויקט שלך <MoveLeft aria-hidden className="size-4" /></a>}
            <GyroChip />
          </div>
        </div>

        <div className={styles.stage} aria-hidden>
          <div className={styles.fallback}><span /><span /></div>
          <div className={styles.artwork}>
            <Hero3DLoader />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-8">
        <Marquee />
        <div id="works" className="scroll-mt-20 pt-14 sm:pt-20">
          <PublicGallery works={works} />
        </div>
        <section id="process" aria-labelledby="process-title" className="mt-20 scroll-mt-24 sm:mt-28">
          <h2 id="process-title" className="text-[clamp(2rem,4.2vw,3.25rem)] font-extrabold tracking-[-0.045em]">איך אנחנו עובדים</h2>
          <ol className={`${styles.process} mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
            {processSteps.map(({ icon: Icon, title, text }, index) => (
              <Reveal as="li" key={title} delay={index * 110} className="rounded-3xl border border-studio-100/80 bg-white/85 p-5 shadow-soft">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg text-lg font-bold focus-visible:outline-2 focus-visible:outline-studio-600 [&::-webkit-details-marker]:hidden">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-studio-50 text-studio-700"><Icon aria-hidden className="size-4" /></span>
                    <span className="grow">{title}</span>
                    <span aria-hidden className="text-studio-600 group-open:hidden">+</span>
                    <span aria-hidden className="hidden text-studio-600 group-open:inline">−</span>
                  </summary>
                  <p className="pt-4 font-copy text-lg leading-relaxed text-muted">{text}</p>
                </details>
              </Reveal>
            ))}
          </ol>
        </section>
      </div>
      {contactUrl && (
        <a href={contactUrl} className="fixed bottom-5 start-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full border border-studio-200 bg-white/90 px-4 text-sm font-bold text-studio-800 shadow-lift backdrop-blur-xl hover:bg-studio-50">
          <WhatsAppIcon className="size-5" />
          לדבר בוואטסאפ
        </a>
      )}
    </div>
  );
}
