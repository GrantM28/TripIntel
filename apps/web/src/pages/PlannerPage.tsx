import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TripOptions } from "@trip-intelligence/shared";
import { OptionsDrawer } from "../components/OptionsDrawer";
import { fetchGeocodeSuggestions, planTrip, type GeocodeSuggestionDto } from "../lib/api";

interface AutoProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const LocationInput = ({ label, value, onChange, placeholder }: AutoProps) => {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestionDto[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const next = await fetchGeocodeSuggestions(value);
        setSuggestions(next);
        setOpen(next.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <label>
      {label}
      <div className="autocomplete" ref={wrapperRef}>
        <input
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          required
        />
        {loading && <div className="suggestions-loading">Searching...</div>}
        {open && suggestions.length > 0 && (
          <div className="suggestions-list" role="listbox">
            {suggestions.map((item, index) => (
              <button
                type="button"
                className="suggestion-item"
                key={`${item.label}-${index}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(item.label);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
};

export const PlannerPage = () => {
  const navigate = useNavigate();
  const [startText, setStartText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<TripOptions>({
    maxDetourKm: 15,
    stopsPerCategory: 8,
    preferences: [],
    ev: { enabled: false, connectorTypes: [] }
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!startText.trim() || !destinationText.trim()) {
      setError("Start and destination are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await planTrip({ startText, destinationText, options });
      navigate(`/trip/${result.tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to plan trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="planner-page">
      <section className="hero-card">
        <h1>Trip Intelligence</h1>
        <p>Plan smarter road trips with one click and stream useful stops as they load.</p>
        <form onSubmit={submit}>
          <LocationInput
            label="Start"
            placeholder="Chicago, IL"
            value={startText}
            onChange={setStartText}
          />
          <LocationInput
            label="Destination"
            placeholder="Nashville, TN"
            value={destinationText}
            onChange={setDestinationText}
          />
          <div className="actions-row">
            <button type="button" className="secondary" onClick={() => setIsOptionsOpen((prev) => !prev)}>
              {isOptionsOpen ? "Hide Options" : "Options"}
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Planning..." : "Plan Trip"}
            </button>
          </div>
          <OptionsDrawer isOpen={isOptionsOpen} options={options} onChange={setOptions} />
          {error && <p className="error-text">{error}</p>}
        </form>
      </section>
    </main>
  );
};
