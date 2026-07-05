"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { CandlestickChart } from "@/components/CandlestickChart";
import { getHistory, getQuote, type Timeframe } from "@/lib/api";
import type { HistoricalBar, Quote } from "@/types/market";

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "h4", label: "H4" },
  { value: "h1", label: "H1" },
];

export default function SymbolPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoricalBar[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("day");

  useEffect(() => {
    getQuote(symbol).then(setQuote).catch(() => setQuote(null));
  }, [symbol]);

  useEffect(() => {
    getHistory(symbol, timeframe).then(setHistory).catch(() => setHistory([]));
  }, [symbol, timeframe]);

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

      <div className="mt-6 flex gap-2">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              timeframe === tf.value ? "bg-sky-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <CandlestickChart data={history} />
      </div>
    </main>
  );
}
