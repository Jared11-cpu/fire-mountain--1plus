import type { CityName } from '../data/mockData';

export type RoutePointType = 'start' | 'scenic' | 'food' | 'photo' | 'rest' | 'hotel' | 'end';

export type RoutePoint = {
  id: string;
  name: string;
  type: RoutePointType;
  city: CityName;
  lat: number;
  lng: number;
  time: string;
  stayMinutes: number;
  reason: string;
  photoTip: string;
  recordTip: string;
};

export type SceneryAnalysis = {
  highlights: string[];
  bestPhotoTimes: string[];
  videoShots: string[];
  socialCopy: string;
  crowdTips: Record<string, string>;
};

export type SmartRoute = {
  id: string;
  title: string;
  city: CityName;
  startPoint: RoutePoint;
  points: RoutePoint[];
  totalDistanceKm: number;
  estimatedTime: string;
  transportSuggestion: string;
  recommendedStartTime: string;
  avoidTips: string[];
  sceneryAnalysis: SceneryAnalysis;
};

export type LocationStatus = 'idle' | 'locating' | 'success' | 'denied' | 'unsupported' | 'mock';

export type UserLocation = {
  city: CityName;
  name: string;
  lat: number;
  lng: number;
  status: LocationStatus;
  message: string;
};
