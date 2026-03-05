# Trip Intelligence (MVP)

Trip Intelligence is a road-trip planner with a minimal first-load flow: enter only `Start` + `Destination`, then receive a route immediately and progressive category results streamed in (scenic, food, gas, hotels, attractions, weather, EV, alerts).

## Monorepo Tree

```text
.
|-- apps
|   |-- api
|   |   |-- prisma
|   |   |   `-- schema.prisma
|   |   |-- src
|   |   |   |-- config
|   |   |   |-- db
|   |   |   |-- providers
|   |   |   |-- routes
|   |   |   |-- services
|   |   |   |-- sse
|   |   |   |-- utils
|   |   |   |-- app.ts
|   |   |   |-- index.ts
|   |   |   `-- swagger.ts
|   |   |-- tests
|   |   |   `-- ranking.test.ts
|   |   |-- Dockerfile
|   |   |-- package.json
|   |   `-- tsconfig.json
|   `-- web
|       |-- src
|       |   |-- components
|       |   |-- lib
|       |   |-- pages
|       |   |-- App.tsx
|       |   |-- main.tsx
|       |   `-- styles.css
|       |-- Dockerfile
|       |-- index.html
|       |-- package.json
|       |-- tsconfig.json
|       `-- vite.config.ts
|-- infra
|   `-- osrm
|       `-- README.md
|-- packages
|   `-- shared
|       |-- src
|       |   `-- index.ts
|       |-- package.json
|       `-- tsconfig.json
|-- .env.example
|-- docker-compose.yml
|-- package.json
`-- tsconfig.base.json
```

## Features

- Two-input first load UX (`Start`, `Destination`) with optional `Options` drawer.
- Leaflet + OSM map with route polyline and clickable markers.
- Sidebar tabs: Stops, Weather, Hotels, Gas, EV, Alerts.
- Progressive loading via SSE (`/api/trip/:id/stream`).
- Save trip + share URL (`/trip/:id`).
- SQLite persistence with Prisma.
- Free/open providers by default:
  - Geocoding: Nominatim
  - Routing: OSRM public demo (or self-host)
  - POIs: Overpass (+ OpenTripMap optional)
  - Weather: Open-Meteo
  - EV: OpenChargeMap optional
  - Construction/incidents: placeholder adapter when provider is not configured
- Caching + provider throttling built into outbound HTTP layer.
- Security baseline: helmet, CORS, API rate limiting, input validation.
- API docs at `/docs`.

## Quick Start (Docker Compose)

1. Create env file:
   - `copy .env.example .env` (Windows)
2. Start services:
   - `docker compose up --build`
3. Open:
   - Web: [http://localhost:5173](http://localhost:5173)
   - API health: [http://localhost:4000/api/health](http://localhost:4000/api/health)
   - Swagger docs: [http://localhost:4000/docs](http://localhost:4000/docs)

## Local Dev (without Docker)

1. Install dependencies:
   - `npm install`
2. Initialize DB:
   - `npm run db:push --workspace apps/api`
3. Run API + Web:
   - `npm run dev`
4. Run tests:
   - `npm run test`

## Environment / Providers

Use `.env` values in root. Important keys:

- `NOMINATIM_USER_AGENT` (set contact info; required by policy)
- `OSRM_BASE_URL` (`https://router.project-osrm.org` by default)
- `ENABLE_OPEN_TRIP_MAP` + `OPEN_TRIP_MAP_API_KEY`
- `ENABLE_OPEN_CHARGE_MAP` + `OPEN_CHARGE_MAP_API_KEY`
- `ENABLE_REDIS_CACHE` + `REDIS_URL`
- `ENABLE_CONSTRUCTION_PROVIDER` (currently placeholder adapter)

## Optional Services

- Redis profile:
  - `docker compose --profile redis up --build`
- OSRM profile (self-hosted routing):
  - Prepare OSRM data in `infra/osrm` (see file)
  - `docker compose --profile osrm up --build`
  - Set `OSRM_BASE_URL=http://osrm:5000`

## API Endpoints

- `POST /api/plan`
- `GET /api/trip/:id`
- `GET /api/trip/:id/stream` (SSE)
- `POST /api/trip/:id/save`
- `GET /api/health`

## MVP Limitations / Disclaimers

- Gas prices: free MVP uses fuel station discovery, not true live prices.
- Construction/incidents: adapter placeholder emits `Provider not configured` until a traffic provider is wired.
- OSRM public demo should not be treated as an SLA-backed production route source.
- Nominatim rate limits are respected with throttling and caching, but heavy production usage should use a self-hosted/specialized geocoder.

## Screenshot Instructions

After running `docker compose up`:

1. Open planner page and capture initial two-input UI.
2. Plan a trip (e.g. `Chicago, IL` -> `Nashville, TN`).
3. Capture trip view with route polyline + sidebar tabs + layer toggles.
4. Capture weather/alerts tab once SSE updates arrive.
