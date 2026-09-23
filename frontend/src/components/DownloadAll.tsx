"use client";

import { useEffect, useRef, useState } from "react";

import { ProgressBar } from "@/components/RankingRunStatus";
import { getDownloadAllStatus, startDownloadAll } from "@/lib/api";
import { fmtDateTime, useLang, type Translate } from "@/lib/i18n";
import type { DownloadAllItem, DownloadAllState, DownloadAllStatus, RankingUniverse } from "@/types/market";

const POLL_MS = 5000;

const UNIVERSE_LABELS: Record<RankingUniverse, string> = {
  sp500: "S&P 500",
  nasdaq: "Nasdaq",
  russell2000: "Russell 2000",
  nyse: "NYSE",
  // Never actually shown here - "Download all" only ever covers the four
  // index universes above (DownloadAllService.ORDER on the backend) - but
  // Record<RankingUniverse, string> must stay exhaustive.
  watchlist: "Watchlist",
};

const STATE_STYLES: Record<DownloadAllState, string> = {
  pending: "bg-white/10 text-white/50",
  running: "bg-white/15 text-white",
  cached: "bg-white/10 text-white/70",
  finished: "bg-rise/15 text-rise",
  failed: "bg-fall/15 text-fall",
};

const STATE_LABELS: Record<DownloadAllState, [string, string, string]> = {
  pending: ["Oczekuje", "Pending", "Ausstehend"],
  running: ["Pobieranie", "Downloading", "Wird geladen"],
  cached: ["Z cache", "Cached", "Aus dem Cache"],
  finished: ["Zapisano", "Saved", "Gespeichert"],
  failed: ["Błąd", "Error", "Fehler"],
};

function itemDetail(item: DownloadAllItem, t: Translate) {
  if (item.state === "running" && item.total > 0) {
    return `${Math.round((item.processed / item.total) * 100)}%`;
  }
  if (item.state === "cached") return t("użyto ostatniego przebiegu", "used the last run", "letzter Lauf wiederverwendet");
  if (item.state === "failed") return item.error ?? t("nieznany błąd", "unknown error", "unbekannter Fehler");
  return "";
}

/** Top-of-dashboard "Download all": S&P 500, then Nasdaq, then Russell 2000, then NYSE,
 *  each saved to the database and reused while still inside the cache window. */
export function DownloadAll() {
  const { t } = useLang();
  const [status, setStatus] = useState<DownloadAllStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function poll() {
    getDownloadAllStatus()
      .then((s) => {
        setStatus(s);
        if (s.status !== "running") stopPolling();
      })
      .catch((err) => setError(err.message));
  }

  function startPolling() {
    stopPolling();
    timerRef.current = setInterval(poll, POLL_MS);
  }

  useEffect(() => {
    getDownloadAllStatus()
      .then((s) => {
        setStatus(s);
        if (s.status === "running") startPolling();
      })
      .catch((err) => setError(err.message));
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStart() {
    setError(null);
    startDownloadAll()
      .then((s) => {
        setStatus(s);
        startPolling();
      })
      .catch((err) => setError(err.message));
  }

  const isRunning = status?.status === "running";

  return (
    <section className="rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? t("Pobieranie…", "Downloading…", "Wird geladen…") : t("Pobierz wszystko", "Download all", "Alles laden")}
        </button>
        <span className="text-xs text-white/50">
          {t(
            "Pobiera S&P 500, potem Nasdaq, potem Russell 2000, potem NYSE za jednym razem i zapisuje wszystko w bazie danych. Uniwersa pobrane w ciągu ostatnich 24 godzin są zamiast tego reużywane. Wyniki zapisują się etapami (po każdym kroku D1 / W1 / H4+H1), więc już w trakcie pobierania możesz korzystać z tego, co jest gotowe.",
            "Downloads the S&P 500, then Nasdaq, then Russell 2000, then NYSE in one go and saves everything to the database. Universes downloaded within the last 24 hours are reused instead. Results are saved in stages (after each D1 / W1 / H4+H1 step), so you can already use what is ready while the download is still running.",
            "Lädt den S&P 500, danach Nasdaq, Russell 2000 und NYSE in einem Durchgang und speichert alles in der Datenbank. Indizes, die in den letzten 24 Stunden geladen wurden, werden stattdessen wiederverwendet. Die Ergebnisse werden schrittweise gespeichert (nach jedem D1-/W1-/H4+H1-Schritt), sodass Sie bereits während des Ladens nutzen können, was fertig ist.",
          )}
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-fall">
          {t("Pobieranie wszystkiego nie powiodło się", "Downloading everything failed", "Der Download ist fehlgeschlagen")}: {error}
        </p>}

      {status && status.status !== "idle" && (
        <div className="mt-4 space-y-3">
          {isRunning && (
            <ProgressBar
              label={`${t("Pobieranie", "Downloading", "Lade")} ${status.current ? UNIVERSE_LABELS[status.current] : "…"}`}
              value={status.percent}
            />
          )}
          <ul className="grid gap-2 sm:grid-cols-3">
            {status.items.map((item) => (
              <li key={item.universe} className="rounded-lg border border-white/10 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{UNIVERSE_LABELS[item.universe]}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATE_STYLES[item.state]}`}
                  >
                    {t(...STATE_LABELS[item.state])}
                  </span>
                </div>
                <p className="mt-1 text-white/40">{itemDetail(item, t)}</p>
              </li>
            ))}
          </ul>
          {status.status === "finished" && (
            <p className="text-xs text-white/60">
              {t(
                `Zakończono${status.finished_at ? ` o ${fmtDateTime(status.finished_at)}` : ""}. Wszystko zapisano w bazie danych - otwórz zakładkę S&P 500, Nasdaq, Russell 2000 lub NYSE, żeby zobaczyć rankingi.`,
                `Finished${status.finished_at ? ` at ${fmtDateTime(status.finished_at)}` : ""}. Everything was saved to the database – open the S&P 500, Nasdaq, Russell 2000 or NYSE tab to see the rankings.`,
                `Abgeschlossen${status.finished_at ? ` um ${fmtDateTime(status.finished_at)}` : ""}. Alles wurde in der Datenbank gespeichert – öffnen Sie den Tab S&P 500, Nasdaq, Russell 2000 oder NYSE, um die Rankings zu sehen.`,
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
