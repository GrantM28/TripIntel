import type { Coordinate } from "@trip-intelligence/shared";
import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";
import type { RoutingProvider } from "./types.js";

interface OsrmRouteResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

export class OsrmProvider implements RoutingProvider {
  async route(start: Coordinate, destination: Coordinate) {
    const coordinates = `${start.lon},${start.lat};${destination.lon},${destination.lat}`;
    const url = `${env.OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    const result = await getJson<OsrmRouteResponse>(url, {
      throttleMs: 200
    });

    const route = result.routes?.[0];
    if (!route) {
      throw new Error("Could not build a driving route.");
    }

    return {
      geometry: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60
    };
  }
}