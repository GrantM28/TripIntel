export type TripPreference = "family" | "budget" | "scenic" | "fastest";

export interface EVOptions {
  enabled: boolean;
  rangeKm?: number;
  connectorTypes?: string[];
}

export interface TripOptions {
  maxDetourKm?: number;
  stopsPerCategory?: number;
  preferences?: TripPreference[];
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  ev?: EVOptions;
}

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface RouteSummary {
  distanceKm: number;
  durationMinutes: number;
}

export interface RouteData {
  geometry: Coordinate[];
  summary: RouteSummary;
  sampledPoints: Coordinate[];
}

export type StopCategory =
  | "scenic"
  | "food"
  | "gas"
  | "hotels"
  | "attractions"
  | "ev";

export interface StopItem {
  id: string;
  name: string;
  category: StopCategory;
  coordinate: Coordinate;
  distanceFromRouteKm: number;
  rating?: number;
  popularity?: number;
  source: string;
  tags?: Record<string, string>;
}

export interface WeatherHazard {
  id: string;
  coordinate: Coordinate;
  etaHoursFromStart: number;
  hazards: string[];
  maxWindKph?: number;
  precipitationMm?: number;
  temperatureC?: number;
}

export interface AlertItem {
  id: string;
  source: string;
  message: string;
  coordinate?: Coordinate;
  severity: "info" | "warning" | "critical";
}

export interface TripResults {
  scenic: StopItem[];
  food: StopItem[];
  gas: StopItem[];
  hotels: StopItem[];
  attractions: StopItem[];
  ev: StopItem[];
  weather: WeatherHazard[];
  alerts: AlertItem[];
}

export interface PlannedTrip {
  id: string;
  startText: string;
  destinationText: string;
  options: TripOptions;
  route: RouteData;
  results: TripResults;
  createdAt: string;
}

export interface PlanRequest {
  startText: string;
  destinationText: string;
  options?: TripOptions;
}

export interface PlanResponse {
  tripId: string;
  route: RouteData;
  results: TripResults;
}

export interface StreamEvent<T = unknown> {
  category:
    | "scenic"
    | "food"
    | "gas"
    | "hotels"
    | "attractions"
    | "ev"
    | "weather"
    | "alerts"
    | "status";
  payload: T;
}

export const EMPTY_RESULTS: TripResults = {
  scenic: [],
  food: [],
  gas: [],
  hotels: [],
  attractions: [],
  ev: [],
  weather: [],
  alerts: []
};