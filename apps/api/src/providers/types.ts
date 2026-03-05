import type { Coordinate, StopCategory, StopItem } from "@trip-intelligence/shared";

export interface GeocodeSuggestion {
  label: string;
  coordinate: Coordinate;
  source: "nominatim" | "photon";
  importance?: number;
}

export interface GeocodingProvider {
  geocode(text: string): Promise<Coordinate>;
  suggest(text: string, limit?: number): Promise<GeocodeSuggestion[]>;
}

export interface RoutingProvider {
  route(start: Coordinate, destination: Coordinate): Promise<{
    geometry: Coordinate[];
    distanceKm: number;
    durationMinutes: number;
  }>;
}

export interface PlacesProvider {
  searchByBBox(params: {
    category: StopCategory;
    bbox: [number, number, number, number];
  }): Promise<StopItem[]>;
}

export interface WeatherProvider {
  hazardsForPoints(
    points: Coordinate[],
    routeDurationMinutes: number
  ): Promise<
    Array<{
      coordinate: Coordinate;
      etaHoursFromStart: number;
      hazards: string[];
      maxWindKph?: number;
      precipitationMm?: number;
      temperatureC?: number;
    }>
  >;
}

export interface ConstructionProvider {
  fetchAlerts(): Promise<
    Array<{
      message: string;
      severity: "info" | "warning" | "critical";
      coordinate?: Coordinate;
    }>
  >;
}
