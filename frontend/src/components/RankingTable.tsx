import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { activeRulePeriods, scoreEntry, type ChangeRules, type TimeframeWeights } from "@/components/RankingWeights";
import { TrendBadge } from "@/components/TrendBadge";
import { getRankingChanges } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { RSI_TIMEFRAME_LABELS, RSI_TIMEFRAME_OPTIONS } from "@/components/RankingRsiFilter";
import type {
  ChangePeriod,
  PeriodChange,
  RankingEntry,
  RankingUniverse,
  RsiFilter,
  RsiTimeframe,
} from "@/types/market";

const TREND_COLUMNS: {
  key: "week" | "day" | "h4" | "h1";
  label: string;
  title: string;
}[] = [
  { key: "day", label: "D1", title: "Daily Ichimoku trend" },
  { key: "h4", label: "H4", title: "4-hour Ichimoku trend" },
  { key: "week", label: "W1", title: "Weekly Ichimoku trend" },
  { key: "h1", label: "H1", title: "1-hour Ichimoku trend" },
];

const TARGET_COLUMNS: { key: "low" | "median" | "high"; label: string; title: string }[] = [
  { key: "low", label: "Target low", title: "Lowest analyst price target for the next 12 months" },
  { key: "median", label: "Target median", title: "Median analyst price target for the next 12 months" },
  { key: "high", label: "Target high", title: "Highest analyst price target for the next 12 months" },
];

const PERIOD_OPTIONS: { value: ChangePeriod; label: string }[] = [
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
];

// Header clicks cycle through three states, then back to the original ranking
// order. Change % goes ascending -> descending; the analyst target columns
// (sorted by % distance from the current price) go biggest upside first ->
// smallest -> ranking; the RSI column also goes highest first -> lowest -> ranking.
// Only one column is sorted at a time.
type SortKey = "change" | "low" | "median" | "high" | "rsi" | "hypo" | "vol" | "p15";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir } | null;

function nextSort(current: SortState, key: SortKey, firstDir: SortDir): SortState {
  if (current?.key !== key) return { key, dir: firstDir };
  if (current.dir === firstDir) return { key, dir: firstDir === "asc" ? "desc" : "asc" };
  return null;
}

/** % distance from the current price to the model's 3-month hypothetical target. */
function hypoUpside(entry: RankingEntry): number | null {
  const target = entry.forecast?.median;
  const price = entry.quote?.price;
  if (target == null || !price) return null;
  return (target / price - 1) * 100;
}

/** % distance from the current price to an analyst target (+ = upside). */
function targetUpside(entry: RankingEntry, key: "low" | "median" | "high"): number | null {
  const target = entry.targets?.[key];
  const price = entry.quote?.price;
  if (target == null || !price) return null;
  return (target / price - 1) * 100;
}

export function RankingTable({
  entries,
  universe,
  weights,
  rules,
  rsiFilter,
  onMatchCount,
}: {
  entries: RankingEntry[];
  universe: RankingUniverse;
  weights: TimeframeWeights;
  rules: ChangeRules;
  rsiFilter: RsiFilter | null;
  onMatchCount: (count: number) => void;
}) {
  const [period, setPeriod] = useState<ChangePeriod>("1d");
  const [sort, setSort] = useState<SortState>(null);
  // Timeframe shown in the RSI column; follows the RSI filter when one is applied.
  const [rsiTimeframe, setRsiTimeframe] = useState<RsiTimeframe>("day");
  useEffect(() => {
    if (rsiFilter) setRsiTimeframe(rsiFilter.timeframe);
  }, [rsiFilter]);

  // Periods the scan didn't store (older saved runs) are fetched on demand
  // for just that period - the backend applies the same batching and Yahoo
  // throttling as the scan, so this can take a while.
  const [fetched, setFetched] = useState<Partial<Record<ChangePeriod, Record<string, PeriodChange>>>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // A second horizontal scrollbar pinned above the table header (the real one
  // is at the very bottom of a ~500-row table), kept in sync with the table.
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const hasEntries = entries.length > 0;

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const measure = () => setScrollWidth(el.scrollWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [hasEntries]);

  function syncScroll(from: HTMLDivElement | null, to: HTMLDivElement | null) {
    if (from && to && to.scrollLeft !== from.scrollLeft) to.scrollLeft = from.scrollLeft;
  }

  // The selected period plus any period a bonus rule depends on.
  const neededPeriods = useMemo(
    () => Array.from(new Set<ChangePeriod>([period, ...activeRulePeriods(rules)])),
    [period, rules],
  );
  const missingPeriod = neededPeriods.find(
    (p) => entries.length > 0 && !fetched[p] && entries.some((e) => !e.changes?.[p]),
  );

  useEffect(() => {
    setFetched({});
  }, [universe, entries]);

  // Fetches one missing period at a time (each is a full throttled pass over
  // Yahoo); the effect re-runs for the next missing one when this lands.
  useEffect(() => {
    if (!missingPeriod) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    getRankingChanges(universe, missingPeriod)
      .then((c) => !cancelled && setFetched((prev) => ({ ...prev, [missingPeriod]: c })))
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err.message);
        // Mark as fetched-empty so a failure doesn't retry in a loop.
        setFetched((prev) => ({ ...prev, [missingPeriod]: {} }));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [missingPeriod, universe]);

  function changeForPeriod(entry: RankingEntry, p: ChangePeriod) {
    const quote = entry.quote;
    return (
      entry.changes?.[p] ??
      fetched[p]?.[entry.symbol] ??
      (p === "1d" && quote?.change != null && quote.change_percent != null
        ? { change: quote.change, change_percent: quote.change_percent }
        : null)
    );
  }
  const changeFor = (entry: RankingEntry) => changeForPeriod(entry, period);

  // Re-score and re-rank locally with the user's weights (same formula and
  // alphabetical tiebreak as the backend), so weight edits apply instantly.
  const ranked = useMemo(
    () =>
      entries
        .map((entry) => ({ ...entry, score: scoreEntry(entry, weights, rules, changeForPeriod) }))
        .sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol))
        .map((entry, i) => ({ ...entry, rank: i + 1 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, weights, rules, fetched],
  );

  // The RSI filter keeps only stocks whose RSI on the chosen timeframe is in
  // range; they keep the rank they have in the full list.
  const filtered = useMemo(() => {
    if (!rsiFilter) return ranked;
    return ranked.filter((entry) => {
      const value = entry.rsi?.[rsiFilter.timeframe];
      return value != null && value >= rsiFilter.min && value <= rsiFilter.max;
    });
  }, [ranked, rsiFilter]);

  useEffect(() => {
    onMatchCount(filtered.length);
  }, [filtered.length, onMatchCount]);

  const rows = useMemo(() => {
    if (!sort) return filtered;
    const sign = sort.dir === "asc" ? 1 : -1;
    const valueOf = (entry: RankingEntry) =>
      sort.key === "change"
        ? changeFor(entry)?.change_percent
        : sort.key === "rsi"
          ? entry.rsi?.[rsiTimeframe]
          : sort.key === "hypo"
            ? hypoUpside(entry)
            : sort.key === "vol"
              ? entry.vol_forecast?.sigma
              : sort.key === "p15"
                ? entry.vol_forecast?.p15
                : targetUpside(entry, sort.key);
    return [...filtered].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // entries without data always sink to the bottom
      if (bv == null) return -1;
      return (av - bv) * sign;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, period, sort, fetched, rsiTimeframe]);

  const arrow = (key: SortKey) => (sort?.key !== key ? "" : sort.dir === "asc" ? "▲" : "▼");

  if (entries.length === 0) {
    return <p className="text-sm text-white/40">No results yet - start a scan to build the ranking.</p>;
  }

  if (rsiFilter && filtered.length === 0) {
    return (
      <p className="text-sm text-white/40">
        No stocks have {RSI_TIMEFRAME_LABELS[rsiFilter.timeframe]} RSI between {rsiFilter.min} and {rsiFilter.max}.
      </p>
    );
  }

  return (
    <div>
      {fetchError && <p className="mb-2 text-sm text-fall">Failed to load changes: {fetchError}</p>}
      <div
        ref={topScrollRef}
        onScroll={() => syncScroll(topScrollRef.current, tableScrollRef.current)}
        className="sticky top-0 z-10 overflow-x-auto rounded-t-xl border border-b-0 border-white/10 bg-slate-950"
        aria-hidden="true"
      >
        <div style={{ width: scrollWidth, height: 1 }} />
      </div>
      <div
        ref={tableScrollRef}
        onScroll={() => syncScroll(tableScrollRef.current, topScrollRef.current)}
        className="overflow-x-auto rounded-b-xl border border-white/10"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Sector</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as ChangePeriod)}
                  className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm font-medium text-white/70"
                  aria-label="Change period"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Change {opt.label}
                    </option>
                  ))}
                </select>
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                onClick={() => setSort(nextSort(sort, "change", "asc"))}
                title="Click to sort: ascending, descending, then back to ranking"
              >
                Change % {arrow("change")}
              </th>
              {TARGET_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                  onClick={() => setSort(nextSort(sort, col.key, "desc"))}
                  title={`${col.title}. Click to sort by % distance from the current price: biggest upside, smallest, then back to ranking`}
                >
                  {col.label} {arrow(col.key)}
                </th>
              ))}
              <th
                className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                onClick={() => setSort(nextSort(sort, "hypo", "desc"))}
                title="Method A - machine-learning target: an ML estimate of the price 3 months ahead, with a calibrated 80% range (hover a value; the tooltip also shows how the range performed in the backtest). An experiment, not advice - dimmed values come from a model that did not beat simple baselines. Click to sort by % distance from the current price."
              >
                ML target 3M (A) {arrow("hypo")}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                onClick={() => setSort(nextSort(sort, "vol", "desc"))}
                title="Method C - volatility band: the 3-month price range from the stock's own volatility, no machine learning. About 80% of real 3-month prices fell inside it in the backtest. Click to sort by volatility (widest band first, narrowest, then back to ranking)."
              >
                Volatility band 3M (C) {arrow("vol")}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                onClick={() => setSort(nextSort(sort, "p15", "desc"))}
                title="Chance that the price stays within +-15% of today's price after 3 months, calculated from the stock's volatility. Click to sort: most likely to stay in range first, least likely, then back to ranking."
              >
                P(±15%) 3M {arrow("p15")}
              </th>
              <th className="px-4 py-3 font-medium">
                <div className="flex items-center gap-2">
                  <select
                    value={rsiTimeframe}
                    onChange={(e) => setRsiTimeframe(e.target.value as RsiTimeframe)}
                    className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm font-medium text-white/70"
                    aria-label="RSI timeframe"
                    title="Timeframe of the RSI(14) shown in this column (M1 is filled in by an RSI filter scan)"
                  >
                    {RSI_TIMEFRAME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        RSI {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setSort(nextSort(sort, "rsi", "desc"))}
                    className="cursor-pointer select-none hover:text-white"
                    title="Click to sort: highest RSI first, lowest first, then back to ranking"
                  >
                    {arrow("rsi") || "⇅"}
                  </button>
                </div>
              </th>
              {TREND_COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium" title={col.title}>
                  {col.label}
                </th>
              ))}
              <th
                className="px-4 py-3 font-medium"
                title={`Weighted score: D1*${weights.day} + H4*${weights.h4} + W1*${weights.week} + H1*${weights.h1}`}
              >
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => {
              const quote = entry.quote;
              const periodChange = changeFor(entry);
              const isUp = (periodChange?.change ?? 0) >= 0;
              return (
                <tr key={entry.symbol} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/40">{entry.rank}</td>
                  <td className="px-4 py-3">
                    <Link href={`/ichimoku?symbol=${entry.symbol}`} className="font-medium text-white hover:underline">
                      {entry.symbol}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/50">{entry.sector}</td>
                  <td className="px-4 py-3">
                    {quote ? formatNumber(quote.price) : <span className="text-white/30">n/a</span>}
                  </td>
                  {periodChange ? (
                    <>
                      <td className={`px-4 py-3 ${isUp ? "text-rise" : "text-fall"}`}>
                        {isUp ? "+" : ""}
                        {formatNumber(periodChange.change)}
                      </td>
                      <td className={`px-4 py-3 ${isUp ? "text-rise" : "text-fall"}`}>
                        {isUp ? "+" : ""}
                        {formatNumber(periodChange.change_percent)}%
                      </td>
                    </>
                  ) : (
                    <td className="px-4 py-3 text-white/30" colSpan={2}>
                      {loading ? "Loading…" : "n/a"}
                    </td>
                  )}
                  {TARGET_COLUMNS.map((col) => {
                    const value = entry.targets?.[col.key];
                    const upside = targetUpside(entry, col.key);
                    return (
                      <td key={col.key} className="px-4 py-3">
                        {value != null ? (
                          <>
                            {formatNumber(value)}
                            {upside != null && (
                              <span className={`ml-1 text-xs ${upside >= 0 ? "text-rise" : "text-fall"}`}>
                                ({upside >= 0 ? "+" : ""}
                                {formatNumber(upside)}%)
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-white/30">n/a</span>
                        )}
                      </td>
                    );
                  })}
                  <td
                    className={`px-4 py-3 ${entry.forecast?.verdict === "edge" ? "" : "text-white/60"}`}
                    title={
                      entry.forecast
                        ? `80% range ${formatNumber(entry.forecast.low)} - ${formatNumber(entry.forecast.high)}${
                            entry.forecast.backtest_coverage != null
                              ? ` (backtest: real prices landed inside ${Math.round(entry.forecast.backtest_coverage * 100)}% of the time, average width ${Math.round((entry.forecast.backtest_width ?? 0) * 100)}% of price)`
                              : ""
                          }. Model ${entry.forecast.model_version}, as of ${entry.forecast.as_of}. ${
                            entry.forecast.verdict === "edge"
                              ? "The model beat simple baselines in out-of-sample testing."
                              : "The model did NOT reliably beat simple baselines in testing - illustrative only."
                          }`
                        : undefined
                    }
                  >
                    {entry.forecast ? (
                      <>
                        {formatNumber(entry.forecast.median)}
                        {hypoUpside(entry) != null && (
                          <span className={`ml-1 text-xs ${hypoUpside(entry)! >= 0 ? "text-rise" : "text-fall"}`}>
                            ({hypoUpside(entry)! >= 0 ? "+" : ""}
                            {formatNumber(hypoUpside(entry)!)}%)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-white/30">n/a</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3"
                    title={
                      entry.vol_forecast
                        ? `80% band ${formatNumber(entry.vol_forecast.low)} - ${formatNumber(entry.vol_forecast.high)}, median ${formatNumber(entry.vol_forecast.median)}. 3-month volatility ${formatNumber(entry.vol_forecast.sigma * 100)}%. Based on prices up to ${entry.vol_forecast.as_of}. Backtest: about 80% of real 3-month prices fell inside such a band.`
                        : undefined
                    }
                  >
                    {entry.vol_forecast ? (
                      <>
                        {formatNumber(entry.vol_forecast.low)}
                        <span className="text-white/40"> - </span>
                        {formatNumber(entry.vol_forecast.high)}
                      </>
                    ) : (
                      <span className="text-white/30">n/a</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3"
                    title={
                      entry.vol_forecast
                        ? `Chance the price stays within ${formatNumber(entry.vol_forecast.price * 0.85)} - ${formatNumber(entry.vol_forecast.price * 1.15)} (+-15% of ${formatNumber(entry.vol_forecast.price)}) after 3 months, calculated from volatility.`
                        : undefined
                    }
                  >
                    {entry.vol_forecast ? (
                      <span
                        className={
                          entry.vol_forecast.p15 >= 0.75 ? "text-rise" : entry.vol_forecast.p15 < 0.5 ? "text-fall" : ""
                        }
                      >
                        {Math.round(entry.vol_forecast.p15 * 100)}%
                      </span>
                    ) : (
                      <span className="text-white/30">n/a</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {entry.rsi?.[rsiTimeframe] != null ? (
                      entry.rsi[rsiTimeframe]!.toFixed(1)
                    ) : (
                      <span className="text-white/30">n/a</span>
                    )}
                  </td>
                  {TREND_COLUMNS.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <TrendBadge outlook={entry[col.key]} />
                    </td>
                  ))}
                  <td className="px-4 py-3 font-medium text-white">{entry.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
