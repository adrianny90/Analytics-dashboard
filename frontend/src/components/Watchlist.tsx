"use client";

import { Fragment, useEffect, useState } from "react";

import { DEFAULT_RULES, DEFAULT_WEIGHTS, scoreEntry } from "@/components/RankingWeights";
import { IchimokuLink } from "@/components/IchimokuLink";
import { SearchBox, matchesQuery } from "@/components/SearchBox";
import { SetupLegend } from "@/components/SetupLegend";
import { TrendBadge } from "@/components/TrendBadge";
import { ZoomToolbar } from "@/components/ZoomToolbar";
import { useTableZoom } from "@/hooks/useTableZoom";
import { getRankingChanges, needsChangesFetch } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { nextSetupSort, nextSort, sortByValue, type SortState } from "@/lib/tableSort";
import {
  DEFAULT_SETUP,
  SETUP_TIER_STYLES,
  describeSetup,
  evaluateSetup,
  type SetupTier,
} from "@/lib/rankingSetup";
import type { ChangePeriod, PeriodChange, Quote, RankingEntry, SymbolTrend, WatchlistSymbol } from "@/types/market";

type Tri = [string, string, string];

const TREND_COLUMNS: { key: Exclude<keyof SymbolTrend, "symbol">; label: string; title: Tri }[] = [
  { key: "week", label: "W1", title: ["Tygodniowy trend Ichimoku", "Weekly Ichimoku trend", "Wöchentlicher Ichimoku-Trend"] },
  { key: "day", label: "D1", title: ["Dzienny trend Ichimoku", "Daily Ichimoku trend", "Täglicher Ichimoku-Trend"] },
  { key: "h4", label: "H4", title: ["4-godzinny trend Ichimoku", "4-hour Ichimoku trend", "4-Stunden-Ichimoku-Trend"] },
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

// Sortable columns - the same cycles as the ranking tabs' table (see
// RankingTable.tsx): change % ascending first, everything else biggest first.
type SortKey = "change" | "low" | "median" | "high" | "hypo" | "vol" | "p15" | "rsi";
type WatchlistSort = SortState<SortKey>;

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

function groupBySector(symbols: WatchlistSymbol[]): [string, WatchlistSymbol[]][] {
  const groups = new Map<string, WatchlistSymbol[]>();
  for (const entry of symbols) {
    const list = groups.get(entry.sector) ?? [];
    list.push(entry);
    groups.set(entry.sector, list);
  }
  const sectorRank = (sector: string) => {
    if (sector === "Index") return 0;
    if (sector === "Custom") return 1;
    return 2;
  };

  return Array.from(groups.entries()).sort(([a], [b]) => {
    const rankDiff = sectorRank(a) - sectorRank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.localeCompare(b);
  });
}

function SectorTable({
  sector,
  symbols,
  quotesBySymbol,
  trendsBySymbol,
  entriesBySymbol,
  showRanking,
  period,
  onPeriodChange,
  fetchedChanges,
  sort,
  onSort,
  setupSort,
  onSetupSort,
}: {
  sector: string;
  symbols: WatchlistSymbol[];
  quotesBySymbol: Record<string, Quote>;
  trendsBySymbol: Record<string, SymbolTrend>;
  entriesBySymbol: Map<string, RankingEntry>;
  showRanking: boolean;
  period: ChangePeriod;
  onPeriodChange: (period: ChangePeriod) => void;
  fetchedChanges: Partial<Record<ChangePeriod, Record<string, PeriodChange>>>;
  sort: WatchlistSort;
  onSort: (sort: WatchlistSort) => void;
  setupSort: SetupTier | null;
  onSetupSort: (tier: SetupTier | null) => void;
}) {
  const { t } = useLang();
  const changeFor = (symbol: string) => {
    const quote = quotesBySymbol[symbol];
    if (period === "1d" && quote?.change != null && quote?.change_percent != null) {
      return { change: quote.change, change_percent: quote.change_percent };
    }
    return entriesBySymbol.get(symbol)?.changes?.[period] ?? fetchedChanges[period]?.[symbol];
  };
  // The sort (shared by every sector table, picked in any of their headers or
  // in the Setup legend) reorders rows within each table; without one the
  // watchlist keeps its own order.
  let rows = symbols;
  if (showRanking && setupSort) {
    const has = (symbol: string) => {
      const entry = entriesBySymbol.get(symbol);
      return entry ? evaluateSetup(entry, DEFAULT_SETUP).tier === setupSort : false;
    };
    rows = [...symbols].sort((a, b) => Number(has(b.symbol)) - Number(has(a.symbol)));
  } else if (showRanking && sort) {
    const valueOf = ({ symbol }: WatchlistSymbol) => {
      const entry = entriesBySymbol.get(symbol);
      switch (sort.key) {
        case "change":
          return changeFor(symbol)?.change_percent;
        case "hypo":
          return entry ? hypoUpside(entry) : null;
        case "vol":
          return entry?.vol_forecast?.sigma;
        case "p15":
          return entry?.vol_forecast?.p15;
        case "rsi":
          return entry?.rsi?.day;
        default:
          return entry ? targetUpside(entry, sort.key) : null;
      }
    };
    rows = sortByValue(symbols, valueOf, sort.dir);
  }
  const arrow = (key: SortKey) => (sort?.key !== key ? "" : sort.dir === "asc" ? "▲" : "▼");
  const sortableTh = "cursor-pointer select-none px-4 py-3 font-medium hover:text-white";
  const clickHint = (pl: string, en: string, de: string) =>
    t(
      ` Kliknij, żeby sortować: ${pl}, potem powrót do kolejności listy.`,
      ` Click to sort: ${en}, then back to the list order.`,
      ` Klicken zum Sortieren: ${de}, danach zurück zur Listenreihenfolge.`,
    );
  const upsideHint = clickHint("największy potencjał wzrostu, najmniejszy", "biggest upside, smallest", "größtes Aufwärtspotenzial, kleinstes");
  const biggestHint = clickHint("największe pierwsze, najmniejsze", "biggest first, smallest", "größte zuerst, kleinste");
  // Each sector table zooms/pans on its own (its own toolbar and scrollbar),
  // same mechanics as the ranking tabs' table - see useTableZoom.
  // The indices table has no ranking columns, so it is much narrower than the
  // sector tables - centre it (and its header) instead of leaving it on the left,
  // and don't auto-fit it (that would blow it up instead of shrinking it).
  const centered = sector === "Index";
  // Sector tables open already fitted to the screen width, as after "Fit".
  const { topScrollRef, scrollRef, contentRef, size, zoom, applyZoom, fitToWidth, syncScroll } =
    useTableZoom<HTMLDivElement>(true, !centered);
  const scaledWidth = size.w ? size.w * zoom : undefined;
  return (
    <div className="group relative">
      {/* Sticky header: the sector name and its zoom toolbar (shows on hover, always
          visible on touch screens) sit above the top scrollbar and stay pinned
          together while this section is on screen. */}
      <div className="sticky top-0 z-20 bg-slate-950">
        <div
          className={`flex min-h-9 max-w-full items-center gap-2 px-1 py-1 ${centered ? "mx-auto" : ""}`}
          style={centered ? { width: scaledWidth } : undefined}
        >
          <h3 className="text-sm font-semibold text-white/70">{sector === "Index" ? t("Indeksy", "Indices", "Indizes") : sector}</h3>
          <ZoomToolbar zoom={zoom} onZoomChange={applyZoom} onFit={fitToWidth} />
        </div>
        <div
          ref={topScrollRef}
          onScroll={() => syncScroll(topScrollRef.current, scrollRef.current)}
          className="overflow-x-auto overflow-y-hidden"
          aria-hidden="true"
        >
          <div style={{ width: size.w * zoom, height: 1 }} />
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={() => syncScroll(scrollRef.current, topScrollRef.current)}
        className="overflow-x-auto overflow-y-hidden"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div
          className={centered ? "mx-auto" : undefined}
          style={{ width: scaledWidth, height: size.h ? size.h * zoom : undefined }}
        >
          <div ref={contentRef} style={{ transform: `scale(${zoom})`, transformOrigin: "0 0", width: "max-content" }} className="p-1">
            <div className="rounded-xl border border-white/10">
              <table className="w-max text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-white/50">
                    <th className="px-4 py-3 font-medium">Symbol</th>
                    <th className="px-4 py-3 font-medium">{t("Sektor", "Sector", "Sektor")}</th>
                    <th className="px-4 py-3 font-medium">{t("Cena", "Price", "Kurs")}</th>
                    <th className="px-4 py-3 font-medium">
                      {showRanking ? (
                        <select
                          value={period}
                          onChange={(e) => onPeriodChange(e.target.value as ChangePeriod)}
                          className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm font-medium text-white/70"
                          aria-label={t("Okres zmiany", "Change period", "Änderungszeitraum")}
                        >
                          {PERIOD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {t(`Zmiana ${opt.label[0]}`, `Change: ${opt.label[1]}`, `Änderung: ${opt.label[2]}`)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        t("Zmiana", "Change", "Änderung")
                      )}
                    </th>
                    {showRanking ? (
                      <th
                        className={sortableTh}
                        onClick={() => onSort(nextSort(sort, "change", "asc"))}
                        title={t("Kliknij, żeby sortować: rosnąco, malejąco, potem powrót do kolejności listy", "Click to sort: ascending, descending, then back to the list order", "Klicken zum Sortieren: aufsteigend, absteigend, danach zurück zur Listenreihenfolge")}
                      >
                        {t("Zmiana %", "Change %", "Änderung %")} {arrow("change")}
                      </th>
                    ) : (
                      <th className="px-4 py-3 font-medium">{t("Zmiana %", "Change %", "Änderung %")}</th>
                    )}
                    {TREND_COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 font-medium" title={t(...col.title)}>
                        {col.label}
                      </th>
                    ))}
                    {showRanking && (
                      <>
                        {TARGET_COLUMNS.map((col) => (
                          <th
                            key={col.key}
                            className={sortableTh}
                            onClick={() => onSort(nextSort(sort, col.key, "desc"))}
                            title={`${t(...col.title)}.${upsideHint}`}
                          >
                            {t(...col.label)} {arrow(col.key)}
                          </th>
                        ))}
                        <th
                          className={sortableTh}
                          onClick={() => onSort(nextSort(sort, "hypo", "desc"))}
                          title={t(
                            "Metoda A - cel z uczenia maszynowego: jednorazowy snapshot (uruchamiany ręcznie, offline); dopóki nikt go nie uruchomi dla tej watchlisty, kolumna pozostaje pusta.",
                            "Method A - machine-learning target: a one-time snapshot (run manually, offline); until someone runs it for this watchlist, the column stays empty.",
                            "Methode A - Ziel aus maschinellem Lernen: einmaliger Snapshot (manuell, offline gestartet); solange er nicht für diese Watchlist ausgeführt wurde, bleibt die Spalte leer.",
                          ) + upsideHint}
                        >
                          {t("Cel ML 3M (A)", "ML target 3M (A)", "ML-Ziel 3M (A)")} {arrow("hypo")}
                        </th>
                        <th
                          className={sortableTh}
                          onClick={() => onSort(nextSort(sort, "vol", "desc"))}
                          title={t(
                            "Metoda C - pasmo zmienności: 3-miesięczny przedział cenowy z własnej zmienności spółki, bez uczenia maszynowego.",
                            "Method C - volatility band: a 3-month price range from the stock's own volatility, without machine learning.",
                            "Methode C - Volatilitätsband: ein 3-Monats-Kursbereich aus der eigenen Volatilität der Aktie, ohne maschinelles Lernen.",
                          ) + biggestHint}
                        >
                          {t("Pasmo zmienności 3M (C)", "3M volatility band (C)", "3M-Volatilitätsband (C)")} {arrow("vol")}
                        </th>
                        <th
                          className={sortableTh}
                          onClick={() => onSort(nextSort(sort, "p15", "desc"))}
                          title={t(
                            "Szansa, że cena zostanie w granicach +-15% dzisiejszej po 3 miesiącach, policzona ze zmienności.",
                            "The chance that the price stays within ±15% of today's level after 3 months, calculated from volatility.",
                            "Die Wahrscheinlichkeit, dass der Kurs nach 3 Monaten innerhalb von ±15 % des heutigen Niveaus bleibt, berechnet aus der Volatilität.",
                          ) + biggestHint}
                        >
                          {t("P(±15%) 3M", "P(±15%) 3M", "P(±15 %) 3M")} {arrow("p15")}
                        </th>
                        <th
                          className={sortableTh}
                          onClick={() => onSort(nextSort(sort, "rsi", "desc"))}
                          title={t("RSI(14) dzienny.", "Daily RSI(14).", "Täglicher RSI(14).") + clickHint("najwyższe RSI pierwsze, najniższe", "highest RSI first, lowest", "höchster RSI zuerst, dann niedrigster")}
                        >
                          RSI {arrow("rsi")}
                        </th>
                        <th
                          className="px-4 py-3 font-medium"
                          title={t(
                            "Setup trendowy z domyślnymi ustawieniami (Kijun-sen 52 na H4, MA100 na H4, analitycy >= 20%) - taki sam jak w rankingach S&P 500/Nasdaq/Russell 2000/NYSE. Najedź na znaczek, żeby zobaczyć, które warunki są spełnione.",
                            "Trend setup with default settings (Kijun-sen 52 on H4, MA100 on H4, analysts >= 20%) - the same as in the S&P 500/Nasdaq/Russell 2000/NYSE rankings. Hover over the badge to see which conditions are met.",
                            "Trend-Setup mit Standardeinstellungen (Kijun-sen 52 auf H4, MA100 auf H4, Analysten >= 20 %) - dasselbe wie in den Rankings S&P 500/Nasdaq/Russell 2000/NYSE. Fahren Sie über das Abzeichen, um zu sehen, welche Bedingungen erfüllt sind.",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onSetupSort(nextSetupSort(setupSort))}
                            className={`cursor-pointer select-none hover:text-white ${setupSort ? SETUP_TIER_STYLES[setupSort].text : ""}`}
                            title={t(
                              `Kliknij, żeby sortować po kolorze: niebieski, żółty, purpurowy, zielony, czerwony, różowy, potem powrót do kolejności listy.${setupSort ? ` Teraz na górze: ${SETUP_TIER_STYLES[setupSort].label[0]}.` : ""}`,
                              `Click to sort by color: blue, yellow, purple, green, red, pink, then back to the list order.${setupSort ? ` Now on top: ${SETUP_TIER_STYLES[setupSort].label[1]}.` : ""}`,
                              `Klicken zum Sortieren nach Farbe: blau, gelb, lila, grün, rot, rosa, danach zurück zur Listenreihenfolge.${setupSort ? ` Jetzt oben: ${SETUP_TIER_STYLES[setupSort].label[2]}.` : ""}`,
                            )}
                          >
                            Setup {setupSort ? "●" : "⇅"}
                          </button>
                        </th>
                        <th
                          className="px-4 py-3 font-medium"
                          title={t(
                            "Wynik ważony z domyślnymi wagami (D1*4 + H4*3 + W1*2 + H1*1 + setup*5) - taki sam wzór jak w rankingach.",
                            "Weighted score with default weights (D1*4 + H4*3 + W1*2 + H1*1 + setup*5) - the same formula as in the rankings.",
                            "Gewichteter Score mit Standardgewichtungen (D1*4 + H4*3 + W1*2 + H1*1 + Setup*5) - dieselbe Formel wie in den Rankings.",
                          )}
                        >
                          {t("Wynik", "Score", "Score")}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ symbol, sector: rowSector }) => {
                    const quote = quotesBySymbol[symbol];
                    const trend = trendsBySymbol[symbol];
                    const entry = entriesBySymbol.get(symbol);
                    const change = changeFor(symbol);
                    const isUp = (change?.change ?? 0) >= 0;
                    const setupResult = entry ? evaluateSetup(entry, DEFAULT_SETUP) : null;
                    const score = entry ? scoreEntry(entry, DEFAULT_WEIGHTS, DEFAULT_RULES, () => null, DEFAULT_SETUP) : null;
                    const hypo = entry ? hypoUpside(entry) : null;
                    return (
                      <tr key={symbol} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <IchimokuLink symbol={symbol} className="font-medium text-white hover:underline" />
                          {quote?.stale && (
                            <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                              {t("opóźnione", "delayed", "verzögert")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/50">{rowSector}</td>
                        {quote ? (
                          <>
                            <td className="px-4 py-3">{formatNumber(quote.price)}</td>
                            {change ? (
                              <>
                                <td className={`px-4 py-3 ${isUp ? "text-rise" : "text-fall"}`}>
                                  {isUp ? "+" : ""}
                                  {formatNumber(change.change)}
                                </td>
                                <td className={`px-4 py-3 ${isUp ? "text-rise" : "text-fall"}`}>
                                  {isUp ? "+" : ""}
                                  {formatNumber(change.change_percent)}%
                                </td>
                              </>
                            ) : (
                              <td className="px-4 py-3 text-white/30" colSpan={2}>
                                {t("brak", "n/a", "k. A.")}
                              </td>
                            )}
                          </>
                        ) : (
                          <td className="px-4 py-3 text-white/30" colSpan={3}>
                            {t("wczytywanie…", "loading…", "wird geladen…")}
                          </td>
                        )}
                        {TREND_COLUMNS.map((col) => (
                          <td key={col.key} className="px-4 py-3">
                            <TrendBadge outlook={trend?.[col.key] ?? null} />
                          </td>
                        ))}
                        {showRanking && (
                          <>
                            {TARGET_COLUMNS.map((col) => {
                              const value = entry?.targets?.[col.key];
                              const upside = entry ? targetUpside(entry, col.key) : null;
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
                            <td className="px-4 py-3">
                              {entry?.forecast ? (
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
                            <td className="px-4 py-3">
                              {entry?.vol_forecast ? (
                                <>
                                  {formatNumber(entry.vol_forecast.low)}
                                  <span className="text-white/40"> - </span>
                                  {formatNumber(entry.vol_forecast.high)}
                                </>
                              ) : (
                                <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {entry?.vol_forecast ? (
                                <span
                                  className={
                                    entry.vol_forecast.p15 >= 0.75 ? "text-rise" : entry.vol_forecast.p15 < 0.5 ? "text-fall" : ""
                                  }
                                >
                                  {Math.round(entry.vol_forecast.p15 * 100)}%
                                </span>
                              ) : (
                                <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-white/80">
                              {entry?.rsi?.day != null ? (
                                entry.rsi.day.toFixed(1)
                              ) : (
                                <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>
                              )}
                            </td>
                            <td className="px-4 py-3" title={entry && setupResult ? describeSetup(setupResult, DEFAULT_SETUP, t) : undefined}>
                              {setupResult?.tier ? (
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${SETUP_TIER_STYLES[setupResult.tier].badge}`}
                                >
                                  ✓ Setup
                                </span>
                              ) : (
                                <span className="text-white/20">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-white">
                              {score != null ? score : <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Watchlist({
  symbols,
  quotesBySymbol,
  trendsBySymbol,
  entries,
}: {
  symbols: WatchlistSymbol[];
  quotesBySymbol: Record<string, Quote>;
  trendsBySymbol: Record<string, SymbolTrend>;
  /** Ranking data (analyst targets, RSI, ML/volatility forecasts, Setup, Score) for the
   *  "watchlist" universe - empty until Start has run at least once (see RankingRunStatus
   *  above this table). Not populated for the "Index" sector - see index_ranking_service.py. */
  entries: RankingEntry[];
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<ChangePeriod>("1d");
  // Only one sort at a time - a value sort drops the Setup color sort and vice versa.
  const [sort, setSortState] = useState<WatchlistSort>(null);
  const [setupSort, setSetupSortState] = useState<SetupTier | null>(null);
  const setSort = (next: WatchlistSort) => {
    setSortState(next);
    setSetupSortState(null);
  };
  const setSetupSort = (next: SetupTier | null) => {
    setSetupSortState(next);
    setSortState(null);
  };
  const [fetchedChanges, setFetchedChanges] = useState<Partial<Record<ChangePeriod, Record<string, PeriodChange>>>>({});

  // Periods beyond "1d" (which comes from the live quote) are pulled from the
  // ranking entries first (filled in by the last Start) and, for anything
  // still missing, fetched on demand - same as the ranking tabs' table.
  useEffect(() => {
    if (period === "1d" || fetchedChanges[period] || !needsChangesFetch(entries, period)) return;
    let cancelled = false;
    getRankingChanges("watchlist", period)
      .then((c) => !cancelled && setFetchedChanges((prev) => ({ ...prev, [period]: c })))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [period, entries, fetchedChanges]);

  const entriesBySymbol = new Map(entries.map((e) => [e.symbol, e]));
  const visible = symbols.filter((entry) => matchesQuery(query, entry.symbol, entry.sector));
  const sections = groupBySector(visible);
  const showTables = sections.length > 0;

  return (
    <div>
      {/* Lined up with the "Finished" badge above (inside page.tsx's max-w-5xl
          column, offset by the status card's border + p-4), not the full-width tables. */}
      <div className="mx-auto max-w-5xl px-4">
        <SearchBox value={query} onChange={setQuery} resultLabel={t(`Znaleziono: ${visible.length} z ${symbols.length}`, `Found: ${visible.length} of ${symbols.length}`, `Gefunden: ${visible.length} von ${symbols.length}`)} />
      </div>
      {query.trim() && visible.length === 0 && (
        <p className="mt-4 text-sm text-white/40">
          {t(`Brak wyników dla „${query.trim()}”.`, `No results for “${query.trim()}”.`, `Keine Ergebnisse für „${query.trim()}“.`)}
        </p>
      )}
      {showTables && (
        <div className="mt-6 flex flex-col gap-8">
          {sections.map(([sector, sectorSymbols], i) => (
            <Fragment key={sector}>
            {/* One Setup legend for all sector tables, right under the indices. */}
            {sector !== "Index" && sections.findIndex(([s]) => s !== "Index") === i && (
              <div className="mx-auto w-full max-w-5xl px-4">
                <SetupLegend setup={DEFAULT_SETUP} active={setupSort} onSelect={setSetupSort} />
              </div>
            )}
            <SectorTable
              sector={sector}
              symbols={sectorSymbols}
              quotesBySymbol={quotesBySymbol}
              trendsBySymbol={trendsBySymbol}
              entriesBySymbol={entriesBySymbol}
              showRanking={sector !== "Index"}
              period={period}
              onPeriodChange={setPeriod}
              fetchedChanges={fetchedChanges}
              sort={sort}
              onSort={setSort}
              setupSort={setupSort}
              onSetupSort={setSetupSort}
            />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
