import { store } from "@/lib/store";
import { fileStore, fileKey } from "@/lib/storage";
import type { Item } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

const INLINE = new Set(["image/", "audio/", "video/", "text/"]);
const disposition = (item: Item) =>
  INLINE.has(item.mime) || item.ext === ".pdf" ? "inline" : "attachment";

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const item = await store.find(id);
  if (!item) return new Response("Not found", { status: 404 });

  const buf = await fileStore.get(fileKey(item));
  if (!buf) return new Response("File missing", { status: 404 });

  const headers: Record<string, string> = {
    "content-type": item.mime || "application/octet-stream",
    "content-disposition": `${disposition(item)}; filename*=UTF-8''${encodeURIComponent(item.name)}`,
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=31536000, immutable",
  };

  // תמיכה ב־Range — חיונית לדילוג בנגן האודיו
  const match = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? "");
  if (match) {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), buf.length - 1) : buf.length - 1;
    if (start <= end && start < buf.length) {
      const chunk = buf.subarray(start, end + 1);
      return new Response(new Uint8Array(chunk), {
        status: 206,
        headers: {
          ...headers,
          "content-range": `bytes ${start}-${end}/${buf.length}`,
          "content-length": String(chunk.length),
        },
      });
    }
  }

  return new Response(new Uint8Array(buf), {
    headers: { ...headers, "content-length": String(buf.length) },
  });
}
