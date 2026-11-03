import {
  CircleCheck,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
} from "lucide-react";
import type { OutlookLevel, RainOutlook } from "@/lib/weather";

const STYLES: Record<
  OutlookLevel,
  {
    label: string;
    wrapper: string;
    badge: string;
    icon: string;
    Icon: typeof CloudRain;
  }
> = {
  none: {
    label: "Clear",
    wrapper: "border-emerald-400/25 bg-emerald-400/[0.06]",
    badge: "bg-emerald-400/15 text-emerald-200",
    icon: "text-emerald-300",
    Icon: CircleCheck,
  },
  light: {
    label: "Light",
    wrapper: "border-sky-400/25 bg-sky-400/[0.06]",
    badge: "bg-sky-400/15 text-sky-200",
    icon: "text-sky-300",
    Icon: CloudDrizzle,
  },
  moderate: {
    label: "Moderate",
    wrapper: "border-amber-400/30 bg-amber-400/[0.07]",
    badge: "bg-amber-400/15 text-amber-200",
    icon: "text-amber-300",
    Icon: CloudRain,
  },
  heavy: {
    label: "Heavy",
    wrapper: "border-rose-400/30 bg-rose-400/[0.08]",
    badge: "bg-rose-400/15 text-rose-200",
    icon: "text-rose-300",
    Icon: CloudLightning,
  },
};

export function RainOutlookBanner({ outlook }: { outlook: RainOutlook }) {
  const style = STYLES[outlook.level];
  const Icon = style.Icon;

  return (
    <section
      aria-label="Rain outlook for the next 24 hours"
      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${style.wrapper}`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2 ${style.badge}`}>
          <Icon
            aria-hidden="true"
            strokeWidth={1.5}
            className={`h-5 w-5 ${style.icon}`}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Rain outlook · 24 h
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}
            >
              {style.label}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-white">{outlook.title}</p>
          <p className="text-xs text-slate-400">{outlook.detail}</p>
        </div>
      </div>

      <dl className="flex gap-6 pl-[52px] sm:pl-0">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">
            Next 24 h
          </dt>
          <dd className="text-sm font-semibold text-slate-100 tabular-nums">
            {outlook.next24hMm.toFixed(1)} mm
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">
            Max chance
          </dt>
          <dd className="text-sm font-semibold text-slate-100 tabular-nums">
            {Math.round(outlook.maxProbability)}%
          </dd>
        </div>
      </dl>
    </section>
  );
}
