import type { Metadata } from "next";
import GlobalSearch from "@/components/GlobalSearch";

export const metadata: Metadata = { title: "חיפוש" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">חיפוש</h1>
        <p className="mt-1 text-sm text-slate-500">
          חיפוש בכל הקבצים — לפי כותרת ושם קובץ, בכל המודולים יחד.
        </p>
      </header>
      <GlobalSearch initialQuery={sp.q ?? ""} />
    </div>
  );
}
