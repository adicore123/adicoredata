import type { Db, MongoClient } from "mongodb";

let dbPromise: Promise<Db> | undefined;

/** חיבור בטלה (lazy) וחד־פעמי ל־MongoDB, כולל שמירה על החיבור בין hot-reloads בפיתוח. */
export function mongoDb(): Promise<Db> {
  dbPromise ??= (async () => {
    const { MongoClient } = await import("mongodb");
    const g = globalThis as typeof globalThis & { __adicoreMongo?: MongoClient };
    const client = (g.__adicoreMongo ??= new MongoClient(process.env.MONGODB_URI!));
    await client.connect();
    return client.db(process.env.MONGODB_DB ?? "adicore");
  })();
  return dbPromise;
}
