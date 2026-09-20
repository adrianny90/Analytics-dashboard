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
      setError(s.error ?? "The forecast run failed.");
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
          {isRunning ? "Calculating…" : "Calculate volatility forecast"}
        </button>
        <span className="text-xs text-white/50">
          Fills the <span className="text-white/70">Volatility band 3M</span> and{" "}
          <span className="text-white/70">P(±15%) 3M</span> columns for every stock and saves them to the database.
        </span>
      </div>

      {isRunning && (
        <div className="mt-4">
          <ProgressBar label="Downloading daily prices and calculating volatility" value={percent} />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-fall">{error}</p>}

      {scan?.status === "finished" && (
        <p className="mt-3 text-xs text-white/60">
          <span className="rounded bg-rise/15 px-2 py-0.5 font-semibold text-rise">Saved</span>{" "}
          {scan.source === "cached"
            ? "Reused a run from the last 12 hours (already in the database)."
            : "Downloaded and calculated for every stock and saved to the database."}
          {scan.updated_at ? ` Calculated ${new Date(scan.updated_at).toLocaleString()}.` : ""}
        </p>
      )}

      <p className="mt-3 text-xs text-white/40">
        Method C uses volatility only, with no machine learning: the range is today&apos;s price scaled by the
        stock&apos;s own 3-month volatility, sized so that in an S&amp;P 500 backtest (2016-2026) about 80% of real
        3-month prices landed inside it (79.8% on the years it had not seen). P(±15%) is the chance the price stays
        within 15% of today&apos;s after 3 months, calculated from that volatility.
      </p>
    </section>
  );
}
