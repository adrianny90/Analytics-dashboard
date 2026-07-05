import Link from "next/link";

import type { Quote, WatchlistSymbol } from "@/types/market";

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
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

function SectorTable({ sector, symbols, quotesBySymbol }: { sector: string; symbols: WatchlistSymbol[]; quotesBySymbol: Record<string, Quote> }) {
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
            </tr>
          </thead>
          <tbody>
            {symbols.map(({ symbol }) => {
              const quote = quotesBySymbol[symbol];
              const isUp = (quote?.change ?? 0) >= 0;
              return (
                <tr key={symbol} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/symbol/${symbol}`} className="font-medium text-white hover:underline">
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
}: {
  symbols: WatchlistSymbol[];
  quotesBySymbol: Record<string, Quote>;
}) {
  const sections = groupBySector(symbols);

  return (
    <div className="flex flex-col gap-8">
      {sections.map(([sector, sectorSymbols]) => (
        <SectorTable key={sector} sector={sector} symbols={sectorSymbols} quotesBySymbol={quotesBySymbol} />
      ))}
    </div>
  );
}
