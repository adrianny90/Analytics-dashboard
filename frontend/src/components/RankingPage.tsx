"use client";

import { useEffect, useRef, useState } from "react";

import { RankingTable } from "@/components/RankingTable";
import { getRanking, getRankingStatus, startRanking } from "@/lib/api";
import type { RankingEntry, RankingStatus, RankingUniverse } from "@/types/market";

// The scan is a one-shot batch job (not a poll loop like the dashboard), so
// checking every few seconds for progress is cheap and keeps the button's
// label current without hammering the backend.
const STATUS_POLL_MS = 5000;

export function RankingPage({
  universe,
  title,
  description,
  startLabel,
}: {
  universe: RankingUniverse;
  title: string;
  description: string;
  startLabel: string;
}) {
  const [status, setStatus] = useState<RankingStatus | null>(null);
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function pollStatus() {
    getRankingStatus(universe)
      .then((s) => {
        setStatus(s);
        if (s.status !== "running") {
          stopPolling();
          if (s.status === "finished") {
            getRanking(universe)
              .then(setEntries)
              .catch((err) => setError(err.message));
          }
        }
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    setStatus(null);
    setEntries([]);
    setError(null);
    stopPolling();

    getRankingStatus(universe)
      .then((s) => {
        setStatus(s);
        if (s.status === "running") {
          pollRef.current = setInterval(pollStatus, STATUS_POLL_MS);
        }
      })
      .catch((err) => setError(err.message));
    getRanking(universe)
      .then(setEntries)
      .catch((err) => setError(err.message));

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe]);

  function handleStart() {
    setError(null);
    startRanking(universe)
      .then((s) => {
        setStatus(s);
        stopPolling();
        pollRef.current = setInterval(pollStatus, STATUS_POLL_MS);
      })
      .catch((err) => setError(err.message));
  }

  const isRunning = status?.status === "running";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-white/50">{description}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {startLabel}
        </button>

        {isRunning && (
          <span className="text-sm text-white/60">
            Running… {status.processed}/{status.total}
          </span>
        )}
        {status?.status === "finished" && (
          <span className="rounded bg-rise/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-rise">
            Finished
          </span>
        )}
        {status?.updated_at && (
          <span className="text-xs text-white/40">Last run: {new Date(status.updated_at).toLocaleString()}</span>
        )}
      </div>

      {error && <p className="mt-4 text-fall">Failed to load ranking: {error}</p>}

      <div className="mt-8">
        <RankingTable entries={entries} />
      </div>
    </main>
  );
}
