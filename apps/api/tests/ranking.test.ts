import { describe, expect, it } from "vitest";
import type { StopItem } from "@trip-intelligence/shared";
import { dedupeStops } from "../src/utils/geo.js";
import { rankStops } from "../src/utils/ranking.js";

const makeStop = (overrides: Partial<StopItem>): StopItem => ({
  id: crypto.randomUUID(),
  name: "Stop",
  category: "food",
  coordinate: { lat: 41, lon: -87 },
  distanceFromRouteKm: 3,
  source: "test",
  ...overrides
});

describe("dedupeStops", () => {
  it("removes nearby duplicates", () => {
    const deduped = dedupeStops([
      makeStop({ id: "a", name: "Cafe North" }),
      makeStop({ id: "b", name: "Cafe North" }),
      makeStop({ id: "c", name: "Cafe South", coordinate: { lat: 42, lon: -87 } })
    ]);

    expect(deduped.length).toBe(2);
  });
});

describe("rankStops", () => {
  it("prefers closer and better rated stops", () => {
    const ranked = rankStops(
      [
        makeStop({ id: "a", distanceFromRouteKm: 20, rating: 2.5 }),
        makeStop({ id: "b", distanceFromRouteKm: 2, rating: 4.7 }),
        makeStop({ id: "c", distanceFromRouteKm: 3, rating: 4.3 })
      ],
      2
    );

    expect(ranked[0].id).toBe("b");
    expect(ranked.length).toBe(2);
  });
});