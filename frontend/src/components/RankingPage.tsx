"use client";

import { useEffect, useRef, useState } from "react";

import { RankingTable } from "@/components/RankingTable";
import {
  DEFAULT_RULES,
  DEFAULT_WEIGHTS,
  RankingWeights,
  type ChangeRules,
  type TimeframeWeights,
} from "@/components/RankingWeights";
import { RankingForecastScan } from "@/components/RankingForecastScan";
import { RankingRsiFilter } from "@/components/RankingRsiFilter";
import { RankingRunStatus } from "@/components/RankingRunStatus";
import { getRanking, getRankingStatus, startRanking } from "@/lib/api";
import type { RankingEntry, RankingStatus, RankingUniverse, RsiFilter } from "@/types/market";

// Polling never stops: besides the manual run, the backend re-downloads
// H1/H4 every hour on its own, and the page should pick that up too.
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
  const prevStatusRef = useRef<RankingStatus | null>(null);
  const [weights, setWeights] = useState<TimeframeWeights>(DEFAULT_WEIGHTS);
  const [rules, setRules] = useState<ChangeRules>(DEFAULT_RULES);
  const [rsiFilter, setRsiFilter] = useState<RsiFilter | null>(null);
  const [rsiMatchCount, setRsiMatchCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // The ranking is re-read whenever the main run or the hourly H1/H4 refresh
  // just completed, since each one saves a new ranking to the database.
  function pollStatus() {
    getRankingStatus(universe)
      .then((s) => {
        const prev = prevStatusRef.current;
        prevStatusRef.current = s;
        setStatus(s);
        const mainDone = prev?.status === "running" && s.status !== "running";
        const bgDone = prev?.background_status === "running" && s.background_status !== "running";
        if (mainDone || bgDone) {
          getRanking(universe)
            .then(setEntries)
            .catch((err) => setError(err.message));
        }
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    setStatus(null);
    prevStatusRef.current = null;
    setEntries([]);
    setRsiFilter(null);
    setError(null);
    stopPolling();

    getRankingStatus(universe)
      .then((s) => {
        prevStatusRef.current = s;
        setStatus(s);
      })
      .catch((err) => setError(err.message));
    getRanking(universe)
      .then(setEntries)
      .catch((err) => setError(err.message));
    pollRef.current = setInterval(pollStatus, STATUS_POLL_MS);

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe]);

  function handleStart() {
    setError(null);
    startRanking(universe)
      .then((s) => {
        prevStatusRef.current = s;
        setStatus(s);
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

        {status?.updated_at && (
          <span className="text-xs text-white/40">Last run: {new Date(status.updated_at).toLocaleString()}</span>
        )}
      </div>

      <RankingRunStatus status={status} />

      <RankingWeights weights={weights} onChange={setWeights} rules={rules} onRulesChange={setRules} />

      <RankingRsiFilter
        key={universe}
        universe={universe}
        applied={rsiFilter}
        matchCount={rsiMatchCount}
        totalCount={entries.length}
        onApply={setRsiFilter}
        onScanned={() => getRanking(universe).then(setEntries)}
      />

      <RankingForecastScan
        key={`forecast-${universe}`}
        universe={universe}
        onScanned={() => getRanking(universe).then(setEntries)}
      />

      {error && <p className="mt-4 text-fall">Failed to load ranking: {error}</p>}

      <div className="mt-8">
        <RankingTable
          entries={entries}
          universe={universe}
          weights={weights}
          rules={rules}
          rsiFilter={rsiFilter}
          onMatchCount={setRsiMatchCount}
        />
      </div>
    </main>
  );
}
