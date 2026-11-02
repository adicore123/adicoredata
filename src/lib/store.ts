import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Item, ModuleId, NewItem } from "./types";
import { mongoDb } from "./mongo";

/** כמה זמן קובץ נשמר בסל מיחזור לפני מחיקה סופית */
export const TRASH_RETAIN_MS = 30 * 24 * 60 * 60 * 1000;

export interface Store {
  list(module?: ModuleId): Promise<Item[]>;
  /** קבצים שבסל מיחזור, החדשים מחוקים קודם */
  listDeleted(): Promise<Item[]>;
  find(id: string): Promise<Item | null>;
  create(item: NewItem): Promise<Item>;
  update(id: string, patch: Partial<Pick<Item, "title" | "module">>): Promise<Item | null>;
  /** מחיקה רכה — העברה לסל מיחזור */
  softDelete(id: string): Promise<Item | null>;
  /** שחזור מסל המיחזור חזרה למודול */
  restore(id: string): Promise<Item | null>;
  /** מחיקה סופית של פריטים שחלפה להם השהיית הסל — מחזיר אותם לצורך ניקוי הקבצים */
  purgeDeleted(): Promise<Item[]>;
  remove(id: string): Promise<Item | null>;
}

/** מסד נתונים מקומי — data/db.json, עם תור כתיבה שמונע כתיבות חופפות. */
class JsonStore implements Store {
  #file = path.join(process.cwd(), "data", "db.json");
  #queue: Promise<unknown> = Promise.resolve();

  #run<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.#queue.then(fn);
    this.#queue = run.catch(() => {});
    return run;
  }

  #read(): Promise<Item[]> {
    return fs
      .readFile(this.#file, "utf8")
      .then((raw) => (JSON.parse(raw).items ?? []) as Item[])
      .catch(() => []);
  }

  #write(items: Item[]) {
    return fs
      .mkdir(path.dirname(this.#file), { recursive: true })
      .then(() => fs.writeFile(this.#file, JSON.stringify({ items }, null, 2)));
  }

  list(module?: ModuleId) {
    return this.#run(async () =>
      (await this.#read())
        .filter((i) => !i.deletedAt && (!module || i.module === module))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  listDeleted() {
    return this.#run(async () =>
      (await this.#read())
        .filter((i): i is Item & { deletedAt: string } => !!i.deletedAt)
        .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)),
    );
  }

  find(id: string) {
    return this.#run(async () => (await this.#read()).find((i) => i.id === id) ?? null);
  }

  create(data: NewItem) {
    const item: Item = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
    return this.#run(async () => {
      const items = await this.#read();
      await this.#write([...items, item]);
      return item;
    });
  }

  update(id: string, patch: Partial<Pick<Item, "title" | "module">>) {
    return this.#run(async () => {
      const items = await this.#read();
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...patch };
      await this.#write(items);
      return items[idx];
    });
  }

  softDelete(id: string) {
    return this.#run(async () => {
      const items = await this.#read();
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], deletedAt: new Date().toISOString() };
      await this.#write(items);
      return items[idx];
    });
  }

  restore(id: string) {
    return this.#run(async () => {
      const items = await this.#read();
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      const { deletedAt: _drop, ...rest } = items[idx];
      items[idx] = rest;
      await this.#write(items);
      return items[idx];
    });
  }

  purgeDeleted() {
    return this.#run(async () => {
      const items = await this.#read();
      const cutoff = new Date(Date.now() - TRASH_RETAIN_MS).toISOString();
      const doomed = items.filter((i): i is Item & { deletedAt: string } => !!i.deletedAt && i.deletedAt < cutoff);
      if (!doomed.length) return [];
      const ids = new Set(doomed.map((i) => i.id));
      await this.#write(items.filter((i) => !ids.has(i.id)));
      return doomed;
    });
  }

  remove(id: string) {
    return this.#run(async () => {
      const items = await this.#read();
      const item = items.find((i) => i.id === id);
      if (!item) return null;
      await this.#write(items.filter((i) => i.id !== id));
      return item;
    });
  }
}

/** מסד נתונים בענן — פעיל אוטומטית כשמוגדר MONGODB_URI. */
class MongoStore implements Store {
  #col() {
    return mongoDb().then((db) => db.collection<Item>("items"));
  }

  async list(module?: ModuleId) {
    const items = await (await this.#col())
      .find({ ...(module ? { module } : {}), deletedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .toArray();
    return items.map(({ _id, ...item }) => item);
  }

  async listDeleted(): Promise<Item[]> {
    const items = await (await this.#col())
      .find({ deletedAt: { $exists: true } })
      .sort({ deletedAt: -1 })
      .toArray();
    return items.map(({ _id, ...item }) => item);
  }

  async find(id: string): Promise<Item | null> {
    const doc = await (await this.#col()).findOne({ id });
    if (!doc) return null;
    const { _id, ...item } = doc;
    return item;
  }

  async create(data: NewItem) {
    const item: Item = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
    await (await this.#col()).insertOne({ ...item }); // עותק, שה־driver לא יכתוב _id למקור
    return item;
  }

  async update(id: string, patch: Partial<Pick<Item, "title" | "module">>): Promise<Item | null> {
    const doc = await (await this.#col()).findOneAndUpdate(
      { id },
      { $set: patch },
      { returnDocument: "after" },
    );
    if (!doc) return null;
    const { _id, ...item } = doc;
    return item;
  }

  async softDelete(id: string): Promise<Item | null> {
    const doc = await (await this.#col()).findOneAndUpdate(
      { id },
      { $set: { deletedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    );
    if (!doc) return null;
    const { _id, ...item } = doc;
    return item;
  }

  async restore(id: string): Promise<Item | null> {
    const doc = await (await this.#col()).findOneAndUpdate(
      { id },
      { $unset: { deletedAt: "" } },
      { returnDocument: "after" },
    );
    if (!doc) return null;
    const { _id, ...item } = doc;
    return item;
  }

  async purgeDeleted(): Promise<Item[]> {
    const cutoff = new Date(Date.now() - TRASH_RETAIN_MS).toISOString();
    const col = await this.#col();
    const doomed = await col.find({ deletedAt: { $lt: cutoff } }).toArray();
    if (!doomed.length) return [];
    await col.deleteMany({ id: { $in: doomed.map((d) => d.id) } });
    return doomed.map(({ _id, ...item }) => item);
  }

  async remove(id: string): Promise<Item | null> {
    const doc = await (await this.#col()).findOneAndDelete({ id });
    if (!doc) return null;
    const { _id, ...item } = doc;
    return item;
  }
}

export const store: Store = process.env.MONGODB_URI ? new MongoStore() : new JsonStore();
