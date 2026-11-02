import { store } from "@/lib/store";
import { fileStore, fileKey, extOf, mimeOf } from "@/lib/storage";
import { isModule, type Item } from "@/lib/types";

/** מגבלת מסמך בודד ב־Mongo — במצב JSON מקומי אין מגבלה. */
const MAX_SIZE = process.env.MONGODB_URI ? 15 * 1024 * 1024 : Infinity;

export async function POST(req: Request) {
  const form = await req.formData();
  const module = form.get("module");
  if (!isModule(module)) return Response.json({ error: "צריך לבחור מודול" }, { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return Response.json({ error: "לא נשלחו קבצים" }, { status: 400 });

  let titles: string[] = [];
  try {
    titles = JSON.parse(String(form.get("titles") ?? "[]"));
  } catch {}

  const tooBig = files.filter((f) => f.size > MAX_SIZE);
  if (tooBig.length) {
    return Response.json(
      { error: `קבצים גדולים מ־15MB לא נתמכים במצב Mongo: ${tooBig.map((f) => f.name).join(", ")}` },
      { status: 413 },
    );
  }

  const created: Item[] = [];
  for (const [i, file] of files.entries()) {
    const ext = extOf(file.name);
    // קבצים משותפים לפעמים מגיעים עם octet-stream גנרי — מסיקים מהסיומת כדי שהנגן יעבוד
    const mime = file.type && file.type !== "application/octet-stream" ? file.type : mimeOf(ext);
    // המסד הוא שמנפיק את המזהה — ולפיו נשמר הקובץ, כדי שיתאימו תמיד
    const item = await store.create({
      module,
      title: (titles[i]?.trim() || file.name || "קובץ").slice(0, 120),
      name: file.name || `file${ext}`,
      ext,
      mime,
      size: file.size,
    });
    await fileStore.put(fileKey(item), Buffer.from(await file.arrayBuffer()));
    created.push(item);
  }

  return Response.json(created, { status: 201 });
}
