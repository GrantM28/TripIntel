import { StopItem } from "@trip-intelligence/shared";

const categoryBoost: Record<StopItem["category"], number> = {
  scenic: 0.95,
  food: 0.9,
  gas: 0.88,
  hotels: 0.86,
  attractions: 0.92,
  ev: 0.87
};

export const scoreStop = (stop: StopItem): number => {
  const distanceScore = Math.max(0, 1 - stop.distanceFromRouteKm / 40);
  const ratingScore = (stop.rating ?? 3.8) / 5;
  const popularityScore = Math.min(1, (stop.popularity ?? 60) / 100);

  return (
    distanceScore * 0.45 +
    ratingScore * 0.35 +
    popularityScore * 0.1 +
    categoryBoost[stop.category] * 0.1
  );
};

export const rankStops = (stops: StopItem[], topN: number): StopItem[] =>
  [...stops]
    .sort((a, b) => scoreStop(b) - scoreStop(a))
    .slice(0, topN);