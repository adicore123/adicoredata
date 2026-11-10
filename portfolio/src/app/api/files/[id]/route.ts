import { store } from "@/lib/store";
import { fileStore, fileKey } from "@/lib/storage";
import type { MediaItem } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

const INLINE = new Set(["image/", "audio/", "video/", "text/"]);

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;

  // חיפוש המדיה בכל העבודות (גם לא פורסמו — הקבצים עצמם אינם סוד; העבודות מוגנות בעמודים)
  const works = await store.listAll();
  const media: MediaItem | undefined = works.flatMap((w) => w.media).find((m) => m.id === id);
  if (!media) return new Response("Not found", { status: 404 });

  const buf = await fileStore.get(fileKey(media));
  if (!buf) return new Response("File missing", { status: 404 });

  const headers: Record<string, string> = {
    "content-type": media.mime || "application/octet-stream",
    "content-disposition": `${INLINE.has(media.mime) || media.ext === ".pdf" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(media.name)}`,
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
  };

  // תמיכת Range — הכרחית לווידאו ולדילוג באודיו
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
