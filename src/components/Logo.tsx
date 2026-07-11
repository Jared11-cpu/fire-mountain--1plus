export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark relative grid shrink-0 place-items-center overflow-hidden rounded-[30%] bg-ink text-white ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}>
      <svg viewBox="0 0 64 64" role="img" aria-label="楚游智导 AI 标识" className="relative z-10 h-full w-full">
        <defs>
          <linearGradient id="brandRiver" x1="10" x2="54" y1="50" y2="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2FB98E" />
            <stop offset="1" stopColor="#62D5F2" />
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="48" height="48" rx="16" fill="#10222A" />
        <path d="M15 45 C23 38 28 42 34 34 C40 26 46 26 52 18" fill="none" stroke="url(#brandRiver)" strokeWidth="5" strokeLinecap="round" />
        <path d="M17 48 H47" stroke="#2FB98E" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        <circle cx="34" cy="34" r="4" fill="#F4D17A" stroke="white" strokeWidth="2" />
        <circle cx="52" cy="18" r="3.5" fill="#E75B3D" stroke="white" strokeWidth="2" />
        <text x="16" y="31" fill="white" fontSize="19" fontWeight="900" fontFamily="serif">楚</text>
        <text x="38" y="50" fill="white" fontSize="8" fontWeight="900" letterSpacing="1">AI</text>
      </svg>
    </div>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div>
        <div className="font-display text-[1.28rem] font-black tracking-[.08em] text-ink">楚游智导<span className="ml-1 text-tower">AI</span></div>
        <div className="mt-0.5 text-[10px] font-black tracking-[0.2em] text-river">湖北旅行智能体</div>
      </div>
    </div>
  );
}
