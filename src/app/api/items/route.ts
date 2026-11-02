import { store } from "@/lib/store";
import { fileStore, fileKey } from "@/lib/storage";
import { isModule } from "@/lib/types";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;

  if (sp.get("deleted")) {
    // פתיחת הסל מנקה בדרך פריטים שחלפה להם השהיית 30 הימים — כולל הקבצים עצמם
    const purged = await store.purgeDeleted();
    await Promise.all(purged.map((item) => fileStore.del(fileKey(item))));
    return Response.json(await store.listDeleted());
  }

  const module = sp.get("module");
  const q = sp.get("q")?.trim().toLowerCase();
  let items = await store.list(isModule(module) ? module : undefined);
  if (q) items = items.filter((i) => `${i.title} ${i.name}`.toLowerCase().includes(q));
  return Response.json(items);
}
