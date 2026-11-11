"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const KEY = "adicore:gyro-dismissed";

interface OrientationPerm {
  requestPermission?: () => Promise<"granted" | "denied">;
}

/** צ'יפ הרשאת ג'ירוסקופ — מוצג רק ב-iOS (שדורש הרשאה) עד לאישור/דחייה */
export default function GyroChip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // iOS 13+ דורש requestPermission — ורק במכשירי מגע
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!coarse) return;
    const D = (window as unknown as { DeviceOrientationEvent?: OrientationPerm }).DeviceOrientationEvent;
    if (!D?.requestPermission) return;
    if (localStorage.getItem(KEY)) return;
    setShow(true);
  }, []);

  if (!show) return null;

  async function enable() {
    const D = (window as unknown as { DeviceOrientationEvent?: OrientationPerm }).DeviceOrientationEvent;
    try {
      await D?.requestPermission?.();
    } catch {}
    localStorage.setItem(KEY, "1");
    setShow(false);
  }

  return (
    <button
      onClick={enable}
      className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/70 px-3.5 py-1.5 text-[11px] font-bold text-emerald-700 shadow-soft backdrop-blur transition hover:bg-white"
    >
      <Sparkles className="size-3 text-emerald-500" />
      הפעלת תנועה תלת-מימדית 🎩
    </button>
  );
}
