import { v4 as uuidv4 } from "uuid";
import type { StopCategory, StopItem } from "@trip-intelligence/shared";
import { env } from "../config/env.js";
import { postText } from "../utils/http.js";
import type { PlacesProvider } from "./types.js";

interface OverpassResponse {
  elements: Array<{
    id: number;
    lat: number;
    lon: number;
    tags?: Record<string, string>;
  }>;
}

const categoryToOverpassFilter: Record<StopCategory, string[]> = {
  scenic: ["node[\"tourism\"=\"viewpoint\"]", "node[\"natural\"=\"peak\"]"],
  food: [
    "node[\"amenity\"=\"restaurant\"]",
    "node[\"amenity\"=\"cafe\"]",
    "node[\"amenity\"=\"fast_food\"]"
  ],
  gas: ["node[\"amenity\"=\"fuel\"]"],
  hotels: [
    "node[\"tourism\"=\"hotel\"]",
    "node[\"tourism\"=\"motel\"]",
    "node[\"tourism\"=\"guest_house\"]"
  ],
  attractions: [
    "node[\"tourism\"=\"attraction\"]",
    "node[\"historic\"]",
    "node[\"leisure\"=\"park\"]"
  ],
  ev: ["node[\"amenity\"=\"charging_station\"]"]
};

export class OverpassProvider implements PlacesProvider {
  async searchByBBox(params: {
    category: StopCategory;
    bbox: [number, number, number, number];
  }): Promise<StopItem[]> {
    const filters = categoryToOverpassFilter[params.category] || [];
    const [south, west, north, east] = params.bbox;
    const query = `[out:json][timeout:25];(${filters
      .map((f) => `${f}(${south},${west},${north},${east});`)
      .join("")});out body;`;

    const data = await postText<OverpassResponse>(env.OVERPASS_BASE_URL, query, {
      throttleMs: 1200
    });

    return data.elements.map((element) => ({
      id: `${params.category}-${element.id}-${uuidv4().slice(0, 6)}`,
      name: element.tags?.name ?? `Unnamed ${params.category}`,
      category: params.category,
      coordinate: {
        lat: element.lat,
        lon: element.lon
      },
      distanceFromRouteKm: 0,
      source: "overpass",
      rating: element.tags?.stars ? Number(element.tags.stars) : undefined,
      popularity: element.tags?.check_date ? 70 : 50,
      tags: element.tags
    }));
  }
}
