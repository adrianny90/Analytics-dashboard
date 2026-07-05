"use client";

import { useEffect, useState } from "react";

import { IndexCard } from "@/components/IndexCard";
import { Watchlist } from "@/components/Watchlist";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { getIndices, getWatchlist, getWatchlistSymbols } from "@/lib/api";
import type { IndexSummary, Quote, WatchlistSymbol } from "@/types/market";

export default function DashboardPage() {
  const [indices, setIndices] = useState<IndexSummary[]>([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<WatchlistSymbol[]>([]);
  const [initialQuotes, setInitialQuotes] = useState<Quote[]>([]);
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

  const trackedSymbols = [
    ...indices.map((index) => index.proxy_symbol),
    ...watchlistSymbols.map((entry) => entry.symbol),
  ];
  const liveQuotes = useLiveQuotes(trackedSymbols);

  const quotesBySymbol: Record<string, Quote> = { ...liveQuotes };
  for (const quote of initialQuotes) {
    if (!quotesBySymbol[quote.symbol]) quotesBySymbol[quote.symbol] = quote;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">US Market Dashboard</h1>
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
        minute or two for the first full pass.
      </p>
      <div className="mt-4">
        <Watchlist symbols={watchlistSymbols} quotesBySymbol={quotesBySymbol} />
      </div>
    </main>
  );
}
