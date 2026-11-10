import { createHash } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "adicore_admin";

/** טוקן הסשן — נגזר מהסיסמה; ה-cookie שומר אותו */
export function adminToken(): string {
  const pass = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`${pass}:adicore-session-v1`).digest("hex");
}

export function checkPassword(password: string): boolean {
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

/** האם הבקשה הנוכחית מחוברת כאדמין */
export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === adminToken();
}

export const COOKIE_NAME = COOKIE;

/** זמן חיי הסשן — 30 יום */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
