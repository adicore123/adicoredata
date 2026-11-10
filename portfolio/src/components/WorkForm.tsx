"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ImageUp, Loader2, Star, Trash2 } from "lucide-react";
import type { Work, MediaItem } from "@/lib/types";
import { isImage, isVideo } from "@/lib/types";
import { formatBytes } from "@/lib/format";

/** טופס מילוי ליצירה/עריכת עבודה: פרטים ← מדיה ← כרינה */
export default function WorkForm({
  work,
  categories,
  onCancel,
  onSaved,
}: {
  work: Work | null;
  categories: string[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(work?.title ?? "");
  const [description, setDescription] = useState(work?.description ?? "");
  const [category, setCategory] = useState(work?.category ?? "");
  const [client, setClient] = useState(work?.client ?? "");
  const [year, setYear] = useState(work?.year ? String(work.year) : "");
  const [tagsRaw, setTagsRaw] = useState(work?.tags.join(", ") ?? "");
  const [link, setLink] = useState(work?.link ?? "");
  const [published, setPublished] = useState(work?.published ?? true);
  const [featured, setFeatured] = useState(work?.featured ?? false);
  const [media, setMedia] = useState<MediaItem[]>(work?.media ?? []);
  const [workId, setWorkId] = useState(work?.id ?? null);
  const [coverIndex, setCoverIndex] = useState(work?.coverIndex ?? 0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

  async function attachFiles(files: File[]) {
    if (!files.length || !workId) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/works/${workId}/media`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "העלאה נכשלה");
      const updated: Work = await res.json();
      setMedia(updated.media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "העלאה נכשלה");
    } finally {
      setUploading(false);
    }
  }

  async function removeMedia(mediaId: string) {
    if (!workId) return;
    const res = await fetch(`/api/works/${workId}/media?mediaId=${mediaId}`, { method: "DELETE" });
    if (res.ok) {
      const updated: Work = await res.json();
      setMedia(updated.media);
      setCoverIndex(updated.coverIndex);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const body = {
        title,
        description,
        category: category.trim(),
        client: client.trim(),
        year: year.trim() ? Number(year) : null,
        tags,
        link: link.trim(),
        coverIndex: Math.min(coverIndex, Math.max(0, media.length - 1)),
        published,
        featured,
        ...(workId ? {} : { media: [] as MediaItem[], order: 0 }),
      };
      const res = await fetch(workId ? `/api/works/${workId}` : "/api/works", {
        method: workId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "השמירה נכשלה");
      if (workId) {
        await onSaved();
      } else {
        // עבודה חדשה: נשארים בטופס ופותחים את העלאת הקבצים
        const created: Work = await res.json();
        setWorkId(created.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "השמירה נכשלה");
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1.5 h-11 w-full rounded-xl border border-mint-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-mint-400 focus:border-mint-500 focus:ring-2 focus:ring-mint-200";

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{work ? "עריכת עבודה" : "עבודה חדשה"}</h1>
          <p className="text-sm text-slate-500">טופס מילוי: פרטים ← קבצים ← כרינה ← שמירה</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
        >
          <ArrowRight className="size-4" /> חזרה
        </button>
      </header>

      {!workId && (
        <p className="rounded-2xl border border-mint-100 bg-mint-50/70 px-4 py-3 text-xs leading-relaxed text-mint-900">
          שלב ראשון: ממלאים את הפרטים ושומרים טיוטה — אחר כך ייפתח העלאת הקבצים.
        </p>
      )}

      <div className="card relative overflow-hidden p-5 sm:p-6">
        <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-mint-400/60 to-transparent" />

        <label className="block text-sm font-bold text-slate-700">
          כותרת העבודה <span className="font-normal text-slate-400">— כך היא תופיע ללקוחות</span>
        </label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: אתר חנות תכשיטים" className={inputCls} autoFocus />

        <label className="mt-4 block text-sm font-bold text-slate-700">תיאור</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="מה הפרויקט עושה, מה נבנה, מה מיוחד בו…"
          className="mt-1.5 w-full rounded-xl border border-mint-300 bg-white px-3 py-2.5 text-sm leading-relaxed shadow-sm outline-none transition placeholder:text-slate-400 focus:border-mint-500 focus:ring-2 focus:ring-mint-200"
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-slate-700">קטגוריה</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="categories"
              placeholder="למשל: אתרים / מערכות / חנויות"
              className={inputCls}
            />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">לקוח</label>
            <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="שם הלקוח או העסק" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">שנה</label>
            <input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} placeholder="2026" inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700">תגיות <span className="font-normal text-slate-400">— מופרדות בפסיק</span></label>
            <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="Next.js, חנות, וואטסאפ" className={inputCls} />
          </div>
        </div>

        <label className="mt-4 block text-sm font-bold text-slate-700">קישור חי <span className="font-normal text-slate-400">— אופציונלי</span></label>
        <input value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" placeholder="https://…" className={inputCls} />

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPublished((p) => !p)}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition ${
              published ? "border-mint-500 bg-mint-50 text-mint-700" : "border-slate-200 text-slate-500"
            }`}
          >
            <span className={`grid size-4 place-items-center rounded-full border-2 ${published ? "border-mint-600 bg-mint-600 text-white" : "border-slate-300"}`}>
              {published && <Check className="size-2.5" />}
            </span>
            {published ? "מפורסם באתר" : "טיוטה מוסתרת"}
          </button>
          <button
            type="button"
            onClick={() => setFeatured((f) => !f)}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition ${
              featured ? "border-amber-400 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-500"
            }`}
          >
            <Star className={`size-4 ${featured ? "fill-current" : ""}`} />
            {featured ? "מודגש" : "הדגשה"}
          </button>
        </div>
      </div>

      {workId && (
        <div className="card relative overflow-hidden p-5 sm:p-6">
          <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-mint-400/60 to-transparent" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-bold text-slate-700">
              קבצי המדיה <span className="font-normal text-slate-400">— תמונות, סרטונים ומסמכים</span>
            </label>
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-mint-300 bg-mint-50/40 px-4 py-2.5 text-sm font-bold text-mint-700 transition hover:border-mint-500 hover:bg-mint-50 ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
              {uploading ? "מעלה…" : "הוספת קבצים"}
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  attachFiles([...(e.target.files ?? [])]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {media.length === 0 ? (
            <p className="mt-4 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              עדיין לא נוספו קבצים — לחצו על "הוספת קבצים"
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {media.map((m, i) => (
                <div
                  key={m.id}
                  className={`relative overflow-hidden rounded-2xl border-2 bg-white shadow-soft transition ${
                    i === coverIndex ? "border-mint-500 ring-2 ring-mint-200" : "border-slate-200"
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-mint-50">
                    {isVideo(m) ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={`/api/files/${m.id}`} preload="metadata" muted playsInline className="size-full object-cover" />
                    ) : isImage(m) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={`/api/files/${m.id}`} alt={m.name} className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-sm font-bold text-mint-700">
                        {m.ext.replace(".", "").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2.5 py-2">
                    <p className="min-w-0 truncate text-[11px] font-medium text-slate-500" title={m.name}>
                      {m.name} · {formatBytes(m.size)}
                    </p>
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => setCoverIndex(i)}
                        title={i === coverIndex ? "כרינה" : "קביעה ככרינה"}
                        className={`grid size-7 place-items-center rounded-lg transition ${
                          i === coverIndex ? "text-mint-600" : "text-slate-300 hover:text-amber-500"
                        }`}
                      >
                        <Star className={`size-4 ${i === coverIndex ? "fill-current" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMedia(m.id)}
                        title="הסרה"
                        className="grid size-7 place-items-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  {i === coverIndex && (
                    <span className="absolute end-2 top-2 rounded-full bg-mint-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      כרינה
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      <div className="sticky bottom-4 flex gap-2">
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-mint-600 py-4 text-sm font-bold text-white shadow-lift transition hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> שומר…
            </>
          ) : workId ? (
            "סיום ושמירה"
          ) : (
            "שמירה והוספת קבצים"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
