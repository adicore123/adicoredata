import { store } from "@/lib/store";
import { fileStore, fileKey } from "@/lib/storage";
import { isModule, type ModuleId } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: { title?: string; module?: ModuleId } = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim().slice(0, 120);
  if (isModule(body.module)) patch.module = body.module;
  if (!patch.title && !patch.module) return Response.json({ error: "לא נשלחו שינויים" }, { status: 400 });

  const item = await store.update(id, patch);
  return item ? Response.json(item) : Response.json({ error: "לא נמצא" }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const item = await store.remove(id);
  if (!item) return Response.json({ error: "לא נמצא" }, { status: 404 });
  await fileStore.del(fileKey(item));
  return new Response(null, { status: 204 });
}
