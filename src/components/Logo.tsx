export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark relative grid shrink-0 place-items-center overflow-hidden rounded-[28%] bg-ink text-white ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
      <span className={`relative z-10 -translate-y-0.5 font-display font-black text-white ${compact ? 'text-xl' : 'text-2xl'}`}>鄂</span>
      <span className="absolute inset-x-1.5 bottom-1.5 h-[3px] rounded-full bg-jade" />
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
