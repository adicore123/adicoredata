import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Eye, ExternalLink, FolderOpen, HardDrive, Star, User } from "lucide-react";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { coverOf, isImage, isVideo } from "@/lib/types";
import WorkGallery from "@/components/WorkGallery";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const work = await store.find(id);
  return work ? { title: work.title } : {};
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params;
  const work = await store.find(id);
  if (!work || !work.published) notFound();

  store.incrementViews(id).catch(() => {});
  const cover = coverOf(work);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pt-8 sm:px-6">
      <Link
        href="/portfolio#works"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-studio-700 transition hover:text-studio-900"
      >
        <ArrowRight className="size-4" /> חזרה לכל העבודות
      </Link>

      {/* באנר כרינה ברוחב מלא */}
      <Reveal variant="scale">
        <section className="noise relative aspect-[21/9] max-h-72 overflow-hidden rounded-[2rem] bg-studio-900 sm:max-h-80">
          {cover ? (
            isVideo(cover) ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={`/api/files/${cover.id}`} autoPlay muted loop playsInline className="size-full object-cover" />
            ) : isImage(cover) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={`/api/files/${cover.id}`} alt={work.title} className="size-full object-cover" />
            ) : null
          ) : null}
          <span className="absolute inset-0 bg-gradient-to-t from-studio-900/90 via-studio-900/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <h1 className="text-2xl font-black text-white drop-shadow-sm sm:text-4xl">{work.title}</h1>
          </div>
          {work.featured && (
            <span className="absolute end-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-amber-600 shadow-soft">
              <Star className="size-3.5 fill-current" /> עבודה מודגשת
            </span>
          )}
        </section>
      </Reveal>

      {/* מטא דביק + תוכן */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Reveal className="card relative overflow-hidden p-6 sm:p-8">
            <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-studio-400/60 to-transparent" />
            {work.category && (
              <span className="inline-block rounded-full bg-studio-50 px-3 py-1 text-xs font-bold text-studio-700">
                {work.category}
              </span>
            )}
            {work.description && (
              <p className="mt-4 whitespace-pre-wrap font-copy text-lg/relaxed text-muted sm:text-xl/relaxed">
                {work.description}
              </p>
            )}
            {work.link && (
              <a
                href={work.link}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-studio-600 px-6 py-3.5 text-sm font-bold text-white shadow-lift transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105"
              >
                <ExternalLink className="size-4" /> לצפייה חיה בפרויקט
              </a>
            )}
          </Reveal>

          <WorkGallery work={work} />
        </div>

        {/* עמודת מטא דביקה */}
        <Reveal variant="blur" delay={120}>
          <aside className="card sticky top-20 p-5">
            <h2 className="text-sm font-black text-slate-400">פרטי הפרויקט</h2>
            <ul className="mt-4 space-y-3.5 text-sm">
              {work.client && (
                <li className="flex items-center gap-2.5 text-muted">
                  <User className="size-4 shrink-0 text-studio-500" />
                  <span className="font-semibold">{work.client}</span>
                </li>
              )}
              {work.year && (
                <li className="flex items-center gap-2.5 text-muted">
                  <CalendarDays className="size-4 shrink-0 text-studio-500" />
                  <span className="font-semibold">{work.year}</span>
                </li>
              )}
              <li className="flex items-center gap-2.5 text-muted">
                <FolderOpen className="size-4 shrink-0 text-studio-500" />
                <span className="font-semibold">{work.media.length} קבצים</span>
              </li>
              <li className="flex items-center gap-2.5 text-muted">
                <HardDrive className="size-4 shrink-0 text-studio-500" />
                <span className="font-semibold">
                  {Math.round(work.media.reduce((s, m) => s + m.size, 0) / 1024)} KB סה״כ
                </span>
              </li>
              <li className="flex items-center gap-2.5 text-muted">
                <Eye className="size-4 shrink-0 text-studio-500" />
                <span className="font-semibold">{work.views + 1} צפיות</span>
              </li>
            </ul>
            {work.tags.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {work.tags.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
              נוסף ב-{formatDate(work.createdAt)}
            </p>
          </aside>
        </Reveal>
      </div>
    </div>
  );
}
