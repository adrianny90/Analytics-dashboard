import Link from "next/link";

import { TrendBadge } from "@/components/TrendBadge";
import { formatNumber } from "@/lib/format";
import type { RankingEntry } from "@/types/market";

const TREND_COLUMNS: { key: "week" | "day" | "h4" | "h1"; label: string; title: string }[] = [
  { key: "day", label: "D1", title: "Daily Ichimoku trend (highest weight)" },
  { key: "h4", label: "H4", title: "4-hour Ichimoku trend" },
  { key: "week", label: "W1", title: "Weekly Ichimoku trend" },
  { key: "h1", label: "H1", title: "1-hour Ichimoku trend (lowest weight)" },
];

export function RankingTable({ entries }: { entries: RankingEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-white/40">No results yet - start a scan to build the ranking.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/50">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="px-4 py-3 font-medium">Sector</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Change</th>
            <th className="px-4 py-3 font-medium">Change %</th>
            {TREND_COLUMNS.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium" title={col.title}>
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 font-medium" title="Weighted score: day*4 + h4*3 + week*2 + h1*1">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const quote = entry.quote;
            const isUp = (quote?.change ?? 0) >= 0;
            return (
              <tr key={entry.symbol} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 text-white/40">{entry.rank}</td>
                <td className="px-4 py-3">
                  <Link href={`/ichimoku?symbol=${entry.symbol}`} className="font-medium text-white hover:underline">
                    {entry.symbol}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white/50">{entry.sector}</td>
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
                    n/a
                  </td>
                )}
                {TREND_COLUMNS.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <TrendBadge outlook={entry[col.key]} />
                  </td>
                ))}
                <td className="px-4 py-3 font-medium text-white">{entry.score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
