const capabilities = ["Next.js", "React", "TypeScript", "Three.js", "WebGL", "MongoDB", "UI/UX", "RTL"];

export default function Marquee() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-studio-100/80 bg-white/75 p-3 sm:flex-nowrap sm:px-5">
      <span className="shrink-0 px-2 font-copy text-base font-bold text-muted">טכנולוגיות ויכולות</span>
      <div className="marquee-track min-w-0 flex-1 overflow-hidden motion-reduce:overflow-visible" dir="rtl">
        <div className="marquee-move flex w-max items-center motion-reduce:w-auto">
          {[0, 1, 2, 3].map((copy) => (
            <ul key={copy} aria-hidden={copy !== 0 || undefined} className={`flex items-center gap-2 pe-2 ${copy !== 0 ? "motion-reduce:hidden" : "motion-reduce:flex-wrap"}`}>
              {capabilities.map((item) => (
                <li key={item} dir="ltr" className="whitespace-nowrap rounded-full border border-studio-100 bg-studio-50/70 px-3 py-1.5 text-xs font-bold text-studio-800">{item}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
