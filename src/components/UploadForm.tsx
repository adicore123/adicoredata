"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CloudUpload,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Share2,
  X,
} from "lucide-react";
import { MODULES, detectModule } from "@/lib/modules";
import { MODULE_IDS, type ModuleId } from "@/lib/types";
import { formatBytes } from "@/lib/format";

interface Pick {
  file: File;
  title: string;
}

function PickIcon({ file }: { file: File }) {
  const cls = "size-5";
  const t = file.type;
  if (t.startsWith("audio")) return <FileAudio className={`${cls} text-mint-600`} />;
  if (t.startsWith("image")) return <FileImage className={`${cls} text-mint-600`} />;
  if (/\.(xls|xlsx|csv)$/.test(file.name)) return <FileSpreadsheet className={`${cls} text-mint-600`} />;
  if (/\.zip$/.test(file.name)) return <FileArchive className={`${cls} text-mint-600`} />;
  return <FileText className={`${cls} text-mint-600`} />;
}

export default function UploadForm({
  defaultModule,
  fromShare,
}: {
  defaultModule?: ModuleId;
  fromShare?: boolean;
}) {
  const router = useRouter();
  // הגעה מעמוד מודול — המודול נעול ואין צריך לבחור; בחירה ידנית רק מוואטסאפ/כללי
  const locked = !!defaultModule;
  const [module, setModule] = useState<ModuleId>(defaultModule ?? "recordings");
  const [overrideLock, setOverrideLock] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [manualPick, setManualPick] = useState(false);
  const ModuleIcon = MODULES[module].icon;

  /** מוסיף קבצים, ובמסלול הכללי (וואטסאפ) גם מציע אוטומטית את המודול לפי סוגם */
  const applyPicks = (added: Pick[]) => {
    setPicks((prev) => [...prev, ...added]);
    if (!locked && !manualPick && added.length) {
      setModule(detectModule(added.map((p) => p.file)));
      setAutoDetected(true);
    }
  };

  const addFiles = (files: Iterable<File>) =>
    applyPicks([...files].map((file) => ({ file, title: file.name })));
  const [picks, setPicks] = useState<Pick[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);

  // קליטת קבצים ששותפו מוואטסאפ דרך ה־Service Worker
  useEffect(() => {
    if (!fromShare) return;
    (async () => {
      try {
        if (!("caches" in window)) return;
        const cache = await caches.open("share-target");
        const meta = await cache.match("/shared-count");
        if (!meta) return;
        const { count, title } = (await meta.json()) as { count: number; title?: string };
        const received: Pick[] = [];
        for (let i = 0; i < count; i++) {
          const res = await cache.match(`/shared-file-${i}`);
          if (!res) continue;
          const blob = await res.blob();
          const name = decodeURIComponent(res.headers.get("x-file-name") ?? `file-${i + 1}`);
          received.push({
            file: new File([blob], name, { type: blob.type }),
            title: (i === 0 && title) || name,
          });
        }
        await Promise.all([
          cache.delete("/shared-count"),
          ...received.map((_, i) => cache.delete(`/shared-file-${i}`)),
        ]);
        if (received.length) {
          applyPicks(received);
          setShared(true);
        }
      } catch {}
    })();
  }, [fromShare]);

  const setTitle = (i: number, title: string) =>
    setPicks((prev) => prev.map((p, idx) => (idx === i ? { ...p, title } : p)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!picks.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("module", module);
      fd.set("titles", JSON.stringify(picks.map((p) => p.title)));
      picks.forEach((p) => fd.append("files", p.file));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "ההעלאה נכשלה");
      router.push(`/${module}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ההעלאה נכשלה");
      setBusy(false);
    }
  }

  const totalSize = picks.reduce((sum, p) => sum + p.file.size, 0);

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">העלאת קבצים{locked ? ` ל${MODULES[module].label}` : ""}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {locked
            ? "המודול כבר נבחר — רק הוסיפו קבצים ותנו לכל אחד כותרת."
            : "בוחרים מודול, מוסיפים קבצים (כל סוג שהוא) ונותנים לכל קובץ כותרת משלו."}
        </p>
      </header>

      {shared && (
        <p className="flex items-center gap-2 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-800">
          <CheckCircle2 className="size-5 shrink-0" />
          התקבל מוואטסאפ — בחרו מודול, ערכו כותרות ולחצו העלאה.
        </p>
      )}

      {locked && !overrideLock ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3.5">
          <p className="flex min-w-0 items-center gap-2.5 text-sm font-bold text-mint-800">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint-500/15 text-mint-700">
              <ModuleIcon className="size-5" />
            </span>
            הקבצים ישויכו אוטומטית ל{MODULES[module].label}
          </p>
          <button
            type="button"
            onClick={() => setOverrideLock(true)}
            className="shrink-0 text-xs font-bold text-mint-700 underline underline-offset-4 transition hover:text-mint-900"
          >
            שינוי מודול
          </button>
        </div>
      ) : (
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-sm font-bold">
          לאיזה מודול לשייך?
          {autoDetected && !manualPick && (
            <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-bold text-mint-700">
              זוהה אוטומטית
            </span>
          )}
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {MODULE_IDS.map((id) => {
            const meta = MODULES[id];
            const Icon = meta.icon;
            const active = module === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setModule(id);
                  setManualPick(true);
                  setAutoDetected(false);
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-4 text-xs font-bold transition sm:text-sm ${
                  active
                    ? "border-mint-500 bg-mint-50 text-mint-700 shadow-soft"
                    : "border-slate-200 bg-white text-slate-500 hover:border-mint-300"
                }`}
              >
                <Icon className="size-6" />
                {meta.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-mint-500 bg-mint-50" : "border-slate-300 bg-white/70 hover:border-mint-400 hover:bg-mint-50/40"
        }`}
      >
        <span className="grid size-14 place-items-center rounded-full bg-mint-500/10 text-mint-600">
          <CloudUpload className="size-7" />
        </span>
        <span className="text-sm font-bold">גררו קבצים לכאן או לחצו לבחירה</span>
        <span className="text-xs text-slate-500">כל סוגי הקבצים · אפשר לבחור כמה קבצים יחד</span>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files ?? []);
            e.target.value = "";
          }}
        />
      </label>

      {picks.length > 0 && (
        <ul className="card divide-y divide-slate-100">
          {picks.map((p, i) => (
            <li key={`${p.file.name}-${i}`} className="flex items-center gap-3 p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint-500/10">
                <PickIcon file={p.file} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-500">
                  {p.file.name} · {formatBytes(p.file.size)}
                </p>
                <label className="mt-1 block text-[11px] font-bold text-mint-700">
                  השם של הקובץ — כך גם תמצאו אותו בחיפוש:
                </label>
                <input
                  value={p.title}
                  onChange={(e) => setTitle(i, e.target.value)}
                  placeholder="למשל: שיעור 12 — פרשת השבוע"
                  className="mt-0.5 w-full rounded-lg bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-slate-400 focus:bg-mint-50/60 focus:px-2 focus:py-1"
                />
              </div>
              <button
                type="button"
                onClick={() => setPicks((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`הסרת ${p.file.name}`}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      <div className="sticky bottom-4">
        <button
          type="submit"
          disabled={!picks.length || busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mint-600 py-4 text-sm font-bold text-white shadow-lift transition hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> מעלה…
            </>
          ) : (
            `העלאה${picks.length ? ` של ${picks.length} קבצים${totalSize ? ` · ${formatBytes(totalSize)}` : ""}` : ""}`
          )}
        </button>
      </div>

      <p className="flex items-start gap-2 rounded-2xl border border-mint-100 bg-mint-50/60 px-4 py-3 text-xs leading-relaxed text-mint-900">
        <Share2 className="mt-0.5 size-4 shrink-0" />
        <span>
          טיפ לוואטסאפ: אחרי התקנת האפליקציה ("הוספה למסך הבית"), פותחים קובץ בוואטסאפ ← שיתוף ← בוחרים
          "Adidata", והקבצים מגיעים ישירות לטופס הזה. באייפון שומרים את הקובץ ואז מעלים מכאן.
        </span>
      </p>
    </form>
  );
}
