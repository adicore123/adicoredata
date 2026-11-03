"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Eye,
  Loader2,
  Pencil,
  Play,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Item, ModuleId } from "@/lib/types";
import { MODULES } from "@/lib/modules";
import { MODULE_IDS } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/format";
import AudioPlayer from "@/components/AudioPlayer";
import EditableTitle from "@/components/EditableTitle";
import WhatsAppShare from "@/components/WhatsAppShare";
import MediaLightbox from "@/components/MediaLightbox";

type Dialog = { type: "rename"; item: Item } | { type: "delete"; item: Item } | null;

export default function ItemsView({
  items,
  kind,
  initialQuery,
}: {
  items: Item[];
  kind: ModuleId;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<Item | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;
  }, [items, query]);

  if (!items.length) return <EmptyState kind={kind} />;

  const refresh = () => startTransition(() => router.refresh());

  const actions = (item: Item) => (
    <>
      <WhatsAppShare item={item} />
      <a
        href={`/api/files/${item.id}`}
        download={item.name}
        aria-label="הורדה"
        title="הורדה"
        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-mint-700"
      >
        <Download className="size-4" />
      </a>
      <button
        onClick={() => setDialog({ type: "rename", item })}
        aria-label="עריכת כותרת ומודול"
        title="עריכה"
        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-mint-700"
      >
        <Pencil className="size-4" />
      </button>
      <button
        onClick={() => setDialog({ type: "delete", item })}
        aria-label="מחיקה"
        title="מחיקה"
        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="size-4" />
      </button>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="relative flex-1">
          <Search className="absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי כותרת…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm shadow-soft outline-none transition placeholder:text-slate-400 focus:border-mint-400 focus:ring-2 focus:ring-mint-200"
          />
        </label>
        <span className="hidden shrink-0 text-sm text-slate-500 sm:block">
          {filtered.length} קבצים
        </span>
      </div>

      {filtered.length === 0 && (
        <p className="card p-8 text-center text-sm text-slate-500">אין תוצאות עבור "{query}"</p>
      )}

      {kind === "images" && (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {filtered.map((item, i) => {
            const isVideo = item.mime.startsWith("video");
            return (
              <div
                key={item.id}
                className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <button
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`צפייה ב${item.title}`}
                  className="block w-full"
                >
                  {isVideo ? (
                    <span className="relative block">
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video
                        src={`/api/files/${item.id}`}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full"
                      />
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-12 place-items-center rounded-full bg-mint-600/90 text-white shadow-lift backdrop-blur">
                          <Play className="size-6 fill-current" />
                        </span>
                      </span>
                    </span>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/files/${item.id}`}
                      alt={item.title}
                      loading="lazy"
                      className="w-full transition duration-300 group-hover:scale-[1.02]"
                    />
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-900/70 to-transparent px-3 pt-8 pb-2.5 text-start text-xs font-medium text-white">
                    {item.title}
                  </span>
                </button>
                <button
                  onClick={() => setDialog({ type: "rename", item })}
                  aria-label={`עריכת כותרת: ${item.title}`}
                  title="עריכת כותרת ומודול"
                  className="absolute end-2 top-2 grid size-8 place-items-center rounded-xl bg-white/85 text-slate-600 shadow-soft backdrop-blur transition hover:bg-white hover:text-mint-700"
                >
                  <Pencil className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {kind === "recordings" && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <article key={item.id} className="card flex items-start gap-4 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint-500/10 text-mint-600">
                <ModuleIconOf item={item} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <EditableTitle id={item.id} title={item.title} />
                  </div>
                  <div className="flex shrink-0 items-center">{actions(item)}</div>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(item.createdAt)} · {formatBytes(item.size)}
                </p>
                <AudioPlayer item={item} />
              </div>
            </article>
          ))}
        </div>
      )}

      {kind === "documents" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => (
            <article key={item.id} className="card flex items-start gap-4 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint-500/10 text-mint-600">
                <ModuleIconOf item={item} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <EditableTitle id={item.id} title={item.title} />
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button
                      onClick={() => setPreview(item)}
                      aria-label="תצוגה מקדימה"
                      title="תצוגה מקדימה"
                      className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-mint-700"
                    >
                      <Eye className="size-4" />
                    </button>
                    {actions(item)}
                  </div>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{item.name}</p>
                <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                  {item.ext && (
                    <span className="rounded-md bg-mint-50 px-1.5 py-0.5 font-bold text-mint-700">
                      {item.ext.replace(".", "").toUpperCase()}
                    </span>
                  )}
                  {formatDate(item.createdAt)} · {formatBytes(item.size)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <MediaLightbox
          items={filtered}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onRename={(item) => setDialog({ type: "rename", item })}
        />
      )}

      {preview && <DocPreview item={preview} onClose={() => setPreview(null)} />}

      {dialog && (
        <DialogPortal
          dialog={dialog}
          pending={pending}
          onClose={() => setDialog(null)}
          onRenamed={refresh}
        />
      )}
    </div>
  );
}

function ModuleIconOf({ item }: { item: Item }) {
  const Icon = MODULES[item.module].icon;
  return <Icon className="size-5" />;
}

/** תצוגה מקדימה של מסמך: PDF בנגן המובנה, טקסט קריא, וידאו בנגן — בלי לרדת מהמערכת */
function DocPreview({ item, onClose }: { item: Item; onClose: () => void }) {
  const isPdf = item.mime === "application/pdf" || item.ext === ".pdf";
  const isVideo = item.mime.startsWith("video");
  const isText =
    item.mime.startsWith("text/") || [".txt", ".md", ".csv", ".json", ".log"].includes(item.ext);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isText) return;
    let alive = true;
    fetch(`/api/files/${item.id}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error())))
      .then((t) => alive && setText(t.slice(0, 200_000)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [item.id, isText]);

  return (
    <div className="fade-in fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-3 backdrop-blur-sm sm:p-6">
      <button aria-label="סגירה" onClick={onClose} className="absolute inset-0" />
      <div className="card relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-sm font-bold">{item.title}</p>
          <div className="flex shrink-0 items-center gap-1">
            <WhatsAppShare item={item} />
            <a
              href={`/api/files/${item.id}`}
              target="_blank"
              rel="noreferrer"
              aria-label="פתיחה בטאב חדש"
              title="פתיחה בטאב חדש"
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-mint-700"
            >
              <Download className="size-4" />
            </a>
            <button
              onClick={onClose}
              aria-label="סגירה"
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-50">
          {isVideo && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={`/api/files/${item.id}`} controls autoPlay playsInline className="max-h-[70vh] w-full bg-black" />
          )}
          {isPdf && (
            <iframe
              src={`/api/files/${item.id}#toolbar=1`}
              title={item.title}
              className="h-[70vh] w-full bg-white"
            />
          )}
          {isText &&
            (failed ? (
              <p className="p-6 text-center text-sm text-slate-500">טעינת הטקסט נכשלה — נסו להוריד את הקובץ.</p>
            ) : text === null ? (
              <p className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" /> טוען…
              </p>
            ) : (
              <pre dir="auto" className="p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {text}
              </pre>
            ))}
          {!isVideo && !isPdf && !isText && (
            <div className="grid place-items-center gap-3 p-10 text-center">
              <p className="text-sm text-slate-500">
                אין תצוגה מקדימה לסוג הקובץ הזה ({item.ext || item.mime || "לא ידוע"}).
              </p>
              <a
                href={`/api/files/${item.id}`}
                download={item.name}
                className="inline-flex items-center gap-2 rounded-2xl bg-mint-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-mint-700"
              >
                <Download className="size-4" /> הורדת הקובץ
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DialogPortal({
  dialog,
  pending,
  onClose,
  onRenamed,
}: {
  dialog: Exclude<Dialog, null>;
  pending: boolean;
  onClose: () => void;
  onRenamed: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(dialog.item.title);
  const [module, setModule] = useState<ModuleId>(dialog.item.module);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/items/${dialog.item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, module }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("השמירה נכשלה, נסו שוב");
      return;
    }
    onClose();
    onRenamed();
  }

  async function remove() {
    setSaving(true);
    await fetch(`/api/items/${dialog.item.id}`, { method: "DELETE" });
    setSaving(false);
    onClose();
    onRenamed();
  }

  const busy = saving || pending;

  return (
    <div className="fixed inset-0 z-60 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm fade-in">
      <button aria-label="סגירה" onClick={onClose} className="absolute inset-0" />
      <div className="card relative w-full max-w-sm p-5">
        {dialog.type === "rename" ? (
          <>
            <h3 className="text-base font-bold">עריכת קובץ</h3>
            <label className="mt-4 block text-xs font-semibold text-slate-500">כותרת</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-200"
            />
            <p className="mt-4 text-xs font-semibold text-slate-500">מודול</p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {MODULE_IDS.map((id) => {
                const meta = MODULES[id];
                const Icon = meta.icon;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setModule(id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                      module === id
                        ? "border-mint-500 bg-mint-50 text-mint-700"
                        : "border-slate-200 text-slate-500 hover:border-mint-300"
                    }`}
                  >
                    <Icon className="size-5" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={save}
                disabled={busy || !title.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mint-600 py-2.5 text-sm font-bold text-white transition hover:bg-mint-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />} שמירה
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                ביטול
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-bold">מחיקת קובץ</h3>
            <p className="mt-2 text-sm text-slate-500">
              "{dialog.item.title}" יועבר לסל מיחזור — ניתן יהיה לשחזר אותו עד 30 יום.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={remove}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />} מחיקה
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                ביטול
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ kind }: { kind: ModuleId }) {
  const meta = MODULES[kind];
  const Icon = meta.icon;
  return (
    <div className="card grid place-items-center border-dashed border-2 px-6 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-mint-500/10 text-mint-600">
        <Icon className="size-8" />
      </span>
      <h3 className="mt-4 text-lg font-bold">עדיין אין {meta.label}</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{meta.hint} — העלו את הקובץ הראשון והוא יופיע כאן.</p>
      <Link
        href={`/upload?module=${kind}`}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-mint-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-mint-700"
      >
        <Upload className="size-4" /> העלאת קובץ ל{meta.label}
      </Link>
    </div>
  );
}
