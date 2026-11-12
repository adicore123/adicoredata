"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { usePathname } from "next/navigation";

/** מסך פתיחה קצר — לוגו פועם ודוהה; פעם אחת לסשן */
export default function Preloader() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const loaded = sessionStorage.getItem("adicore:loaded");
    sessionStorage.setItem("adicore:loaded", "1");
    if (pathname === "/portfolio" || loaded || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(false);
      return;
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!show || pathname === "/portfolio") return null;

  return (
    <div aria-hidden className="preloader-out pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-app motion-reduce:hidden">
      <span className="preloader-logo grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-studio-400 to-studio-600 text-white shadow-lift">
        <Layers className="size-8" />
      </span>
    </div>
  );
}
