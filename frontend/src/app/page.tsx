"use client";

import { useEffect, useRef, useState } from "react";

import { AddTicker } from "@/components/AddTicker";
import { DownloadAll } from "@/components/DownloadAll";
import { IndexCard } from "@/components/IndexCard";
import { RankingRunStatus } from "@/components/RankingRunStatus";
import { Watchlist } from "@/components/Watchlist";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { fmtDateTime, useLang } from "@/lib/i18n";
import {
  getIndices,
  getRanking,
  getRankingStatus,
  getWatchlist,
  getWatchlistSymbols,
  getWatchlistTrends,
  peekIndices,
  peekRanking,
  peekRankingStatus,
  peekWatchlist,
  peekWatchlistSymbols,
  peekWatchlistTrends,
  startRanking,
  startTargets,
} from "@/lib/api";
import type { IndexSummary, Quote, RankingEntry, RankingStatus, SymbolTrend, WatchlistSymbol } from "@/types/market";

// The background trend poll loop is far slower than quotes (four
// timeframes x the whole watchlist, each a much bigger history pull), so
// polling this endpoint less often than quotes is enough to catch it
// filling in.
const TREND_POLL_MS = 30_000;
// The watchlist ranking (analyst targets, RSI, Setup/Score - see Watchlist.tsx)
// is a one-shot batch job, not a poll loop, so checking every few seconds for
// progress is cheap - same cadence as the ranking tabs' own status poll.
const RANKING_STATUS_POLL_MS = 5000;

export default function DashboardPage() {
  const { t } = useLang();
  // Coming back from another tab, start from what this page showed last time
  // (kept in memory by lib/api.ts) - the requests below then refresh it.
  const [indices, setIndices] = useState<IndexSummary[]>(() => peekIndices()?.value ?? []);
  const [watchlistSymbols, setWatchlistSymbols] = useState<WatchlistSymbol[]>(() => peekWatchlistSymbols()?.value ?? []);
  const [initialQuotes, setInitialQuotes] = useState<Quote[]>(() => peekWatchlist()?.value ?? []);
  const [trendsBySymbol, setTrendsBySymbol] = useState<Record<string, SymbolTrend>>(() =>
    Object.fromEntries((peekWatchlistTrends()?.value ?? []).map((t) => [t.symbol, t])),
  );
  const [error, setError] = useState<string | null>(null);
  const [rankingStatus, setRankingStatus] = useState<RankingStatus | null>(() => peekRankingStatus("watchlist")?.value ?? null);
  const [rankingEntries, setRankingEntries] = useState<RankingEntry[]>(() => peekRanking("watchlist")?.value ?? []);
  const prevRankingStatusRef = useRef<RankingStatus | null>(rankingStatus);

  useEffect(() => {
    getIndices()
      .then(setIndices)
      .catch((err) => setError(err.message));
    // Static symbol/sector metadata loads instantly regardless of live data.
    getWatchlistSymbols()
      .then(setWatchlistSymbols)
      .catch((err) => setError(err.message));
    getWatchlist()
      .then(setInitialQuotes)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function pollTrends() {
      getWatchlistTrends()
        .then((trends) => setTrendsBySymbol(Object.fromEntries(trends.map((t) => [t.symbol, t]))))
        .catch(() => undefined);
    }
    pollTrends();
    const interval = setInterval(pollTrends, TREND_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // Analyst targets, RSI, volatility forecast, Setup and Score for the
  // watchlist table below (see Watchlist.tsx) - the same one-shot ranking
  // scan the S&P 500/Nasdaq/Russell 2000/NYSE tabs use, just for this
  // dynamic "watchlist" universe (backend/app/services/index_ranking_service.py).
  useEffect(() => {
    function pollRankingStatus() {
      getRankingStatus("watchlist")
        .then((s) => {
          const prev = prevRankingStatusRef.current;
          prevRankingStatusRef.current = s;
          setRankingStatus(s);
          const mainDone = prev?.status === "running" && s.status !== "running";
          const bgDone = prev?.background_status === "running" && s.background_status !== "running";
          const targetsDone = prev?.targets?.status === "running" && s.targets?.status !== "running";
          if (mainDone || bgDone || targetsDone) {
            getRanking("watchlist")
              .then(setRankingEntries)
              .catch(() => undefined);
          }
        })
        .catch(() => undefined);
    }
    pollRankingStatus();
    getRanking("watchlist")
      .then(setRankingEntries)
      .catch(() => undefined);
    const interval = setInterval(pollRankingStatus, RANKING_STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  function handleStartRanking() {
    startRanking("watchlist")
      .then((s) => {
        prevRankingStatusRef.current = s;
        setRankingStatus(s);
      })
      .catch((err) => setError(err.message));
  }

  function handleStartTargets() {
    startTargets("watchlist")
      .then((targets) => {
        const next = rankingStatus ? { ...rankingStatus, targets } : null;
        prevRankingStatusRef.current = next;
        setRankingStatus(next);
      })
      .catch((err) => setError(err.message));
  }

  const targetsRunning = rankingStatus?.targets?.status === "running";

  const trackedSymbols = [
    ...indices.map((index) => index.proxy_symbol),
    ...watchlistSymbols.map((entry) => entry.symbol),
  ];
  const liveQuotes = useLiveQuotes(trackedSymbols);

  const quotesBySymbol: Record<string, Quote> = { ...liveQuotes };
  for (const quote of initialQuotes) {
    if (!quotesBySymbol[quote.symbol]) quotesBySymbol[quote.symbol] = quote;
  }

  function handleTickerAdded(entry: WatchlistSymbol) {
    setWatchlistSymbols((prev) => (prev.some((e) => e.symbol === entry.symbol) ? prev : [...prev, entry]));
  }

  return (
    // Unlike the panels below (kept at a readable max-w-5xl), the watchlist
    // table needs the full screen width - same layout split as RankingPage.tsx.
    <main className="px-3 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
      <DownloadAll />

      <div className="mt-6">
        <AddTicker onAdded={handleTickerAdded} />
      </div>

      <h1 className="mt-6 text-2xl font-semibold">{t("Panel rynku amerykańskiego", "US Market Dashboard", "US-Marktübersicht")}</h1>
      <p className="mt-1 text-sm text-white/50">
        {t(
          "S&P 500, Nasdaq i Russell 2000, śledzone na żywo przez ich ETF-y proxy SPY / QQQ / IWM.",
          "S&P 500, Nasdaq and Russell 2000, tracked live through their proxy ETFs SPY / QQQ / IWM.",
          "S&P 500, Nasdaq und Russell 2000, live verfolgt über ihre Proxy-ETFs SPY / QQQ / IWM.",
        )}
      </p>

      {error && <p className="mt-6 text-fall">
          {t("Nie udało się pobrać danych rynkowych", "Failed to load market data", "Marktdaten konnten nicht geladen werden")}: {error}
        </p>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {indices.map((index) => (
          <IndexCard key={index.proxy_symbol} index={index} liveQuote={liveQuotes[index.proxy_symbol]} />
        ))}
      </div>

      <h2 className="mt-12 text-lg font-semibold">{t("Lista obserwowanych", "Watchlist", "Watchlist")}</h2>
      <p className="mt-1 text-sm text-white/50">
        {t(
          `Ceny uzupełniają się w miarę pobierania — przy ~${watchlistSymbols.length} tickerach z darmowego źródła danych spodziewaj się minuty lub dwóch na pierwszy pełny przebieg. Kolumny trendu (W1/D1/H4/H1) pobierają znacznie więcej historii na ticker, więc ich pełne uzupełnienie może potrwać kilka minut.`,
          `Prices fill in as they are downloaded — with ~${watchlistSymbols.length} tickers from a free data source, expect a minute or two for the first full pass. The trend columns (W1/D1/H4/H1) pull far more history per ticker, so filling them in completely can take a few minutes.`,
          `Die Kurse füllen sich nach und nach — bei ca. ${watchlistSymbols.length} Tickern aus einer kostenlosen Datenquelle dauert der erste vollständige Durchlauf ein bis zwei Minuten. Die Trendspalten (W1/D1/H4/H1) laden deutlich mehr Historie pro Ticker, daher kann es einige Minuten dauern, bis sie vollständig befüllt sind.`,
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleStartRanking}
          disabled={rankingStatus?.status === "running"}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(
            "Uzupełnij kolumny rankingu (RSI, pasmo zmienności, Setup...)",
            "Fill in the ranking columns (RSI, volatility band, Setup...)",
            "Ranking-Spalten befüllen (RSI, Volatilitätsband, Setup...)",
          )}
        </button>
        <button
          onClick={handleStartTargets}
          disabled={targetsRunning}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {targetsRunning
            ? t("Pobieranie prognoz…", "Downloading forecasts…", "Prognosen werden geladen…")
            : t("Pobierz prognozy", "Download forecasts", "Prognosen laden")}
        </button>
        {rankingStatus?.updated_at && (
          <span className="text-xs text-white/40">
            {t("Ostatni przebieg", "Last run", "Letzter Lauf")}: {fmtDateTime(rankingStatus.updated_at)}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-white/40">
        {t(
          "Dotyczy tylko sekcji poniżej (bez Indeksów): RSI, pasmo zmienności, Setup i Wynik - te same kolumny co w rankingach S&P 500/Nasdaq/Russell 2000/NYSE. Cele cenowe analityków pobiera osobny przycisk „Pobierz prognozy”. Cel ML (A) to osobny, ręcznie uruchamiany jednorazowy snapshot - patrz strona Metodologia.",
          "Applies only to the section below (not the Indices): RSI, volatility band, Setup and Score - the same columns as in the S&P 500/Nasdaq/Russell 2000/NYSE rankings. Analyst price targets are downloaded separately with “Download forecasts”. The ML target (A) is a separate, manually-run one-time snapshot - see the Methodology page.",
          "Betrifft nur den Abschnitt unten (nicht die Indizes): RSI, Volatilitätsband, Setup und Score - dieselben Spalten wie in den Rankings S&P 500/Nasdaq/Russell 2000/NYSE. Die Analysten-Kursziele lädt die separate Schaltfläche „Prognosen laden“. Das ML-Ziel (A) ist ein separater, manuell gestarteter einmaliger Snapshot - siehe die Seite Methodik.",
        )}
      </p>
      <RankingRunStatus status={rankingStatus} />
      </div>

      <div className="mt-4">
        <Watchlist symbols={watchlistSymbols} quotesBySymbol={quotesBySymbol} trendsBySymbol={trendsBySymbol} entries={rankingEntries} />
      </div>
    </main>
  );
}
