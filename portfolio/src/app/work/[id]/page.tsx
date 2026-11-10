import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Eye, ExternalLink, HardDrive, Star, User } from "lucide-react";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/format";
import WorkGallery from "@/components/WorkGallery";

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

  // מונה צפיות (בלי לחכות — fire and forget)
  store.incrementViews(id).catch(() => {});

  return (
    <div className="space-y-8">
      <Link
        href="/#works"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint-700 transition hover:text-mint-900"
      >
        <ArrowRight className="size-4" /> חזרה לכל העבודות
      </Link>

      <header className="card relative overflow-hidden p-6 sm:p-8">
        <span
          aria-hidden
          className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-mint-400/60 to-transparent"
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black sm:text-3xl">{work.title}</h1>
            {work.category && (
              <span className="mt-2 inline-block rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700">
                {work.category}
              </span>
            )}
          </div>
          {work.featured && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">
              <Star className="size-3.5 fill-current" /> עבודה מודגשת
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
          {work.client && (
            <span className="flex items-center gap-1.5">
              <User className="size-4 text-mint-500" /> {work.client}
            </span>
          )}
          {work.year && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-mint-500" /> {work.year}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <HardDrive className="size-4 text-mint-500" /> {work.media.length} קבצים
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-4 text-mint-500" /> {work.views + 1} צפיות
          </span>
          <span className="text-xs text-slate-400">נוסף ב-{formatDate(work.createdAt)}</span>
        </div>

        {work.description && (
          <p className="mt-5 max-w-3xl text-base/relaxed whitespace-pre-wrap text-slate-600">
            {work.description}
          </p>
        )}

        {work.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {work.tags.map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {t}
              </span>
            ))}
          </div>
        )}

        {work.link && (
          <a
            href={work.link}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-mint-600 px-6 py-3.5 text-sm font-bold text-white shadow-lift transition hover:bg-mint-700"
          >
            <ExternalLink className="size-4" /> לצפייה חיה בפרויקט
          </a>
        )}
      </header>

      <WorkGallery work={work} />
    </div>
  );
}
