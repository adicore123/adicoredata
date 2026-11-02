// מיגרציה חד־פעמית: מעתיק את הפריטים מ־data/db.json ואת הקבצים מ־data/uploads
// אל MongoDB (שנקרא מתוך .env.local / משתני הסביבה). בטוח להרצה חוזרת.
// הרצה: node scripts/migrate-json-to-mongo.mjs
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const q = String.fromCharCode(34);
function loadEnv() {
  const parse = (txt) =>
    Object.fromEntries(
      txt
        .split(/\r?\n/)
        .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().split(q).join("")];
        }),
    );
  if (process.env.MONGODB_URI) return process.env;
  try {
    return { ...process.env, ...parse(readFileSync(".env.local", "utf8")) };
  } catch {
    return process.env;
  }
}

const env = loadEnv();
if (!env.MONGODB_URI) {
  console.error("✗ חסר MONGODB_URI — מגדירים ב־.env.local או בסביבה ומנסים שוב");
  process.exit(1);
}

const root = process.cwd();
const { items } = JSON.parse(readFileSync(path.join(root, "data", "db.json"), "utf8"));
const uploadsDir = path.join(root, "data", "uploads");

const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.MONGODB_DB ?? "adidata");

let copied = 0;
let skipped = 0;
for (const item of items ?? []) {
  const exists = await db.collection("items").countDocuments({ id: item.id }, { limit: 1 });
  if (exists) {
    skipped++;
    continue;
  }
  await db.collection("items").insertOne({ ...item });
  try {
    const buf = readFileSync(path.join(uploadsDir, item.id + item.ext));
    await db.collection("files").updateOne({ _id: item.id + item.ext }, { $set: { data: buf } }, { upsert: true });
  } catch {
    console.warn(`⚠ הפריט "${item.title}" אויח ללא קובץ פיזי`);
  }
  copied++;
}

console.log(`✔ הסתיים: ${copied} הועתקו, ${skipped} כבר היו קיימים`);
await client.close();
