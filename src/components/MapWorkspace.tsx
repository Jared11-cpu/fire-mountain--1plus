import { useEffect, useState } from 'react';
import { CircleDollarSign, Bus, Camera, ChevronRight, Clock3, ExternalLink, MapPin, Sparkles, TrainFront, Utensils } from 'lucide-react';
import type { TravelPlan } from '../utils/aiGenerator';
import type { RoutePoint, SmartRoute } from '../types/route';
import { RouteMap } from './RouteMap';

type Tab = 'stops' | 'days' | 'transport' | 'food' | 'budget';

export function MapWorkspace({ route, plan, selectedPointId, activePointIndex, navigating, imageUrl, onSelectPoint }: {
  route: SmartRoute; plan: TravelPlan; selectedPointId?: string; activePointIndex: number; navigating: boolean; imageUrl: string; onSelectPoint: (point: RoutePoint) => void;
}) {
  const [tab, setTab] = useState<Tab>('stops');
  return <section className="map-workspace overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
    <div className="grid lg:h-[calc(100vh-7rem)] lg:min-h-[680px] lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-h-[62vh]"><RouteMap route={route} selectedPointId={selectedPointId} activePointIndex={activePointIndex} navigating={navigating} onSelectPoint={onSelectPoint} mapOnly /></div>
      <aside className="flex min-h-0 flex-col border-l border-ink/10 bg-[#fffdf7]">
        <div className="border-b border-ink/10 p-4"><div className="grid grid-cols-5 gap-1 rounded-2xl bg-ink/5 p-1">
          <TabButton active={tab==='stops'} onClick={()=>setTab('stops')} icon={Sparkles} label="沿途" />
          <TabButton active={tab==='days'} onClick={()=>setTab('days')} icon={Clock3} label="日程" />
          <TabButton active={tab==='transport'} onClick={()=>setTab('transport')} icon={Bus} label="交通" />
          <TabButton active={tab==='food'} onClick={()=>setTab('food')} icon={Utensils} label="美食" />
          <TabButton active={tab==='budget'} onClick={()=>setTab('budget')} icon={CircleDollarSign} label="预算" />
        </div></div>
        <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-4">
          {tab==='stops'&&<div><SideTitle eyebrow="SCENERY NOTES" title="沿途风景与记录点" desc="真实照片来自 Wikimedia Commons；点击卡片可聚焦地图。"/><div className="space-y-3">{route.points.map((point,index)=><button key={point.id} onClick={()=>onSelectPoint(point)} className={`group w-full overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg ${point.id===selectedPointId?'border-tower ring-2 ring-tower/15':'border-ink/8'}`}><div className="relative h-32 overflow-hidden bg-ink/10"><RealPlaceImage query={`${point.city} ${point.name}`} fallback={point.imageUrl||imageUrl} alt={`${point.name}真实照片`} /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10"/><span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-tower text-xs font-black text-white">{index+1}</span><div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white"><div><div className="text-xs font-bold text-white/70">{point.time} · 停留 {point.stayMinutes} 分钟</div><div className="font-display text-xl font-black">{point.name}</div></div><ChevronRight className="h-5 w-5"/></div></div><div className="p-3"><p className="line-clamp-2 text-sm leading-6 text-ink/65">{point.reason}</p><div className="mt-2 flex items-start gap-2 text-xs font-bold leading-5 text-river"><Camera className="mt-0.5 h-3.5 w-3.5 shrink-0"/>{point.photoTip}</div></div></button>)}</div></div>}
          {tab==='days'&&<div><SideTitle eyebrow="DAY BY DAY" title="每日行程安排" desc="把时间、地点和停留逻辑放在同一条时间线上。"/>{plan.days.map(day=><div key={day.day} className="mb-5"><div className="sticky top-0 z-10 mb-2 rounded-xl bg-ink px-3 py-2 text-white"><b>{day.day}</b><span className="ml-2 text-xs text-white/60">{day.theme}</span></div>{day.items.map(item=><div key={`${day.day}-${item.time}`} className="relative ml-3 border-l border-river/25 py-3 pl-5 before:absolute before:-left-1.5 before:top-5 before:h-3 before:w-3 before:rounded-full before:bg-river"><div className="text-xs font-black text-tower">{item.time}</div><div className="font-black">{item.place}</div><p className="mt-1 text-sm leading-6 text-ink/55">{item.reason}</p></div>)}</div>)}</div>}
          {tab==='transport'&&<TransportPanel city={route.city} items={plan.transport}/>} 
          {tab==='food'&&<InfoList title="美食店铺推荐" icon={Utensils} items={plan.food}/>} 
          {tab==='budget'&&<BudgetPanel plan={plan}/>} 
        </div>
      </aside>
    </div>
  </section>;
}

function TabButton({active,onClick,icon:Icon,label}:{active:boolean;onClick:()=>void;icon:typeof MapPin;label:string}) { return <button onClick={onClick} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-black transition ${active?'bg-white text-river shadow-sm':'text-ink/45 hover:text-ink'}`}><Icon className="h-4 w-4"/>{label}</button> }
function SideTitle({eyebrow,title,desc}:{eyebrow:string;title:string;desc:string}) { return <header className="mb-4"><div className="text-[10px] font-black tracking-[.2em] text-tower">{eyebrow}</div><h3 className="mt-1 font-display text-2xl font-black">{title}</h3><p className="mt-1 text-sm text-ink/45">{desc}</p></header> }
function InfoList({title,icon:Icon,items}:{title:string;icon:typeof MapPin;items:string[]}) { return <div><SideTitle eyebrow="LOCAL GUIDE" title={title} desc="根据路线顺序整理的实用建议。"/><div className="space-y-3">{items.map((item,index)=><div key={item} className="rounded-2xl border border-ink/8 bg-white p-4"><div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-river/10 text-river"><Icon className="h-4 w-4"/></span><div><div className="text-xs font-black text-tower">推荐 {String(index+1).padStart(2,'0')}</div><p className="mt-1 text-sm font-semibold leading-6 text-ink/65">{item}</p></div></div></div>)}</div></div> }

function RealPlaceImage({query,fallback,alt}:{query:string;fallback:string;alt:string}) {
  const [photo,setPhoto]=useState<{url:string;page:string;credit:string}>({url:fallback,page:'',credit:'正在查找实景照片…'});
  useEffect(()=>{let active=true; const url=`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&format=json&origin=*`; fetch(url).then(r=>r.json()).then(data=>{const page=Object.values(data.query?.pages||{})[0] as any; const info=page?.imageinfo?.[0]; if(active&&info?.thumburl) setPhoto({url:info.thumburl,page:`https://commons.wikimedia.org/?curid=${page.pageid}`,credit:'Wikimedia Commons'});}).catch(()=>{}); return()=>{active=false}},[query,fallback]);
  return <><img src={photo.url} alt={alt} onError={(e)=>{e.currentTarget.src=fallback}} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>{photo.page&&<a href={photo.page} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="absolute right-2 top-2 z-10 rounded-full bg-black/55 px-2 py-1 text-[9px] font-bold text-white/80">{photo.credit}</a>}</>;
}

const scheduleByCity: Record<string,{rail:string[];bus:string[]}> = {
  宜昌:{rail:['D2234 宜昌东 13:05 → 武汉 15:36（约2小时31分）','D2248 宜昌东 13:10 → 汉口 15:05（约1小时55分）'],bus:['B1路 宜昌东站 → 山庄路：约06:00–22:30，高峰约5–8分钟/班','B9路 宜昌东站 → 葛洲坝方向：约06:20–21:30，约10–15分钟/班','三峡游客中心旅游专线：按景区预约班次发车，建议提前30分钟到站']},
  武汉:{rail:['G/动车 武汉站 → 宜昌东：全天约61个可选车次，常见耗时约2小时','城际/动车 汉口站 → 荆州站：早中晚均有班次，常见耗时约1.5小时'],bus:['地铁4号线 武汉站 → 复兴路：约06:00–23:00，高峰约3–6分钟/班','公交402路串联东湖、江汉关等区域：约06:00–20:30，约10–15分钟/班','轮渡中华路码头 → 武汉关码头：白天约20–30分钟/班']},
  恩施:{rail:['D字头 武汉/汉口 → 恩施：每日多班，常见耗时约4小时','恩施站返汉口：建议优先选择17:00前车次，预留景区返程时间'],bus:['恩施站 → 女儿城公交：白天约10–20分钟/班','恩施汽车客运中心 → 大峡谷旅游专线：通常上午集中发班，返程以景区公告为准']},
  荆州:{rail:['D字头 汉口 → 荆州：每日多班，常见耗时约1.5小时','荆州站 → 宜昌东：动车班次密集，常见耗时约40–60分钟'],bus:['公交21路 荆州站 → 古城/博物馆方向：约10–15分钟/班','古城旅游公交：节假日可能加密班次，以站牌为准']},
  襄阳:{rail:['G/动车 武汉 → 襄阳东：每日多班，常见耗时约2小时','襄阳东 → 汉口：早中晚均有班次'],bus:['G02高铁公交 襄阳东站 → 市区：高铁到站时段滚动发车','古城 → 唐城公交：约10–20分钟/班，夜场结束前确认末班车']},
  黄石:{rail:['城际/高铁 武汉 → 黄石北：每日多班，常见耗时约30–50分钟','黄石北 → 武汉：晚间仍有部分班次，具体以12306为准'],bus:['公交37路 黄石北站 → 市区方向：约10–15分钟/班','磁湖景区周边公交：白天约10–20分钟/班']},
};
function TransportPanel({city,items}:{city:string;items:string[]}) { const schedule=scheduleByCity[city]||scheduleByCity.宜昌; return <div><SideTitle eyebrow="TRANSIT BOARD" title="交通与班次" desc="班次会临时调整，出发前务必实时复核。"/><ScheduleBlock icon={TrainFront} title="高铁 / 动车参考" items={schedule.rail}/><a href="https://kyfw.12306.cn/otn/leftTicket/init" target="_blank" rel="noreferrer" className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-[#d83b32] px-4 py-3 text-sm font-black text-white">打开铁路12306实时查询<ExternalLink className="h-4 w-4"/></a><ScheduleBlock icon={Bus} title="公交 / 专线参考" items={schedule.bus}/><div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">公交发车间隔受工作日、节假日和交通状况影响；页面展示为比赛 Demo 参考，实际以当地公交 App、站牌和景区公告为准。</div><div className="mt-4"><InfoList title="换乘建议" icon={Bus} items={items}/></div></div> }
function ScheduleBlock({icon:Icon,title,items}:{icon:typeof Bus;title:string;items:string[]}) { return <div className="mb-4 rounded-2xl border border-ink/8 bg-white p-4"><div className="mb-3 flex items-center gap-2 font-black"><Icon className="h-5 w-5 text-river"/>{title}</div><div className="space-y-2">{items.map(item=><div key={item} className="rounded-xl bg-mist px-3 py-3 text-sm font-semibold leading-6 text-ink/68">{item}</div>)}</div></div> }
function BudgetPanel({plan}:{plan:TravelPlan}) { const total=plan.budget.reduce((sum,row)=>sum+row.amount,0); return <div><SideTitle eyebrow="TRIP COST" title="预算明细表" desc="按交通、门票、餐饮和住宿拆分。"/><div className="overflow-hidden rounded-2xl border border-ink/8 bg-white">{plan.budget.map(row=><div key={row.item} className="border-b border-ink/8 p-4 last:border-0"><div className="flex items-center justify-between"><b>{row.item}</b><span className="font-display text-xl font-black text-tower">¥{row.amount}</span></div><p className="mt-1 text-xs leading-5 text-ink/45">{row.note}</p></div>)}</div><div className="mt-4 flex items-end justify-between rounded-2xl bg-ink p-5 text-white"><div><div className="text-xs font-bold text-white/50">预计总计</div><div className="mt-1 text-sm text-white/70">建议预留 10% 机动费用</div></div><div className="font-display text-3xl font-black text-jade">¥{total}</div></div></div> }
