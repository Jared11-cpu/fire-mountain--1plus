export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark relative grid shrink-0 place-items-center overflow-hidden rounded-[28%] text-white ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}>
      <svg viewBox="0 0 64 64" role="img" aria-label="楚游智导 AI 标识" className="h-full w-full">
        <path d="M12 42 C19 36 23 26 30 22 C35 28 38 33 43 34 C47 34 50 31 53 27" fill="none" stroke="#F8FFFC" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 46 C24 49 35 48 48 43" fill="none" stroke="#8EE6CC" strokeWidth="2.8" strokeLinecap="round"/>
        <circle cx="52" cy="24" r="4" fill="#F06A4D" stroke="#F8FFFC" strokeWidth="1.5"/>
        <path d="M46 49 V55 M43 52 H49" stroke="#F8FFFC" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[1.25rem] font-black tracking-[.04em] text-ink">楚游智导</span>
          <span className="rounded-full bg-tower px-1.5 py-0.5 text-[10px] font-black leading-none tracking-[0.08em] text-white">AI</span>
        </div>
        <div className="mt-1.5 text-[10px] font-black tracking-[0.16em] text-river">湖北旅行智能体</div>
      </div>
    </div>
  );
}
