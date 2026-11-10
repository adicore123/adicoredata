import { store } from "@/lib/store";
import { fileStore, fileKey } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import type { WorkPatch } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const work = await store.find(id);
  return work ? Response.json(work) : Response.json({ error: "לא נמצא" }, { status: 404 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: WorkPatch = {};

  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim().slice(0, 120);
  if (typeof body.description === "string") patch.description = body.description.slice(0, 4000);
  if (typeof body.category === "string") patch.category = body.category.slice(0, 60);
  if (typeof body.client === "string") patch.client = body.client.slice(0, 80);
  if (body.year === null || body.year === "") patch.year = null;
  else if (Number.isFinite(+body.year) && body.year) patch.year = Math.round(+body.year);
  if (Array.isArray(body.tags)) patch.tags = body.tags.slice(0, 12).map((t: unknown) => String(t).slice(0, 30));
  if (typeof body.link === "string") patch.link = body.link.slice(0, 500);
  if (Array.isArray(body.media)) patch.media = body.media;
  if (Number.isFinite(+body.coverIndex)) patch.coverIndex = Math.max(0, Math.round(+body.coverIndex));
  if (typeof body.featured === "boolean") patch.featured = body.featured;
  if (typeof body.published === "boolean") patch.published = body.published;
  if (Number.isFinite(+body.order)) patch.order = Math.round(+body.order);

  if (!Object.keys(patch).length) return Response.json({ error: "לא נשלחו שינויים" }, { status: 400 });
  const work = await store.update(id, patch);
  return work ? Response.json(work) : Response.json({ error: "לא נמצא" }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
  const { id } = await params;
  const work = await store.remove(id);
  if (!work) return Response.json({ error: "לא נמצא" }, { status: 404 });
  await Promise.all(work.media.map((m) => fileStore.del(fileKey(m))));
  return new Response(null, { status: 204 });
}
