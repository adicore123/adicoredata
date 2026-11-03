"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Share2,
  X,
} from "lucide-react";
import { MODULES, detectModule } from "@/lib/modules";
import { MODULE_IDS, type ModuleId } from "@/lib/types";
import { formatBytes } from "@/lib/format";

interface Row {
  title: string;
  file: File | null;
}

const emptyRow: Row = { title: "", file: null };

function PickIcon({ file }: { file: File }) {
  const cls = "size-5 text-mint-600";
  if (file.type.startsWith("audio")) return <FileAudio className={cls} />;
  if (file.type.startsWith("image")) return <FileImage className={cls} />;
  if (/\.(xls|xlsx|csv)$/.test(file.name)) return <FileSpreadsheet className={cls} />;
  if (/\.zip$/.test(file.name)) return <FileArchive className={cls} />;
  return <FileText className={cls} />;
}

/** ממקד את שדה השם הריק הראשון — בדסקטופ בלבד, שלא תיפתח מקלדת במובייל לחינם */
function focusFirstEmptyName() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  setTimeout(() => {
    const el = [...document.querySelectorAll<HTMLInputElement>("input[data-name-input]")].find(
      (i) => !i.value,
    );
    el?.focus();
  }, 80);
}

export default function UploadForm({
  defaultModule,
  fromShare,
}: {
  defaultModule?: ModuleId;
  fromShare?: boolean;
}) {
  const router = useRouter();
  // הגעה מעמוד מודול — המודול נעול; בחירה ידנית רק במסלול הכללי (וואטסאפ)
  const locked = !!defaultModule;
  const [module, setModule] = useState<ModuleId>(defaultModule ?? "recordings");
  const [overrideLock, setOverrideLock] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [manualPick, setManualPick] = useState(false);
  // טופס מילוי: שורה ריקה ראשונה מופיעה מיד — קודם שם, אחר כך קובץ
  const [rows, setRows] = useState<Row[]>([emptyRow]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);
  const ModuleIcon = MODULES[module].icon;

  useEffect(() => {
    focusFirstEmptyName();
  }, []);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const suggestModule = (files: File[]) => {
    if (!locked && !manualPick) {
      setModule(detectModule(files));
      setAutoDetected(true);
    }
  };

  /** מצרף קבצים לטופס: ממלא שורות ריקות ומוסיף חדשות לפי הצורך */
  const attachFiles = (files: File[]) => {
    if (!files.length) return;
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r }));
      for (const f of files) {
        const idx = next.findIndex((r) => !r.file);
        if (idx !== -1) next[idx] = { ...next[idx], file: f };
        else next.push({ title: "", file: f });
      }
      return next;
    });
    suggestModule(files);
    focusFirstEmptyName();
  };

  // קליטת קבצים ששותפו מוואטסאפ דרך ה־Service Worker — נכנסים כשורות מוכנות, השם ריק וממתין למילוי
  useEffect(() => {
    if (!fromShare) return;
    (async () => {
      try {
        if (!("caches" in window)) return;
        const cache = await caches.open("share-target");
        const meta = await cache.match("/shared-count");
        if (!meta) return;
        const { count } = (await meta.json()) as { count: number };
        const received: File[] = [];
        for (let i = 0; i < count; i++) {
          const res = await cache.match(`/shared-file-${i}`);
          if (!res) continue;
          const blob = await res.blob();
          const name = decodeURIComponent(res.headers.get("x-file-name") ?? `file-${i + 1}`);
          received.push(new File([blob], name, { type: blob.type }));
        }
        await Promise.all([
          cache.delete("/shared-count"),
          ...received.map((_, i) => cache.delete(`/shared-file-${i}`)),
        ]);
        if (received.length) {
          attachFiles(received);
          setShared(true);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromShare]);

  const ready = rows.filter((r): r is Row & { file: File } => !!r.file);
  const totalSize = ready.reduce((sum, r) => sum + r.file.size, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("module", module);
      fd.set("titles", JSON.stringify(ready.map((r) => r.title)));
      ready.forEach((r) => fd.append("files", r.file));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "ההעלאה נכשלה");
      router.push(`/${module}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ההעלאה נכשלה");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">העלאת קבצים{locked ? ` ל${MODULES[module].label}` : ""}</h1>
        <p className="mt-1 text-sm text-slate-500">
          טופס מילוי: קודם כותבים שם לקובץ, אחר כך בוחרים את הקובץ עצמו — ומעלים.
        </p>
      </header>

      {shared && (
        <p className="flex items-center gap-2 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-800">
          <CheckCircle2 className="size-5 shrink-0" />
          התקבל מוואטסאפ — הקבצים כבר מסומנים בטופס, רק תנו להם שמות ולחצו העלאה.
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
                className={`flex min-h-16 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 text-xs font-bold transition sm:text-sm ${
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

      {/* שורות הטופס — שם קודם, קובץ אחר כך */}
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400">קובץ {i + 1}</p>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`הסרת שורה ${i + 1}`}
                  className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <label htmlFor={`title-${i}`} className="mt-1 block text-sm font-bold text-slate-700">
              שם הקובץ{" "}
              <span className="font-normal text-slate-400">— השם שלכם, שכך גם יימצא בחיפוש</span>
            </label>
            <input
              id={`title-${i}`}
              data-name-input={i}
              value={row.title}
              onChange={(e) => setRow(i, { title: e.target.value })}
              placeholder="למשל: שיעור 12 — פרשת השבוע"
              className="mt-1.5 h-11 w-full rounded-xl border border-mint-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-mint-400 focus:border-mint-500 focus:ring-2 focus:ring-mint-200"
            />

            <p className="mt-3 text-sm font-bold text-slate-700">הקובץ עצמו</p>
            {row.file ? (
              <div className="mt-1.5 flex min-h-11 items-center gap-3 rounded-xl border border-mint-200 bg-mint-50/60 px-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-mint-600 shadow-sm">
                  <PickIcon file={row.file} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{row.file.name}</span>
                  <span className="block text-xs text-slate-500">{formatBytes(row.file.size)}</span>
                </span>
                <label
                  htmlFor={`file-${i}`}
                  className="cursor-pointer text-xs font-bold text-mint-700 underline underline-offset-4 transition hover:text-mint-900"
                >
                  החלפה
                </label>
              </div>
            ) : (
              <label
                htmlFor={`file-${i}`}
                className="mt-1.5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-mint-300 bg-mint-50/40 text-sm font-bold text-mint-700 transition hover:border-mint-500 hover:bg-mint-50"
              >
                <FolderOpen className="size-4" />
                בחירת קובץ
              </label>
            )}
            <input
              id={`file-${i}`}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setRow(i, { file: f });
                  suggestModule([f]);
                }
                e.target.value = "";
              }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, emptyRow])}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3.5 text-sm font-bold text-slate-500 transition hover:border-mint-400 hover:text-mint-700"
      >
        <Plus className="size-4" /> הוספת קובץ נוסף
      </button>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          attachFiles([...e.dataTransfer.files]);
        }}
        className={`block rounded-2xl px-4 py-2.5 text-center text-xs transition ${
          dragging ? "border-2 border-dashed border-mint-500 bg-mint-50 font-bold text-mint-700" : "text-slate-400"
        }`}
      >
        או גררו קבצים לכאן להוספה מהירה
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            attachFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      <div className="sticky bottom-4">
        <button
          type="submit"
          disabled={!ready.length || busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mint-600 py-4 text-sm font-bold text-white shadow-lift transition hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> מעלה…
            </>
          ) : (
            `העלאה${ready.length ? ` של ${ready.length} קבצים${totalSize ? ` · ${formatBytes(totalSize)}` : ""}` : ""}`
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
