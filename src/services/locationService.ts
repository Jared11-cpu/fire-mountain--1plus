import type { CityName } from '../data/mockData';
import { mockStartPoints } from '../data/routeData';
import type { UserLocation } from '../types/route';

export const mockLocationOptions = Object.values(mockStartPoints).map((point) => ({
  city: point.city,
  name: point.name,
  lat: point.lat,
  lng: point.lng,
}));

export function makeMockLocation(city: CityName): UserLocation {
  const point = mockStartPoints[city];
  return {
    city,
    name: point.name,
    lat: point.lat,
    lng: point.lng,
    status: 'mock',
    message: '已使用 Mock 出发地，可在后续接入高德逆地理编码。',
  };
}

export function getBrowserLocation(fallbackCity: CityName): Promise<UserLocation> {
  if (!('geolocation' in navigator)) {
    return Promise.resolve({
      ...makeMockLocation(fallbackCity),
      status: 'unsupported',
      message: '当前浏览器不支持定位，已切换为手动出发地。',
    });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          city: fallbackCity,
          name: '当前位置',
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          status: 'success',
          message: '已获取浏览器定位。后续可接入高德逆地理编码识别真实城市和道路。',
        });
      },
      () => {
        resolve({
          ...makeMockLocation(fallbackCity),
          status: 'denied',
          message: '定位未授权，已切换为手动选择出发地。',
        });
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 },
    );
  });
}
