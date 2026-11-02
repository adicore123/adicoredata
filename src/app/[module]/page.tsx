import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Upload } from "lucide-react";
import { store } from "@/lib/store";
import { MODULES } from "@/lib/modules";
import { isModule } from "@/lib/types";
import ItemsView from "@/components/ItemsView";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ module: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  return isModule(module) ? { title: MODULES[module].label } : {};
}

export default async function ModulePage({ params, searchParams }: Props) {
  const { module } = await params;
  if (!isModule(module)) notFound();

  const sp = await searchParams;
  const initialQuery = typeof sp.q === "string" ? sp.q : undefined;

  const meta = MODULES[module];
  const items = await store.list(module);
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-mint-500/10 text-mint-600">
          <Icon className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{meta.label}</h1>
          <p className="text-sm text-slate-500">
            {items.length > 0 ? `${items.length} קבצים · ${meta.hint}` : meta.hint}
          </p>
        </div>
        <Link
          href={`/upload?module=${module}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-mint-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-mint-700"
        >
          <Upload className="size-4" /> העלאה
        </Link>
      </header>

      <ItemsView items={items} kind={module} initialQuery={initialQuery} />
    </div>
  );
}
