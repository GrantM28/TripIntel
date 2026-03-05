import { EventEmitter } from "node:events";

class TripStreamRegistry {
  private streams = new Map<string, EventEmitter>();

  get(tripId: string): EventEmitter {
    if (!this.streams.has(tripId)) {
      this.streams.set(tripId, new EventEmitter());
    }
    return this.streams.get(tripId)!;
  }

  emit(tripId: string, event: string, payload: unknown): void {
    const stream = this.get(tripId);
    stream.emit(event, payload);
  }
}

export const tripStreams = new TripStreamRegistry();