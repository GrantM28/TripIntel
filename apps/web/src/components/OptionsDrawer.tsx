import type { TripOptions } from "@trip-intelligence/shared";

interface Props {
  isOpen: boolean;
  options: TripOptions;
  onChange: (next: TripOptions) => void;
}

export const OptionsDrawer = ({ isOpen, options, onChange }: Props) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="options-drawer">
      <label>
        Max Detour (km)
        <input
          type="number"
          min={1}
          value={options.maxDetourKm ?? 15}
          onChange={(event) =>
            onChange({
              ...options,
              maxDetourKm: Number(event.target.value)
            })
          }
        />
      </label>
      <label>
        Stops Per Category
        <input
          type="number"
          min={1}
          max={20}
          value={options.stopsPerCategory ?? 8}
          onChange={(event) =>
            onChange({
              ...options,
              stopsPerCategory: Number(event.target.value)
            })
          }
        />
      </label>
      <div className="checkbox-grid">
        <label>
          <input
            type="checkbox"
            checked={options.preferences?.includes("family") ?? false}
            onChange={(event) => {
              const next = new Set(options.preferences ?? []);
              if (event.target.checked) next.add("family");
              else next.delete("family");
              onChange({ ...options, preferences: [...next] });
            }}
          />
          Family-friendly
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.preferences?.includes("budget") ?? false}
            onChange={(event) => {
              const next = new Set(options.preferences ?? []);
              if (event.target.checked) next.add("budget");
              else next.delete("budget");
              onChange({ ...options, preferences: [...next] });
            }}
          />
          Budget
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.preferences?.includes("scenic") ?? false}
            onChange={(event) => {
              const next = new Set(options.preferences ?? []);
              if (event.target.checked) next.add("scenic");
              else next.delete("scenic");
              onChange({ ...options, preferences: [...next] });
            }}
          />
          Scenic
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.preferences?.includes("fastest") ?? false}
            onChange={(event) => {
              const next = new Set(options.preferences ?? []);
              if (event.target.checked) next.add("fastest");
              else next.delete("fastest");
              onChange({ ...options, preferences: [...next] });
            }}
          />
          Fastest
        </label>
      </div>
      <div className="checkbox-grid">
        <label>
          <input
            type="checkbox"
            checked={options.avoidTolls ?? false}
            onChange={(event) => onChange({ ...options, avoidTolls: event.target.checked })}
          />
          Avoid Tolls
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.avoidHighways ?? false}
            onChange={(event) => onChange({ ...options, avoidHighways: event.target.checked })}
          />
          Avoid Highways
        </label>
      </div>
      <div className="ev-settings">
        <label>
          <input
            type="checkbox"
            checked={options.ev?.enabled ?? false}
            onChange={(event) =>
              onChange({
                ...options,
                ev: { ...(options.ev ?? { connectorTypes: [] }), enabled: event.target.checked }
              })
            }
          />
          EV Mode
        </label>
        {options.ev?.enabled && (
          <label>
            Vehicle Range (km)
            <input
              type="number"
              min={50}
              value={options.ev.rangeKm ?? 350}
              onChange={(event) =>
                onChange({
                  ...options,
                  ev: {
                    ...(options.ev ?? { enabled: true, connectorTypes: [] }),
                    rangeKm: Number(event.target.value)
                  }
                })
              }
            />
          </label>
        )}
      </div>
    </div>
  );
};