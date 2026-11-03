import { CloudRain, Droplets, Sunrise, Sunset, Wind } from "lucide-react";
import type {
  CurrentConditions as CurrentConditionsData,
  DailyForecast,
} from "@/lib/weather";
import { formatClock, formatMm, temperature } from "@/lib/format";
import { WeatherIcon } from "./weather-icon";

export function CurrentConditions({
  current,
  today,
}: {
  current: CurrentConditionsData;
  today: DailyForecast;
}) {
  const metrics = [
    {
      label: "Humidity",
      value: `${Math.round(current.humidity)}%`,
      Icon: Droplets,
    },
    {
      label: "Wind",
      value: `${Math.round(current.windKmh)} km/h`,
      Icon: Wind,
    },
    {
      label: "Rain",
      value: formatMm(current.precipitationMm),
      Icon: CloudRain,
    },
  ];

  return (
    <section
      aria-label="Current conditions"
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-300/80">
            Right now
          </p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-6xl leading-none font-semibold tracking-tight text-white tabular-nums">
              {temperature(current.temperatureC)}
            </span>
            <div className="pb-1.5">
              <p className="font-medium text-slate-100">
                {current.condition.label}
              </p>
              <p className="text-sm text-slate-400">
                Feels like {temperature(current.apparentC)}
              </p>
            </div>
          </div>
        </div>
        <WeatherIcon
          kind={current.condition.kind}
          className="h-16 w-16 shrink-0"
        />
      </div>

      <dl className="relative mt-6 grid grid-cols-3 gap-2">
        {metrics.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-white/5 bg-slate-950/40 px-3 py-3"
          >
            <dt className="flex items-center gap-1.5 text-[11px] tracking-wider text-slate-500 uppercase">
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-100 tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-slate-400">
        <span>As of {formatClock(current.time)}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Sunrise aria-hidden="true" className="h-3.5 w-3.5" />
            {formatClock(today.sunrise)}
          </span>
          <span className="flex items-center gap-1">
            <Sunset aria-hidden="true" className="h-3.5 w-3.5" />
            {formatClock(today.sunset)}
          </span>
        </span>
      </div>
    </section>
  );
}
