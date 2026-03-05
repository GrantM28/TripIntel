import type { StopItem } from "@trip-intelligence/shared";

interface Props {
  item: StopItem;
  onAdd: (stop: StopItem) => void;
}

export const StopCard = ({ item, onAdd }: Props) => {
  return (
    <article className="stop-card">
      <div>
        <h4>{item.name}</h4>
        <p>
          {item.category} • {item.distanceFromRouteKm.toFixed(1)} km off route
        </p>
        <p>{item.rating ? `Rating ${item.rating.toFixed(1)} / 5` : "Rating unavailable"}</p>
      </div>
      <button onClick={() => onAdd(item)}>Add to Itinerary</button>
    </article>
  );
};