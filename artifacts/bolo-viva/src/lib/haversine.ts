import { LOCATION_COORDS } from "@/data/locations";

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function walkMinutes(km: number): number {
  return Math.round(km * 13);
}

export function getDistanceBetween(
  id1: string,
  id2: string
): { km: number; walkMin: number } | null {
  const c1 = LOCATION_COORDS[id1];
  const c2 = LOCATION_COORDS[id2];
  if (!c1 || !c2) return null;
  const km = haversineKm(c1.lat, c1.lng, c2.lat, c2.lng);
  const rounded = Math.round(km * 100) / 100;
  return { km: rounded, walkMin: walkMinutes(rounded) };
}
