"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "adidata:install-dismissed";

/** באנר התקנת האפליקציה: לחיצה מפעילה את התקנת ה-PWA באנדרואיד/Chrome, ובאייפון נפתחת הדרכה */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    // כבר מותקן כאפליקציה? לא מציגים כלום
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as Navigator & { standalone?: boolean }).standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // פתיחה ידנית מהסיידבאר
    const onOpen = () => setVisible(true);
    window.addEventListener("adidata:install", onOpen);

    // אייפון (אין beforeinstallprompt) — באנר עדין במובייל אחרי 4 שניות
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !localStorage.getItem(DISMISS_KEY)) {
      timer = setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("adidata:install", onOpen);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  async function install() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setVisible(false);
    } else {
      setIosHelp(true);
    }
  }

  if (!visible) return null;

  return (
    <>
      <div className="banner-in fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md sm:inset-x-6">
        <div className="card flex items-center gap-3 p-3.5 shadow-lift sm:p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-soft">
            <Smartphone className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">להתקין את Adidata בטלפון?</p>
            <p className="text-xs text-slate-500">אפליקציה אמיתית במסך הבית — מהירה יותר ועם שיתוף מוואטסאפ</p>
          </div>
          <button
            onClick={install}
            className="shrink-0 rounded-xl bg-mint-600 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-mint-700"
          >
            התקנה
          </button>
          <button
            onClick={dismiss}
            aria-label="סגירה"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {iosHelp && (
        <div className="fade-in fixed inset-0 z-60 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <button aria-label="סגירה" onClick={() => setIosHelp(false)} className="absolute inset-0" />
          <div className="card relative w-full max-w-sm p-5">
            <h3 className="text-base font-bold">התקנה באייפון</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint-100 text-xs font-extrabold text-mint-700">1</span>
                פותחים את האתר בדפדפן <strong>Safari</strong>
              </li>
              <li className="flex gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint-100 text-xs font-extrabold text-mint-700">2</span>
                לוחצים על כפתור <strong>השיתוף</strong> (הריבוע עם החץ למעלה)
              </li>
              <li className="flex gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint-100 text-xs font-extrabold text-mint-700">3</span>
                גוללים ובוחרים <strong>"הוסף למסך הבית"</strong>
              </li>
              <li className="flex gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint-100 text-xs font-extrabold text-mint-700">4</span>
                מאשרים — והאפליקציה שלכם מותקנת 🎉
              </li>
            </ol>
            <button
              onClick={() => setIosHelp(false)}
              className="mt-5 w-full rounded-xl bg-mint-600 py-2.5 text-sm font-bold text-white transition hover:bg-mint-700"
            >
              הבנתי
            </button>
          </div>
        </div>
      )}
    </>
  );
}
