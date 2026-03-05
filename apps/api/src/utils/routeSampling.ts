import { Coordinate } from "@trip-intelligence/shared";
import { haversineKm } from "./geo.js";

export const sampleRouteCorridor = (
  geometry: Coordinate[],
  sampleEveryKm = 20
): Coordinate[] => {
  if (geometry.length < 2) {
    return geometry;
  }

  const sampled: Coordinate[] = [geometry[0]];
  let accumulated = 0;

  for (let i = 1; i < geometry.length; i += 1) {
    const segment = haversineKm(geometry[i - 1], geometry[i]);
    accumulated += segment;

    if (accumulated >= sampleEveryKm) {
      sampled.push(geometry[i]);
      accumulated = 0;
    }
  }

  const last = geometry[geometry.length - 1];
  const lastSample = sampled[sampled.length - 1];
  if (last.lat !== lastSample.lat || last.lon !== lastSample.lon) {
    sampled.push(last);
  }

  return sampled;
};

export const boundingBoxFromRoute = (
  points: Coordinate[],
  paddingDegrees = 0.25
): [number, number, number, number] => {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);

  return [
    Math.min(...lats) - paddingDegrees,
    Math.min(...lons) - paddingDegrees,
    Math.max(...lats) + paddingDegrees,
    Math.max(...lons) + paddingDegrees
  ];
};