"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "התחברות נכשלה");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "התחברות נכשלה");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10">
      <div className="card relative overflow-hidden p-6">
        <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-mint-400/60 to-transparent" />
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-soft">
          <Lock className="size-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold">כניסת מנהל</h1>
        <p className="mt-1 text-sm text-slate-500">הזינו סיסמה לניהול העבודות</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="סיסמה"
            className="h-11 w-full rounded-xl border border-mint-300 bg-white px-3 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-mint-500 focus:ring-2 focus:ring-mint-200"
          />
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint-600 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-mint-700 disabled:opacity-40"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} כניסה
          </button>
        </form>
      </div>
    </div>
  );
}
