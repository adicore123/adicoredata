"use client";

import dynamic from "next/dynamic";

/** three נטען רק אצל הלקוח — אפס השפעה על זמן הכניסה ועל ה-SSR */
const Hero3D = dynamic(() => import("@/components/Hero3D"), {
  ssr: false,
  loading: () => null,
});

export default function Hero3DLoader() {
  return <Hero3D />;
}
