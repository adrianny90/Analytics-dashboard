"use client";

import { useEffect, useRef, useState } from "react";

import { ProgressBar } from "@/components/RankingRunStatus";
import { getForecastScanStatus, startForecastScan } from "@/lib/api";
import type { RankingUniverse, RsiScanStatus } from "@/types/market";

const POLL_MS = 3000;

/** Button above the table that runs the volatility forecast (method C) for
 *  every stock and saves it to the database. */
export function RankingForecastScan({
  universe,
  onScanned,
}: {
  universe: RankingUniverse;
  /** Called once a run finished, so the page can reload the ranking (which now carries the fresh forecasts). */
  onScanned: () => Promise<void>;
}) {
  const [scan, setScan] = useState<RsiScanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function finish(s: RsiScanStatus) {
    stopPolling();
    if (s.status === "failed") {
      setError(s.error ?? "Przebieg prognozy nie powiódł się.");
      return;
    }
    try {
      await onScanned();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function poll() {
    getForecastScanStatus(universe)
      .then((s) => {
        setScan(s);
        if (s.status !== "running") void finish(s);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    // Picks up a run that is still going (e.g. the page was reopened).
    getForecastScanStatus(universe)
      .then((s) => {
        setScan(s);
        if (s.status === "running") timerRef.current = setInterval(poll, POLL_MS);
      })
      .catch(() => undefined);
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe]);

  function handleClick() {
    setError(null);
    startForecastScan(universe)
      .then((s) => {
        setScan(s);
        if (s.status === "running") {
          stopPolling();
          timerRef.current = setInterval(poll, POLL_MS);
        } else {
          void finish(s);
        }
      })
      .catch((err) => setError(err.message));
  }

  const isRunning = scan?.status === "running";
  const percent = scan && scan.total > 0 ? Math.min(100, Math.round((scan.processed / scan.total) * 100)) : 0;

  return (
    <section className="mt-6 rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleClick}
          disabled={isRunning}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? "Liczenie…" : "Oblicz prognozę zmienności"}
        </button>
        <span className="text-xs text-white/50">
          Uzupełnia kolumny <span className="text-white/70">Pasmo zmienności 3M</span> i{" "}
          <span className="text-white/70">P(±15%) 3M</span> dla każdej spółki i zapisuje je w bazie danych.
        </span>
      </div>

      {isRunning && (
        <div className="mt-4">
          <ProgressBar label="Pobieranie dziennych cen i obliczanie zmienności" value={percent} />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-fall">{error}</p>}

      {scan?.status === "finished" && (
        <p className="mt-3 text-xs text-white/60">
          <span className="rounded bg-rise/15 px-2 py-0.5 font-semibold text-rise">Zapisano</span>{" "}
          {scan.source === "cached"
            ? "Użyto przebiegu z ostatnich 24 godzin (już w bazie danych)."
            : "Pobrano i policzono dla każdej spółki, i zapisano w bazie danych."}
          {scan.updated_at ? ` Policzono ${new Date(scan.updated_at).toLocaleString()}.` : ""}
        </p>
      )}

      <p className="mt-3 text-xs text-white/40">
        Metoda C korzysta wyłącznie ze zmienności, bez uczenia maszynowego: przedział to dzisiejsza cena
        przeskalowana przez własną 3-miesięczną zmienność spółki, dobrana tak, żeby w backteście S&amp;P 500
        (2016-2026) około 80% realnych 3-miesięcznych cen znalazło się w środku (79,8% w latach, których model nie
        widział). P(±15%) to szansa, że cena zostanie w granicach 15% dzisiejszej po 3 miesiącach, policzona z tej
        samej zmienności.
      </p>
    </section>
  );
}
