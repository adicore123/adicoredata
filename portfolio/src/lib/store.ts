import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Work, NewWork, WorkPatch } from "./types";
import { mongoDb } from "./mongo";

export interface Store {
  /** כל העבודות לאדמין — לפי סדר תצוגה ואז חדשות קודם */
  listAll(): Promise<Work[]>;
  /** עבודות פורסמו בלבד — לאתר הציבורי */
  listPublished(): Promise<Work[]>;
  find(id: string): Promise<Work | null>;
  create(data: NewWork): Promise<Work>;
  update(id: string, patch: WorkPatch): Promise<Work | null>;
  remove(id: string): Promise<Work | null>;
  incrementViews(id: string): Promise<void>;
  /** הקטגוריות הקיימות (להצעות בטופס) */
  categories(): Promise<string[]>;
}

const sortWorks = (a: Work, b: Work) =>
  a.order - b.order || b.createdAt.localeCompare(a.createdAt);

/** מסד נתונים מקומי — data/db.json, עם תור כתיבה */
class JsonStore implements Store {
  #file = path.join(process.cwd(), "data", "db.json");
  #queue: Promise<unknown> = Promise.resolve();

  #run<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.#queue.then(fn);
    this.#queue = run.catch(() => {});
    return run;
  }

  #read(): Promise<Work[]> {
    return fs
      .readFile(this.#file, "utf8")
      .then((raw) => (JSON.parse(raw).works ?? []) as Work[])
      .catch(() => []);
  }

  #write(works: Work[]) {
    return fs
      .mkdir(path.dirname(this.#file), { recursive: true })
      .then(() => fs.writeFile(this.#file, JSON.stringify({ works }, null, 2)));
  }

  listAll() {
    return this.#run(async () => (await this.#read()).sort(sortWorks));
  }

  listPublished() {
    return this.#run(async () =>
      (await this.#read())
        .filter((w) => w.published)
        .sort(sortWorks),
    );
  }

  find(id: string) {
    return this.#run(async () => (await this.#read()).find((w) => w.id === id) ?? null);
  }

  create(data: NewWork) {
    const now = new Date().toISOString();
    const work: Work = { ...data, id: randomUUID(), views: 0, createdAt: now, updatedAt: now };
    return this.#run(async () => {
      const works = await this.#read();
      await this.#write([...works, work]);
      return work;
    });
  }

  update(id: string, patch: WorkPatch) {
    return this.#run(async () => {
      const works = await this.#read();
      const idx = works.findIndex((w) => w.id === id);
      if (idx === -1) return null;
      works[idx] = { ...works[idx], ...patch, updatedAt: new Date().toISOString() };
      await this.#write(works);
      return works[idx];
    });
  }

  remove(id: string) {
    return this.#run(async () => {
      const works = await this.#read();
      const work = works.find((w) => w.id === id);
      if (!work) return null;
      await this.#write(works.filter((w) => w.id !== id));
      return work;
    });
  }

  async incrementViews(id: string) {
    await this.#run(async () => {
      const works = await this.#read();
      const idx = works.findIndex((w) => w.id === id);
      if (idx === -1) return;
      works[idx] = { ...works[idx], views: works[idx].views + 1 };
      await this.#write(works);
    });
  }

  async categories() {
    const works = await this.listAll();
    return [...new Set(works.map((w) => w.category).filter(Boolean))];
  }
}

/** מסד נתונים בענן — פעיל אוטומטית כשמוגדר MONGODB_URI (מסד adicore, נפרד מ-Adidata) */
class MongoStore implements Store {
  #col() {
    return mongoDb().then((db) => db.collection<Work>("works"));
  }

  strip(doc: Work & { _id?: unknown }): Work {
    const { _id, ...work } = doc;
    return work as Work;
  }

  async listAll() {
    const works = await (await this.#col()).find({}).sort({ order: 1, createdAt: -1 }).toArray();
    return works.map((w) => this.strip(w));
  }

  async listPublished() {
    const works = await (await this.#col()).find({ published: true }).sort({ order: 1, createdAt: -1 }).toArray();
    return works.map((w) => this.strip(w));
  }

  async find(id: string) {
    const doc = await (await this.#col()).findOne({ id });
    return doc ? this.strip(doc) : null;
  }

  async create(data: NewWork) {
    const now = new Date().toISOString();
    const work: Work = { ...data, id: randomUUID(), views: 0, createdAt: now, updatedAt: now };
    await (await this.#col()).insertOne({ ...work });
    return work;
  }

  async update(id: string, patch: WorkPatch) {
    const doc = await (await this.#col()).findOneAndUpdate(
      { id },
      { $set: { ...patch, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    );
    return doc ? this.strip(doc) : null;
  }

  async remove(id: string) {
    const doc = await (await this.#col()).findOneAndDelete({ id });
    return doc ? this.strip(doc) : null;
  }

  async incrementViews(id: string) {
    await (await this.#col()).updateOne({ id }, { $inc: { views: 1 } });
  }

  async categories() {
    const works = await this.listAll();
    return [...new Set(works.map((w) => w.category).filter(Boolean))];
  }
}

export const store: Store = process.env.MONGODB_URI ? new MongoStore() : new JsonStore();
