import { store } from "@/lib/store";
import { isModule } from "@/lib/types";

export async function GET(req: Request) {
  const m = new URL(req.url).searchParams.get("module");
  return Response.json(await store.list(isModule(m) ? m : undefined));
}
