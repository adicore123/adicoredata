import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { store } from "@/lib/store";
import { MODULES } from "@/lib/modules";
import { MODULE_IDS, type Item } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await store.list();
  const recent = items.slice(0, 6);
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-mint-600 via-mint-500 to-mint-400 px-6 py-10 text-white sm:px-10">
        <div aria-hidden className="pointer-events-none absolute -start-16 -top-24 size-72 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 start-40 size-72 rounded-full bg-white/10" />
        <p className="text-sm font-semibold text-mint-50/90">ניהול קבצים חכם</p>
        <h1 className="mt-2 max-w-xl text-3xl font-black sm:text-4xl">
          כל ההקלטות, התמונות והמסמכים — במקום אחד
        </h1>
        <p className="mt-3 max-w-lg text-sm/relaxed text-mint-50/85">
          העלו כל קובץ, תנו לו כותרת ושייכו אותו למודול המתאים. אפשר גם לשתף קבצים ישירות מוואטסאפ אל האפליקציה.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-mint-700 shadow-lift transition hover:bg-mint-50"
          >
            <Upload className="size-4" /> העלאת קבצים
          </Link>
          <span className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium backdrop-blur">
            {items.length} קבצים · {formatBytes(totalSize)}
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {MODULE_IDS.map((id) => {
          const meta = MODULES[id];
          const Icon = meta.icon;
          const count = items.filter((item) => item.module === id).length;
          return (
            <Link key={id} href={`/${id}`} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="grid size-12 place-items-center rounded-2xl bg-mint-500/10 text-mint-600 transition group-hover:bg-mint-500 group-hover:text-white">
                <Icon className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold">{meta.label}</h2>
              <p className="text-sm text-slate-500">{meta.hint}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-mint-600">
                {count} קבצים
                <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" />
              </p>
            </Link>
          );
        })}
      </section>

      {recent.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="text-base font-bold">לאחרונה</h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {recent.map((item) => (
              <RecentRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RecentRow({ item }: { item: Item }) {
  const Icon = MODULES[item.module].icon;
  return (
    <li>
      <Link href={`/${item.module}`} className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-mint-50/60">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint-500/10 text-mint-600">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{item.title}</span>
          <span className="block text-xs text-slate-500">
            {formatDate(item.createdAt)} · {formatBytes(item.size)}
          </span>
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {MODULES[item.module].label}
        </span>
      </Link>
    </li>
  );
}
