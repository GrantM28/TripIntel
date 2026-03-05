import { v4 as uuidv4 } from "uuid";
import type { StopItem } from "@trip-intelligence/shared";
import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";
import type { PlacesProvider } from "./types.js";

interface OpenChargeMapItem {
  ID: number;
  AddressInfo: {
    Title: string;
    Latitude: number;
    Longitude: number;
  };
  NumberOfPoints?: number;
}

export class OpenChargeMapProvider implements PlacesProvider {
  async searchByBBox(params: {
    category: "ev";
    bbox: [number, number, number, number];
  }): Promise<StopItem[]> {
    const [south, west, north, east] = params.bbox;
    const centerLat = (south + north) / 2;
    const centerLon = (west + east) / 2;

    const url = `${env.OPEN_CHARGE_MAP_BASE_URL}/poi/?output=json&latitude=${centerLat}&longitude=${centerLon}&distance=120&distanceunit=KM&maxresults=100`;

    const items = await getJson<OpenChargeMapItem[]>(url, {
      throttleMs: 600,
      headers: env.OPEN_CHARGE_MAP_API_KEY
        ? { "X-API-Key": env.OPEN_CHARGE_MAP_API_KEY }
        : undefined
    });

    return items.map((item) => ({
      id: `ev-${item.ID}-${uuidv4().slice(0, 6)}`,
      name: item.AddressInfo?.Title ?? "EV Charger",
      category: "ev",
      coordinate: {
        lat: item.AddressInfo.Latitude,
        lon: item.AddressInfo.Longitude
      },
      distanceFromRouteKm: 0,
      popularity: item.NumberOfPoints ? Math.min(100, item.NumberOfPoints * 10) : 60,
      source: "openchargemap"
    }));
  }
}