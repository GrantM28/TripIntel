import type { Coordinate } from "@trip-intelligence/shared";
import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";
import type { GeocodeSuggestion, GeocodingProvider } from "./types.js";

interface NominatimResponseItem {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

interface PhotonResponse {
  features: Array<{
    properties?: {
      name?: string;
      city?: string;
      state?: string;
      country?: string;
    };
    geometry: {
      coordinates: [number, number];
    };
  }>;
}

const stateMap: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming"
};

const extractStateHint = (text: string): string | null => {
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return null;

  const maybeAbbr = last.toUpperCase();
  if (stateMap[maybeAbbr]) return stateMap[maybeAbbr];
  return last.toLowerCase();
};

const rankSuggestion = (query: string, suggestion: GeocodeSuggestion): number => {
  const label = suggestion.label.toLowerCase();
  const q = query.toLowerCase().trim();
  const stateHint = extractStateHint(query);

  let score = suggestion.importance ?? 0;
  if (label.startsWith(q)) score += 2;
  if (label.includes(q)) score += 1;

  if (stateHint && label.includes(stateHint)) score += 2;
  if (stateHint && label.includes(`, ${stateHint},`)) score += 1;

  if (label.includes("united states")) score += 0.5;

  return score;
};

const suggestWithNominatim = async (text: string, limit: number): Promise<GeocodeSuggestion[]> => {
  const url = `${env.NOMINATIM_BASE_URL}/search?format=jsonv2&addressdetails=1&limit=${limit}&countrycodes=us&q=${encodeURIComponent(text)}`;

  const result = await getJson<NominatimResponseItem[]>(url, {
    throttleMs: 1000,
    headers: {
      "User-Agent": env.NOMINATIM_USER_AGENT
    }
  });

  return result.map((item) => ({
    label: item.display_name,
    coordinate: {
      lat: Number(item.lat),
      lon: Number(item.lon)
    },
    source: "nominatim",
    importance: item.importance
  }));
};

const suggestWithPhoton = async (text: string, limit: number): Promise<GeocodeSuggestion[]> => {
  const url = `${env.PHOTON_BASE_URL}/api/?q=${encodeURIComponent(text)}&limit=${limit}&lang=en`;
  const result = await getJson<PhotonResponse>(url, {
    throttleMs: 300
  });

  return (result.features ?? []).map((feature) => {
    const props = feature.properties ?? {};
    const parts = [props.name, props.city, props.state, props.country].filter(Boolean);

    return {
      label: parts.join(", "),
      coordinate: {
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0]
      },
      source: "photon" as const
    };
  });
};

export class NominatimProvider implements GeocodingProvider {
  async suggest(text: string, limit = 5): Promise<GeocodeSuggestion[]> {
    if (text.trim().length < 2) {
      return [];
    }

    try {
      const suggestions = await suggestWithNominatim(text, limit);
      return suggestions
        .sort((a, b) => rankSuggestion(text, b) - rankSuggestion(text, a))
        .slice(0, limit);
    } catch {
      const fallback = await suggestWithPhoton(text, limit);
      return fallback
        .sort((a, b) => rankSuggestion(text, b) - rankSuggestion(text, a))
        .slice(0, limit);
    }
  }

  async geocode(text: string): Promise<Coordinate> {
    const suggestions = await this.suggest(text, 6);
    const best = suggestions[0];

    if (!best) {
      throw new Error("Could not geocode that location.");
    }

    return best.coordinate;
  }
}
