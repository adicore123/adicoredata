/** חילוץ פסי גל-סאונד מקובץ אודיו בעזרת Web Audio, עם קאש ב-localStorage לכל קובץ */

const peaksKey = (id: string) => `adidata:peaks:${id}`;

/**
 * מחזיר N ערכי עוצמה מנורמלים (0–1) לקובץ אודיו.
 * מחושב פעם אחת ונשמר בקאש; null אם הפענוח נכשל (נופלים לברים אחידים).
 */
export async function getPeaks(id: string, src: string, buckets = 72): Promise<number[] | null> {
  try {
    const cached = localStorage.getItem(peaksKey(id));
    if (cached) return JSON.parse(cached) as number[];
  } catch {}

  try {
    const buf = await (await fetch(src)).arrayBuffer();
    const AC: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const audio = await ctx.decodeAudioData(buf);
    const data = audio.getChannelData(0);
    ctx.close();

    const block = Math.max(1, Math.floor(data.length / buckets));
    const step = Math.max(1, Math.floor(block / 250)); // דגימה חלקית לקבצים ארוכים
    const peaks: number[] = [];
    let max = 0;
    for (let i = 0; i < buckets; i++) {
      let peak = 0;
      const start = i * block;
      const end = Math.min(data.length, start + block);
      for (let j = start; j < end; j += step) {
        const v = Math.abs(data[j]);
        if (v > peak) peak = v;
      }
      if (peak > max) max = peak;
      peaks.push(peak);
    }
    const normalized = peaks.map((p) => Math.round((max ? p / max : 0) * 100) / 100);
    try {
      localStorage.setItem(peaksKey(id), JSON.stringify(normalized));
    } catch {}
    return normalized;
  } catch {
    return null;
  }
}
