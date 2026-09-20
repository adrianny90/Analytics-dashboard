"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchBox, matchesQuery } from "@/components/SearchBox";
import { TrendBadge } from "@/components/TrendBadge";
import { formatNumber } from "@/lib/format";
import type { Quote, SymbolTrend, WatchlistSymbol } from "@/types/market";

const TREND_COLUMNS: { key: Exclude<keyof SymbolTrend, "symbol">; label: string; title: string }[] = [
  { key: "week", label: "W1", title: "Tygodniowy trend Ichimoku" },
  { key: "day", label: "D1", title: "Dzienny trend Ichimoku" },
  { key: "h4", label: "H4", title: "4-godzinny trend Ichimoku" },
  { key: "h1", label: "H1", title: "1-godzinny trend Ichimoku" },
];

function groupBySector(symbols: WatchlistSymbol[]): [string, WatchlistSymbol[]][] {
  const groups = new Map<string, WatchlistSymbol[]>();
  for (const entry of symbols) {
    const list = groups.get(entry.sector) ?? [];
    list.push(entry);
    groups.set(entry.sector, list);
  }
  const sectorRank = (sector: string) => {
    if (sector === "Index") return 0;
    if (sector === "Custom") return 1;
    return 2;
  };

  return Array.from(groups.entries()).sort(([a], [b]) => {
    const rankDiff = sectorRank(a) - sectorRank(b);
    if (rankDiff !== 0) return rankDiff;
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
      <h3 className="text-sm font-semibold text-white/70">{sector === "Index" ? "Indeksy" : sector}</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Sektor</th>
              <th className="px-4 py-3 font-medium">Cena</th>
              <th className="px-4 py-3 font-medium">Zmiana</th>
              <th className="px-4 py-3 font-medium">Zmiana %</th>
              {TREND_COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium" title={col.title}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map(({ symbol, sector: rowSector }) => {
              const quote = quotesBySymbol[symbol];
              const trend = trendsBySymbol[symbol];
              const isUp = (quote?.change ?? 0) >= 0;
              return (
                <tr key={symbol} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/ichimoku?symbol=${symbol}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white hover:underline"
                    >
                      {symbol}
                    </Link>
                    {quote?.stale && (
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                        opóźnione
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/50">{rowSector}</td>
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
                      wczytywanie…
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
  const [query, setQuery] = useState("");
  const visible = symbols.filter((entry) => matchesQuery(query, entry.symbol, entry.sector));
  const sections = groupBySector(visible);

  return (
    <div className="flex flex-col gap-8">
      <SearchBox value={query} onChange={setQuery} resultLabel={`Znaleziono: ${visible.length} z ${symbols.length}`} />
      {query.trim() && visible.length === 0 && (
        <p className="text-sm text-white/40">Brak wyników dla „{query.trim()}”.</p>
      )}
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
