import { fmtDateTime, fmtTime, useLang } from "@/lib/i18n";
import type { RankingStatus } from "@/types/market";

function percent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

export function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="h-full rounded-full bg-rise transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** Progress bar while a run is going, then the "Finished" label describing
 *  what was downloaded and saved, plus the hourly H1/H4 refresh. */
export function RankingRunStatus({ status }: { status: RankingStatus | null }) {
  const { t } = useLang();
  if (!status) return null;

  const { summary } = status;
  const isRunning = status.status === "running";
  const bgRunning = status.background_status === "running";
  const outOf = (n: number) => `${n}/${summary?.symbols_total ?? 0}`;
  const symbolsWord = t("symboli", "symbols", "Symbole");
  const unknownError = t("nieznany błąd", "unknown error", "unbekannter Fehler");

  return (
    <div className="mt-4 space-y-3">
      {isRunning && (
        <ProgressBar
          label={
            status.phase === "targets"
              ? t(
                  "Krok 2/2 · Pobieranie celów cenowych analityków (1 rok)",
                  "Step 2/2 · Downloading analyst price targets (1 year)",
                  "Schritt 2/2 · Analysten-Kursziele werden geladen (1 Jahr)",
                )
              : t(
                  "Krok 1/2 · Pobieranie cen, zmian i trendów D1 / W1 / H4 / H1",
                  "Step 1/2 · Downloading prices, changes and D1 / W1 / H4 / H1 trends",
                  "Schritt 1/2 · Kurse, Veränderungen und D1-/W1-/H4-/H1-Trends werden geladen",
                )
          }
          value={percent(status.processed, status.total)}
        />
      )}

      {status.status === "failed" && (
        <div className="rounded-xl border border-fall/30 bg-fall/10 p-4 text-sm">
          <span className="rounded bg-fall/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-fall">
            {t("Błąd", "Error", "Fehler")}
          </span>
          <p className="mt-2 text-white/70">
            {t(
              `Przebieg zatrzymał się: ${status.error ?? unknownError}. Nic nie zostało nadpisane - poprzedni zapisany ranking jest wciąż pokazywany. Spróbuj ponownie za kilka minut.`,
              `The run stopped: ${status.error ?? unknownError}. Nothing was overwritten – the previously saved ranking is still shown. Try again in a few minutes.`,
              `Der Lauf wurde abgebrochen: ${status.error ?? unknownError}. Es wurde nichts überschrieben – das zuvor gespeicherte Ranking wird weiterhin angezeigt. Versuchen Sie es in ein paar Minuten erneut.`,
            )}
          </p>
        </div>
      )}

      {status.status === "finished" && summary && (
        <div className="rounded-xl border border-rise/30 bg-rise/5 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-rise/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-rise">
              {t("Zakończono", "Finished", "Abgeschlossen")}
            </span>
            <span className="text-xs text-white/50">{fmtDateTime(summary.finished_at)}</span>
          </div>

          <p className="mt-3 text-xs font-semibold text-white/70">
            {t("Pobrano i zapisano w bazie danych:", "Downloaded and saved to the database:", "Geladen und in der Datenbank gespeichert:")}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-white/60">
            <li>
              <span className="text-white/80">{t("Ceny", "Prices", "Kurse")}</span>{" "}
              {t(
                "(ostatnie zamknięcie, dzienne wysoka/niska, wolumen)",
                "(last close, daily high/low, volume)",
                "(letzter Schlusskurs, Tageshoch/-tief, Volumen)",
              )}{" "}
              - {outOf(summary.with_prices)} {symbolsWord}
            </li>
            <li>
              <span className="text-white/80">{t("Zmiana i zmiana %", "Change and change %", "Änderung und Änderung in %")}</span>{" "}
              {t(
                "za 1 dzień, 1 tydzień, 1 miesiąc, 6 miesięcy i 1 rok",
                "over 1 day, 1 week, 1 month, 6 months and 1 year",
                "über 1 Tag, 1 Woche, 1 Monat, 6 Monate und 1 Jahr",
              )}{" "}
              - {outOf(summary.with_changes)} {symbolsWord}
            </li>
            <li>
              <span className="text-white/80">{t("Trendy Ichimoku", "Ichimoku trends", "Ichimoku-Trends")}</span> D1 (
              {outOf(summary.with_trend_d1)}), W1 ({outOf(summary.with_trend_w1)}), H4 (
              {summary.with_trend_h4 != null ? outOf(summary.with_trend_h4) : "-"}) {t("i", "and", "und")} H1 (
              {summary.with_trend_h1 != null ? outOf(summary.with_trend_h1) : "-"})
            </li>
            <li>
              <span className="text-white/80">{t("Cele cenowe analityków", "Analyst price targets", "Analysten-Kursziele")}</span>{" "}
              {t(
                `na kolejny rok (niski / mediana / wysoki) - ${outOf(summary.with_targets)} symboli z pokryciem; ${summary.targets_fetched} pobrano teraz, ${summary.targets_reused} użyto z bazy danych (ważne przez 24 godziny)`,
                `for the next year (low / median / high) - ${outOf(summary.with_targets)} symbols covered; ${summary.targets_fetched} fetched now, ${summary.targets_reused} reused from the database (valid for 24 hours)`,
                `für das kommende Jahr (niedrig / Median / hoch) – ${outOf(summary.with_targets)} Symbole mit Abdeckung; ${summary.targets_fetched} jetzt geladen, ${summary.targets_reused} aus der Datenbank wiederverwendet (24 Stunden gültig)`,
              )}
            </li>
          </ul>

          <p className="mt-3 text-xs font-semibold text-white/70">
            {t("Godzinne odświeżenie H1 / H4:", "Hourly H1 / H4 refresh:", "Stündliche H1-/H4-Aktualisierung:")}
          </p>
          {bgRunning ? (
            <div className="mt-2">
              <ProgressBar
                label={t("Odświeżanie trendów H1 / H4", "Refreshing H1 / H4 trends", "H1-/H4-Trends werden aktualisiert")}
                value={percent(status.background_processed, status.background_total)}
              />
            </div>
          ) : status.background_status === "failed" ? (
            <p className="mt-1 text-xs text-fall">
              {t(
                "Ostatnie godzinne odświeżenie nie powiodło się (zwykle limit żądań Yahoo); spróbuje ponownie za godzinę.",
                "The last hourly refresh failed (usually Yahoo's rate limit); it will try again in an hour.",
                "Die letzte stündliche Aktualisierung ist fehlgeschlagen (meist wegen des Yahoo-Anfragelimits); der nächste Versuch erfolgt in einer Stunde.",
              )}
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/60">
              {t(
                "H1 i H4 są pobierane na nowo automatycznie co godzinę, dopóki backend działa",
                "H1 and H4 are re-downloaded automatically every hour while the backend is running",
                "H1 und H4 werden automatisch jede Stunde neu geladen, solange das Backend läuft",
              )}
              {status.intraday_updated_at
                ? t(
                    ` (ostatnio: ${fmtTime(status.intraday_updated_at)}, następnie: około ${fmtTime(new Date(status.intraday_updated_at).getTime() + 3600_000)})`,
                    ` (last: ${fmtTime(status.intraday_updated_at)}, next: around ${fmtTime(new Date(status.intraday_updated_at).getTime() + 3600_000)})`,
                    ` (zuletzt: ${fmtTime(status.intraday_updated_at)}, nächste: ca. ${fmtTime(new Date(status.intraday_updated_at).getTime() + 3600_000)})`,
                  )
                : ""}
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
