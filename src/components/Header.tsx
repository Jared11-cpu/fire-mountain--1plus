import type { navItems } from '../data/mockData';
import { Logo } from './Logo';

type PageId = (typeof navItems)[number]['id'];

type HeaderProps = {
  page: PageId;
  nav: typeof navItems;
  onNavigate: (page: PageId) => void;
};

export function Header({ page, nav, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-mist/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button onClick={() => onNavigate('home')} className="rounded-2xl text-left transition hover:scale-[1.01] active:scale-95">
          <Logo />
        </button>
        <nav className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/45 p-1.5 shadow-[0_18px_50px_rgba(18,34,42,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl lg:flex">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative overflow-hidden rounded-full px-4 py-2 text-sm font-black transition active:scale-95 ${
                page === item.id
                  ? 'bg-[#12222A]/95 text-white shadow-[0_10px_24px_rgba(18,34,42,0.22),inset_0_1px_0_rgba(255,255,255,0.18)] before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-white/45'
                  : 'text-ink/66 hover:bg-white/45 hover:text-ink hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="hidden w-[210px] lg:block" aria-hidden="true" />
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`shrink-0 rounded-full border border-white/60 px-4 py-2 text-sm font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl transition active:scale-95 ${
              page === item.id ? 'bg-[#12222A]/95 text-white shadow-lg' : 'bg-white/45 text-ink/70 hover:bg-white/70 hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
