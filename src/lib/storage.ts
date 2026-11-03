import { promises as fs } from "node:fs";
import path from "node:path";
import type { Item } from "./types";
import { mongoDb } from "./mongo";

export interface FileStore {
  put(key: string, buf: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  del(key: string): Promise<void>;
}

/** מפתח הקובץ על הדיסק/בענן לפי הפריט. */
export const fileKey = (item: Pick<Item, "id" | "ext">) => item.id + item.ext;

/** אחסון מקומי — data/uploads. */
class DiskFiles implements FileStore {
  #dir = path.join(process.cwd(), "data", "uploads");

  async put(key: string, buf: Buffer) {
    await fs.mkdir(this.#dir, { recursive: true });
    await fs.writeFile(path.join(this.#dir, key), buf);
  }

  async get(key: string) {
    return fs.readFile(path.join(this.#dir, key)).catch(() => null);
  }

  async del(key: string) {
    await fs.rm(path.join(this.#dir, key), { force: true });
  }
}

/**
 * אחסון בענן — הקבצים עצמם נשמרים כ־Binary ב־Mongo (מתאים עד ~15MB לקובץ,
 * שמכסה את רוב הקבצים שמגיעים מוואטסאפ).
 */
class MongoFiles implements FileStore {
  #col() {
    return mongoDb().then((db) => db.collection<{ _id: string; data: unknown }>("files"));
  }

  async put(key: string, buf: Buffer) {
    await (await this.#col()).updateOne(
      { _id: key },
      { $set: { data: buf } },
      { upsert: true },
    );
  }

  async get(key: string) {
    const doc = await (await this.#col()).findOne({ _id: key });
    if (!doc) return null;
    // ה־driver מחזיר Binary שהבייטים שלו נמצאים בשדה buffer
    const data = doc.data as { buffer?: Uint8Array } | null;
    const raw = data?.buffer ?? (doc.data as unknown as Uint8Array);
    return raw ? Buffer.from(raw) : null;
  }

  async del(key: string) {
    await (await this.#col()).deleteOne({ _id: key });
  }
}

export const fileStore: FileStore = process.env.MONGODB_URI ? new MongoFiles() : new DiskFiles();

/** סיומת תקינה משם קובץ, למשל "שיעור.mp3" → ".mp3". */
export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  const ext = i > 0 ? name.slice(i).toLowerCase() : "";
  return /^[\w.]{1,12}$/.test(ext) ? ext : "";
}

const MIMES: Record<string, string> = {
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".wav": "audio/wav",
  ".ogg": "audio/ogg", ".opus": "audio/ogg", ".amr": "audio/amr", ".flac": "audio/flac",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".heic": "image/heic", ".avif": "image/avif", ".svg": "image/svg+xml",
  ".pdf": "application/pdf", ".txt": "text/plain", ".csv": "text/csv", ".md": "text/markdown",
  ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip", ".json": "application/json",
  ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".mkv": "video/x-matroska", ".3gp": "video/3gpp", ".avi": "video/x-msvideo",
};

export const mimeOf = (ext: string, fallback = "application/octet-stream") => MIMES[ext] ?? fallback;
