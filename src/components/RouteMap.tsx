import { Camera, Clock3, MapPin, Navigation, Route as RouteIcon, Utensils } from 'lucide-react';
import type { RoutePoint, SmartRoute } from '../types/route';
import { getPointTypeLabel } from '../services/mapService';

type RouteMapProps = {
  route: SmartRoute;
  selectedPointId?: string;
  activePointIndex: number;
  navigating: boolean;
  onSelectPoint: (point: RoutePoint) => void;
};

const markerStyles: Record<RoutePoint['type'], string> = {
  start: 'bg-emerald-500 text-white ring-emerald-100',
  scenic: 'bg-river text-white ring-blue-100',
  food: 'bg-tower text-white ring-orange-100',
  photo: 'bg-pink-500 text-white ring-pink-100',
  rest: 'bg-slate-500 text-white ring-slate-100',
  hotel: 'bg-indigo-500 text-white ring-indigo-100',
  end: 'bg-purple-600 text-white ring-purple-100',
};

const markerIcons: Record<RoutePoint['type'], typeof MapPin> = {
  start: Navigation,
  scenic: MapPin,
  food: Utensils,
  photo: Camera,
  rest: Clock3,
  hotel: MapPin,
  end: RouteIcon,
};

export function RouteMap({ route, selectedPointId, activePointIndex, navigating, onSelectPoint }: RouteMapProps) {
  const points = route.points;
  const selectedPoint = points.find((point) => point.id === selectedPointId) ?? points[Math.min(activePointIndex, points.length - 1)];
  const coordinates = points.map((_, index) => {
    const progress = points.length === 1 ? 0 : index / (points.length - 1);
    return {
      x: 9 + progress * 82,
      y: 68 - Math.sin(progress * Math.PI) * 38 + (index % 2 === 0 ? -4 : 7),
    };
  });
  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(' ');
  const activePoint = points[Math.min(activePointIndex, points.length - 1)];

  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-[#eef8f5] shadow-soft ring-1 ring-white/70">
      <div className="flex flex-col gap-4 border-b border-white/80 bg-white/70 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-river/10 px-3 py-1 text-xs font-black text-river">
            <Navigation className="h-4 w-4" />
            AI 路线地图
          </div>
          <h3 className="mt-2 font-display text-2xl font-black text-ink">{route.title}</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-ink/65">
          <Metric label="总距离" value={`${route.totalDistanceKm}km`} />
          <Metric label="预计时间" value={route.estimatedTime.split(' ')[0]} />
          <Metric label="建议出发" value={route.recommendedStartTime} />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="relative min-h-[430px] overflow-x-auto bg-[linear-gradient(135deg,#f8fcfb_0%,#e7f5ef_45%,#f7efe0_100%)] p-4">
          <div className="relative h-[390px] min-w-[720px] overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/55 shadow-inner">
            <div className="absolute inset-x-0 top-24 h-24 -rotate-6 bg-river/15 blur-sm" />
            <div className="absolute left-0 top-28 h-12 w-full -rotate-6 bg-river/20" />
            <div className="absolute right-8 top-8 h-24 w-40 rounded-full bg-jade/15 blur-xl" />
            <div className="absolute bottom-10 left-20 h-20 w-56 rounded-full bg-tower/10 blur-2xl" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#32556a14_1px,transparent_1px),linear-gradient(90deg,#32556a14_1px,transparent_1px)] [background-size:34px_34px]" />

            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              <polyline points={polyline} fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
              <polyline points={polyline} fill="none" stroke="#1B70A6" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={navigating ? '6 5' : '0'} />
              {coordinates.map((point, index) => (
                <circle
                  key={`${route.id}-pulse-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={index <= activePointIndex && navigating ? 2.8 : 1.3}
                  fill={index <= activePointIndex && navigating ? '#24A46F' : '#ffffff'}
                  opacity="0.9"
                />
              ))}
            </svg>

            {points.map((point, index) => {
              const Icon = markerIcons[point.type];
              const position = coordinates[index];
              const isActive = point.id === activePoint.id && navigating;
              const isSelected = point.id === selectedPoint?.id;
              return (
                <button
                  key={point.id}
                  onClick={() => onSelectPoint(point)}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full px-3 py-2 text-xs font-black shadow-soft ring-4 transition hover:-translate-y-[58%] active:scale-95 ${markerStyles[point.type]} ${
                    isSelected ? 'scale-110' : ''
                  } ${isActive ? 'animate-pulse' : ''}`}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{index + 1}</span>
                </button>
              );
            })}

            <div className="absolute left-4 top-4 rounded-2xl bg-white/88 p-3 text-xs font-bold text-ink/65 shadow-sm backdrop-blur">
              <div className="font-black text-ink">长江/山水路线模拟图</div>
              <div className="mt-1">后续可替换为高德地图 JS API</div>
            </div>
            <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 rounded-2xl bg-white/88 p-3 shadow-sm backdrop-blur">
              {(['start', 'scenic', 'food', 'photo', 'rest', 'end'] as RoutePoint['type'][]).map((type) => (
                <span key={type} className="inline-flex items-center gap-1 text-xs font-bold text-ink/62">
                  <span className={`h-2.5 w-2.5 rounded-full ${markerStyles[type].split(' ')[0]}`} />
                  {getPointTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 bg-white/75 p-5">
          <div className="rounded-2xl bg-ink p-4 text-white">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-jade">Navigation Status</div>
            <div className="mt-2 text-2xl font-black">{navigating ? `正在模拟到达：${activePoint.name}` : '点击 Marker 查看点位'}</div>
            <p className="mt-2 text-sm leading-6 text-white/65">{route.transportSuggestion}</p>
          </div>

          {selectedPoint && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-river">{getPointTypeLabel(selectedPoint.type)} · {selectedPoint.time}</div>
                  <h4 className="mt-1 text-xl font-black text-ink">{selectedPoint.name}</h4>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-black ${markerStyles[selectedPoint.type]}`}>{selectedPoint.stayMinutes} 分钟</div>
              </div>
              <Detail label="推荐理由" value={selectedPoint.reason} />
              <Detail label="拍照建议" value={selectedPoint.photoTip} />
              <Detail label="记录点" value={selectedPoint.recordTip} />
              <div className="mt-3 rounded-xl bg-river/5 p-3 text-xs font-bold text-ink/55">
                经纬度：{selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-black text-ink">避坑提醒</div>
            <div className="space-y-2">
              {route.avoidTips.map((tip) => (
                <div key={tip} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-ink/68">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
      <div className="text-base font-black text-ink">{value}</div>
      <div>{label}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-black text-ink/45">{label}</div>
      <p className="mt-1 text-sm leading-6 text-ink/68">{value}</p>
    </div>
  );
}
