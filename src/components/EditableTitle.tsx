"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

/**
 * כותרת שניתן לערוך בלחיצה — השם שהקובץ נקרא בו ושהחיפוש מוצא.
 * לחיצה פותחת עריכה במקום, Enter/בלחיצה בחוץ שומר, Escape מבטל.
 */
export default function EditableTitle({
  id,
  title,
  tone = "dark",
}: {
  id: string;
  title: string;
  tone?: "dark" | "light";
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function save() {
    const next = value.trim();
    setEditing(false);
    if (!next || next === title) {
      setValue(title);
      return;
    }
    setSaving(true);
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: next.slice(0, 120) }),
    });
    setSaving(false);
    router.refresh();
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        autoFocus
        onFocus={(e) => e.target.select()}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        dir="auto"
        className={`w-full rounded-lg border px-2 py-1 text-sm font-bold outline-none ${
          tone === "light"
            ? "border-white/30 bg-white/10 text-white"
            : "border-mint-400 bg-mint-50/60 text-slate-900"
        }`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="לחיצה לעריכת השם"
      className="group/title flex w-full min-w-0 items-center gap-1.5 text-start"
    >
      <span
        className={`truncate text-sm font-bold ${
          tone === "light" ? "text-white" : "text-slate-900"
        } ${saving ? "opacity-50" : ""}`}
      >
        {title}
      </span>
      <Pencil
        className={`size-3 shrink-0 transition ${
          tone === "light"
            ? "text-white/40 group-hover/title:text-white"
            : "text-slate-300 group-hover/title:text-mint-600"
        }`}
      />
    </button>
  );
}
