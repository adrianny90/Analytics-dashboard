"use client";

import { useEffect, useRef, useState } from "react";

import { ProgressBar } from "@/components/RankingRunStatus";
import { getDownloadAllStatus, startDownloadAll } from "@/lib/api";
import type { DownloadAllItem, DownloadAllState, DownloadAllStatus, RankingUniverse } from "@/types/market";

const POLL_MS = 5000;

const UNIVERSE_LABELS: Record<RankingUniverse, string> = {
  sp500: "S&P 500",
  nasdaq: "Nasdaq",
  russell2000: "Russell 2000",
};

const STATE_STYLES: Record<DownloadAllState, string> = {
  pending: "bg-white/10 text-white/50",
  running: "bg-white/15 text-white",
  cached: "bg-white/10 text-white/70",
  finished: "bg-rise/15 text-rise",
  failed: "bg-fall/15 text-fall",
};

const STATE_LABELS: Record<DownloadAllState, string> = {
  pending: "Waiting",
  running: "Downloading",
  cached: "Cached",
  finished: "Saved",
  failed: "Failed",
};

function itemDetail(item: DownloadAllItem) {
  if (item.state === "running" && item.total > 0) {
    return `${Math.round((item.processed / item.total) * 100)}%`;
  }
  if (item.state === "cached") return "recent run reused";
  if (item.state === "failed") return item.error ?? "unknown error";
  return "";
}

/** Top-of-dashboard "Download all": S&P 500, then Nasdaq, then Russell 2000,
 *  each saved to the database and reused while still inside the cache window. */
export function DownloadAll() {
  const [status, setStatus] = useState<DownloadAllStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function poll() {
    getDownloadAllStatus()
      .then((s) => {
        setStatus(s);
        if (s.status !== "running") stopPolling();
      })
      .catch((err) => setError(err.message));
  }

  function startPolling() {
    stopPolling();
    timerRef.current = setInterval(poll, POLL_MS);
  }

  useEffect(() => {
    getDownloadAllStatus()
      .then((s) => {
        setStatus(s);
        if (s.status === "running") startPolling();
      })
      .catch((err) => setError(err.message));
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStart() {
    setError(null);
    startDownloadAll()
      .then((s) => {
        setStatus(s);
        startPolling();
      })
      .catch((err) => setError(err.message));
  }

  const isRunning = status?.status === "running";

  return (
    <section className="rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? "Downloading…" : "Download all"}
        </button>
        <span className="text-xs text-white/50">
          Downloads S&amp;P 500, then Nasdaq, then Russell 2000 in one go and saves everything to the database.
          Universes downloaded within the last 12 hours are reused instead.
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-fall">Download all failed: {error}</p>}

      {status && status.status !== "idle" && (
        <div className="mt-4 space-y-3">
          {isRunning && (
            <ProgressBar
              label={`Downloading ${status.current ? UNIVERSE_LABELS[status.current] : "…"}`}
              value={status.percent}
            />
          )}
          <ul className="grid gap-2 sm:grid-cols-3">
            {status.items.map((item) => (
              <li key={item.universe} className="rounded-lg border border-white/10 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{UNIVERSE_LABELS[item.universe]}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATE_STYLES[item.state]}`}
                  >
                    {STATE_LABELS[item.state]}
                  </span>
                </div>
                <p className="mt-1 text-white/40">{itemDetail(item)}</p>
              </li>
            ))}
          </ul>
          {status.status === "finished" && (
            <p className="text-xs text-white/60">
              Finished{status.finished_at ? ` at ${new Date(status.finished_at).toLocaleString()}` : ""}. Everything is
              saved to the database - open the S&amp;P 500, Nasdaq or Russell 2000 tab to see the rankings.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
