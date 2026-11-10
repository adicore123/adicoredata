import { store } from "@/lib/store";
import { isAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const all = sp.get("all") === "1" && (await isAdmin());
  const works = all ? await store.listAll() : await store.listPublished();
  const category = sp.get("category");
  const q = sp.get("q")?.trim().toLowerCase();
  let out = works;
  if (category) out = out.filter((w) => w.category === category);
  if (q) out = out.filter((w) => `${w.title} ${w.description} ${w.tags.join(" ")}`.toLowerCase().includes(q));
  return Response.json(out);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.title !== "string" || !body.title.trim()) {
    return Response.json({ error: "חייבת כותרת" }, { status: 400 });
  }
  const work = await store.create({
    title: body.title.trim().slice(0, 120),
    description: String(body.description ?? "").slice(0, 4000),
    category: String(body.category ?? "").slice(0, 60),
    client: String(body.client ?? "").slice(0, 80),
    year: Number.isFinite(+body.year) && body.year ? Math.round(+body.year) : null,
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 12).map((t: unknown) => String(t).slice(0, 30)) : [],
    link: String(body.link ?? "").slice(0, 500),
    media: Array.isArray(body.media) ? body.media : [],
    coverIndex: Math.max(0, Math.round(+body.coverIndex || 0)),
    featured: !!body.featured,
    published: !!body.published,
    order: Math.round(+body.order || 0),
  });
  return Response.json(work, { status: 201 });
}
