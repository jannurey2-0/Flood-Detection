import { MapPin, RefreshCw, Waves } from "lucide-react";
import { getForecast } from "@/lib/weather";
import { formatFullDate, formatUpdatedAt } from "@/lib/format";
import { CurrentConditions } from "@/components/current-conditions";
import { ForecastCards } from "@/components/forecast-cards";
import { RainChart } from "@/components/rain-chart";
import { RainOutlookBanner } from "@/components/rain-outlook";

export default async function Home() {
  const forecast = await getForecast();
  const today = forecast.current.time.slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 ring-1 ring-sky-400/30 ring-inset">
            <Waves aria-hidden="true" className="h-6 w-6 text-sky-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Flood Monitoring
              </h1>
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-200">
                Phase 1 · Weather
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Barangay weather &amp; flood advisory
            </p>
          </div>
        </div>

        <div className="text-sm sm:text-right">
          <p className="flex items-center gap-1.5 text-slate-200 sm:justify-end">
            <MapPin aria-hidden="true" className="h-4 w-4 text-sky-300" />
            {forecast.location.name}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 sm:justify-end">
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Updated{" "}
            {formatUpdatedAt(forecast.fetchedAt, forecast.location.timezone)} ·
            Open-Meteo
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatFullDate(today)}
          </p>
        </div>
      </header>

      <main className="mt-6 space-y-6">
        <RainOutlookBanner outlook={forecast.rainOutlook} />

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <CurrentConditions
              current={forecast.current}
              today={forecast.daily[0]}
            />
          </div>
          <div className="lg:col-span-3">
            <RainChart hourly={forecast.hourly} />
          </div>
        </div>

        <section aria-labelledby="forecast-heading">
          <div className="mb-3">
            <h2
              id="forecast-heading"
              className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400"
            >
              5-day forecast
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Daily rainfall totals and maximum chance of rain
            </p>
          </div>
          <ForecastCards days={forecast.daily} today={today} />
        </section>
      </main>

      <footer className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Forecast data: Open-Meteo · cached for 10 minutes ·{" "}
          {forecast.location.timezone}
        </p>
        <p>River-level monitoring and barrier control arrive in Phase 2.</p>
      </footer>
    </div>
  );
}
