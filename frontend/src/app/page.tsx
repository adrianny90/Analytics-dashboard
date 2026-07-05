"use client";

import { useEffect, useState } from "react";

import { IndexCard } from "@/components/IndexCard";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { getIndices } from "@/lib/api";
import type { IndexSummary } from "@/types/market";

export default function DashboardPage() {
  const [indices, setIndices] = useState<IndexSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getIndices()
      .then(setIndices)
      .catch((err) => setError(err.message));
  }, []);

  const liveQuotes = useLiveQuotes(indices.map((index) => index.proxy_symbol));

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
    </main>
  );
}
