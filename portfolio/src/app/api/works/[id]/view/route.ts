import { store } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

/** מונה צפיות ציבורי */
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await store.incrementViews(id);
  return new Response(null, { status: 204 });
}
