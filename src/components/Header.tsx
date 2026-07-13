import type { navItems } from '../data/mockData';
import { Logo } from './Logo';

type PageId = (typeof navItems)[number]['id'];

type HeaderProps = {
  page: PageId;
  nav: typeof navItems;
  onNavigate: (page: PageId) => void;
};

export function Header({ page, nav, onNavigate }: HeaderProps) {
  const activeIndex = Math.max(nav.findIndex((item) => item.id === page), 0);
  const indicatorStyle = {
    width: `calc((100% - 0.75rem) / ${nav.length})`,
    transform: `translateX(${activeIndex * 100}%)`,
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-mist/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <button onClick={() => onNavigate('home')} className="rounded-2xl text-left transition hover:scale-[1.01] active:scale-95">
          <Logo />
        </button>
        <nav
          className="relative hidden min-w-0 flex-1 grid-cols-4 overflow-hidden rounded-full border border-white/70 bg-white/40 p-1.5 shadow-[0_18px_50px_rgba(18,34,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl lg:grid"
          style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
        >
          <span
            aria-hidden="true"
            className="absolute left-1.5 top-1.5 h-[calc(100%-0.75rem)] rounded-full bg-[#12222A]/95 shadow-[0_12px_28px_rgba(18,34,42,0.24),inset_0_1px_0_rgba(255,255,255,0.22)] transition-transform duration-300 ease-out before:absolute before:inset-x-3 before:top-0 before:h-px before:bg-white/50"
            style={indicatorStyle}
          />
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative z-10 rounded-full px-4 py-2 text-sm font-black transition-colors duration-300 active:scale-95 ${
                page === item.id
                  ? 'text-white'
                  : 'text-ink/66 hover:bg-white/45 hover:text-ink hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="px-4 pb-3 lg:hidden">
        <nav
          className="relative grid min-w-[360px] overflow-hidden rounded-full border border-white/65 bg-white/40 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_14px_34px_rgba(18,34,42,0.12)] backdrop-blur-2xl"
          style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
        >
          <span
            aria-hidden="true"
            className="absolute left-1.5 top-1.5 h-[calc(100%-0.75rem)] rounded-full bg-[#12222A]/95 shadow-[0_10px_22px_rgba(18,34,42,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform duration-300 ease-out"
            style={indicatorStyle}
          />
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`relative z-10 rounded-full px-3 py-2 text-sm font-black transition-colors duration-300 active:scale-95 ${
              page === item.id ? 'text-white' : 'text-ink/70 hover:bg-white/45 hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
        </nav>
      </div>
    </header>
  );
}
