import type { Db, MongoClient } from "mongodb";

let dbPromise: Promise<Db> | undefined;

/** חיבור בטלה (lazy) וחד־פעמי ל־MongoDB, כולל שמירה על החיבור בין hot-reloads בפיתוח. */
export function mongoDb(): Promise<Db> {
  dbPromise ??= (async () => {
    const { MongoClient } = await import("mongodb");
    const g = globalThis as typeof globalThis & { __adidataMongo?: MongoClient };
    const client = (g.__adidataMongo ??= new MongoClient(process.env.MONGODB_URI!));
    await client.connect();
    return client.db(process.env.MONGODB_DB ?? "adidata");
  })();
  return dbPromise;
}
