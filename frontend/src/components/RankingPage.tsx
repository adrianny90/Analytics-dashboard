"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { RankingTable } from "@/components/RankingTable";
import {
  DEFAULT_RULES,
  DEFAULT_WEIGHTS,
  RankingWeights,
  type ChangeRules,
  type TimeframeWeights,
} from "@/components/RankingWeights";
import { RankingForecastScan } from "@/components/RankingForecastScan";
import { RankingPricePrediction, type PredictionState } from "@/components/RankingPricePrediction";
import { RankingRsiFilter } from "@/components/RankingRsiFilter";
import { RankingSetup } from "@/components/RankingSetup";
import { DEFAULT_SETUP, type SetupConfig } from "@/lib/rankingSetup";
import { RankingRunStatus } from "@/components/RankingRunStatus";
import { SearchBox, matchesQuery } from "@/components/SearchBox";
import { getRanking, getRankingStatus, startRanking } from "@/lib/api";
import { fmtDateTime, useLang } from "@/lib/i18n";
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
  title: [string, string, string];
  description: [string, string, string];
  startLabel: [string, string, string];
}) {
  const { t } = useLang();
  const [status, setStatus] = useState<RankingStatus | null>(null);
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const prevStatusRef = useRef<RankingStatus | null>(null);
  const progressBucketRef = useRef(0);
  const [weights, setWeights] = useState<TimeframeWeights>(DEFAULT_WEIGHTS);
  const [rules, setRules] = useState<ChangeRules>(DEFAULT_RULES);
  const [rsiFilter, setRsiFilter] = useState<RsiFilter | null>(null);
  const [rsiMatchCount, setRsiMatchCount] = useState(0);
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [query, setQuery] = useState("");
  const [setup, setSetup] = useState<SetupConfig>(DEFAULT_SETUP);
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
        // While a run is in progress the backend saves partial results every 5%; show them too.
        let progressed = false;
        if (s.status === "running" && s.total > 0) {
          const bucket = Math.floor((s.processed / s.total) * 20);
          if (bucket > progressBucketRef.current) progressed = true;
          progressBucketRef.current = bucket;
        } else {
          progressBucketRef.current = 0;
        }
        if (mainDone || bgDone || progressed) {
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
    setPrediction(null);
    setQuery("");
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
  const matchCount = useMemo(
    () => entries.filter((entry) => matchesQuery(query, entry.symbol, entry.sector)).length,
    [entries, query],
  );

  return (
    <main className="px-3 py-8 sm:px-6 sm:py-12">
      {/* Panels stay readable-width; only the table below uses the full screen. */}
      <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">{t(...title)}</h1>
      <p className="mt-1 text-sm text-white/50">{t(...description)}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(...startLabel)}
        </button>

        {status?.updated_at && (
          <span className="text-xs text-white/40">
            {t("Ostatni przebieg", "Last run", "Letzter Lauf")}: {fmtDateTime(status.updated_at)}
          </span>
        )}
      </div>

      <RankingRunStatus status={status} />

      <RankingWeights weights={weights} onChange={setWeights} rules={rules} onRulesChange={setRules} />

      <RankingSetup entries={entries} setup={setup} onChange={setSetup} />

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

      <RankingPricePrediction entries={entries} applied={prediction} onApply={setPrediction} />

      {error && <p className="mt-4 text-fall">
          {t("Nie udało się wczytać rankingu", "Failed to load the ranking", "Das Ranking konnte nicht geladen werden")}: {error}
        </p>}

      <div className="mt-8">
        <SearchBox
          value={query}
          onChange={setQuery}
          resultLabel={t(`Znaleziono: ${matchCount} z ${entries.length}`, `Found: ${matchCount} of ${entries.length}`, `Gefunden: ${matchCount} von ${entries.length}`)}
        />
      </div>
      </div>

      <div className="mt-4">
        <RankingTable
          entries={entries}
          universe={universe}
          weights={weights}
          rules={rules}
          rsiFilter={rsiFilter}
          prediction={prediction}
          query={query}
          setup={setup}
          onMatchCount={setRsiMatchCount}
        />
      </div>
    </main>
  );
}
