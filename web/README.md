# Flood Monitoring — Phase 1 Dashboard

Weather forecast dashboard for Barangay Logpond, Siay, Zamboanga Sibugay. Part of the
Automated Flood Detection and Flood Control System (see the root `PLAN.md`).

## What's included

- Current conditions (temperature, feels-like, humidity, wind, rainfall)
- 24-hour rain outlook banner derived from the hourly forecast
- 48-hour rainfall / chance-of-rain chart (Recharts)
- 5-day forecast cards (rain total, probability, wind, hi/lo)
- Server-side Open-Meteo client cached for 10 minutes
- `GET /api/weather` JSON endpoint for future station/dashboard clients

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Configuration

Defaults point at Barangay Logpond (7.7073, 122.8589). Copy `.env.example` to
`.env.local` to override the location without touching code:

```
FORECAST_LOCATION_NAME=Barangay Logpond, Siay, Zamboanga Sibugay
FORECAST_LAT=7.7073
FORECAST_LON=122.8589
FORECAST_TIMEZONE=Asia/Manila
```

## Notes

- Weather data comes from [Open-Meteo](https://open-meteo.com/) (free, no API key).
  Requests are made server-side only; the browser never calls Open-Meteo directly.
- The cache uses Next.js Cache Components (`use cache` + `cacheLife`) with a
  10-minute revalidate window, matching the plan's API budget.
- Live river levels, barrier status, and alerts arrive in Phase 2.
