import { cacheLife } from "next/cache";

export type WeatherKind =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "storm"
  | "snow";

export interface WeatherCondition {
  code: number;
  label: string;
  kind: WeatherKind;
}

export interface CurrentConditions {
  time: string;
  temperatureC: number;
  apparentC: number;
  humidity: number;
  precipitationMm: number;
  windKmh: number;
  condition: WeatherCondition;
}

export interface DailyForecast {
  date: string;
  condition: WeatherCondition;
  maxC: number;
  minC: number;
  precipMm: number;
  probability: number;
  windKmh: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyPoint {
  time: string;
  precipitationMm: number;
  probability: number;
}

export type OutlookLevel = "none" | "light" | "moderate" | "heavy";

export interface RainOutlook {
  level: OutlookLevel;
  title: string;
  detail: string;
  next24hMm: number;
  maxProbability: number;
}

export interface Forecast {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  fetchedAt: string;
  current: CurrentConditions;
  daily: DailyForecast[];
  hourly: HourlyPoint[];
  rainOutlook: RainOutlook;
}

interface OpenMeteoResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: Array<number | null>;
    wind_speed_10m_max: number[];
    sunrise: string[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    precipitation: number[];
    precipitation_probability: number[];
  };
}

const WMO_CONDITIONS: Record<number, { label: string; kind: WeatherKind }> = {
  0: { label: "Clear sky", kind: "clear" },
  1: { label: "Mainly clear", kind: "clear" },
  2: { label: "Partly cloudy", kind: "partly" },
  3: { label: "Overcast", kind: "cloudy" },
  45: { label: "Fog", kind: "fog" },
  48: { label: "Rime fog", kind: "fog" },
  51: { label: "Light drizzle", kind: "drizzle" },
  53: { label: "Drizzle", kind: "drizzle" },
  55: { label: "Heavy drizzle", kind: "drizzle" },
  56: { label: "Freezing drizzle", kind: "drizzle" },
  57: { label: "Freezing drizzle", kind: "drizzle" },
  61: { label: "Light rain", kind: "rain" },
  63: { label: "Rain", kind: "rain" },
  65: { label: "Heavy rain", kind: "heavy-rain" },
  66: { label: "Freezing rain", kind: "rain" },
  67: { label: "Freezing rain", kind: "rain" },
  71: { label: "Light snow", kind: "snow" },
  73: { label: "Snow", kind: "snow" },
  75: { label: "Heavy snow", kind: "snow" },
  77: { label: "Snow grains", kind: "snow" },
  80: { label: "Light showers", kind: "rain" },
  81: { label: "Rain showers", kind: "rain" },
  82: { label: "Heavy showers", kind: "heavy-rain" },
  85: { label: "Snow showers", kind: "snow" },
  86: { label: "Heavy snow showers", kind: "snow" },
  95: { label: "Thunderstorm", kind: "storm" },
  96: { label: "Thunderstorm, hail", kind: "storm" },
  99: { label: "Severe thunderstorm", kind: "storm" },
};

function describeCode(code: number): WeatherCondition {
  const condition = WMO_CONDITIONS[code] ?? { label: "Unknown", kind: "cloudy" };
  return { code, ...condition };
}

function envNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const forecastLocation = {
  name:
    process.env.FORECAST_LOCATION_NAME ??
    "Barangay Logpond, Siay, Zamboanga Sibugay",
  latitude: envNumber(process.env.FORECAST_LAT, 7.7073),
  longitude: envNumber(process.env.FORECAST_LON, 122.8589),
  timezone: process.env.FORECAST_TIMEZONE ?? "Asia/Manila",
};

function buildOutlook(hourly: HourlyPoint[]): RainOutlook {
  const next24h = hourly.slice(0, 24);
  const next24hMm = next24h.reduce((sum, point) => sum + point.precipitationMm, 0);
  const maxProbability = next24h.reduce(
    (max, point) => Math.max(max, point.probability),
    0,
  );

  let level: OutlookLevel = "none";
  if (next24hMm >= 30 || (maxProbability >= 90 && next24hMm >= 15)) {
    level = "heavy";
  } else if (next24hMm >= 10) {
    level = "moderate";
  } else if (next24hMm >= 1) {
    level = "light";
  }

  const titles: Record<OutlookLevel, string> = {
    none: "Little to no rain expected",
    light: "Light rain expected",
    moderate: "Rain likely",
    heavy: "Heavy rain possible",
  };

  const details: Record<OutlookLevel, string> = {
    none: "Dry conditions expected over the next 24 hours.",
    light: "Brief, light showers possible — no action needed.",
    moderate: "Steady rain likely — keep an eye on creeks and drains.",
    heavy: "Heavy rainfall possible — be ready to monitor river levels.",
  };

  return {
    level,
    title: titles[level],
    detail: details[level],
    next24hMm,
    maxProbability,
  };
}

export async function getForecast(): Promise<Forecast> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 1800 });

  const params = new URLSearchParams({
    latitude: String(forecastLocation.latitude),
    longitude: String(forecastLocation.longitude),
    timezone: forecastLocation.timezone,
    forecast_days: "5",
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
    hourly: "precipitation,precipitation_probability",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;

  const daily: DailyForecast[] = data.daily.time.map((date, index) => ({
    date,
    condition: describeCode(data.daily.weather_code[index]),
    maxC: data.daily.temperature_2m_max[index],
    minC: data.daily.temperature_2m_min[index],
    precipMm: data.daily.precipitation_sum[index] ?? 0,
    probability: data.daily.precipitation_probability_max[index] ?? 0,
    windKmh: data.daily.wind_speed_10m_max[index] ?? 0,
    sunrise: data.daily.sunrise[index],
    sunset: data.daily.sunset[index],
  }));

  const currentHour = data.current.time.slice(0, 13);
  const foundIndex = data.hourly.time.findIndex(
    (time) => time.slice(0, 13) >= currentHour,
  );
  const startIndex = foundIndex === -1 ? 0 : foundIndex;

  const hourly: HourlyPoint[] = data.hourly.time
    .slice(startIndex, startIndex + 48)
    .map((time, index) => ({
      time,
      precipitationMm: data.hourly.precipitation[startIndex + index] ?? 0,
      probability: data.hourly.precipitation_probability[startIndex + index] ?? 0,
    }));

  return {
    location: {
      name: forecastLocation.name,
      latitude: forecastLocation.latitude,
      longitude: forecastLocation.longitude,
      timezone: data.timezone,
    },
    fetchedAt: new Date().toISOString(),
    current: {
      time: data.current.time,
      temperatureC: data.current.temperature_2m,
      apparentC: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      precipitationMm: data.current.precipitation,
      windKmh: data.current.wind_speed_10m,
      condition: describeCode(data.current.weather_code),
    },
    daily,
    hourly,
    rainOutlook: buildOutlook(hourly),
  };
}
