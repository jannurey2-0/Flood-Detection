import { NextResponse } from "next/server";
import { getForecast } from "@/lib/weather";

export async function GET() {
  try {
    const forecast = await getForecast();
    return NextResponse.json(forecast, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    console.error("Failed to load forecast", error);
    return NextResponse.json(
      { error: "Forecast is temporarily unavailable" },
      { status: 502 },
    );
  }
}
