import { v4 as uuidv4 } from "uuid";
import type { Coordinate, StopCategory, StopItem } from "@trip-intelligence/shared";
import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";
import type { PlacesProvider } from "./types.js";

interface OpenTripMapResponse {
  features: Array<{
    id: string;
    properties: {
      name: string;
      rate?: number;
      xid?: string;
    };
    geometry: {
      coordinates: [number, number];
    };
  }>;
}

const categoryToKinds: Record<StopCategory, string> = {
  scenic: "view_points,natural",
  food: "foods",
  gas: "fuel",
  hotels: "accomodations",
  attractions: "interesting_places,cultural",
  ev: "transport"
};

export class OpenTripMapProvider implements PlacesProvider {
  async searchByBBox(params: {
    category: StopCategory;
    bbox: [number, number, number, number];
  }): Promise<StopItem[]> {
    if (!env.OPEN_TRIP_MAP_API_KEY) {
      return [];
    }

    const [south, west, north, east] = params.bbox;
    const center: Coordinate = {
      lat: (south + north) / 2,
      lon: (west + east) / 2
    };

    const url = `${env.OPEN_TRIP_MAP_BASE_URL}/radius?radius=12000&lon=${center.lon}&lat=${center.lat}&kinds=${categoryToKinds[params.category]}&limit=120&apikey=${env.OPEN_TRIP_MAP_API_KEY}`;

    const response = await getJson<OpenTripMapResponse>(url, {
      throttleMs: 500
    });

    return response.features.map((feature) => ({
      id: feature.id || `otm-${uuidv4()}`,
      name: feature.properties.name || `Unnamed ${params.category}`,
      category: params.category,
      coordinate: {
        lon: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1]
      },
      source: "opentripmap",
      rating: feature.properties.rate,
      popularity: feature.properties.rate ? feature.properties.rate * 20 : 55
    }));
  }
}