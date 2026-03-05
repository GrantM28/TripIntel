import type { AlertItem, PlannedTrip, StopItem, WeatherHazard } from "@trip-intelligence/shared";
import { StopCard } from "./StopCard";

type TabKey = "stops" | "weather" | "hotels" | "gas" | "ev" | "alerts";

interface Props {
  trip: PlannedTrip;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onAdd: (stop: StopItem) => void;
  itineraryIds: Set<string>;
  streamStatus: string;
}

const stopsForTab = (trip: PlannedTrip, tab: TabKey): StopItem[] => {
  switch (tab) {
    case "hotels":
      return trip.results.hotels;
    case "gas":
      return trip.results.gas;
    case "ev":
      return trip.results.ev;
    case "stops":
      return [...trip.results.scenic, ...trip.results.food, ...trip.results.attractions];
    default:
      return [];
  }
};

const WeatherList = ({ weather }: { weather: WeatherHazard[] }) => (
  <div className="panel-list">
    {weather.map((item) => (
      <article key={item.id} className="weather-card">
        <h4>{item.hazards.join(", ")}</h4>
        <p>
          ETA {item.etaHoursFromStart}h - Wind {item.maxWindKph?.toFixed(1) ?? "-"} kph - Precip{" "}
          {item.precipitationMm?.toFixed(1) ?? "-"} mm
        </p>
      </article>
    ))}
    {weather.length === 0 && <p className="muted">No weather hazards detected yet.</p>}
  </div>
);

const AlertList = ({ alerts }: { alerts: AlertItem[] }) => (
  <div className="panel-list">
    {alerts.map((alert) => (
      <article key={alert.id} className="weather-card">
        <h4>{alert.severity.toUpperCase()}</h4>
        <p>{alert.message}</p>
      </article>
    ))}
  </div>
);

export const Sidebar = ({
  trip,
  activeTab,
  onTabChange,
  onAdd,
  itineraryIds,
  streamStatus
}: Props) => {
  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: "stops", label: "Stops" },
    { id: "weather", label: "Weather" },
    { id: "hotels", label: "Hotels" },
    { id: "gas", label: "Gas" },
    { id: "ev", label: "EV" },
    { id: "alerts", label: "Alerts" }
  ];

  const list = stopsForTab(trip, activeTab);

  return (
    <aside className="sidebar">
      <section className="summary-card">
        <h2>Route Summary</h2>
        <p>
          {trip.startText} to {trip.destinationText}
        </p>
        <p>
          {trip.route.summary.distanceKm.toFixed(1)} km - {trip.route.summary.durationMinutes} min
        </p>
        <p className="muted">Status: {streamStatus}</p>
      </section>
      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === activeTab ? "active" : ""}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === "weather" && <WeatherList weather={trip.results.weather} />}
      {activeTab === "alerts" && <AlertList alerts={trip.results.alerts} />}
      {activeTab !== "weather" && activeTab !== "alerts" && (
        <div className="panel-list">
          {list.map((item) => (
            <div key={item.id} className={itineraryIds.has(item.id) ? "added" : ""}>
              <StopCard item={item} onAdd={onAdd} />
            </div>
          ))}
          {list.length === 0 && <p className="muted">Loading category results...</p>}
        </div>
      )}
    </aside>
  );
};