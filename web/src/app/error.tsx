"use client";

import { CloudOff } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-sm text-center">
        <CloudOff aria-hidden="true" className="mx-auto h-10 w-10 text-slate-500" />
        <h2 className="mt-4 text-lg font-semibold text-white">
          Forecast unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          We couldn&apos;t reach Open-Meteo. Check the connection and try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-full bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-300"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
