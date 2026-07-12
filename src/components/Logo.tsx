export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark relative grid shrink-0 place-items-center overflow-hidden rounded-[26%] bg-ink text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_12px_24px_rgba(18,34,42,0.16)] ring-1 ring-white/70 ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}>
      <svg viewBox="0 0 64 64" role="img" aria-label="楚游智导 AI 标识" className="relative z-10 h-full w-full">
        <rect x="7" y="7" width="50" height="50" rx="17" fill="#12222A"/>
        <path d="M17 46 H43" fill="none" stroke="#2FB98E" strokeWidth="4.5" strokeLinecap="round"/>
        <circle cx="48" cy="18" r="4.5" fill="#D35236" stroke="#F8FFFC" strokeWidth="2"/>
        <text x="18" y="39" fill="#F8FFFC" fontSize="28" fontWeight="900" fontFamily="Noto Serif SC, Source Han Serif SC, serif">楚</text>
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
