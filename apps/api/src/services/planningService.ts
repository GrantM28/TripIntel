import {
  EMPTY_RESULTS,
  type PlanResponse,
  type StopCategory,
  type StopItem,
  type TripOptions,
  type WeatherHazard
} from "@trip-intelligence/shared";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { PlaceholderConstructionProvider } from "../providers/constructionProvider.js";
import { OpenChargeMapProvider } from "../providers/evProvider.js";
import { NominatimProvider } from "../providers/geocodingProvider.js";
import { OpenTripMapProvider } from "../providers/openTripMapProvider.js";
import { OverpassProvider } from "../providers/overpassProvider.js";
import { OsrmProvider } from "../providers/routingProvider.js";
import { OpenMeteoProvider } from "../providers/weatherProvider.js";
import { tripStreams } from "../sse/tripStream.js";
import { dedupeStops, minDistanceToRouteKm } from "../utils/geo.js";
import { rankStops } from "../utils/ranking.js";
import { boundingBoxFromRoute, sampleRouteCorridor } from "../utils/routeSampling.js";
import { sanitizeLocationText } from "../utils/sanitize.js";
import {
  createTrip,
  markTripComplete,
  updateTripCategory
} from "./tripService.js";

const geocoder = new NominatimProvider();
const router = new OsrmProvider();
const overpass = new OverpassProvider();
const openTripMap = new OpenTripMapProvider();
const weatherProvider = new OpenMeteoProvider();
const evProvider = new OpenChargeMapProvider();
const constructionProvider = new PlaceholderConstructionProvider();

const normalizeOptions = (options?: TripOptions): TripOptions => ({
  maxDetourKm: options?.maxDetourKm ?? env.DEFAULT_MAX_DETOUR_KM,
  stopsPerCategory: options?.stopsPerCategory ?? env.DEFAULT_STOPS_PER_CATEGORY,
  preferences: options?.preferences ?? [],
  avoidTolls: options?.avoidTolls ?? false,
  avoidHighways: options?.avoidHighways ?? false,
  ev: {
    enabled: options?.ev?.enabled ?? false,
    rangeKm: options?.ev?.rangeKm,
    connectorTypes: options?.ev?.connectorTypes ?? []
  }
});

const emitCategory = async (
  tripId: string,
  category:
    | "scenic"
    | "food"
    | "gas"
    | "hotels"
    | "attractions"
    | "ev"
    | "weather"
    | "alerts",
  payload: unknown
): Promise<void> => {
  await updateTripCategory(tripId, category, payload);
  tripStreams.emit(tripId, "update", {
    category,
    payload
  });
};

const fetchRankedStops = async (
  category: StopCategory,
  routeGeometry: Array<{ lat: number; lon: number }>,
  bbox: [number, number, number, number],
  maxDetourKm: number,
  topN: number
): Promise<StopItem[]> => {
  const [overpassStops, openTripStops] = await Promise.all([
    overpass.searchByBBox({ category, bbox }),
    env.ENABLE_OPEN_TRIP_MAP ? openTripMap.searchByBBox({ category, bbox }) : Promise.resolve([])
  ]);

  const merged = [...overpassStops, ...openTripStops]
    .map((stop) => ({
      ...stop,
      distanceFromRouteKm: minDistanceToRouteKm(stop.coordinate, routeGeometry)
    }))
    .filter((stop) => Number.isFinite(stop.distanceFromRouteKm) && stop.distanceFromRouteKm <= maxDetourKm);

  return rankStops(dedupeStops(merged), topN);
};

const fetchEvStops = async (
  routeGeometry: Array<{ lat: number; lon: number }>,
  bbox: [number, number, number, number],
  maxDetourKm: number,
  topN: number
): Promise<StopItem[]> => {
  const baseStops = await overpass.searchByBBox({ category: "ev", bbox });
  const premiumStops = env.ENABLE_OPEN_CHARGE_MAP
    ? await evProvider.searchByBBox({ category: "ev", bbox })
    : [];

  const merged = [...baseStops, ...premiumStops]
    .map((stop) => ({
      ...stop,
      distanceFromRouteKm: minDistanceToRouteKm(stop.coordinate, routeGeometry)
    }))
    .filter((stop) => stop.distanceFromRouteKm <= maxDetourKm);

  return rankStops(dedupeStops(merged), topN);
};

const fetchWeatherHazards = async (
  sampledPoints: Array<{ lat: number; lon: number }>,
  durationMinutes: number
): Promise<WeatherHazard[]> => {
  const hazards = await weatherProvider.hazardsForPoints(sampledPoints, durationMinutes);
  return hazards.map((hazard) => ({
    ...hazard,
    id: hazard.id || `wx-${uuidv4()}`
  }));
};

export const planTrip = async (params: {
  startText: string;
  destinationText: string;
  options?: TripOptions;
}): Promise<PlanResponse> => {
  const startText = sanitizeLocationText(params.startText);
  const destinationText = sanitizeLocationText(params.destinationText);

  if (!startText || !destinationText) {
    throw new Error("Start and destination are required.");
  }

  const options = normalizeOptions(params.options);
  const [start, destination] = await Promise.all([
    geocoder.geocode(startText),
    geocoder.geocode(destinationText)
  ]);

  const route = await router.route(start, destination);
  const sampledPoints = sampleRouteCorridor(route.geometry, 15);
  const routeData = {
    geometry: route.geometry,
    summary: {
      distanceKm: Number(route.distanceKm.toFixed(1)),
      durationMinutes: Math.round(route.durationMinutes)
    },
    sampledPoints
  };

  const trip = await createTrip({
    startText,
    destinationText,
    options,
    route: routeData
  });

  void runPlanningPipeline({
    tripId: trip.id,
    options,
    routeGeometry: route.geometry,
    sampledPoints,
    routeDurationMinutes: route.durationMinutes
  });

  return {
    tripId: trip.id,
    route: routeData,
    results: EMPTY_RESULTS
  };
};

const runPlanningPipeline = async (params: {
  tripId: string;
  options: TripOptions;
  routeGeometry: Array<{ lat: number; lon: number }>;
  sampledPoints: Array<{ lat: number; lon: number }>;
  routeDurationMinutes: number;
}): Promise<void> => {
  try {
    const maxDetourKm = params.options.maxDetourKm ?? env.DEFAULT_MAX_DETOUR_KM;
    const topN = params.options.stopsPerCategory ?? env.DEFAULT_STOPS_PER_CATEGORY;
    const bbox = boundingBoxFromRoute(params.routeGeometry);

    const categories: StopCategory[] = ["scenic", "food", "gas", "hotels", "attractions"];
    for (const category of categories) {
      const stops = await fetchRankedStops(
        category,
        params.routeGeometry,
        bbox,
        maxDetourKm,
        topN
      );
      await emitCategory(params.tripId, category, stops);
    }

    if (params.options.ev?.enabled) {
      const evStops = await fetchEvStops(params.routeGeometry, bbox, maxDetourKm, topN);
      await emitCategory(params.tripId, "ev", evStops);
    } else {
      await emitCategory(params.tripId, "ev", []);
    }

    const weather = await fetchWeatherHazards(params.sampledPoints, params.routeDurationMinutes);
    await emitCategory(params.tripId, "weather", weather);

    const alerts = await constructionProvider.fetchAlerts();
    await emitCategory(
      params.tripId,
      "alerts",
      alerts.map((alert) => ({
        ...alert,
        id: `alert-${uuidv4()}`,
        source: env.ENABLE_CONSTRUCTION_PROVIDER ? "configured-provider" : "placeholder"
      }))
    );

    await markTripComplete(params.tripId);
    tripStreams.emit(params.tripId, "update", {
      category: "status",
      payload: { status: "ready" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Planner failed unexpectedly.";
    tripStreams.emit(params.tripId, "error", {
      message
    });
  }
};