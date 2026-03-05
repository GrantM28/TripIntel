import { Coordinate, StopItem } from "@trip-intelligence/shared";

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const haversineKm = (a: Coordinate, b: Coordinate): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

const pointToSegmentDistanceKm = (
  point: Coordinate,
  a: Coordinate,
  b: Coordinate
): number => {
  const x = point.lon;
  const y = point.lat;
  const x1 = a.lon;
  const y1 = a.lat;
  const x2 = b.lon;
  const y2 = b.lat;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return haversineKm(point, a);
  }

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const projected: Coordinate = {
    lon: x1 + t * dx,
    lat: y1 + t * dy
  };

  return haversineKm(point, projected);
};

export const minDistanceToRouteKm = (point: Coordinate, route: Coordinate[]): number => {
  if (route.length < 2) {
    return Infinity;
  }

  let min = Infinity;
  for (let i = 0; i < route.length - 1; i += 1) {
    min = Math.min(min, pointToSegmentDistanceKm(point, route[i], route[i + 1]));
  }
  return min;
};

export const routeLengthKm = (route: Coordinate[]): number => {
  let length = 0;
  for (let i = 1; i < route.length; i += 1) {
    length += haversineKm(route[i - 1], route[i]);
  }
  return length;
};

export const dedupeStops = (stops: StopItem[], thresholdKm = 0.3): StopItem[] => {
  const deduped: StopItem[] = [];

  for (const stop of stops) {
    const duplicate = deduped.find(
      (existing) =>
        existing.name.toLowerCase() === stop.name.toLowerCase() ||
        haversineKm(existing.coordinate, stop.coordinate) <= thresholdKm
    );

    if (!duplicate) {
      deduped.push(stop);
    }
  }

  return deduped;
};