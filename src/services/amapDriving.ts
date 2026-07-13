import type { RoutePoint } from '../types/route';

export const AMAP_MAX_WAYPOINTS = 16;

export type RoadPlanStatus = 'loading' | 'planned' | 'no-data' | 'auth-error' | 'network-error' | 'fallback';

export type RoadPlanMetrics = {
  status: RoadPlanStatus;
  distanceKm?: number;
  durationMinutes?: number;
  source: 'amap-driving' | 'estimate';
  message: string;
};

export type DrivingSearchFailure = {
  status: string;
  result?: unknown;
  error?: unknown;
};

export type DrivingPlanResult = {
  path: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  drivingInstances: any[];
};

export function splitDrivingPoints(points: Array<[number, number]>, maxWaypoints = AMAP_MAX_WAYPOINTS) {
  if (points.length < 2) return [];
  const segments: Array<Array<[number, number]>> = [];
  const maxSegmentPoints = maxWaypoints + 2;
  let startIndex = 0;
  while (startIndex < points.length - 1) {
    const endIndex = Math.min(startIndex + maxSegmentPoints - 1, points.length - 1);
    segments.push(points.slice(startIndex, endIndex + 1));
    startIndex = endIndex;
  }
  return segments;
}

export function classifyDrivingFailure(failure: DrivingSearchFailure): Exclude<RoadPlanStatus, 'loading' | 'planned'> {
  const text = `${failure.status} ${stringifyFailure(failure.result)} ${stringifyFailure(failure.error)}`.toLowerCase();
  if (/invalid_user_key|userkey|security|auth|permission|forbidden|白名单|key/.test(text)) return 'auth-error';
  if (/network|timeout|fetch|load|script|connection|internet|网络/.test(text)) return 'network-error';
  if (failure.status === 'no_data' || /no[_ -]?data|zero_results|无结果/.test(text)) return 'no-data';
  return 'fallback';
}

export async function planAmapDrivingRoute(AMap: any, points: RoutePoint[]): Promise<DrivingPlanResult> {
  const coordinates = points.map((point) => [point.lng, point.lat] as [number, number]);
  const segments = splitDrivingPoints(coordinates);
  if (!segments.length) throw { status: 'no_data', result: 'Route needs at least two points' } satisfies DrivingSearchFailure;

  const drivingInstances: any[] = [];
  const mergedPath: [number, number][] = [];
  let distanceMeters = 0;
  let durationSeconds = 0;

  try {
    for (const segment of segments) {
      const driving = new AMap.Driving({
        policy: AMap.DrivingPolicy?.LEAST_TIME ?? 0,
        extensions: 'all',
        ferry: 0,
        showTraffic: false,
      });
      drivingInstances.push(driving);
      const route = await searchDrivingSegment(driving, segment);
      const segmentPath = extractDrivingPath(route);
      if (segmentPath.length < 2) {
        throw { status: 'no_data', result: route, error: 'Driving route contains no usable path' } satisfies DrivingSearchFailure;
      }
      appendUniquePath(mergedPath, segmentPath);
      distanceMeters += Number(route.distance) || 0;
      durationSeconds += Number(route.time) || 0;
    }
  } catch (error) {
    drivingInstances.forEach((driving) => driving?.clear?.());
    throw error;
  }

  return { path: mergedPath, distanceMeters, durationSeconds, drivingInstances };
}

function searchDrivingSegment(driving: any, coordinates: Array<[number, number]>) {
  return new Promise<any>((resolve, reject) => {
    const start = coordinates[0];
    const end = coordinates[coordinates.length - 1];
    const waypoints = coordinates.slice(1, -1);
    try {
      driving.search(start, end, { waypoints }, (status: string, result: any) => {
        if (status === 'complete' && result?.routes?.[0]) {
          resolve(result.routes[0]);
          return;
        }
        reject({ status, result, error: result?.info ?? result?.message } satisfies DrivingSearchFailure);
      });
    } catch (error) {
      reject({ status: 'error', error } satisfies DrivingSearchFailure);
    }
  });
}

export function extractDrivingPath(route: any) {
  const path: Array<[number, number]> = [];
  for (const step of route?.steps ?? []) {
    for (const point of step?.path ?? []) {
      const lng = typeof point?.getLng === 'function' ? point.getLng() : Number(point?.lng ?? point?.[0]);
      const lat = typeof point?.getLat === 'function' ? point.getLat() : Number(point?.lat ?? point?.[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      appendUniquePath(path, [[lng, lat]]);
    }
  }
  return path;
}

function appendUniquePath(target: Array<[number, number]>, source: Array<[number, number]>) {
  for (const point of source) {
    const previous = target[target.length - 1];
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) target.push(point);
  }
}

function stringifyFailure(value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try { return JSON.stringify(value ?? ''); } catch { return String(value ?? ''); }
}
