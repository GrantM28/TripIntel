import type { PlanRequest, PlanResponse, PlannedTrip, StreamEvent } from "@trip-intelligence/shared";

const computedDefaultBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:4000/api`
    : "http://localhost:4000/api";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? computedDefaultBase;

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Request failed");
  }
  return (await response.json()) as T;
};

export const planTrip = async (payload: PlanRequest): Promise<PlanResponse> => {
  const response = await fetch(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<PlanResponse>(response);
};

export const fetchTrip = async (tripId: string): Promise<PlannedTrip> => {
  const response = await fetch(`${API_BASE}/trip/${tripId}`);
  return parseJson<PlannedTrip>(response);
};

export const saveTrip = async (tripId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/trip/${tripId}/save`, {
    method: "POST"
  });
  await parseJson<{ status: string }>(response);
};

export const connectStream = (
  tripId: string,
  onUpdate: (event: StreamEvent) => void,
  onError: (message: string) => void
): EventSource => {
  const stream = new EventSource(`${API_BASE}/trip/${tripId}/stream`);
  stream.addEventListener("update", (event) => {
    const parsed = JSON.parse((event as MessageEvent).data) as StreamEvent;
    onUpdate(parsed);
  });
  stream.addEventListener("error", (event) => {
    const parsed = JSON.parse((event as MessageEvent).data || "{}") as { message?: string };
    onError(parsed.message || "Stream disconnected");
  });
  return stream;
};
