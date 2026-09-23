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
import { getRanking, getRankingStatus, peekRanking, peekRankingStatus, startRanking, startTargets } from "@/lib/api";
import { fmtDateTime, useLang } from "@/lib/i18n";
import type { RankingEntry, RankingStatus, RankingUniverse, RsiFilter } from "@/types/market";

// Polling never stops: besides the manual run, the backend re-downloads
// H1/H4 every hour on its own, and the page should pick that up too.
// The scan is a one-shot batch job (not a poll loop like the dashboard), so
// checking every few seconds for progress is cheap and keeps the button's
// label current without hammering the backend.
const STATUS_POLL_MS = 5000;

// Coming back to a tab shows the ranking already in memory (see lib/api.ts)
// at once. It's only downloaded again (up to ~9 MB for Nasdaq) when it's older
// than this, or when the status says something saved new data since.
const RANKING_FRESH_MS = 2 * 60_000;

/** What, in the status, changes whenever the saved ranking does: a finished
 *  run, the hourly H1/H4 refresh, an analyst targets download. */
function rankingVersion(status: RankingStatus | null) {
  return status ? [status.updated_at, status.intraday_updated_at, status.targets?.finished_at ?? null].join("|") : "";
}

// Per universe: the rankingVersion the in-memory ranking was downloaded at.
const loadedVersions = new Map<RankingUniverse, string>();

const INDEX_UNIVERSES: RankingUniverse[] = ["sp500", "nasdaq", "nyse", "russell2000"];

/** Once a tab's own ranking is on screen, downloads the other index tabs'
 *  rankings in the background (one at a time, when the browser is idle), so
 *  even the first switch to them renders at once from memory. */
function prefetchOtherRankings(current: RankingUniverse) {
  const idle = (fn: () => void) =>
    "requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 500);
  const queue = INDEX_UNIVERSES.filter((u) => u !== current && !peekRanking(u));
  const next = () => {
    const universe = queue.shift();
    if (!universe) return;
    getRankingStatus(universe)
      .then((status) =>
        getRanking(universe).then(() => {
          if (!loadedVersions.has(universe)) loadedVersions.set(universe, rankingVersion(status));
        }),
      )
      .catch(() => undefined)
      .finally(() => idle(next));
  };
  idle(next);
}

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

  function loadRanking() {
    return getRanking(universe)
      .then((next) => {
        loadedVersions.set(universe, rankingVersion(prevStatusRef.current));
        setEntries(next);
        prefetchOtherRankings(universe);
      })
      .catch((err) => setError(err.message));
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // The ranking is re-read whenever the price run, the (optional) hourly H1/H4
  // refresh or the analyst forecast download just completed, since each one
  // saves new data to the database.
  function pollStatus() {
    getRankingStatus(universe)
      .then((s) => {
        const prev = prevStatusRef.current;
        prevStatusRef.current = s;
        setStatus(s);
        const mainDone = prev?.status === "running" && s.status !== "running";
        const bgDone = prev?.background_status === "running" && s.background_status !== "running";
        const targetsDone = prev?.targets?.status === "running" && s.targets?.status !== "running";
        // While a run is in progress the backend saves partial results every 5%; show them too.
        let progressed = false;
        if (s.status === "running" && s.total > 0) {
          const bucket = Math.floor((s.processed / s.total) * 20);
          if (bucket > progressBucketRef.current) progressed = true;
          progressBucketRef.current = bucket;
        } else {
          progressBucketRef.current = 0;
        }
        if (mainDone || bgDone || targetsDone || progressed) {
          loadRanking();
        }
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    const cachedStatus = peekRankingStatus(universe)?.value ?? null;
    const cached = peekRanking(universe);
    setStatus(cachedStatus);
    prevStatusRef.current = cachedStatus;
    setEntries(cached?.value ?? []);
    setRsiFilter(null);
    setPrediction(null);
    setQuery("");
    setError(null);
    stopPolling();

    // Nothing in memory yet: download both at once. Otherwise the cached
    // ranking is already on screen - check the status first and download the
    // ranking again only if it's stale.
    if (!cached) loadRanking();
    getRankingStatus(universe)
      .then((s) => {
        prevStatusRef.current = s;
        setStatus(s);
        if (!cached) return;
        const fresh = Date.now() - cached.at < RANKING_FRESH_MS && loadedVersions.get(universe) === rankingVersion(s);
        if (!fresh) loadRanking();
        else prefetchOtherRankings(universe);
      })
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

  function handleStartTargets() {
    setError(null);
    startTargets(universe)
      .then((targets) => {
        const next = status ? { ...status, targets } : null;
        prevStatusRef.current = next;
        setStatus(next);
      })
      .catch((err) => setError(err.message));
  }

  const isRunning = status?.status === "running";
  const targetsRunning = status?.targets?.status === "running";
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
        <button
          onClick={handleStartTargets}
          disabled={targetsRunning}
          title={t(
            "Pobiera roczne cele cenowe analityków (niski / mediana / wysoki) dla wszystkich spółek i zapisuje je w bazie danych. Cele pobrane w ciągu ostatnich 24 godzin są reużywane.",
            "Downloads one-year analyst price targets (low / median / high) for every stock and saves them to the database. Targets downloaded within the last 24 hours are reused.",
            "Lädt die Einjahres-Kursziele der Analysten (niedrig / Median / hoch) für alle Aktien und speichert sie in der Datenbank. Innerhalb der letzten 24 Stunden geladene Kursziele werden wiederverwendet.",
          )}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {targetsRunning
            ? t("Pobieranie prognoz…", "Downloading forecasts…", "Prognosen werden geladen…")
            : t("Pobierz prognozy", "Download forecasts", "Prognosen laden")}
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
        onScanned={loadRanking}
      />

      <RankingForecastScan
        key={`forecast-${universe}`}
        universe={universe}
        onScanned={loadRanking}
      />

      <RankingPricePrediction entries={entries} applied={prediction} onApply={setPrediction} />

      {error && <p className="mt-4 text-fall">
          {t("Nie udało się wczytać rankingu", "Failed to load the ranking", "Das Ranking konnte nicht geladen werden")}: {error}
        </p>}

      {/* px-4: lined up with the "Finished" badge (status card's border + p-4). */}
      <div className="mt-8 px-4">
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
