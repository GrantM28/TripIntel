import { v4 as uuidv4 } from "uuid";
import type { Coordinate, WeatherHazard } from "@trip-intelligence/shared";
import { env } from "../config/env.js";
import { getJson } from "../utils/http.js";
import type { WeatherProvider } from "./types.js";

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    precipitation: number[];
    wind_speed_10m: number[];
    temperature_2m: number[];
    weather_code?: number[];
  };
}

const deriveHazards = (data: {
  precipitationMm: number;
  windKph: number;
  tempC: number;
  weatherCode?: number;
}): string[] => {
  const hazards: string[] = [];
  if (data.precipitationMm >= 8) hazards.push("Heavy precipitation");
  if (data.windKph >= 45) hazards.push("High winds");
  if (data.tempC <= -5) hazards.push("Freezing temperatures");
  if (data.tempC >= 37) hazards.push("Extreme heat");
  if ((data.weatherCode ?? 0) >= 95) hazards.push("Thunderstorm risk");
  if ([71, 73, 75, 77, 85, 86].includes(data.weatherCode ?? -1)) hazards.push("Snow risk");
  return hazards;
};

export class OpenMeteoProvider implements WeatherProvider {
  async hazardsForPoints(points: Coordinate[], routeDurationMinutes: number): Promise<WeatherHazard[]> {
    const hazards: WeatherHazard[] = [];

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const etaHours = (routeDurationMinutes / 60) * (i / Math.max(1, points.length - 1));
      const url = `${env.OPEN_METEO_BASE_URL}/forecast?latitude=${point.lat}&longitude=${point.lon}&hourly=precipitation,wind_speed_10m,temperature_2m,weather_code&forecast_days=2`;

      const result = await getJson<OpenMeteoResponse>(url, {
        throttleMs: 250
      });

      const idx = Math.min(result.hourly.time.length - 1, Math.max(0, Math.round(etaHours)));
      const precipitationMm = result.hourly.precipitation[idx] ?? 0;
      const windKph = result.hourly.wind_speed_10m[idx] ?? 0;
      const tempC = result.hourly.temperature_2m[idx] ?? 0;
      const weatherCode = result.hourly.weather_code?.[idx];
      const hazardFlags = deriveHazards({
        precipitationMm,
        windKph,
        tempC,
        weatherCode
      });

      if (hazardFlags.length > 0) {
        hazards.push({
          id: `wx-${uuidv4()}`,
          coordinate: point,
          etaHoursFromStart: Number(etaHours.toFixed(1)),
          hazards: hazardFlags,
          maxWindKph: windKph,
          precipitationMm,
          temperatureC: tempC
        });
      }
    }

    return hazards;
  }
}