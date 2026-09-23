import { memo, useEffect, useMemo, useRef, useState } from "react";

import { activeRulePeriods, scoreEntry, type ChangeRules, type TimeframeWeights } from "@/components/RankingWeights";
import { IchimokuLink } from "@/components/IchimokuLink";
import { matchesQuery } from "@/components/SearchBox";
import { SetupLegend } from "@/components/SetupLegend";
import { ZoomToolbar } from "@/components/ZoomToolbar";
import {
  SETUP_TIER_STYLES,
  describeSetup,
  evaluateSetup,
  type SetupConfig,
  type SetupResult,
  type SetupTier,
} from "@/lib/rankingSetup";
import { TrendBadge } from "@/components/TrendBadge";
import { useTableZoom } from "@/hooks/useTableZoom";
import { getRankingChanges, needsChangesFetch } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { nextSetupSort, nextSort, sortByValue, type SortState as TableSortState } from "@/lib/tableSort";
import { RSI_TIMEFRAME_LABELS, RSI_TIMEFRAME_OPTIONS } from "@/components/RankingRsiFilter";
import type { PredictionState } from "@/components/RankingPricePrediction";
import type {
  ChangePeriod,
  PeriodChange,
  RankingEntry,
  RankingUniverse,
  RsiFilter,
  RsiTimeframe,
} from "@/types/market";

type Tri = [string, string, string];

const TREND_COLUMNS: {
  key: "week" | "day" | "h4" | "h1";
  label: string;
  title: Tri;
}[] = [
  { key: "day", label: "D1", title: ["Dzienny trend Ichimoku", "Daily Ichimoku trend", "Täglicher Ichimoku-Trend"] },
  { key: "h4", label: "H4", title: ["4-godzinny trend Ichimoku", "4-hour Ichimoku trend", "4-Stunden-Ichimoku-Trend"] },
  { key: "week", label: "W1", title: ["Tygodniowy trend Ichimoku", "Weekly Ichimoku trend", "Wöchentlicher Ichimoku-Trend"] },
  { key: "h1", label: "H1", title: ["1-godzinny trend Ichimoku", "1-hour Ichimoku trend", "1-Stunden-Ichimoku-Trend"] },
];

const TARGET_COLUMNS: { key: "low" | "median" | "high"; label: Tri; title: Tri }[] = [
  {
    key: "low",
    label: ["Cel niski", "Target low", "Kursziel niedrig"],
    title: [
      "Najniższy cel cenowy analityków na kolejne 12 miesięcy",
      "Lowest analyst price target for the next 12 months",
      "Niedrigstes Analysten-Kursziel für die nächsten 12 Monate",
    ],
  },
  {
    key: "median",
    label: ["Cel mediana", "Target median", "Kursziel Median"],
    title: [
      "Medianowy cel cenowy analityków na kolejne 12 miesięcy",
      "Median analyst price target for the next 12 months",
      "Median der Analysten-Kursziele für die nächsten 12 Monate",
    ],
  },
  {
    key: "high",
    label: ["Cel wysoki", "Target high", "Kursziel hoch"],
    title: [
      "Najwyższy cel cenowy analityków na kolejne 12 miesięcy",
      "Highest analyst price target for the next 12 months",
      "Höchstes Analysten-Kursziel für die nächsten 12 Monate",
    ],
  },
];

const PERIOD_OPTIONS: { value: ChangePeriod; label: Tri }[] = [
  { value: "1d", label: ["1 dzień", "1 day", "1 Tag"] },
  { value: "1w", label: ["1 tydzień", "1 week", "1 Woche"] },
  { value: "1m", label: ["1 miesiąc", "1 month", "1 Monat"] },
  { value: "6m", label: ["6 miesięcy", "6 months", "6 Monate"] },
  { value: "1y", label: ["1 rok", "1 year", "1 Jahr"] },
];

// Rows are rendered progressively: a Nasdaq ranking has ~3400 rows x ~20 cells,
// and mounting all of them at once is what makes the page crawl. The first
// batch only needs to fill the screen (even zoomed out); more follow on scroll.
const PAGE_SIZE = 60;

// Header clicks cycle through three states (see nextSort). Change % goes
// ascending -> descending; the analyst target columns (sorted by % distance
// from the current price) go biggest upside first -> smallest -> ranking; the
// RSI column also goes highest first -> lowest -> ranking.
type SortKey = "change" | "low" | "median" | "high" | "rsi" | "hypo" | "vol" | "p15" | "prediction";
type SortState = TableSortState<SortKey>;

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

type RankedEntry = RankingEntry & { setupResult: SetupResult };

// Memoized so that zooming, polling and unrelated state changes in the parent
// don't re-render every row - only rows whose own props changed.
const RankingRow = memo(function RankingRow({
  entry,
  change,
  changePercent,
  loading,
  rsiTimeframe,
  showPrediction,
  prediction,
  setup,
}: {
  entry: RankedEntry;
  change: number | null;
  changePercent: number | null;
  loading: boolean;
  rsiTimeframe: RsiTimeframe;
  showPrediction: boolean;
  prediction: number | null;
  setup: SetupConfig;
}) {
  const { t } = useLang();
  const quote = entry.quote;
  const isUp = (change ?? 0) >= 0;
  const hypo = hypoUpside(entry);
  const rsi = entry.rsi?.[rsiTimeframe];
  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/5">
      <td className="px-4 py-3 text-white/40">{entry.rank}</td>
      <td className="px-4 py-3">
        <IchimokuLink symbol={entry.symbol} className="font-medium text-white hover:underline" />
      </td>
      <td className="px-4 py-3 text-white/50">{entry.sector}</td>
      <td className="px-4 py-3">
        {quote ? formatNumber(quote.price) : <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>}
      </td>
      {change != null && changePercent != null ? (
        <>
          <td className={`px-4 py-3 ${isUp ? "text-rise" : "text-fall"}`}>
            {isUp ? "+" : ""}
            {formatNumber(change)}
          </td>
          <td className={`px-4 py-3 ${isUp ? "text-rise" : "text-fall"}`}>
            {isUp ? "+" : ""}
            {formatNumber(changePercent)}%
          </td>
        </>
      ) : (
        <td className="px-4 py-3 text-white/30" colSpan={2}>
          {loading ? t("Wczytywanie…", "Loading…", "Wird geladen…") : t("brak", "n/a", "k. A.")}
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
              <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>
            )}
          </td>
        );
      })}
      <td
        className={`px-4 py-3 ${entry.forecast?.verdict === "edge" ? "" : "text-white/60"}`}
        title={
          entry.forecast
            ? (() => {
                const f = entry.forecast;
                const cov = f.backtest_coverage != null ? Math.round(f.backtest_coverage * 100) : null;
                const width = Math.round((f.backtest_width ?? 0) * 100);
                const edge = f.verdict === "edge";
                return t(
                  `Przedział 80% ${formatNumber(f.low)} - ${formatNumber(f.high)}${
                    cov != null ? ` (backtest: realne ceny mieściły się w środku przez ${cov}% czasu, średnia szerokość ${width}% ceny)` : ""
                  }. Model ${f.model_version}, na dzień ${f.as_of}. ${
                    edge
                      ? "Model pobił proste baseline'y w teście out-of-sample."
                      : "Model NIE pobił niezawodnie prostych baseline'ów w teście - wyłącznie poglądowo."
                  }`,
                  `80% range ${formatNumber(f.low)} - ${formatNumber(f.high)}${
                    cov != null ? ` (backtest: actual prices stayed inside for ${cov}% of the time, average width ${width}% of price)` : ""
                  }. Model ${f.model_version}, as of ${f.as_of}. ${
                    edge
                      ? "The model beat simple baselines in the out-of-sample test."
                      : "The model did NOT reliably beat simple baselines in the test - for illustration only."
                  }`,
                  `80-%-Intervall ${formatNumber(f.low)} - ${formatNumber(f.high)}${
                    cov != null ? ` (Backtest: Die tatsächlichen Kurse lagen zu ${cov} % der Zeit innerhalb, durchschnittliche Breite ${width} % des Kurses)` : ""
                  }. Modell ${f.model_version}, Stand ${f.as_of}. ${
                    edge
                      ? "Das Modell hat einfache Baselines im Out-of-Sample-Test geschlagen."
                      : "Das Modell hat einfache Baselines im Test NICHT zuverlässig geschlagen - nur zur Veranschaulichung."
                  }`,
                );
              })()
            : undefined
        }
      >
        {entry.forecast ? (
          <>
            {formatNumber(entry.forecast.median)}
            {hypo != null && (
              <span className={`ml-1 text-xs ${hypo >= 0 ? "text-rise" : "text-fall"}`}>
                ({hypo >= 0 ? "+" : ""}
                {formatNumber(hypo)}%)
              </span>
            )}
          </>
        ) : (
          <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>
        )}
      </td>
      <td
        className="px-4 py-3"
        title={
          entry.vol_forecast
            ? t(
                `Pasmo 80% ${formatNumber(entry.vol_forecast.low)} - ${formatNumber(entry.vol_forecast.high)}, mediana ${formatNumber(entry.vol_forecast.median)}. 3-miesięczna zmienność ${formatNumber(entry.vol_forecast.sigma * 100)}%. Na podstawie cen do ${entry.vol_forecast.as_of}. Backtest: około 80% realnych 3-miesięcznych cen mieściło się w takim paśmie.`,
                `80% band ${formatNumber(entry.vol_forecast.low)} - ${formatNumber(entry.vol_forecast.high)}, median ${formatNumber(entry.vol_forecast.median)}. 3-month volatility ${formatNumber(entry.vol_forecast.sigma * 100)}%. Based on prices up to ${entry.vol_forecast.as_of}. Backtest: about 80% of actual 3-month prices fell within such a band.`,
                `80-%-Band ${formatNumber(entry.vol_forecast.low)} - ${formatNumber(entry.vol_forecast.high)}, Median ${formatNumber(entry.vol_forecast.median)}. 3-Monats-Volatilität ${formatNumber(entry.vol_forecast.sigma * 100)} %. Auf Basis der Kurse bis ${entry.vol_forecast.as_of}. Backtest: Rund 80 % der tatsächlichen 3-Monats-Kurse lagen innerhalb eines solchen Bandes.`,
              )
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
          <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>
        )}
      </td>
      <td
        className="px-4 py-3"
        title={
          entry.vol_forecast
            ? t(
                `Szansa, że cena zostanie w granicach ${formatNumber(entry.vol_forecast.price * 0.85)} - ${formatNumber(entry.vol_forecast.price * 1.15)} (+-15% od ${formatNumber(entry.vol_forecast.price)}) po 3 miesiącach, policzona ze zmienności.`,
                `The chance that the price stays within ${formatNumber(entry.vol_forecast.price * 0.85)} - ${formatNumber(entry.vol_forecast.price * 1.15)} (±15% around ${formatNumber(entry.vol_forecast.price)}) after 3 months, calculated from volatility.`,
                `Wahrscheinlichkeit, dass der Kurs nach 3 Monaten innerhalb von ${formatNumber(entry.vol_forecast.price * 0.85)} - ${formatNumber(entry.vol_forecast.price * 1.15)} bleibt (±15 % um ${formatNumber(entry.vol_forecast.price)}), berechnet aus der Volatilität.`,
              )
            : undefined
        }
      >
        {entry.vol_forecast ? (
          <span
            className={entry.vol_forecast.p15 >= 0.75 ? "text-rise" : entry.vol_forecast.p15 < 0.5 ? "text-fall" : ""}
          >
            {Math.round(entry.vol_forecast.p15 * 100)}%
          </span>
        ) : (
          <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>
        )}
      </td>
      {showPrediction && (
        <td className="px-4 py-3">
          {prediction != null ? (
            <span className={prediction >= 75 ? "text-rise" : prediction < 50 ? "text-fall" : ""}>
              {Math.round(prediction)}%
            </span>
          ) : (
            <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>
          )}
        </td>
      )}
      <td className="px-4 py-3 text-white/80">
        {rsi != null ? rsi.toFixed(1) : <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>}
      </td>
      {TREND_COLUMNS.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <TrendBadge outlook={entry[col.key]} />
        </td>
      ))}
      <td className="px-4 py-3" title={describeSetup(entry.setupResult, setup, t)}>
        {entry.setupResult.tier ? (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${SETUP_TIER_STYLES[entry.setupResult.tier].badge}`}
          >
            ✓ Setup
          </span>
        ) : (
          <span className="text-white/20">-</span>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-white">{entry.score}</td>
    </tr>
  );
});

// Re-rendered only when its own props change - the parent page polls the run
// status every few seconds, which used to re-render the whole table each time.
export const RankingTable = memo(function RankingTable({
  entries,
  universe,
  weights,
  rules,
  rsiFilter,
  prediction,
  query,
  setup,
  onMatchCount,
}: {
  entries: RankingEntry[];
  universe: RankingUniverse;
  weights: TimeframeWeights;
  rules: ChangeRules;
  rsiFilter: RsiFilter | null;
  prediction: PredictionState | null;
  query: string;
  setup: SetupConfig;
  onMatchCount: (count: number) => void;
}) {
  const { t, lang } = useLang();
  const [period, setPeriod] = useState<ChangePeriod>("1d");
  const [sort, setSortState] = useState<SortState>(null);
  const [setupSort, setSetupSortState] = useState<SetupTier | null>(null);
  // Only one column sorts at a time - picking a value sort drops the
  // Setup color sort and vice versa.
  const setSort = (next: SortState) => {
    setSortState(next);
    setSetupSortState(null);
  };
  const setSetupSort = (next: SetupTier | null) => {
    setSetupSortState(next);
    setSortState(null);
  };
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

  // The selected period plus any period a bonus rule depends on.
  const neededPeriods = useMemo(
    () => Array.from(new Set<ChangePeriod>([period, ...activeRulePeriods(rules)])),
    [period, rules],
  );
  const missingPeriod = neededPeriods.find(
    (p) => !fetched[p] && needsChangesFetch(entries, p),
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
  const ranked = useMemo<RankedEntry[]>(
    () =>
      entries
        .map((entry) => ({
          ...entry,
          score: scoreEntry(entry, weights, rules, changeForPeriod, setup),
          setupResult: evaluateSetup(entry, setup),
        }))
        .sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol))
        .map((entry, i) => ({ ...entry, rank: i + 1 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, weights, rules, fetched, setup],
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

  // The prediction filter (search for a target % move) keeps only stocks whose
  // computed touch probability meets the minimum - applied on top of the RSI
  // filter, independently of it (its own match-count is shown by the panel above).
  const predictionFiltered = useMemo(() => {
    if (!prediction) return filtered;
    return filtered.filter((entry) => (prediction.results.get(entry.symbol) ?? -1) >= prediction.minPercent);
  }, [filtered, prediction]);

  const searchFiltered = useMemo(
    () => predictionFiltered.filter((entry) => matchesQuery(query, entry.symbol, entry.sector)),
    [predictionFiltered, query],
  );

  const rows = useMemo(() => {
    if (setupSort) {
      // Rows with the chosen color first, everything else after; Array.sort
      // is stable, so both groups keep their ranking order.
      const has = (entry: RankingEntry) => (entry as RankedEntry).setupResult.tier === setupSort;
      return [...searchFiltered].sort((a, b) => Number(has(b)) - Number(has(a)));
    }
    if (!sort) return searchFiltered;
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
                : sort.key === "prediction"
                  ? (prediction?.results.get(entry.symbol) ?? undefined)
                  : targetUpside(entry, sort.key);
    return sortByValue(searchFiltered, valueOf, sort.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFiltered, period, sort, setupSort, fetched, rsiTimeframe, prediction]);

  const arrow = (key: SortKey) => (sort?.key !== key ? "" : sort.dir === "asc" ? "▲" : "▼");

  // ---- Progressive rendering: mount more rows as the user nears the bottom.
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [universe, sort, setupSort, query, rsiFilter, prediction]);
  const visibleRows = rows.length > limit ? rows.slice(0, limit) : rows;
  const hasMore = rows.length > limit;

  // ---- Zoom / overview
  const hasEntries = entries.length > 0;
  const showTable =
    hasEntries &&
    !(rsiFilter && filtered.length === 0) &&
    !(prediction && predictionFiltered.length === 0) &&
    !(query.trim() && searchFiltered.length === 0);

  // Zoom/pan (shared with the watchlist ranking table - see useTableZoom) plus
  // the second horizontal scrollbar pinned above the table header, kept in
  // sync with the table. Opens fitted to the screen width, as after "Fit".
  const { topScrollRef, scrollRef: tableScrollRef, contentRef: tableRef, size, zoom, applyZoom, fitToWidth, syncScroll } =
    useTableZoom<HTMLTableElement>(showTable, true);

  // Load the next page of rows when the sentinel below the table comes near the
  // viewport. Re-created after each page so it fires again if it's still visible
  // (e.g. when zoomed far out).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (obs) => {
        if (obs.some((o) => o.isIntersecting)) setLimit((l) => l + PAGE_SIZE * 2);
      },
      { rootMargin: "1500px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, limit, showTable]);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-white/40">
        {t(
          "Brak wyników - uruchom skan, żeby zbudować ranking.",
          "No results - run a scan to build the ranking.",
          "Keine Ergebnisse – starten Sie einen Scan, um das Ranking zu erstellen.",
        )}
      </p>
    );
  }

  if (rsiFilter && filtered.length === 0) {
    return (
      <p className="text-sm text-white/40">
        {t(
          `Żadna spółka nie ma RSI ${RSI_TIMEFRAME_LABELS[rsiFilter.timeframe]} między ${rsiFilter.min} a ${rsiFilter.max}.`,
          `No stock has an RSI ${RSI_TIMEFRAME_LABELS[rsiFilter.timeframe]} between ${rsiFilter.min} and ${rsiFilter.max}.`,
          `Keine Aktie hat einen RSI ${RSI_TIMEFRAME_LABELS[rsiFilter.timeframe]} zwischen ${rsiFilter.min} und ${rsiFilter.max}.`,
        )}
      </p>
    );
  }

  if (prediction && predictionFiltered.length === 0) {
    return (
      <p className="text-sm text-white/40">
        {t(
          `Żadna spółka nie osiąga ruchu ${prediction.targetPct >= 0 ? "+" : ""}${prediction.targetPct}% w ciągu 12 miesięcy z co najmniej ${prediction.minPercent}% szacowanego prawdopodobieństwa.`,
          `No stock reaches a move of ${prediction.targetPct >= 0 ? "+" : ""}${prediction.targetPct}% within 12 months with at least ${prediction.minPercent}% estimated probability.`,
          `Keine Aktie erreicht innerhalb von 12 Monaten eine Bewegung von ${prediction.targetPct >= 0 ? "+" : ""}${prediction.targetPct} % mit einer geschätzten Wahrscheinlichkeit von mindestens ${prediction.minPercent} %.`,
        )}
      </p>
    );
  }

  if (query.trim() && searchFiltered.length === 0) {
    return (
      <p className="text-sm text-white/40">
        {t(`Brak wyników dla „${query.trim()}”.`, `No results for “${query.trim()}”.`, `Keine Ergebnisse für „${query.trim()}“.`)}
      </p>
    );
  }

  return (
    <div className="group relative">
      {fetchError && <p className="mb-2 text-sm text-fall">
          {t("Nie udało się wczytać zmian", "Failed to load changes", "Änderungen konnten nicht geladen werden")}: {fetchError}
        </p>}

      {/* Sticky header: the zoom toolbar (shows on hover, always visible on touch
          screens) sits above the top scrollbar and both stay pinned together. */}
      <div className="sticky top-0 z-20 bg-slate-950">
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 px-1 py-1">
        <SetupLegend setup={setup} active={setupSort} onSelect={setSetupSort} />
        <ZoomToolbar zoom={zoom} onZoomChange={applyZoom} onFit={fitToWidth} />
        </div>
        <div
          ref={topScrollRef}
          onScroll={() => syncScroll(topScrollRef.current, tableScrollRef.current)}
          className="overflow-x-auto overflow-y-hidden rounded-t-xl border border-b-0 border-white/10"
          aria-hidden="true"
        >
          <div style={{ width: size.w * zoom, height: 1 }} />
        </div>
      </div>
      <div
        ref={tableScrollRef}
        onScroll={() => syncScroll(tableScrollRef.current, topScrollRef.current)}
        className="overflow-x-auto overflow-y-hidden rounded-b-xl border border-white/10"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div style={{ width: size.w ? size.w * zoom : undefined, height: size.h ? size.h * zoom : undefined }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0", width: "max-content" }}>
            <table ref={tableRef} className="w-max text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">{t("Sektor", "Sector", "Sektor")}</th>
                  <th className="px-4 py-3 font-medium">{t("Cena", "Price", "Kurs")}</th>
                  <th className="px-4 py-3 font-medium">
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as ChangePeriod)}
                      className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm font-medium text-white/70"
                      aria-label={t("Okres zmiany", "Change period", "Änderungszeitraum")}
                    >
                      {PERIOD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {lang === "pl" ? `Zmiana ${opt.label[0]}` : lang === "en" ? `Change: ${opt.label[1]}` : `Änderung: ${opt.label[2]}`}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                    onClick={() => setSort(nextSort(sort, "change", "asc"))}
                    title={t("Kliknij, żeby sortować: rosnąco, malejąco, potem powrót do rankingu", "Click to sort: ascending, descending, then back to the ranking", "Klicken zum Sortieren: aufsteigend, absteigend, danach zurück zum Ranking")}
                  >
                    {t("Zmiana %", "Change %", "Änderung %")} {arrow("change")}
                  </th>
                  {TARGET_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                      onClick={() => setSort(nextSort(sort, col.key, "desc"))}
                      title={t(
                        `${col.title[0]}. Kliknij, żeby sortować wg % odległości od aktualnej ceny: największy potencjał wzrostu, najmniejszy, potem powrót do rankingu`,
                        `${col.title[1]}. Click to sort by % distance from the current price: biggest upside, smallest, then back to the ranking`,
                        `${col.title[2]}. Klicken zum Sortieren nach prozentualem Abstand zum aktuellen Kurs: größtes Aufwärtspotenzial, kleinstes, danach zurück zum Ranking`,
                      )}
                    >
                      {t(...col.label)} {arrow(col.key)}
                    </th>
                  ))}
                  <th
                    className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                    onClick={() => setSort(nextSort(sort, "hypo", "desc"))}
                    title={t(
                      "Metoda A - cel z uczenia maszynowego: szacunek ML dla ceny za 3 miesiące, z kalibrowanym 80% przedziałem (najedź na wartość - tooltip pokaże też, jak przedział sprawdził się w backteście). Eksperyment, nie porada inwestycyjna - przygaszone wartości pochodzą z modelu, który nie pobił prostych baseline'ów. Kliknij, żeby sortować wg % odległości od aktualnej ceny.",
                      "Method A - machine-learning target: the ML estimate of the price in 3 months, with a calibrated 80% interval (hover over a value - the tooltip also shows how the interval held up in the backtest). An experiment, not investment advice - dimmed values come from a model that did not beat simple baselines. Click to sort by % distance from the current price.",
                      "Methode A - Ziel aus maschinellem Lernen: ML-Schätzung des Kurses in 3 Monaten mit kalibriertem 80-%-Intervall (fahren Sie über einen Wert - der Tooltip zeigt auch, wie sich das Intervall im Backtest bewährt hat). Ein Experiment, keine Anlageberatung - abgedunkelte Werte stammen von einem Modell, das einfache Baselines nicht geschlagen hat. Klicken Sie, um nach prozentualem Abstand zum aktuellen Kurs zu sortieren.",
                    )}
                  >
                    {t("Cel ML 3M (A)", "ML target 3M (A)", "ML-Ziel 3M (A)")} {arrow("hypo")}
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                    onClick={() => setSort(nextSort(sort, "vol", "desc"))}
                    title={t(
                      "Metoda C - pasmo zmienności: 3-miesięczny przedział cenowy z własnej zmienności spółki, bez uczenia maszynowego. Około 80% realnych 3-miesięcznych cen mieściło się w nim w backteście. Kliknij, żeby sortować wg zmienności (najszersze pasmo pierwsze, najwęższe, potem powrót do rankingu).",
                      "Method C - volatility band: a 3-month price range from the stock's own volatility, without machine learning. About 80% of actual 3-month prices fell within it in the backtest. Click to sort by volatility (widest band first, narrowest, then back to the ranking).",
                      "Methode C - Volatilitätsband: ein 3-Monats-Kursbereich aus der eigenen Volatilität der Aktie, ohne maschinelles Lernen. Im Backtest lagen rund 80 % der tatsächlichen 3-Monats-Kurse darin. Klicken zum Sortieren nach Volatilität (breitestes Band zuerst, dann schmalstes, danach zurück zum Ranking).",
                    )}
                  >
                    {t("Pasmo zmienności 3M (C)", "3M volatility band (C)", "3M-Volatilitätsband (C)")} {arrow("vol")}
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                    onClick={() => setSort(nextSort(sort, "p15", "desc"))}
                    title={t(
                      "Szansa, że cena zostanie w granicach +-15% dzisiejszej po 3 miesiącach, policzona ze zmienności spółki. Kliknij, żeby sortować: najbardziej prawdopodobne pozostanie w zakresie pierwsze, najmniej prawdopodobne, potem powrót do rankingu.",
                      "The chance that the price stays within ±15% of today's level after 3 months, calculated from the stock's volatility. Click to sort: most likely to stay in range first, least likely, then back to the ranking.",
                      "Die Wahrscheinlichkeit, dass der Kurs nach 3 Monaten innerhalb von ±15 % des heutigen Niveaus bleibt, berechnet aus der Volatilität der Aktie. Klicken zum Sortieren: am wahrscheinlichsten im Bereich zuerst, dann am unwahrscheinlichsten, danach zurück zum Ranking.",
                    )}
                  >
                    {t("P(±15%) 3M", "P(±15%) 3M", "P(±15 %) 3M")} {arrow("p15")}
                  </th>
                  {prediction && (
                    <th
                      className="cursor-pointer select-none px-4 py-3 font-medium hover:text-white"
                      onClick={() => setSort(nextSort(sort, "prediction", "desc"))}
                      title={t(
                        `Model matematyczny progu bariery (jak wycena opcji "one-touch"), NIE backtestowany jak metody A/C: szacowane prawdopodobieństwo, że cena osiągnie ${prediction.targetPct >= 0 ? "+" : ""}${prediction.targetPct}% w ciągu 12 miesięcy, na podstawie zmienności (metoda C), momentum, celów analityków, prognozy ML (A) i koniunktury Kitchina. Kliknij, żeby sortować: malejąco, rosnąco, powrót do rankingu.`,
                        `Mathematical barrier model (like pricing a "one-touch" option), NOT backtested like methods A/C: the estimated probability that the price reaches ${prediction.targetPct >= 0 ? "+" : ""}${prediction.targetPct}% within 12 months, based on volatility (method C), momentum, analyst targets, the ML forecast (A) and the Kitchin cycle. Click to sort: descending, ascending, back to the ranking.`,
                        `Mathematisches Barrieremodell (wie die Bewertung einer „One-Touch“-Option), NICHT wie die Methoden A/C backgetestet: geschätzte Wahrscheinlichkeit, dass der Kurs innerhalb von 12 Monaten ${prediction.targetPct >= 0 ? "+" : ""}${prediction.targetPct} % erreicht, basierend auf Volatilität (Methode C), Momentum, Analystenzielen, ML-Prognose (A) und Kitchin-Konjunktur. Klicken zum Sortieren: absteigend, aufsteigend, zurück zum Ranking.`,
                      )}
                    >
                      {t("Predykcja", "Prediction", "Prognose")} {arrow("prediction")}
                    </th>
                  )}
                  <th className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <select
                        value={rsiTimeframe}
                        onChange={(e) => setRsiTimeframe(e.target.value as RsiTimeframe)}
                        className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm font-medium text-white/70"
                        aria-label={t("Interwał RSI", "RSI timeframe", "RSI-Zeitrahmen")}
                        title={t("Interwał RSI(14) pokazany w tej kolumnie (M1 jest uzupełniane przez skan filtra RSI)", "RSI(14) timeframe shown in this column (M1 is filled in by the RSI filter scan)", "In dieser Spalte angezeigter RSI(14)-Zeitrahmen (M1 wird durch den Scan des RSI-Filters befüllt)")}
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
                        title={t("Kliknij, żeby sortować: najwyższe RSI pierwsze, najniższe, potem powrót do rankingu", "Click to sort: highest RSI first, lowest, then back to the ranking", "Klicken zum Sortieren: höchster RSI zuerst, dann niedrigster, danach zurück zum Ranking")}
                      >
                        {arrow("rsi") || "⇅"}
                      </button>
                    </div>
                  </th>
                  {TREND_COLUMNS.map((col) => (
                    <th key={col.key} className="px-4 py-3 font-medium" title={t(...col.title)}>
                      {col.label}
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 font-medium"
                    title={t(
                      "Setup trendowy (kolor = najmocniejszy spełniony wariant). Niebieski: cena nad Kijun-sen (52), potencjał wg analityków i cena nad MA - ustawienia w sekcji Setup trendowy. Żółty: jak niebieski, ale Kijun-sen (52) z D1 i MA200. Purpurowy: to samo co żółty, ale bez potwierdzenia analityków. Zielony: 5 linii Ichimoku na D1 (nad chmurą, Chikou nad ceną, nad Kijun i Tenkan) + cena nad MA200 na D1 + analitycy. Czerwony: to samo co zielony, ale bez potwierdzenia analityków. Różowy: na H4 cena nad MA100 i Kijun-sen (52), a Chikou nad chmurą (analitycy bez znaczenia). Najedź na znaczek, żeby zobaczyć, które warunki są spełnione.",
                      "Trend setup (color = strongest variant met). Blue: price above the Kijun-sen (52), analyst upside and price above the MA - settings are in the Trend setup section. Yellow: like blue, but Kijun-sen (52) from D1 and MA200. Purple: same as yellow, but without analyst confirmation. Green: Ichimoku 5-line signal on D1 (above the cloud, Chikou above price, above Kijun and Tenkan) + price above MA200 on D1 + analysts. Red: same as green, but without analyst confirmation. Pink: on H4 price above MA100 and Kijun-sen (52), and Chikou above the cloud (analysts ignored). Hover over the badge to see which conditions are met.",
                      "Trend-Setup (Farbe = stärkste erfüllte Variante). Blau: Kurs über der Kijun-sen (52), Analysten-Potenzial und Kurs über der MA - Einstellungen im Abschnitt Trend-Setup. Gelb: wie blau, aber Kijun-sen (52) aus D1 und MA200. Lila: wie gelb, aber ohne Bestätigung der Analysten. Grün: Ichimoku-5-Linien-Signal auf D1 (über der Wolke, Chikou über dem Kurs, über Kijun und Tenkan) + Kurs über MA200 auf D1 + Analysten. Rot: wie grün, aber ohne Bestätigung der Analysten. Rosa: auf H4 Kurs über MA100 und Kijun-sen (52), Chikou über der Wolke (Analysten egal). Fahren Sie über das Abzeichen, um zu sehen, welche Bedingungen erfüllt sind.",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSetupSort(nextSetupSort(setupSort))}
                      className={`cursor-pointer select-none hover:text-white ${setupSort ? SETUP_TIER_STYLES[setupSort].text : ""}`}
                      title={t(
                        `Kliknij, żeby sortować po kolorze: niebieski, żółty, purpurowy, zielony, czerwony, różowy, potem powrót do rankingu.${setupSort ? ` Teraz na górze: ${SETUP_TIER_STYLES[setupSort].label[0]}.` : ""}`,
                        `Click to sort by color: blue, yellow, purple, green, red, pink, then back to the ranking.${setupSort ? ` Now on top: ${SETUP_TIER_STYLES[setupSort].label[1]}.` : ""}`,
                        `Klicken zum Sortieren nach Farbe: blau, gelb, lila, grün, rot, rosa, danach zurück zum Ranking.${setupSort ? ` Jetzt oben: ${SETUP_TIER_STYLES[setupSort].label[2]}.` : ""}`,
                      )}
                    >
                      Setup {setupSort ? "●" : "⇅"}
                    </button>
                  </th>
                  <th
                    className="px-4 py-3 font-medium"
                    title={`${t("Wynik ważony", "Weighted score", "Gewichteter Score")}: D1*${weights.day} + H4*${weights.h4} + W1*${weights.week} + H1*${weights.h1}${setup.weight > 0 ? ` + setup*${setup.weight}` : ""}`}
                  >
                    {t("Wynik", "Score", "Score")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((entry) => {
                  const periodChange = changeFor(entry);
                  return (
                    <RankingRow
                      key={entry.symbol}
                      entry={entry as RankedEntry}
                      change={periodChange?.change ?? null}
                      changePercent={periodChange?.change_percent ?? null}
                      loading={loading}
                      rsiTimeframe={rsiTimeframe}
                      showPrediction={!!prediction}
                      prediction={prediction?.results.get(entry.symbol) ?? null}
                      setup={setup}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div ref={sentinelRef} className="flex items-center justify-center gap-3 py-4 text-xs text-white/40">
        {hasMore ? (
          <>
            <span>
              {t(
                `Wyświetlono ${visibleRows.length} z ${rows.length} - kolejne wiersze wczytują się podczas przewijania`,
                `Showing ${visibleRows.length} of ${rows.length} - more rows load as you scroll`,
                `Angezeigt: ${visibleRows.length} von ${rows.length} – weitere Zeilen werden beim Scrollen nachgeladen`,
              )}
            </span>
            <button
              type="button"
              onClick={() => setLimit(rows.length)}
              className="rounded border border-white/10 px-2 py-1 text-white/70 hover:text-white"
            >
              {t("Pokaż wszystkie", "Show all", "Alle anzeigen")}
            </button>
          </>
        ) : (
          <span>{t(`Wyświetlono wszystkie ${rows.length} wierszy`, `Showing all ${rows.length} rows`, `Alle ${rows.length} Zeilen angezeigt`)}</span>
        )}
      </div>
    </div>
  );
});
