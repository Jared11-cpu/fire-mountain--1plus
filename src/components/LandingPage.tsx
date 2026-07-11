import { useMemo, useState } from 'react';
import { ArrowRight, MapPin, Send, Wand2 } from 'lucide-react';
import { cities, type CityName } from '../data/mockData';
import { readEntries } from '../services/journalStorage';

type LandingPageProps = {
  onStart: (prompt?: string) => void;
  onCitySelect: (city: CityName) => void;
};

export function LandingPage({ onStart, onCitySelect }: LandingPageProps) {
  const [prompt, setPrompt] = useState('');
  const [activeStat, setActiveStat] = useState<'places'|'mileage'|'cities'|'photos'|null>(null);
  const entries = useMemo(() => readEntries(), []);
  const stats = useMemo(() => {
    const places = new Set(entries.map((item) => item.pointName)).size;
    const citiesVisited = new Set(entries.map((item) => item.city)).size;
    const photos = entries.reduce((sum, item) => sum + item.photoIds.length, 0);
    const mileage = Math.round(Math.max(0, places - 1) * 8.6);
    return { places, citiesVisited, photos, mileage };
  }, [entries]);
  const submitPrompt = () => onStart(prompt.trim());
  return (
    <main>
      <section className="section-pad river-line relative overflow-hidden py-14 md:py-20">
        <div className="absolute inset-0 -z-10 bg-river-grid map-ridge opacity-80" />
        <div className="mx-auto max-w-5xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-river/20 bg-white/75 px-4 py-2 text-sm font-bold text-river shadow-sm">
              <Wand2 className="h-4 w-4" />
              湖北本地文化旅行智能体 · 火山杯青年赛道
            </div>
            <h1 className="font-display text-5xl font-black leading-[1.08] text-ink sm:text-6xl lg:text-7xl">
              一句话，走懂湖北
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-8 text-ink/60">AI 把路线、地图、预算与真实旅行记录整理成一份可以直接出发的行程。</p>
            <form onSubmit={(event) => { event.preventDefault(); submitPrompt(); }} className="mx-auto mt-7 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 p-3 text-left shadow-soft transition focus-within:border-river/40 focus-within:ring-4 focus-within:ring-river/10">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-river/10 text-river"><MapPin className="h-5 w-5" /></span>
              <label className="min-w-0 flex-1"><span className="block text-xs font-black tracking-[.15em] text-river">和楚游 AI 说说你的旅行</span><input value={prompt} onChange={(event)=>setPrompt(event.target.value)} className="mt-1 w-full bg-transparent font-semibold text-ink outline-none placeholder:text-ink/35" placeholder="例如：恩施三天两夜，预算 1000，喜欢峡谷和拍照" /></label>
              <button type="submit" aria-label="发送旅行需求" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tower text-white transition hover:scale-105"><Send className="h-4 w-4" /></button>
            </form>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => onStart()}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 font-black text-white shadow-soft transition hover:-translate-y-1 hover:bg-river active:scale-95"
              >
                立即生成行程
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
              <span className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-ink/45">已覆盖宜昌、武汉、恩施等 6 座城市</span>
            </div>
        </div>
      </section>

      <section className="section-pad py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-river">City Entrances</p>
              <h2 className="mt-2 font-display text-4xl font-black text-ink">湖北城市入口</h2>
            </div>
            <p className="max-w-xl text-ink/60">选择城市，快速生成专属湖北路线。</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cities.map((city) => (
              <button
                key={city.name}
                onClick={() => onCitySelect(city.name)}
                className="group relative min-h-[250px] overflow-hidden rounded-[1.75rem] p-5 text-left text-white shadow-soft transition hover:-translate-y-1 active:scale-[0.98]"
              >
                <img src={city.imageUrl} alt={`${city.name}城市风景`} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-black/10" />
                <a href={city.imageCredit.sourceUrl} target="_blank" rel="noreferrer" onClick={(event)=>event.stopPropagation()} className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-bold text-white/75">{city.imageCredit.author} · {city.imageCredit.license}</a>
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="rounded-full bg-white/18 px-3 py-1 text-sm font-black backdrop-blur">{city.image}</div>
                    <ArrowRight className="h-6 w-6 transition group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-black">{city.name}</h3>
                    <p className="mt-2 text-lg font-semibold text-white/88">{city.title}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {city.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/18 px-3 py-1 text-sm font-bold backdrop-blur">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad pb-20 pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-ink p-7 text-white shadow-soft md:p-10">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="text-xs font-black tracking-[.22em] text-jade">MY TRAVEL FOOTPRINT</div><h2 className="mt-2 font-display text-3xl font-black">我的湖北旅行足迹</h2></div><p className="text-sm text-white/45">数据来自保存在本设备的旅行手账</p></div>
            <div className="mt-7 grid grid-cols-2 divide-x divide-white/10 md:grid-cols-4">
              <Stat value={stats.places} unit="处" label="记录地点" active={activeStat==='places'} onClick={()=>setActiveStat(activeStat==='places'?null:'places')} />
              <Stat value={stats.mileage} unit="km" label="累计里程" active={activeStat==='mileage'} onClick={()=>setActiveStat(activeStat==='mileage'?null:'mileage')} />
              <Stat value={stats.citiesVisited} unit="座" label="到访城市" active={activeStat==='cities'} onClick={()=>setActiveStat(activeStat==='cities'?null:'cities')} />
              <Stat value={stats.photos} unit="张" label="真实照片" active={activeStat==='photos'} onClick={()=>setActiveStat(activeStat==='photos'?null:'photos')} />
            </div>
            {activeStat && <div className="mt-5 rounded-2xl border border-white/10 bg-white/7 p-5"><StatDetails type={activeStat} entries={entries} mileage={stats.mileage} /></div>}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({value,unit,label,active,onClick}:{value:number;unit:string;label:string;active:boolean;onClick:()=>void}) { return <button onClick={onClick} className={`px-4 py-4 text-center transition first:pl-0 last:pr-0 ${active?'rounded-xl bg-white/10':'hover:bg-white/5'}`}><div><span className="font-display text-4xl font-black text-[#f4d17a] md:text-5xl">{value}</span><span className="ml-1 text-sm font-black text-white/55">{unit}</span></div><div className="mt-2 text-sm font-bold text-white/55">{label} · 点击查看</div></button> }

function StatDetails({type,entries,mileage}:{type:'places'|'mileage'|'cities'|'photos';entries:ReturnType<typeof readEntries>;mileage:number}) {
  if (!entries.length) return <p className="text-sm text-white/60">还没有旅行记录。前往“旅行手账”上传第一张真实照片后，这里会自动生成足迹详情。</p>;
  if (type==='places') return <div><b>记录过的地点</b><div className="mt-3 flex flex-wrap gap-2">{[...new Set(entries.map(e=>e.pointName))].map(x=><span key={x} className="rounded-full bg-white/10 px-3 py-2 text-sm">{x}</span>)}</div></div>;
  if (type==='cities') return <div><b>到访城市</b><div className="mt-3 flex flex-wrap gap-2">{[...new Set(entries.map(e=>e.city))].map(x=><span key={x} className="rounded-full bg-white/10 px-3 py-2 text-sm">{x}</span>)}</div></div>;
  if (type==='photos') return <div><b>照片记录</b><div className="mt-3 space-y-2">{entries.map(e=><div key={e.id} className="flex justify-between rounded-xl bg-white/7 px-3 py-2 text-sm"><span>{e.pointName}</span><span>{e.photoIds.length} 张</span></div>)}</div></div>;
  return <div><b>累计里程估算：{mileage} km</b><p className="mt-2 text-sm leading-6 text-white/55">根据已记录地点数量，以相邻旅行记录平均 8.6 km 估算；接入真实轨迹后将替换为 GPS 路线里程。</p></div>;
}
