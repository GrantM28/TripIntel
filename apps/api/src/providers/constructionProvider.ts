import type { ConstructionProvider } from "./types.js";

export class PlaceholderConstructionProvider implements ConstructionProvider {
  async fetchAlerts() {
    return [
      {
        message:
          "Incident provider not configured. Set ENABLE_CONSTRUCTION_PROVIDER=true and connect your preferred traffic incidents API.",
        severity: "info" as const
      }
    ];
  }
}