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
  if (!status) return null;

  const { summary } = status;
  const isRunning = status.status === "running";
  const bgRunning = status.background_status === "running";
  const outOf = (n: number) => `${n}/${summary?.symbols_total ?? 0}`;

  return (
    <div className="mt-4 space-y-3">
      {isRunning && (
        <ProgressBar
          label={
            status.phase === "targets"
              ? "Krok 2/2 · Pobieranie celów cenowych analityków (1 rok)"
              : "Krok 1/2 · Pobieranie cen, zmian i trendów D1 / W1 / H4 / H1"
          }
          value={percent(status.processed, status.total)}
        />
      )}

      {status.status === "failed" && (
        <div className="rounded-xl border border-fall/30 bg-fall/10 p-4 text-sm">
          <span className="rounded bg-fall/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-fall">
            Błąd
          </span>
          <p className="mt-2 text-white/70">
            Przebieg zatrzymał się: {status.error ?? "nieznany błąd"}. Nic nie zostało nadpisane - poprzedni
            zapisany ranking jest wciąż pokazywany. Spróbuj ponownie za kilka minut.
          </p>
        </div>
      )}

      {status.status === "finished" && summary && (
        <div className="rounded-xl border border-rise/30 bg-rise/5 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-rise/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-rise">
              Zakończono
            </span>
            <span className="text-xs text-white/50">{new Date(summary.finished_at).toLocaleString()}</span>
          </div>

          <p className="mt-3 text-xs font-semibold text-white/70">Pobrano i zapisano w bazie danych:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-white/60">
            <li>
              <span className="text-white/80">Ceny</span> (ostatnie zamknięcie, dzienne wysoka/niska, wolumen) -{" "}
              {outOf(summary.with_prices)} symboli
            </li>
            <li>
              <span className="text-white/80">Zmiana i zmiana %</span> za 1 dzień, 1 tydzień, 1 miesiąc, 6 miesięcy i 1
              rok - {outOf(summary.with_changes)} symboli
            </li>
            <li>
              <span className="text-white/80">Trendy Ichimoku</span> D1 ({outOf(summary.with_trend_d1)}), W1 (
              {outOf(summary.with_trend_w1)}), H4 ({summary.with_trend_h4 != null ? outOf(summary.with_trend_h4) : "-"})
              i H1 ({summary.with_trend_h1 != null ? outOf(summary.with_trend_h1) : "-"})
            </li>
            <li>
              <span className="text-white/80">Cele cenowe analityków</span> na kolejny rok (niski / mediana / wysoki) -{" "}
              {outOf(summary.with_targets)} symboli z pokryciem; {summary.targets_fetched} pobrano teraz,{" "}
              {summary.targets_reused} użyto z bazy danych (ważne przez 24 godziny)
            </li>
          </ul>

          <p className="mt-3 text-xs font-semibold text-white/70">Godzinne odświeżenie H1 / H4:</p>
          {bgRunning ? (
            <div className="mt-2">
              <ProgressBar
                label="Odświeżanie trendów H1 / H4"
                value={percent(status.background_processed, status.background_total)}
              />
            </div>
          ) : status.background_status === "failed" ? (
            <p className="mt-1 text-xs text-fall">
              Ostatnie godzinne odświeżenie nie powiodło się (zwykle limit żądań Yahoo); spróbuje ponownie za
              godzinę.
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/60">
              H1 i H4 są pobierane na nowo automatycznie co godzinę, dopóki backend działa
              {status.intraday_updated_at
                ? ` (ostatnio: ${new Date(status.intraday_updated_at).toLocaleTimeString()}, następnie: około ${new Date(
                    new Date(status.intraday_updated_at).getTime() + 3600_000,
                  ).toLocaleTimeString()})`
                : ""}
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
