import Link from "next/link";

import type { Quote, SymbolTrend, TrendOutlook, WatchlistSymbol } from "@/types/market";

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

const TREND_COLUMNS: { key: Exclude<keyof SymbolTrend, "symbol">; label: string; title: string }[] = [
  { key: "week", label: "W1", title: "Weekly Ichimoku trend" },
  { key: "day", label: "D1", title: "Daily Ichimoku trend" },
  { key: "h4", label: "H4", title: "4-hour Ichimoku trend" },
  { key: "h1", label: "H1", title: "1-hour Ichimoku trend" },
];

const TREND_BADGE_STYLES: Record<TrendOutlook, string> = {
  bullish: "bg-rise/15 text-rise",
  bearish: "bg-fall/15 text-fall",
  neutral: "bg-white/10 text-white/50",
};

const TREND_BADGE_LABELS: Record<TrendOutlook, string> = {
  bullish: "Bull",
  bearish: "Bear",
  neutral: "Neut",
};

function TrendBadge({ outlook }: { outlook: TrendOutlook | null | undefined }) {
  if (!outlook) return <span className="text-white/20">···</span>;
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TREND_BADGE_STYLES[outlook]}`}
    >
      {TREND_BADGE_LABELS[outlook]}
    </span>
  );
}

function groupBySector(symbols: WatchlistSymbol[]): [string, WatchlistSymbol[]][] {
  const groups = new Map<string, WatchlistSymbol[]>();
  for (const entry of symbols) {
    const list = groups.get(entry.sector) ?? [];
    list.push(entry);
    groups.set(entry.sector, list);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === "Index") return -1;
    if (b === "Index") return 1;
    return a.localeCompare(b);
  });
}

function SectorTable({
  sector,
  symbols,
  quotesBySymbol,
  trendsBySymbol,
}: {
  sector: string;
  symbols: WatchlistSymbol[];
  quotesBySymbol: Record<string, Quote>;
  trendsBySymbol: Record<string, SymbolTrend>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/70">{sector === "Index" ? "Indices" : sector}</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">Change %</th>
              {TREND_COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium" title={col.title}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map(({ symbol }) => {
              const quote = quotesBySymbol[symbol];
              const trend = trendsBySymbol[symbol];
              const isUp = (quote?.change ?? 0) >= 0;
              return (
                <tr key={symbol} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/ichimoku?symbol=${symbol}`} className="font-medium text-white hover:underline">
                      {symbol}
                    </Link>
                    {quote?.stale && (
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                        delayed
                      </span>
                    )}
                  </td>
                  {quote ? (
                    <>
                      <td className="px-4 py-3">{formatNumber(quote.price)}</td>
                      <td className={`px-4 py-3 ${isUp ? "text-rise" : "text-fall"}`}>
                        {isUp ? "+" : ""}
                        {formatNumber(quote.change)}
                      </td>
                      <td className={`px-4 py-3 ${isUp ? "text-rise" : "text-fall"}`}>
                        {isUp ? "+" : ""}
                        {formatNumber(quote.change_percent)}%
                      </td>
                    </>
                  ) : (
                    <td className="px-4 py-3 text-white/30" colSpan={3}>
                      loading…
                    </td>
                  )}
                  {TREND_COLUMNS.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <TrendBadge outlook={trend?.[col.key] ?? null} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Watchlist({
  symbols,
  quotesBySymbol,
  trendsBySymbol,
}: {
  symbols: WatchlistSymbol[];
  quotesBySymbol: Record<string, Quote>;
  trendsBySymbol: Record<string, SymbolTrend>;
}) {
  const sections = groupBySector(symbols);

  return (
    <div className="flex flex-col gap-8">
      {sections.map(([sector, sectorSymbols]) => (
        <SectorTable
          key={sector}
          sector={sector}
          symbols={sectorSymbols}
          quotesBySymbol={quotesBySymbol}
          trendsBySymbol={trendsBySymbol}
        />
      ))}
    </div>
  );
}
