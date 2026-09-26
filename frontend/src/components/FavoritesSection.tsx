"use client";

import { FavoriteStar } from "@/components/FavoriteStar";
import { IchimokuLink } from "@/components/IchimokuLink";
import { TrendBadge } from "@/components/TrendBadge";
import { formatNumber } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import type { TrendOutlook } from "@/types/market";

export interface FavoriteRow {
  symbol: string;
  sector?: string | null;
  price?: number | null;
  change?: number | null;
  changePercent?: number | null;
  trends?: Partial<Record<"week" | "day" | "h4" | "h1", TrendOutlook | null>>;
}

const TREND_COLUMNS = [
  { key: "week", label: "W1" },
  { key: "day", label: "D1" },
  { key: "h4", label: "H4" },
  { key: "h1", label: "H1" },
] as const;

/** "Watched" - the starred tickers, shown above the main company table (on
 * the dashboard and on every ranking tab). Un-starring a row here removes it
 * everywhere, since the stars are one shared, database-backed set. */
export function FavoritesSection({
  rows,
  onToggleFavorite,
  error,
  emptyHint,
}: {
  rows: FavoriteRow[];
  onToggleFavorite: (symbol: string) => void;
  error?: string | null;
  emptyHint: string;
}) {
  const { t } = useLang();
  const na = <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>;
  return (
    <section className="mx-auto max-w-5xl">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <span className="text-yellow-400">★</span>
        {t("Obserwowane", "Watched", "Beobachtet")}
        {rows.length > 0 && <span className="text-sm font-normal text-white/40">({rows.length})</span>}
      </h2>
      {error && (
        <p className="mt-1 text-sm text-fall">
          {t("Nie udało się zapisać/wczytać obserwowanych", "Failed to save/load watched stocks", "Beobachtete Aktien konnten nicht gespeichert/geladen werden")}: {error}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="mt-1 text-sm text-white/40">{emptyHint}</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="px-4 py-2 font-medium">Symbol</th>
                <th className="px-4 py-2 font-medium">{t("Sektor", "Sector", "Sektor")}</th>
                <th className="px-4 py-2 font-medium">{t("Cena", "Price", "Kurs")}</th>
                <th className="px-4 py-2 font-medium">{t("Zmiana", "Change", "Änderung")}</th>
                <th className="px-4 py-2 font-medium">{t("Zmiana %", "Change %", "Änderung %")}</th>
                {TREND_COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-2 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isUp = (row.change ?? row.changePercent ?? 0) >= 0;
                const tone = isUp ? "text-rise" : "text-fall";
                return (
                  <tr key={row.symbol} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-2">
                      <FavoriteStar active onToggle={() => onToggleFavorite(row.symbol)} />
                      <IchimokuLink symbol={row.symbol} className="font-medium text-white hover:underline" />
                    </td>
                    <td className="px-4 py-2 text-white/50">{row.sector ?? "-"}</td>
                    <td className="px-4 py-2">{row.price != null ? formatNumber(row.price) : na}</td>
                    <td className={`px-4 py-2 ${tone}`}>
                      {row.change != null ? `${isUp ? "+" : ""}${formatNumber(row.change)}` : na}
                    </td>
                    <td className={`px-4 py-2 ${tone}`}>
                      {row.changePercent != null ? `${isUp ? "+" : ""}${formatNumber(row.changePercent)}%` : na}
                    </td>
                    {TREND_COLUMNS.map((col) => (
                      <td key={col.key} className="px-4 py-2">
                        <TrendBadge outlook={row.trends?.[col.key] ?? null} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
