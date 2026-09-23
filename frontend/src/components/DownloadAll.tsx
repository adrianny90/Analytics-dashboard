"use client";

import { useEffect, useRef, useState } from "react";

import { ProgressBar } from "@/components/RankingRunStatus";
import { getDownloadAllStatus, getDownloadAllTargetsStatus, startDownloadAll, startDownloadAllTargets } from "@/lib/api";
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

/** Start + status polling for one "download everything" job (prices or analyst forecasts). */
function useDownloadAllJob(getStatus: () => Promise<DownloadAllStatus>, start: () => Promise<DownloadAllStatus>) {
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
    getStatus()
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
    getStatus()
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
    start()
      .then((s) => {
        setStatus(s);
        startPolling();
      })
      .catch((err) => setError(err.message));
  }

  return { status, error, isRunning: status?.status === "running", handleStart };
}

function JobStatus({
  title,
  status,
  error,
  finishedText,
}: {
  title: string;
  status: DownloadAllStatus | null;
  error: string | null;
  finishedText: (finishedAt: string | null) => string;
}) {
  const { t } = useLang();
  if (!error && (!status || status.status === "idle")) return null;
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-white/70">{title}</p>
      {error && (
        <p className="text-sm text-fall">
          {t("Nie powiodło się", "Failed", "Fehlgeschlagen")}: {error}
        </p>
      )}
      {status && status.status !== "idle" && (
        <>
          {status.status === "running" && (
            <ProgressBar
              label={`${t("Pobieranie", "Downloading", "Lade")} ${status.current ? UNIVERSE_LABELS[status.current] : "…"}`}
              value={status.percent}
            />
          )}
          <ul className="grid gap-2 sm:grid-cols-4">
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
          {status.status === "finished" && <p className="text-xs text-white/60">{finishedText(status.finished_at)}</p>}
        </>
      )}
    </div>
  );
}

/** Top-of-dashboard downloads for S&P 500, then Nasdaq, then Russell 2000, then NYSE,
 *  each saved to the database and reused while still inside the cache window:
 *  "Download all" fetches prices (the Start run), "Download all forecasts" the
 *  analyst price targets - two separate jobs. */
export function DownloadAll() {
  const { t } = useLang();
  const prices = useDownloadAllJob(getDownloadAllStatus, startDownloadAll);
  const targets = useDownloadAllJob(getDownloadAllTargetsStatus, startDownloadAllTargets);
  const at = (finishedAt: string | null, pl: string) => (finishedAt ? `${pl}${fmtDateTime(finishedAt)}` : "");

  return (
    <section className="space-y-4 rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={prices.handleStart}
          disabled={prices.isRunning}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prices.isRunning ? t("Pobieranie…", "Downloading…", "Wird geladen…") : t("Pobierz wszystko", "Download all", "Alles laden")}
        </button>
        <button
          onClick={targets.handleStart}
          disabled={targets.isRunning}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {targets.isRunning
            ? t("Pobieranie prognoz…", "Downloading forecasts…", "Prognosen werden geladen…")
            : t("Pobierz wszystkie prognozy", "Download all forecasts", "Alle Prognosen laden")}
        </button>
      </div>
      <p className="text-xs text-white/50">
        {t(
          "Oba przyciski przechodzą po kolei przez S&P 500, Nasdaq, Russell 2000 i NYSE i zapisują wyniki w bazie danych. „Pobierz wszystko” pobiera ceny, zmiany i trendy D1 / W1 / H4 / H1 (zapisywane etapami, więc już w trakcie możesz korzystać z tego, co jest gotowe). „Pobierz wszystkie prognozy” pobiera roczne cele cenowe analityków - to najwolniejsza część (jedno zapytanie na spółkę), dlatego jest osobno. Dane pobrane w ciągu ostatnich 24 godzin są reużywane zamiast pobierane ponownie.",
          "Both buttons go through S&P 500, Nasdaq, Russell 2000 and NYSE in turn and save the results to the database. “Download all” fetches prices, changes and D1 / W1 / H4 / H1 trends (saved in stages, so you can already use what is ready while it runs). “Download all forecasts” fetches one-year analyst price targets - the slowest part (one request per stock), which is why it is separate. Data downloaded within the last 24 hours is reused instead of downloaded again.",
          "Beide Schaltflächen gehen nacheinander S&P 500, Nasdaq, Russell 2000 und NYSE durch und speichern die Ergebnisse in der Datenbank. „Alles laden“ lädt Kurse, Veränderungen und D1-/W1-/H4-/H1-Trends (schrittweise gespeichert, sodass Sie schon während des Ladens nutzen können, was fertig ist). „Alle Prognosen laden“ lädt die Einjahres-Kursziele der Analysten – der langsamste Teil (eine Anfrage pro Aktie), daher separat. Innerhalb der letzten 24 Stunden geladene Daten werden wiederverwendet statt erneut geladen.",
        )}
      </p>

      <JobStatus
        title={t("Ceny i trendy", "Prices and trends", "Kurse und Trends")}
        status={prices.status}
        error={prices.error}
        finishedText={(finishedAt) =>
          t(
            `Zakończono${at(finishedAt, " o ")}. Wszystko zapisano w bazie danych - otwórz zakładkę S&P 500, Nasdaq, Russell 2000 lub NYSE, żeby zobaczyć rankingi.`,
            `Finished${at(finishedAt, " at ")}. Everything was saved to the database – open the S&P 500, Nasdaq, Russell 2000 or NYSE tab to see the rankings.`,
            `Abgeschlossen${at(finishedAt, " um ")}. Alles wurde in der Datenbank gespeichert – öffnen Sie den Tab S&P 500, Nasdaq, Russell 2000 oder NYSE, um die Rankings zu sehen.`,
          )
        }
      />
      <JobStatus
        title={t("Prognozy analityków", "Analyst forecasts", "Analystenprognosen")}
        status={targets.status}
        error={targets.error}
        finishedText={(finishedAt) =>
          t(
            `Zakończono${at(finishedAt, " o ")}. Cele cenowe analityków zapisano w bazie danych - widać je w kolumnach celów w rankingach.`,
            `Finished${at(finishedAt, " at ")}. Analyst price targets were saved to the database – they show up in the target columns of the rankings.`,
            `Abgeschlossen${at(finishedAt, " um ")}. Die Analysten-Kursziele wurden in der Datenbank gespeichert – sie erscheinen in den Kursziel-Spalten der Rankings.`,
          )
        }
      />
    </section>
  );
}
