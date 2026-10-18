import { MAP_MAX_LAT } from '../config/map'

export interface LatLng {
  lat: number
  lng: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= MAP_MAX_LAT && Math.abs(lng) <= 180
}

/** Clamps to the Web Mercator range and rounds to ~0.1 m. */
export function normalizeLatLng(lat: number, lng: number): LatLng {
  return {
    lat: Math.round(clamp(lat, -MAP_MAX_LAT, MAP_MAX_LAT) * 1e6) / 1e6,
    lng: Math.round(clamp(lng, -180, 180) * 1e6) / 1e6,
  }
}

export function formatLatLng(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export function buildTileUrl(template: string, z: number, x: number, y: number): string {
  return template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y))
}
