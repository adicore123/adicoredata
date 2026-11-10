import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-5xl font-black text-mint-500">404</p>
        <h1 className="mt-3 text-xl font-bold">העמוד לא נמצא</h1>
        <p className="mt-2 text-sm text-slate-500">ייתכן שהעבודה הוסתרה או הוסרה.</p>
        <Link
          href="/portfolio"
          className="mt-6 inline-flex rounded-2xl bg-mint-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-mint-700"
        >
          לעמוד הראשי
        </Link>
      </div>
    </div>
  );
}
