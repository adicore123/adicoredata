import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Item, ModuleId, NewItem } from "./types";
import { mongoDb } from "./mongo";

export interface Store {
  list(module?: ModuleId): Promise<Item[]>;
  find(id: string): Promise<Item | null>;
  create(item: NewItem): Promise<Item>;
  update(id: string, patch: Partial<Pick<Item, "title" | "module">>): Promise<Item | null>;
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
        .filter((i) => !module || i.module === module)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
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
      .find(module ? { module } : {})
      .sort({ createdAt: -1 })
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

  async remove(id: string): Promise<Item | null> {
    const doc = await (await this.#col()).findOneAndDelete({ id });
    if (!doc) return null;
    const { _id, ...item } = doc;
    return item;
  }
}

export const store: Store = process.env.MONGODB_URI ? new MongoStore() : new JsonStore();
