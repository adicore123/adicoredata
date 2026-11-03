/** שמירת מקום ההאזנה לכל הקלטה ב־localStorage — להמשך האזנה מאיפה שעצרת */

export interface Progress {
  /** שניות */
  t: number;
  /** משך כולל בשניות */
  d: number;
}

const posKey = (id: string) => `adidata:pos:${id}`;

export function loadProgress(id: string): Progress | null {
  try {
    const raw = localStorage.getItem(posKey(id));
    if (!raw) return null;
    const p = JSON.parse(raw) as Progress;
    return Number.isFinite(p.t) && Number.isFinite(p.d) && p.d > 0 ? p : null;
  } catch {
    return null;
  }
}

export function saveProgress(id: string, t: number, d: number) {
  try {
    localStorage.setItem(posKey(id), JSON.stringify({ t: Math.floor(t), d }));
  } catch {}
}

export function clearProgress(id: string) {
  try {
    localStorage.removeItem(posKey(id));
  } catch {}
}

/** אחוז ההתקדמות השמור לקובץ (0–1) — להצגה על כרטיס לפני נגינה */
export function savedPercent(id: string): number {
  const p = loadProgress(id);
  return p && p.d ? Math.min(1, p.t / p.d) : 0;
}
