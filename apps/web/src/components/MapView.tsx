import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet";
import type { Coordinate, StopItem, WeatherHazard } from "@trip-intelligence/shared";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

interface Props {
  route: Coordinate[];
  stops: StopItem[];
  weather: WeatherHazard[];
  onAdd: (stop: StopItem) => void;
}

export const MapView = ({ route, stops, weather, onAdd }: Props) => {
  const center = route[0] ?? { lat: 39.5, lon: -98.35 };

  return (
    <MapContainer className="map" center={[center.lat, center.lon]} zoom={5} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {route.length > 1 && <Polyline positions={route.map((p) => [p.lat, p.lon])} color="#1f6feb" />}
      {stops.map((stop) => (
        <Marker key={stop.id} position={[stop.coordinate.lat, stop.coordinate.lon]}>
          <Popup>
            <strong>{stop.name}</strong>
            <p>{stop.distanceFromRouteKm.toFixed(1)} km detour</p>
            <button className="popup-btn" onClick={() => onAdd(stop)}>
              Add
            </button>
          </Popup>
        </Marker>
      ))}
      {weather.map((hazard) => (
        <Marker key={hazard.id} position={[hazard.coordinate.lat, hazard.coordinate.lon]}>
          <Popup>
            <strong>Weather Hazard</strong>
            <p>ETA {hazard.etaHoursFromStart}h</p>
            <p>{hazard.hazards.join(", ")}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};