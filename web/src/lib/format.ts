const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseWallTime(isoLocal: string): Date {
  const [datePart, timePart = "00:00"] = isoLocal.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

export function formatWeekday(isoDate: string): string {
  return SHORT_WEEKDAYS[parseWallTime(isoDate).getUTCDay()];
}

export function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parseWallTime(isoDate));
}

export function formatFullDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseWallTime(isoDate));
}

export function formatHour(isoLocal: string): string {
  const hour = parseWallTime(isoLocal).getUTCHours();
  const suffix = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${suffix}`;
}

export function formatClock(isoLocal: string): string {
  const date = parseWallTime(isoLocal);
  const hour = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const suffix = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

export function formatHourDay(isoLocal: string): string {
  return `${formatWeekday(isoLocal)}, ${formatHour(isoLocal)}`;
}

export function formatAxisTick(isoLocal: string): string {
  const hour = parseWallTime(isoLocal).getUTCHours();
  return hour === 0 ? formatWeekday(isoLocal) : formatHour(isoLocal);
}

export function formatMm(value: number): string {
  return `${value.toFixed(1)} mm`;
}

export function formatUpdatedAt(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(isoUtc));
}

export function temperature(value: number): string {
  return `${Math.round(value)}°`;
}
