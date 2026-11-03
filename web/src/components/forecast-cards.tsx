import { Droplets, Wind } from "lucide-react";
import type { DailyForecast } from "@/lib/weather";
import {
  formatMm,
  formatShortDate,
  formatWeekday,
  temperature,
} from "@/lib/format";
import { WeatherIcon } from "./weather-icon";

export function ForecastCards({
  days,
  today,
}: {
  days: DailyForecast[];
  today: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {days.map((day) => {
        const isToday = day.date === today;

        return (
          <article
            key={day.date}
            aria-label={`${isToday ? "Today" : formatWeekday(day.date)} forecast`}
            className={`flex flex-col rounded-2xl border p-4 ${
              isToday
                ? "border-sky-400/40 bg-sky-400/[0.07]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <header className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-slate-200">
                {isToday ? "Today" : formatWeekday(day.date)}
              </p>
              <p className="text-xs text-slate-500">{formatShortDate(day.date)}</p>
            </header>

            <div className="mt-4 flex flex-col items-center gap-2 text-center">
              <WeatherIcon kind={day.condition.kind} className="h-11 w-11" />
              <p className="min-h-8 text-xs leading-4 text-slate-400">
                {day.condition.label}
              </p>
            </div>

            <div className="mt-3 flex items-baseline justify-center gap-2 tabular-nums">
              <span className="text-lg font-semibold text-white">
                {temperature(day.maxC)}
              </span>
              <span className="text-sm text-slate-500">
                {temperature(day.minC)}
              </span>
            </div>

            <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Droplets aria-hidden="true" className="h-3.5 w-3.5 text-sky-400" />
                  {formatMm(day.precipMm)}
                </span>
                <span className="text-slate-300 tabular-nums">
                  {Math.round(day.probability)}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${Math.round(day.probability)}% chance of rain`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(day.probability)}
                className="h-1 overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className="h-full rounded-full bg-sky-400/80"
                  style={{
                    width: `${Math.min(100, Math.max(0, day.probability))}%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Wind aria-hidden="true" className="h-3.5 w-3.5" />
                {Math.round(day.windKmh)} km/h
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
