import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Camera, CheckCircle2, ImagePlus, Loader2, MapPin, Navigation, Route as RouteIcon, Trash2, UploadCloud, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cities, type CityName } from '../data/mockData';
import { loadAmapJsApi, planAmapDrivingRoute } from '../services/amapDriving';
import { clearJournal, compressPhoto, deletePhoto, loadPhoto, savePhoto } from '../services/journalStorage';
import { useTrip } from '../state/tripStore';
import type { JournalEntry, RoutePoint } from '../types/route';

type PendingPhoto = { id: string; file: File; preview: string; progress: number; status: 'pending' | 'compressing' | 'saved' | 'error'; error?: string };
type JournalMapEntry = JournalEntry & { photoUrl?: string; isExample?: boolean };

const cityCoordinates: Record<CityName, [number, number]> = {
  武汉: [114.3055, 30.5928], 宜昌: [111.2865, 30.6919], 恩施: [109.4882, 30.2722],
  荆州: [112.2397, 30.3352], 襄阳: [112.1224, 32.009], 黄石: [115.0389, 30.1995],
};

export function JournalPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { journalEntries: entries, setJournalEntries, plan, notify } = useTrip();
  const [mode, setMode] = useState<'real' | 'example'>('real');
  const [draft, setDraft] = useState({ pointName: '', note: '', city: '武汉' as CityName, visitedAt: new Date().toISOString().slice(0, 10) });
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const pendingRef = useRef<PendingPhoto[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => () => pendingRef.current.forEach((item) => URL.revokeObjectURL(item.preview)), []);

  useEffect(() => {
    let alive = true;
    const ids = entries.flatMap((entry) => entry.photoIds);
    Promise.all(ids.map(async (id) => [id, await loadPhoto(id)] as const)).then((rows) => {
      if (!alive) return;
      const next: Record<string, string> = {};
      rows.forEach(([id, blob]) => { if (blob) next[id] = URL.createObjectURL(blob); });
      setPhotoUrls((old) => { Object.values(old).forEach(URL.revokeObjectURL); return next; });
    }).catch((error) => {
      console.error('Journal photo load failed', error);
      notify('IndexedDB 照片读取失败，文字记录仍可使用。', 'error');
    });
    return () => { alive = false; };
  }, [entries, notify]);

  const stats = useMemo(() => ({ places: new Set(entries.map((entry) => entry.pointName)).size, cities: new Set(entries.map((entry) => entry.city)).size, photos: entries.reduce((sum, entry) => sum + entry.photoIds.length, 0) }), [entries]);
  const examplePoints = plan?.route.points ?? [];
  const realMapEntries: JournalMapEntry[] = entries.map((entry) => ({ ...entry, photoUrl: entry.photoIds.map((id) => photoUrls[id]).find(Boolean) }));
  const exampleMapEntries: JournalMapEntry[] = examplePoints.map((point) => ({ id: `example-${point.id}`, pointId: point.id, pointName: point.name, city: point.city, day: point.day ?? 1, note: point.recordTip, visitedAt: plan?.requestSnapshot.startDate ?? new Date().toISOString().slice(0, 10), lat: point.lat, lng: point.lng, photoIds: [], photoUrl: point.imageUrl, isExample: true }));
  const visibleEntries = mode === 'real' ? realMapEntries : exampleMapEntries;

  const chooseFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    if (pending.length + selected.length > 6) { setFormError('每次最多选择 6 张图片。'); return; }
    const tooLarge = selected.find((file) => file.size > 10 * 1024 * 1024);
    if (tooLarge) { setFormError(`${tooLarge.name} 超过 10MB 原图上限。`); return; }
    setPending((current) => [...current, ...selected.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), progress: 0, status: 'pending' as const }))]);
    setFormError('');
  };

  const removePending = (id: string) => setPending((items) => { const target = items.find((item) => item.id === id); if (target) URL.revokeObjectURL(target.preview); return items.filter((item) => item.id !== id); });

  const saveRecord = async () => {
    if (!draft.pointName.trim()) { setFormError('请填写地点。'); return; }
    if (!draft.visitedAt) { setFormError('请选择日期。'); return; }
    if (!draft.note.trim() && pending.length === 0) { setFormError('请填写文字记录或至少选择一张照片。'); return; }
    setSaving(true); setFormError('');
    const savedIds: string[] = [];
    try {
      for (const photo of pending) {
        setPending((items) => items.map((item) => item.id === photo.id ? { ...item, status: 'compressing', progress: 5 } : item));
        const compressed = await compressPhoto(photo.file, (progress) => setPending((items) => items.map((item) => item.id === photo.id ? { ...item, progress } : item)));
        if (compressed.size > 1.5 * 1024 * 1024) notify(`${photo.file.name} 压缩后仍超过建议的 1.5MB。`, 'info');
        const photoId = await savePhoto(compressed); savedIds.push(photoId);
        setPending((items) => items.map((item) => item.id === photo.id ? { ...item, status: 'saved', progress: 100 } : item));
      }
      const matchedPoint = plan?.route.points.find((point) => point.name === draft.pointName.trim());
      const [fallbackLng, fallbackLat] = cityCoordinates[draft.city];
      const entry: JournalEntry = { id: crypto.randomUUID(), pointId: matchedPoint?.id ?? `real-${crypto.randomUUID()}`, pointName: draft.pointName.trim(), city: draft.city, day: matchedPoint?.day ?? 1, note: draft.note.trim(), visitedAt: draft.visitedAt, lat: matchedPoint?.lat ?? fallbackLat, lng: matchedPoint?.lng ?? fallbackLng, photoIds: savedIds };
      setJournalEntries([entry, ...entries]);
      pending.forEach((item) => URL.revokeObjectURL(item.preview));
      setPending([]); setDraft((value) => ({ ...value, pointName: '', note: '' })); setMode('real');
      notify('这一页旅行手账已保存。', 'success');
    } catch (error) {
      await Promise.all(savedIds.map(deletePhoto));
      const message = `IndexedDB 保存失败：${error instanceof Error ? error.message : '未知错误'}。请检查浏览器存储权限和剩余容量。`;
      setFormError(message); notify(message, 'error');
    } finally { setSaving(false); }
  };

  const removeEntry = async (entry: JournalEntry) => {
    try { await Promise.all(entry.photoIds.map(deletePhoto)); setJournalEntries(entries.filter((item) => item.id !== entry.id)); notify('记录已删除。', 'success'); }
    catch (error) { console.error('Journal entry delete failed', error); notify('删除照片失败，记录未更改。', 'error'); }
  };

  const clearAll = async () => {
    if (!window.confirm('清空全部真实足迹和照片？此操作无法撤销。')) return;
    try { await clearJournal(entries); setJournalEntries([]); notify('真实足迹已清空。', 'success'); }
    catch (error) { console.error('Journal clear failed', error); notify('清空失败，请重试。', 'error'); }
  };

  if (entryId) return <JournalDetail entry={entries.find((entry) => entry.id === entryId)} photoUrls={photoUrls} onBack={() => navigate('/journal')} />;

  return <main className="section-pad py-10"><div className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-black uppercase tracking-[.2em] text-river">Travel Journal</p><h1 className="mt-2 font-display text-4xl font-black md:text-5xl">把一路山水，写成自己的湖北故事</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/55">照片留住风景，文字记下心情；每一次真实抵达，都成为以后可以重新翻阅的一页。</p></div><div className="grid grid-cols-3 gap-2">{[['地点', stats.places], ['城市', stats.cities], ['照片', stats.photos]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm"><div className="font-display text-2xl font-black">{value}</div><div className="text-xs font-bold text-ink/45">{label}</div></div>)}</div></div>

    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
      <section aria-label="旅行手账地图" className="journal-map journal-a4-page order-1 flex min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-ink/8 p-5 shadow-[0_28px_75px_rgba(18,34,42,.13)] md:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-xs font-black tracking-[.2em] text-river"><RouteIcon className="h-4 w-4"/>MY HUBEI ROUTE</div><h2 className="journal-handwriting mt-2 text-4xl font-black">我的旅行路线手账</h2><p className="mt-2 text-xs font-bold text-ink/45">真实足迹与示例路线分开查看，只有你保存的记录计入统计。</p></div><div className="flex rounded-full bg-white/70 p-1 shadow-sm" role="tablist">{(['real', 'example'] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => setMode(item)} className={`rounded-full px-4 py-2 text-xs font-black transition ${mode === item ? 'bg-ink text-white' : 'text-ink/50'}`}>{item === 'real' ? `真实足迹 ${entries.length}` : `示例路线 ${examplePoints.length}`}</button>)}</div></div>
        <JournalRouteMap entries={visibleEntries} mode={mode} onOpen={(id) => mode === 'real' && navigate(`/journal/${id}`)} />
        <div className="mt-5 flex items-center justify-between border-t border-ink/8 pt-4 text-xs font-bold text-ink/45"><span>{mode === 'real' ? '点击地图便签，翻开这一站的完整手账。' : '示例路线不计入真实足迹。'}</span>{entries.length > 0 && mode === 'real' && <button type="button" onClick={clearAll} className="font-black text-red-600">清空真实记录</button>}</div>
      </section>

      <section aria-label="新增旅行记录" className="paper-card order-2 rounded-[1.6rem] p-5 lg:sticky lg:top-28"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-tower"/><h2 className="font-display text-2xl font-black">记下这一刻</h2></div><p className="mt-2 text-xs font-bold leading-5 text-ink/45">写下地点与心情，也可以只用照片替你记住当时的光。</p><div className="mt-5 grid gap-4"><Field label="地点 *" htmlFor="journal-place"><input id="journal-place" value={draft.pointName} onChange={(event) => setDraft({ ...draft, pointName: event.target.value })} placeholder="例如：黄鹤楼" className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" /></Field><Field label="日期 *" htmlFor="journal-date"><input id="journal-date" type="date" value={draft.visitedAt} onChange={(event) => setDraft({ ...draft, visitedAt: event.target.value })} className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" /></Field><Field label="城市" htmlFor="journal-city"><select id="journal-city" value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value as CityName })} className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3">{cities.map((city) => <option key={city.name}>{city.name}</option>)}</select></Field><Field label="手账心得（与照片至少填一项）" htmlFor="journal-note"><textarea id="journal-note" rows={5} value={draft.note} placeholder="当时看见了什么、听见了什么？" onChange={(event) => setDraft({ ...draft, note: event.target.value })} className="journal-handwriting focus-ring w-full resize-none rounded-2xl border border-ink/10 bg-white px-4 py-3 text-lg leading-7" /></Field></div>
        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-river/40 bg-white/70 px-4 py-4 font-black text-river"><ImagePlus className="h-5 w-5" />选择照片<input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { chooseFiles(event.target.files); event.currentTarget.value = ''; }} /></label><p className="mt-2 text-xs font-bold leading-5 text-ink/45">每次最多6张，原图每张≤10MB；最长边1920px，压缩后仅保存在本机 IndexedDB。</p>
        {pending.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3">{pending.map((photo) => <div key={photo.id} className="relative overflow-hidden rounded-2xl bg-white p-2 shadow-sm"><img src={photo.preview} alt="待上传预览" className="aspect-square w-full rounded-xl object-cover" /><button type="button" aria-label="删除待上传照片" onClick={() => removePending(photo.id)} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/65 text-white"><X className="h-4 w-4" /></button><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full bg-jade" style={{ width: `${photo.progress}%` }} /></div><div className="mt-1 text-[10px] font-bold text-ink/50">{photo.status === 'compressing' ? `压缩 ${photo.progress}%` : photo.status === 'saved' ? '已写入' : '等待保存'}</div></div>)}</div>}
        {formError && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">{formError}</p>}
        <button type="button" disabled={saving} onClick={saveRecord} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 font-black text-white disabled:opacity-60">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}{saving ? '保存中…' : '保存这一页'}</button>
      </section>
    </div>
  </div></main>;
}

function JournalRouteMap({ entries, mode, onOpen }: { entries: JournalMapEntry[]; mode: 'real' | 'example'; onOpen: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>();
  const [status, setStatus] = useState(entries.length ? '正在连接高德道路地图…' : '还没有真实记录，先在右侧写下第一站。');
  const [showPaper, setShowPaper] = useState(false);
  const key = import.meta.env.VITE_AMAP_KEY;
  const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE;
  const signature = entries.map((entry) => `${entry.id}:${entry.lng},${entry.lat}:${entry.photoUrl ?? ''}`).join('|');

  useEffect(() => {
    let disposed = false;
    let drivingInstances: any[] = [];
    let overlays: any[] = [];
    const destroy = () => { drivingInstances.forEach((item) => item?.clear?.()); drivingInstances = []; if (mapRef.current) { if (overlays.length) mapRef.current.remove?.(overlays); mapRef.current.clearMap?.(); mapRef.current.destroy?.(); } mapRef.current = undefined; overlays = []; };
    async function mount() {
      destroy();
      if (!container.current || entries.length === 0) { if (!disposed) { setStatus(mode === 'real' ? '还没有真实记录，先在右侧写下第一站。' : '请先生成一条示例路线。'); setShowPaper(true); } return; }
      if (!key || import.meta.env.VITE_AMAP_ENABLED === 'false') { if (!disposed) { setStatus('未配置高德地图，当前显示纸面点位顺序。'); setShowPaper(true); } return; }
      try {
        const AMap = await loadAmapJsApi(key, securityCode);
        if (disposed || !container.current) return;
        const routePoints = entries.map(toRoutePoint);
        const map = new AMap.Map(container.current, { zoom: 10, center: [routePoints[0].lng, routePoints[0].lat], viewMode: '2D', resizeEnable: true, mapStyle: 'amap://styles/normal', features: ['bg', 'road', 'building', 'point'] });
        mapRef.current = map;
        setShowPaper(false);
        const markers = entries.map((entry, index) => { const marker = new AMap.Marker({ position: [routePoints[index].lng, routePoints[index].lat], anchor: 'bottom-center', title: entry.pointName, content: createJournalMarker(entry, index, () => onOpen(entry.id)), offset: new AMap.Pixel(0, 0) }); marker.on('click', () => onOpen(entry.id)); map.add(marker); return marker; });
        overlays.push(...markers);
        if (routePoints.length > 1) {
          try {
            const result = await planAmapDrivingRoute(AMap, routePoints);
            if (disposed) { result.drivingInstances.forEach((item) => item?.clear?.()); return; }
            drivingInstances = result.drivingInstances;
            const line = new AMap.Polyline({ path: result.path, strokeColor: '#0E6B72', strokeWeight: 6, strokeOpacity: .9, showDir: true, lineJoin: 'round', lineCap: 'round', zIndex: 40 }); map.add(line); overlays.push(line);
            setStatus(`高德道路手账 · ${(result.distanceMeters / 1000).toFixed(1)} km`);
          } catch (error) {
            console.error('Journal AMap driving failed', error);
            const line = new AMap.Polyline({ path: routePoints.map((point) => [point.lng, point.lat]), strokeColor: '#9b6b5c', strokeWeight: 4, strokeOpacity: .75, strokeStyle: 'dashed', strokeDasharray: [9, 9] }); map.add(line); overlays.push(line);
            setStatus('道路规划失败 · 虚线仅表示记录先后顺序');
          }
        } else setStatus('高德真实地图 · 当前共 1 个记录点');
        map.setFitView?.(overlays, false, [95, 95, 95, 95]);
      } catch (error) {
        console.error('Journal AMap load failed', error);
        if (!disposed) { setStatus('地图加载失败 · 当前显示纸面点位顺序'); setShowPaper(true); }
      }
    }
    mount();
    return () => { disposed = true; destroy(); };
  }, [key, securityCode, signature, mode, onOpen]);

  return <div className="relative mt-5 min-h-[620px] flex-1 overflow-hidden rounded-[1.15rem] border border-ink/8 bg-[#e3eee9]">
    <div ref={container} className="absolute inset-0" />
    {showPaper && <JournalPaperMap entries={entries} onOpen={onOpen} />}
    <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full bg-white/92 px-3 py-2 text-[11px] font-black text-river shadow-lg backdrop-blur">{status}</div>
  </div>;
}

function JournalPaperMap({ entries, onOpen }: { entries: JournalMapEntry[]; onOpen: (id: string) => void }) {
  return <div className="journal-notebook-lines absolute inset-0 p-8 pt-20">{entries.length === 0 ? <div className="grid h-full place-items-center text-center"><div><MapPin className="mx-auto h-10 w-10 text-river/35"/><p className="journal-handwriting mt-3 text-xl text-ink/45">第一站，等你落笔。</p></div></div> : <div className="grid gap-4 md:grid-cols-2">{entries.map((entry, index) => <button key={entry.id} type="button" onClick={() => onOpen(entry.id)} className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/90 p-3 text-left shadow-sm"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-river font-black text-white">{index + 1}</span>{entry.photoUrl && <img src={entry.photoUrl} alt="" className="h-14 w-14 rounded-xl object-cover"/>}<span className="min-w-0"><strong className="block truncate">{entry.pointName}</strong><em className="journal-handwriting mt-1 line-clamp-2 block text-sm not-italic text-ink/55">{entry.note || '这一站等待你的心得。'}</em></span></button>)}</div>}</div>;
}

function createJournalMarker(entry: JournalMapEntry, index: number, onOpen: () => void) {
  const root = document.createElement('button'); root.type = 'button'; root.className = `journal-map-pin ${index % 2 === 0 ? 'journal-map-pin-right' : 'journal-map-pin-left'}`; root.setAttribute('aria-label', `${entry.pointName}，打开旅行手账`); root.addEventListener('click', onOpen);
  const number = document.createElement('span'); number.className = 'journal-map-pin-number'; number.textContent = String(index + 1); root.appendChild(number);
  const note = document.createElement('span'); note.className = 'journal-map-note';
  if (entry.photoUrl) { const image = document.createElement('img'); image.src = entry.photoUrl; image.alt = `${entry.pointName}记录照片`; note.appendChild(image); }
  const copy = document.createElement('span'); copy.className = 'journal-map-note-copy'; const title = document.createElement('strong'); title.textContent = entry.pointName; const text = document.createElement('em'); text.textContent = entry.note || (entry.isExample ? '示例路线地点' : '这里等你写下自己的感想。'); copy.append(title, text); note.appendChild(copy); root.appendChild(note); return root;
}

function toRoutePoint(entry: JournalMapEntry, index: number): RoutePoint {
  const base = cityCoordinates[entry.city]; const lng = entry.lng ?? base[0] + index * .006; const lat = entry.lat ?? base[1] + (index % 2 ? index * .006 : -index * .006);
  return { id: entry.id, name: entry.pointName, type: index === 0 ? 'start' : 'scenic', city: entry.city, lng, lat, time: '09:00', stayMinutes: 30, reason: entry.note, photoTip: '', recordTip: entry.note, day: entry.day };
}

function JournalDetail({ entry, photoUrls, onBack }: { entry?: JournalEntry; photoUrls: Record<string, string>; onBack: () => void }) {
  if (!entry) return <main className="section-pad py-12"><div className="mx-auto max-w-3xl text-center"><h1 className="font-display text-4xl font-black">没有找到这一页手账</h1><button type="button" onClick={onBack} className="mt-6 rounded-full bg-ink px-5 py-3 font-black text-white">返回旅行手账</button></div></main>;
  const photos = entry.photoIds.map((id) => photoUrls[id]).filter(Boolean);
  return <main className="section-pad py-10"><div className="mx-auto max-w-4xl"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm"><ArrowLeft className="h-4 w-4"/>返回路线手账</button><article className="journal-a4-page journal-notebook-lines relative mt-6 overflow-hidden rounded-[1.5rem] border border-ink/10 px-8 pb-14 pt-8 shadow-[0_30px_90px_rgba(18,34,42,.16)] md:px-14 md:pt-12">
    <div className="absolute bottom-0 left-9 top-0 w-px bg-tower/20" />
    <section className="relative z-10 overflow-hidden rounded-[1.25rem] bg-ink/[.04]">{photos.length > 0 ? <div className={`grid gap-2 ${photos.length > 1 ? 'grid-cols-2' : ''}`}>{photos.map((url, index) => <img key={url} src={url} alt={`${entry.pointName}记录照片${index + 1}`} className={`w-full object-cover ${photos.length === 1 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`} />)}</div> : <div className="grid aspect-[16/7] place-items-center text-center text-ink/30"><div><Camera className="mx-auto h-9 w-9"/><p className="mt-2 text-sm font-black">这一页没有照片</p></div></div>}</section>
    <header className="relative z-10 mt-8 border-b-2 border-ink/10 pb-6 pl-4"><div className="text-xs font-black uppercase tracking-[.22em] text-river">My Hubei Travel Note</div><h1 className="journal-handwriting mt-2 text-5xl font-black leading-tight">{entry.pointName}</h1><div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-ink/45"><span>{entry.city}</span><span>·</span><time>{formatJournalDate(entry.visitedAt)}</time></div></header>
    <section className="relative z-10 min-h-[360px] pl-4 pt-6"><p className="journal-handwriting whitespace-pre-wrap text-2xl leading-[2rem] text-ink/76">{entry.note || '这一站没有留下文字，但照片已经替我记住了当时的光。'}</p></section>
    <footer className="relative z-10 mt-8 flex justify-end"><div className="journal-handwriting max-w-sm rotate-[-2deg] text-right text-lg leading-8 text-ink/55"><p>感谢这次抵达，</p><p>也感谢认真记录当下的自己。</p></div></footer>
  </article></div></main>;
}

function formatJournalDate(value: string) { const date = new Date(`${value.slice(0, 10)}T00:00:00`); return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(date); }
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div><label htmlFor={htmlFor} className="mb-2 block text-sm font-black text-ink/65">{label}</label>{children}</div>; }
