import type { PlannedRoutePoint, TripRequest } from '../domain/trip';

export type TransportMode = '步行' | '公共交通' | '网约车' | '景区专线';
export type TransportSource = 'transport-api' | 'rules-v1' | 'rules-fallback';

export type TransportSegment = {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  distanceKm: number;
  mode: TransportMode;
  costEstimate: string;
  instruction: string;
  liveStatus?: string;
};

export type TransportPlanRequest = {
  city: string;
  departureTime: string;
  travelerType: TripRequest['travelerType'];
  specialNeeds: TripRequest['specialNeeds'];
  points: Array<Pick<PlannedRoutePoint, 'id' | 'name' | 'lat' | 'lng' | 'arrivalTime' | 'durationMinutes' | 'travelMinutesToNext'>>;
};

export type TransportPlanResponse = {
  source: TransportSource;
  sourceLabel: string;
  generatedAt: string;
  isRealtime: boolean;
  totalMinutes: number;
  totalDistanceKm: number;
  summary: string;
  segments: TransportSegment[];
  notices: string[];
};

export interface TransportPlanProvider {
  readonly id: string;
  plan(request: TransportPlanRequest, signal?: AbortSignal): Promise<TransportPlanResponse>;
}

export class HttpTransportPlanProvider implements TransportPlanProvider {
  readonly id = 'transport-api';
  constructor(private readonly endpoint: string, private readonly fetcher: typeof fetch = fetch) {}
  async plan(request: TransportPlanRequest, signal?: AbortSignal) {
    const response = await this.fetcher(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal });
    if (!response.ok) throw new Error(`交通 API HTTP ${response.status}`);
    const data = await response.json() as TransportPlanResponse;
    if (!Array.isArray(data.segments) || typeof data.summary !== 'string') throw new Error('交通 API 返回格式不正确');
    return { ...data, source: 'transport-api' as const, isRealtime: Boolean(data.isRealtime), sourceLabel: data.sourceLabel || '已配置交通 API' };
  }
}

export class RulesTransportPlanProvider implements TransportPlanProvider {
  readonly id = 'rules-v1';
  async plan(request: TransportPlanRequest) { return buildRulesTransportPlan(request); }
}

export async function resolveTransportPlan(request: TransportPlanRequest, options: { endpoint?: string; fetcher?: typeof fetch; signal?: AbortSignal } = {}) {
  const endpoint = options.endpoint ?? (import.meta.env.VITE_TRANSPORT_API_URL as string | undefined)?.trim();
  if (!endpoint) return new RulesTransportPlanProvider().plan(request);
  try { return await new HttpTransportPlanProvider(endpoint, options.fetcher).plan(request, options.signal); }
  catch (error) {
    const fallback = await new RulesTransportPlanProvider().plan(request);
    return { ...fallback, source: 'rules-fallback' as const, sourceLabel: '交通 API 失败 · 规则降级', notices: [`交通 API 暂不可用：${error instanceof Error ? error.message : '未知错误'}。`, ...fallback.notices] };
  }
}

export function toTransportPlanRequest(request: TripRequest, points: PlannedRoutePoint[], departureTime: string): TransportPlanRequest {
  return { city: request.destinationCity, departureTime, travelerType: request.travelerType, specialNeeds: request.specialNeeds, points: points.map(({ id, name, lat, lng, arrivalTime, durationMinutes, travelMinutesToNext }) => ({ id, name, lat, lng, arrivalTime, durationMinutes, travelMinutesToNext })) };
}

export function buildRulesTransportPlan(request: TransportPlanRequest): TransportPlanResponse {
  const segments = request.points.slice(0, -1).map((point, index): TransportSegment => {
    const next = request.points[index + 1];
    const distanceKm = haversine(point.lat, point.lng, next.lat, next.lng);
    const durationMinutes = Math.max(1, point.travelMinutesToNext);
    const mode = chooseMode(distanceKm, durationMinutes, request.specialNeeds);
    return { id: `${point.id}-${next.id}`, from: point.name, to: next.name, departureTime: shiftClock(point.arrivalTime, point.durationMinutes), arrivalTime: next.arrivalTime, durationMinutes, distanceKm: Math.round(distanceKm * 10) / 10, mode, costEstimate: costRange(mode, distanceKm), instruction: instructionFor(mode, durationMinutes, request.travelerType) };
  });
  const totalMinutes = segments.reduce((sum, segment) => sum + segment.durationMinutes, 0);
  const totalDistanceKm = Math.round(segments.reduce((sum, segment) => sum + segment.distanceKm, 0) * 10) / 10;
  const longSegments = segments.filter((segment) => segment.durationMinutes >= 60).length;
  const notices = ['当前未配置实时交通 API，时间与费用为规则估算，不能替代实时导航。', '铁路班次、景区接驳和道路拥堵请在出发前通过官方渠道复核。'];
  if (request.specialNeeds.includes('行动不便')) notices.unshift('已优先减少步行；上下车点仍需核验无障碍设施。');
  return { source: 'rules-v1', sourceLabel: '规则引擎交通方案', generatedAt: new Date().toISOString(), isRealtime: false, totalMinutes, totalDistanceKm, summary: `共 ${segments.length} 段交通，预计 ${totalMinutes} 分钟、约 ${totalDistanceKm} 公里${longSegments ? `；其中 ${longSegments} 段为跨区长距离交通` : ''}。`, segments, notices };
}

function chooseMode(distanceKm: number, minutes: number, specialNeeds: TripRequest['specialNeeds']): TransportMode {
  if (minutes >= 60 || distanceKm >= 25) return '景区专线';
  if (distanceKm <= 1.8 && !specialNeeds.includes('行动不便')) return '步行';
  if (distanceKm <= 8) return '公共交通';
  return '网约车';
}
function costRange(mode: TransportMode, distanceKm: number) { if (mode === '步行') return '¥0'; if (mode === '公共交通') return '¥2–8'; if (mode === '景区专线') return '¥20–80/人'; const low = Math.max(12, Math.round(distanceKm * 2)); return `¥${low}–${low + 15}`; }
function instructionFor(mode: TransportMode, minutes: number, travelerType: TripRequest['travelerType']) { if (mode === '步行') return '沿主路步行，过路口时以实际信号灯为准。'; if (mode === '公共交通') return '优先选择少换乘线路，上车前核对末班时间和站台方向。'; if (mode === '景区专线') return '建议提前预约景区直通车或正规包车，并为山路预留机动时间。'; return travelerType === '老人' || travelerType === '家庭' ? '建议预约可放行李车辆，上车前确认落客点与步行距离。' : `建议提前 10 分钟叫车，为拥堵预留约 ${Math.max(10, Math.round(minutes * 0.2))} 分钟。`; }
function shiftClock(value: string, delta: number) { const [hour, minute] = value.split(':').map(Number); const total = (((hour || 0) * 60 + (minute || 0) + delta) % 1440 + 1440) % 1440; return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) { const radius = 6371; const radians = (value: number) => value * Math.PI / 180; const dLat = radians(lat2 - lat1); const dLng = radians(lng2 - lng1); const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2; return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }

