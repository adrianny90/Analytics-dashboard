import type { IndexSummary, Quote } from "@/types/market";

function formatNumber(value: number | null, digits = 2) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function IndexCard({ index, liveQuote }: { index: IndexSummary; liveQuote?: Quote }) {
  const quote = liveQuote ?? index.quote;
  const isUp = (quote.change ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-white/70">{index.name}</h3>
        <span className="text-xs text-white/40">{index.proxy_symbol}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-white">{formatNumber(quote.price)}</p>
      <p className={`mt-1 text-sm font-medium ${isUp ? "text-rise" : "text-fall"}`}>
        {isUp ? "+" : ""}
        {formatNumber(quote.change)} ({isUp ? "+" : ""}
        {formatNumber(quote.change_percent)}%)
      </p>
    </div>
  );
}
