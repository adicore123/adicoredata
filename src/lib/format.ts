export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));

const DAY_MS = 24 * 60 * 60 * 1000;
const rtFmt = new Intl.RelativeTimeFormat("he", { numeric: "auto" });

/** "לפני 3 דקות", "אתמול", "לפני 5 ימים" — ומעל חודש עוברים לתאריך מלא */
export function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return rtFmt.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtFmt.format(-hours, "hour");
  const days = Math.round(diff / DAY_MS);
  if (days <= 30) return rtFmt.format(-days, "day");
  return dateFmt.format(new Date(iso));
}
