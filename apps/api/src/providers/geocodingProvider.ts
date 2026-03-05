import type { Coordinate } from "@trip-intelligence/shared";
import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";
import type { GeocodingProvider } from "./types.js";

interface NominatimResponseItem {
  lat: string;
  lon: string;
}

export class NominatimProvider implements GeocodingProvider {
  async geocode(text: string): Promise<Coordinate> {
    const url = `${env.NOMINATIM_BASE_URL}/search?format=jsonv2&limit=1&q=${encodeURIComponent(text)}`;

    const result = await getJson<NominatimResponseItem[]>(url, {
      throttleMs: 1000,
      headers: {
        "User-Agent": env.NOMINATIM_USER_AGENT
      }
    });

    if (!result.length) {
      throw new Error("Could not geocode that location.");
    }

    return {
      lat: Number(result[0].lat),
      lon: Number(result[0].lon)
    };
  }
}