import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSun,
  Snowflake,
  Sun,
} from "lucide-react";
import type { WeatherKind } from "@/lib/weather";

const ICONS: Record<WeatherKind, { Icon: typeof Sun; color: string }> = {
  clear: { Icon: Sun, color: "text-amber-300" },
  partly: { Icon: CloudSun, color: "text-amber-200" },
  cloudy: { Icon: Cloud, color: "text-slate-300" },
  fog: { Icon: CloudFog, color: "text-slate-400" },
  drizzle: { Icon: CloudDrizzle, color: "text-sky-300" },
  rain: { Icon: CloudRain, color: "text-sky-400" },
  "heavy-rain": { Icon: CloudRainWind, color: "text-blue-400" },
  storm: { Icon: CloudLightning, color: "text-violet-400" },
  snow: { Icon: Snowflake, color: "text-cyan-200" },
};

export function WeatherIcon({
  kind,
  className = "h-10 w-10",
}: {
  kind: WeatherKind;
  className?: string;
}) {
  const { Icon, color } = ICONS[kind];
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={1.5}
      className={`${color} ${className}`}
    />
  );
}
