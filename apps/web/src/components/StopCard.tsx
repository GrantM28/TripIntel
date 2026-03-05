import { useEffect, useMemo, useState } from "react";
import type { StopItem } from "@trip-intelligence/shared";

interface Props {
  item: StopItem;
  onAdd: (stop: StopItem) => void;
  isAdded?: boolean;
}

const categoryLabel: Record<StopItem["category"], string> = {
  scenic: "Scenic",
  food: "Food",
  gas: "Gas",
  hotels: "Hotel",
  attractions: "Attraction",
  ev: "EV"
};

const getFallbackImage = (item: StopItem): string =>
  `https://picsum.photos/seed/${encodeURIComponent(`${item.category}-${item.name}`)}/640/360`;

const getCommonsImage = (item: StopItem): string | null => {
  const file = item.tags?.wikimedia_commons;
  if (!file) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`;
};

const getWikipediaTitle = (item: StopItem): string | null => {
  const wp = item.tags?.wikipedia;
  if (!wp) return null;

  const title = wp.includes(":") ? wp.split(":").slice(1).join(":") : wp;
  return title.trim().replace(/\s+/g, "_");
};

export const StopCard = ({ item, onAdd, isAdded = false }: Props) => {
  const fallback = useMemo(() => getFallbackImage(item), [item]);
  const [imageUrl, setImageUrl] = useState<string>(() => getCommonsImage(item) ?? fallback);

  useEffect(() => {
    const commons = getCommonsImage(item);
    if (commons) {
      setImageUrl(commons);
      return;
    }

    setImageUrl(fallback);

    const title = getWikipediaTitle(item);
    if (!title) return;

    let cancelled = false;
    const loadWikiThumb = async () => {
      try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (!response.ok) return;
        const data = (await response.json()) as { thumbnail?: { source?: string } };
        if (!cancelled && data.thumbnail?.source) {
          setImageUrl(data.thumbnail.source);
        }
      } catch {
        // keep fallback image
      }
    };

    void loadWikiThumb();

    return () => {
      cancelled = true;
    };
  }, [item, fallback]);

  return (
    <article className="stop-card">
      <img
        className="stop-image"
        src={imageUrl}
        alt={item.name}
        loading="lazy"
        onError={() => setImageUrl(fallback)}
      />
      <div className="stop-content">
        <div className="stop-top">
          <h4>{item.name}</h4>
          <span className="stop-chip">{categoryLabel[item.category]}</span>
        </div>
        <p className="stop-meta">{item.distanceFromRouteKm.toFixed(1)} km off route</p>
        <p className="stop-meta">{item.rating ? `Rating ${item.rating.toFixed(1)} / 5` : "Rating unavailable"}</p>
        <button onClick={() => onAdd(item)} disabled={isAdded}>
          {isAdded ? "Added" : "Add to Itinerary"}
        </button>
      </div>
    </article>
  );
};
