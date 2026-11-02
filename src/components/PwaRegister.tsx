"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    // ה־Service Worker לא מאכסן דבר חוץ מקבצים ששותפו מוואטסאפ, לכן בטוח גם בפיתוח
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
