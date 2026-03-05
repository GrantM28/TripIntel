# Optional OSRM notes

Place extracted OSRM data files (e.g. `region.osrm` and sidecar files) in this directory if you want to run the optional `osrm` compose profile.

Example:
1. Download `.osm.pbf` data for your area.
2. Run `osrm-extract`, `osrm-partition`, and `osrm-customize` using `osrm/osrm-backend` tools.
3. Put output files here and enable compose profile:
   `docker compose --profile osrm up`
4. Set `OSRM_BASE_URL=http://osrm:5000` for the API service.