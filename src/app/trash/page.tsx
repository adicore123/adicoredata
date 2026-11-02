import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { store } from "@/lib/store";
import { fileStore, fileKey } from "@/lib/storage";
import TrashView from "@/components/TrashView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "סל מיחזור" };

export default async function TrashPage() {
  // כל כניסה לסל מנקה פריטים שחלפה להם השהיית 30 הימים — כולל הקבצים עצמם
  const purged = await store.purgeDeleted();
  await Promise.all(purged.map((item) => fileStore.del(fileKey(item))));
  const items = await store.listDeleted();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-mint-500/10 text-mint-600">
          <Trash2 className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">סל מיחזור</h1>
          <p className="text-sm text-slate-500">
            {items.length > 0
              ? `${items.length} קבצים · נשמרים 30 יום מרגע המחיקה ואז נמחקים אוטומטית`
              : "קבצים שנמחקים נשמרים כאן 30 יום ואז נמחקים אוטומטית"}
          </p>
        </div>
      </header>
      <TrashView items={items} />
    </div>
  );
}
