"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { CandlestickChart } from "@/components/CandlestickChart";
import { Spinner } from "@/components/Spinner";
import { getHistory, getQuote, type Timeframe } from "@/lib/api";
import { TIMEFRAMES } from "@/lib/timeframes";
import type { HistoricalBar, Quote } from "@/types/market";

export default function SymbolPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoricalBar[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    getQuote(symbol).then(setQuote).catch(() => setQuote(null));
  }, [symbol]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    getHistory(symbol, timeframe)
      .then((bars) => {
        if (requestIdRef.current === requestId) setHistory(bars);
      })
      .catch(() => {
        if (requestIdRef.current === requestId) setHistory([]);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  }, [symbol, timeframe]);

  const timeframeLabel = TIMEFRAMES.find((tf) => tf.value === timeframe)?.label ?? timeframe;

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

      <div className="mt-6 flex items-center gap-2">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            disabled={loading}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              timeframe === tf.value ? "bg-sky-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {tf.label}
          </button>
        ))}
        {loading && (
          <span className="flex items-center gap-1.5 text-xs text-white/50">
            <Spinner />
            loading {timeframeLabel}…
          </span>
        )}
      </div>

      <div className="relative mt-6 min-h-[360px]">
        <CandlestickChart data={history} />
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-sm text-white/80">
              <Spinner size={16} />
              Loading {symbol} · {timeframeLabel}…
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
