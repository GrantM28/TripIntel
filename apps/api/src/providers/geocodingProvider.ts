import type { Coordinate } from "@trip-intelligence/shared";
import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";
import type { GeocodingProvider } from "./types.js";

interface NominatimResponseItem {
  lat: string;
  lon: string;
}

interface PhotonResponse {
  features: Array<{
    geometry: {
      coordinates: [number, number];
    };
  }>;
}

const geocodeWithPhoton = async (text: string): Promise<Coordinate> => {
  const url = `${env.PHOTON_BASE_URL}/api/?q=${encodeURIComponent(text)}&limit=1`;
  const result = await getJson<PhotonResponse>(url, {
    throttleMs: 300
  });

  const first = result.features?.[0];
  if (!first) {
    throw new Error("Could not geocode that location.");
  }

  return {
    lat: first.geometry.coordinates[1],
    lon: first.geometry.coordinates[0]
  };
};

export class NominatimProvider implements GeocodingProvider {
  async geocode(text: string): Promise<Coordinate> {
    const url = `${env.NOMINATIM_BASE_URL}/search?format=jsonv2&limit=1&q=${encodeURIComponent(text)}`;

    try {
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
    } catch {
      return geocodeWithPhoton(text);
    }
  }
}
