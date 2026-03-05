import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TripOptions } from "@trip-intelligence/shared";
import { OptionsDrawer } from "../components/OptionsDrawer";
import { planTrip } from "../lib/api";

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
          <label>
            Start
            <input
              placeholder="Chicago, IL"
              value={startText}
              onChange={(event) => setStartText(event.target.value)}
              required
            />
          </label>
          <label>
            Destination
            <input
              placeholder="Nashville, TN"
              value={destinationText}
              onChange={(event) => setDestinationText(event.target.value)}
              required
            />
          </label>
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
