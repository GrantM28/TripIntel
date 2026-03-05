import { Router } from "express";
import { z } from "zod";
import { tripStreams } from "../sse/tripStream.js";
import { planTrip } from "../services/planningService.js";
import { getTripById, saveTrip } from "../services/tripService.js";

const planSchema = z.object({
  startText: z.string().min(2).max(160),
  destinationText: z.string().min(2).max(160),
  options: z
    .object({
      maxDetourKm: z.number().min(1).max(200).optional(),
      stopsPerCategory: z.number().min(1).max(30).optional(),
      preferences: z.array(z.enum(["family", "budget", "scenic", "fastest"])) .optional(),
      avoidTolls: z.boolean().optional(),
      avoidHighways: z.boolean().optional(),
      ev: z
        .object({
          enabled: z.boolean(),
          rangeKm: z.number().min(10).max(1200).optional(),
          connectorTypes: z.array(z.string()).optional()
        })
        .optional()
    })
    .optional()
});

export const tripRouter = Router();

tripRouter.post("/plan", async (req, res, next) => {
  try {
    const payload = planSchema.parse(req.body);
    const planned = await planTrip(payload);
    res.status(201).json(planned);
  } catch (error) {
    next(error);
  }
});

tripRouter.get("/trip/:id", async (req, res, next) => {
  try {
    const trip = await getTripById(req.params.id);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    res.json(trip);
  } catch (error) {
    next(error);
  }
});

tripRouter.post("/trip/:id/save", async (req, res, next) => {
  try {
    await saveTrip(req.params.id);
    res.json({ status: "saved" });
  } catch (error) {
    next(error);
  }
});

tripRouter.get("/trip/:id/stream", (req, res) => {
  const tripId = req.params.id;
  const emitter = tripStreams.get(tripId);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("connected", { tripId });

  const onUpdate = (payload: unknown) => send("update", payload);
  const onError = (payload: unknown) => send("error", payload);

  emitter.on("update", onUpdate);
  emitter.on("error", onError);

  req.on("close", () => {
    emitter.off("update", onUpdate);
    emitter.off("error", onError);
    res.end();
  });
});