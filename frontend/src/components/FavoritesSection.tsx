"use client";

import { Fragment, useState } from "react";

import { FavoriteStar } from "@/components/FavoriteStar";
import { IchimokuLink } from "@/components/IchimokuLink";
import { TrendBadge } from "@/components/TrendBadge";
import { useFavoriteNotes } from "@/hooks/useFavoriteNotes";
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
  const { notes, saveNote } = useFavoriteNotes();
  // Row whose notes are expanded, and the one being edited (with its draft).
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ symbol: string; text: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const na = <span className="text-white/30">{t("brak", "n/a", "k. A.")}</span>;
  // Symbol, sector, price, change, change %, the trend columns and notes.
  const colCount = 6 + TREND_COLUMNS.length;
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
                <th className="px-4 py-2 font-medium">{t("Notatki", "Notes", "Notizen")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isUp = (row.change ?? row.changePercent ?? 0) >= 0;
                const tone = isUp ? "text-rise" : "text-fall";
                const note = notes[row.symbol];
                const expanded = open === row.symbol || editing?.symbol === row.symbol;
                return (
                  <Fragment key={row.symbol}>
                  <tr className="border-b border-white/5 last:border-0 hover:bg-white/5">
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
                    <td className="max-w-xs px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : row.symbol)}
                        className="block w-full truncate text-left text-xs text-white/60 hover:text-white"
                        title={t("Kliknij, żeby rozwinąć lub edytować", "Click to expand or edit", "Klicken zum Aufklappen oder Bearbeiten")}
                      >
                        {expanded ? "▾ " : "▸ "}
                        {note ? note.split("\n")[0] : t("dodaj notatkę", "add a note", "Notiz hinzufügen")}
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-white/5 bg-white/[0.03]">
                      <td colSpan={colCount} className="px-4 py-3">
                        {editing?.symbol === row.symbol ? (
                          <div className="space-y-2">
                            <textarea
                              value={editing.text}
                              onChange={(e) => setEditing({ symbol: row.symbol, text: e.target.value })}
                              rows={12}
                              className="w-full rounded border border-white/10 bg-slate-900 p-2 text-xs text-white/80"
                            />
                            <div className="flex gap-2 text-xs">
                              <button
                                type="button"
                                className="rounded border border-white/20 px-2 py-1 text-white/80 hover:text-white"
                                onClick={() =>
                                  saveNote(row.symbol, editing.text)
                                    .then(() => {
                                      setEditing(null);
                                      setSaveError(null);
                                    })
                                    .catch((err: Error) => setSaveError(err.message))
                                }
                              >
                                {t("Zapisz", "Save", "Speichern")}
                              </button>
                              <button type="button" className="px-2 py-1 text-white/50 hover:text-white" onClick={() => setEditing(null)}>
                                {t("Anuluj", "Cancel", "Abbrechen")}
                              </button>
                              {saveError && <span className="text-fall">{saveError}</span>}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="whitespace-pre-line text-xs leading-relaxed text-white/70">
                              {note ?? t("Brak notatek.", "No notes.", "Keine Notizen.")}
                            </p>
                            <button
                              type="button"
                              className="text-xs text-white/50 underline hover:text-white"
                              onClick={() => setEditing({ symbol: row.symbol, text: note ?? "" })}
                            >
                              {t("Edytuj", "Edit", "Bearbeiten")}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
