import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { PlannedTrip, StopItem, TripResults } from "@trip-intelligence/shared";
import { LayerToggles, type LayerKey } from "../components/LayerToggles";
import { MapView } from "../components/MapView";
import { Sidebar } from "../components/Sidebar";
import { connectStream, fetchTrip, saveTrip } from "../lib/api";

const mergeResults = (existing: TripResults, category: string, payload: unknown): TripResults => {
  if (category in existing) {
    return {
      ...existing,
      [category]: payload
    } as TripResults;
  }
  return existing;
};

export const TripPage = () => {
  const { id = "" } = useParams();
  const [trip, setTrip] = useState<PlannedTrip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stops" | "weather" | "hotels" | "gas" | "ev" | "alerts">("stops");
  const [itineraryIds, setItineraryIds] = useState<Set<string>>(new Set());
  const [streamStatus, setStreamStatus] = useState("connecting");
  const [layerState, setLayerState] = useState<Record<LayerKey, boolean>>({
    scenic: true,
    food: true,
    gas: true,
    hotels: true,
    attractions: true,
    ev: true,
    weather: true
  });

  useEffect(() => {
    if (!id) return;

    let source: EventSource | null = null;
    const load = async () => {
      try {
        const data = await fetchTrip(id);
        setTrip(data);
        setStreamStatus("streaming");
        source = connectStream(
          id,
          (event) => {
            setTrip((current) => {
              if (!current) return current;
              if (event.category === "status") {
                setStreamStatus("ready");
                return current;
              }

              return {
                ...current,
                results: mergeResults(current.results, event.category, event.payload)
              };
            });
          },
          (message) => {
            setStreamStatus("error");
            setError(message);
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load trip");
      }
    };

    void load();

    return () => {
      source?.close();
    };
  }, [id]);

  const addToItinerary = (stop: StopItem) => {
    setItineraryIds((current) => {
      const next = new Set(current);
      next.add(stop.id);
      return next;
    });
  };

  const visibleStops = useMemo(() => {
    if (!trip) return [];
    const stops: StopItem[] = [];
    if (layerState.scenic) stops.push(...trip.results.scenic);
    if (layerState.food) stops.push(...trip.results.food);
    if (layerState.gas) stops.push(...trip.results.gas);
    if (layerState.hotels) stops.push(...trip.results.hotels);
    if (layerState.attractions) stops.push(...trip.results.attractions);
    if (layerState.ev) stops.push(...trip.results.ev);
    return stops;
  }, [trip, layerState]);

  const handleSave = async () => {
    if (!id) return;
    await saveTrip(id);
    setStreamStatus("saved");
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setStreamStatus("link copied");
  };

  if (error) {
    return <main className="error-layout">{error}</main>;
  }

  if (!trip) {
    return <main className="loading-layout">Loading trip...</main>;
  }

  return (
    <main className="trip-layout">
      <Sidebar
        trip={trip}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAdd={addToItinerary}
        itineraryIds={itineraryIds}
        streamStatus={streamStatus}
      />
      <section className="map-panel">
        <div className="top-controls">
          <LayerToggles
            enabled={layerState}
            onToggle={(key) => setLayerState((current) => ({ ...current, [key]: !current[key] }))}
          />
          <div className="actions-row">
            <button className="secondary" onClick={handleSave}>
              Save Trip
            </button>
            <button className="secondary" onClick={handleShare}>
              Share
            </button>
          </div>
        </div>
        <MapView
          route={trip.route.geometry}
          stops={visibleStops}
          weather={layerState.weather ? trip.results.weather : []}
          onAdd={addToItinerary}
        />
      </section>
    </main>
  );
};