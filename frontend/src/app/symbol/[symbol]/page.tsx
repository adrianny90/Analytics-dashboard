"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { PriceChart } from "@/components/PriceChart";
import { getHistory, getQuote } from "@/lib/api";
import type { HistoricalBar, Quote } from "@/types/market";

export default function SymbolPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoricalBar[]>([]);

  useEffect(() => {
    getQuote(symbol).then(setQuote).catch(() => setQuote(null));
    getHistory(symbol, "6mo", "1d").then(setHistory).catch(() => setHistory([]));
  }, [symbol]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{symbol}</h1>
      {quote && (
        <p className="mt-2 text-3xl font-semibold">
          {quote.price.toFixed(2)}{" "}
          <span className={(quote.change ?? 0) >= 0 ? "text-rise" : "text-fall"}>
            {quote.change?.toFixed(2)} ({quote.change_percent?.toFixed(2)}%)
          </span>
        </p>
      )}
      <div className="mt-8">
        <PriceChart data={history} />
      </div>
    </main>
  );
}
