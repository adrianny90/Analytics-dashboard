"use client";

import { useEffect, useState } from "react";

import { AddTicker } from "@/components/AddTicker";
import { IndexCard } from "@/components/IndexCard";
import { Watchlist } from "@/components/Watchlist";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { getIndices, getWatchlist, getWatchlistSymbols, getWatchlistTrends } from "@/lib/api";
import type { IndexSummary, Quote, SymbolTrend, WatchlistSymbol } from "@/types/market";

// The background trend poll loop is far slower than quotes (four
// timeframes x the whole watchlist, each a much bigger history pull), so
// polling this endpoint less often than quotes is enough to catch it
// filling in.
const TREND_POLL_MS = 30_000;

export default function DashboardPage() {
  const [indices, setIndices] = useState<IndexSummary[]>([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<WatchlistSymbol[]>([]);
  const [initialQuotes, setInitialQuotes] = useState<Quote[]>([]);
  const [trendsBySymbol, setTrendsBySymbol] = useState<Record<string, SymbolTrend>>({});
  const [error, setError] = useState<string | null>(null);

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
    <main className="mx-auto max-w-5xl px-6 py-12">
      <AddTicker onAdded={handleTickerAdded} />

      <h1 className="mt-6 text-2xl font-semibold">US Market Dashboard</h1>
      <p className="mt-1 text-sm text-white/50">
        S&amp;P 500, Nasdaq and Russell 2000, tracked live via their SPY / QQQ / IWM ETF proxies.
      </p>

      {error && <p className="mt-6 text-fall">Failed to load market data: {error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {indices.map((index) => (
          <IndexCard key={index.proxy_symbol} index={index} liveQuote={liveQuotes[index.proxy_symbol]} />
        ))}
      </div>

      <h2 className="mt-12 text-lg font-semibold">Watchlist</h2>
      <p className="mt-1 text-sm text-white/50">
        Prices fill in as they're fetched — with ~{watchlistSymbols.length} tickers on a free data source, expect a
        minute or two for the first full pass. Trend columns (W1/D1/H4/H1) pull much more history per ticker, so
        those can take several minutes to fully populate.
      </p>
      <div className="mt-4">
        <Watchlist symbols={watchlistSymbols} quotesBySymbol={quotesBySymbol} trendsBySymbol={trendsBySymbol} />
      </div>
    </main>
  );
}
