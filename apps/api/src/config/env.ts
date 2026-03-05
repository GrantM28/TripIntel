import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default("file:./prisma/dev.db"),
  REDIS_URL: z.string().optional(),
  NOMINATIM_BASE_URL: z.string().default("https://nominatim.openstreetmap.org"),
  NOMINATIM_USER_AGENT: z.string().default("TripIntelligence/1.0 (contact: you@example.com)"),
  OSRM_BASE_URL: z.string().default("https://router.project-osrm.org"),
  OPEN_TRIP_MAP_API_KEY: z.string().optional(),
  OPEN_TRIP_MAP_BASE_URL: z.string().default("https://api.opentripmap.com/0.1/en/places"),
  OVERPASS_BASE_URL: z.string().default("https://overpass-api.de/api/interpreter"),
  OPEN_METEO_BASE_URL: z.string().default("https://api.open-meteo.com/v1"),
  OPEN_CHARGE_MAP_BASE_URL: z.string().default("https://api.openchargemap.io/v3"),
  OPEN_CHARGE_MAP_API_KEY: z.string().optional(),
  ENABLE_REDIS_CACHE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  ENABLE_OPEN_TRIP_MAP: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  ENABLE_OPEN_CHARGE_MAP: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
  ENABLE_CONSTRUCTION_PROVIDER: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  DEFAULT_MAX_DETOUR_KM: z.coerce.number().default(15),
  DEFAULT_STOPS_PER_CATEGORY: z.coerce.number().default(8),
  CACHE_TTL_SECONDS: z.coerce.number().default(900),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100)
});

export const env = envSchema.parse(process.env);