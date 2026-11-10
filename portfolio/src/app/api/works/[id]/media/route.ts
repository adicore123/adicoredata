import { randomUUID } from "node:crypto";
import { store } from "@/lib/store";
import { fileStore, fileKey, extOf, mimeOf } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import type { MediaItem } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

/** העלאת מדיה לעבודה — מוסיף את הקבצים לרשימת המדיה ושומר את הבייטים */
export async function POST(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
  const { id } = await params;
  const work = await store.find(id);
  if (!work) return Response.json({ error: "עבודה לא נמצאה" }, { status: 404 });

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return Response.json({ error: "לא נשלחו קבצים" }, { status: 400 });

  const added: MediaItem[] = [];
  for (const file of files) {
    const ext = extOf(file.name);
    const item: MediaItem = {
      id: randomUUID(),
      name: file.name || `file${ext}`,
      ext,
      mime: file.type && file.type !== "application/octet-stream" ? file.type : mimeOf(ext),
      size: file.size,
    };
    await fileStore.put(fileKey(item), Buffer.from(await file.arrayBuffer()));
    added.push(item);
  }

  const updated = await store.update(id, { media: [...work.media, ...added] });
  return Response.json(updated, { status: 201 });
}

/** הסרת פריט מדיה אחד — ?mediaId= */
export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
  const { id } = await params;
  const mediaId = new URL(req.url).searchParams.get("mediaId");
  const work = await store.find(id);
  if (!work || !mediaId) return Response.json({ error: "לא נמצא" }, { status: 404 });

  const victim = work.media.find((m) => m.id === mediaId);
  const media = work.media.filter((m) => m.id !== mediaId);
  const coverIndex = Math.min(work.coverIndex, Math.max(0, media.length - 1));
  const updated = await store.update(id, { media, coverIndex });
  if (victim) await fileStore.del(fileKey(victim));
  return Response.json(updated);
}
