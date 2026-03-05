const layers = [
  { key: "scenic", label: "Scenic" },
  { key: "food", label: "Food" },
  { key: "gas", label: "Gas" },
  { key: "hotels", label: "Hotels" },
  { key: "attractions", label: "Attractions" },
  { key: "ev", label: "EV" },
  { key: "weather", label: "Weather" }
] as const;

export type LayerKey = (typeof layers)[number]["key"];

interface Props {
  enabled: Record<LayerKey, boolean>;
  onToggle: (key: LayerKey) => void;
}

export const LayerToggles = ({ enabled, onToggle }: Props) => {
  return (
    <div className="layer-toggles">
      {layers.map((layer) => (
        <label key={layer.key}>
          <input
            type="checkbox"
            checked={enabled[layer.key]}
            onChange={() => onToggle(layer.key)}
          />
          {layer.label}
        </label>
      ))}
    </div>
  );
};