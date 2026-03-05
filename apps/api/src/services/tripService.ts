import type { PlannedTrip, TripResults, TripOptions } from "@trip-intelligence/shared";
import { EMPTY_RESULTS } from "@trip-intelligence/shared";
import { prisma } from "../db/prisma.js";

const parseJson = <T>(value: unknown): T => value as T;

export const createTrip = async (params: {
  startText: string;
  destinationText: string;
  options: TripOptions;
  route: PlannedTrip["route"];
}) => {
  return prisma.trip.create({
    data: {
      startText: params.startText,
      destinationText: params.destinationText,
      optionsJson: params.options,
      routeJson: params.route,
      scenicJson: [],
      foodJson: [],
      gasJson: [],
      hotelsJson: [],
      attractionsJson: [],
      evJson: [],
      weatherJson: [],
      alertsJson: [],
      status: "processing"
    }
  });
};

export const updateTripCategory = async (
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
) => {
  const fieldMap = {
    scenic: "scenicJson",
    food: "foodJson",
    gas: "gasJson",
    hotels: "hotelsJson",
    attractions: "attractionsJson",
    ev: "evJson",
    weather: "weatherJson",
    alerts: "alertsJson"
  } as const;

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      [fieldMap[category]]: payload
    }
  });
};

export const markTripComplete = async (tripId: string) => {
  await prisma.trip.update({
    where: { id: tripId },
    data: { status: "ready" }
  });
};

export const saveTrip = async (tripId: string) => {
  await prisma.trip.update({
    where: { id: tripId },
    data: { status: "saved" }
  });
};

export const getTripById = async (tripId: string): Promise<PlannedTrip | null> => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    return null;
  }

  const results: TripResults = {
    ...EMPTY_RESULTS,
    scenic: parseJson(trip.scenicJson),
    food: parseJson(trip.foodJson),
    gas: parseJson(trip.gasJson),
    hotels: parseJson(trip.hotelsJson),
    attractions: parseJson(trip.attractionsJson),
    ev: parseJson(trip.evJson),
    weather: parseJson(trip.weatherJson),
    alerts: parseJson(trip.alertsJson)
  };

  return {
    id: trip.id,
    startText: trip.startText,
    destinationText: trip.destinationText,
    options: parseJson(trip.optionsJson),
    route: parseJson(trip.routeJson),
    results,
    createdAt: trip.createdAt.toISOString()
  };
};