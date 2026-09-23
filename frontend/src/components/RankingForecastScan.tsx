"use client";

import { useEffect, useRef, useState } from "react";

import { ProgressBar } from "@/components/RankingRunStatus";
import { getForecastScanStatus, startForecastScan } from "@/lib/api";
import { fmtDateTime, useLang } from "@/lib/i18n";
import type { RankingUniverse, RsiScanStatus } from "@/types/market";

const POLL_MS = 3000;

/** Button above the table that runs the volatility forecast (method C) for
 *  every stock and saves it to the database. */
export function RankingForecastScan({
  universe,
  onScanned,
}: {
  universe: RankingUniverse;
  /** Called once a run finished, so the page can reload the ranking (which now carries the fresh forecasts). */
  onScanned: () => Promise<void>;
}) {
  const { t } = useLang();
  const [scan, setScan] = useState<RsiScanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function finish(s: RsiScanStatus) {
    stopPolling();
    if (s.status === "failed") {
      setError(s.error ?? t("Przebieg prognozy nie powiódł się.", "The forecast run failed.", "Der Prognoselauf ist fehlgeschlagen."));
      return;
    }
    try {
      await onScanned();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function poll() {
    getForecastScanStatus(universe)
      .then((s) => {
        setScan(s);
        if (s.status !== "running") void finish(s);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    // Picks up a run that is still going (e.g. the page was reopened).
    getForecastScanStatus(universe)
      .then((s) => {
        setScan(s);
        if (s.status === "running") timerRef.current = setInterval(poll, POLL_MS);
      })
      .catch(() => undefined);
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe]);

  function handleClick() {
    setError(null);
    startForecastScan(universe)
      .then((s) => {
        setScan(s);
        if (s.status === "running") {
          stopPolling();
          timerRef.current = setInterval(poll, POLL_MS);
        } else {
          void finish(s);
        }
      })
      .catch((err) => setError(err.message));
  }

  const isRunning = scan?.status === "running";
  const percent = scan && scan.total > 0 ? Math.min(100, Math.round((scan.processed / scan.total) * 100)) : 0;

  return (
    <section className="mt-6 rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleClick}
          disabled={isRunning}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? t("Liczenie…", "Calculating…", "Wird berechnet…") : t("Oblicz prognozę zmienności", "Calculate volatility forecast", "Volatilitätsprognose berechnen")}
        </button>
        <span className="text-xs text-white/50">
          {t(
            <>
              Uzupełnia kolumny <span className="text-white/70">Pasmo zmienności 3M</span> i{" "}
              <span className="text-white/70">P(±15%) 3M</span> dla każdej spółki i zapisuje je w bazie danych.
            </>,
            <>
              Fills in the <span className="text-white/70">3M volatility band</span> and{" "}
              <span className="text-white/70">P(±15%) 3M</span> columns for every stock and saves them to the database.
            </>,
            <>
              Befüllt die Spalten <span className="text-white/70">3M-Volatilitätsband</span> und{" "}
              <span className="text-white/70">P(±15 %) 3M</span> für jede Aktie und speichert sie in der Datenbank.
            </>,
          )}
        </span>
      </div>

      {isRunning && (
        <div className="mt-4">
          <ProgressBar label={t("Pobieranie dziennych cen i obliczanie zmienności", "Downloading daily prices and calculating volatility", "Tageskurse werden geladen und Volatilität berechnet")} value={percent} />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-fall">{error}</p>}

      {scan?.status === "finished" && (
        <p className="mt-3 text-xs text-white/60">
          <span className="rounded bg-rise/15 px-2 py-0.5 font-semibold text-rise">{t("Zapisano", "Saved", "Gespeichert")}</span>{" "}
          {scan.source === "cached"
            ? t(
                "Użyto przebiegu z ostatnich 24 godzin (już w bazie danych).",
                "Used a run from the last 24 hours (already in the database).",
                "Ein Lauf der letzten 24 Stunden wurde wiederverwendet (bereits in der Datenbank).",
              )
            : t(
                "Pobrano i policzono dla każdej spółki, i zapisano w bazie danych.",
                "Downloaded and calculated for every stock, and saved to the database.",
                "Für jede Aktie geladen und berechnet und in der Datenbank gespeichert.",
              )}
          {scan.updated_at
            ? t(` Policzono ${fmtDateTime(scan.updated_at)}.`, ` Calculated ${fmtDateTime(scan.updated_at)}.`, ` Berechnet am ${fmtDateTime(scan.updated_at)}.`)
            : ""}
        </p>
      )}

      <p className="mt-3 text-xs text-white/40">
        {t(
          "Metoda C korzysta wyłącznie ze zmienności, bez uczenia maszynowego: przedział to dzisiejsza cena przeskalowana przez własną 3-miesięczną zmienność spółki, dobrana tak, żeby w backteście S&P 500 (2016-2026) około 80% realnych 3-miesięcznych cen znalazło się w środku (79,8% w latach, których model nie widział). P(±15%) to szansa, że cena zostanie w granicach 15% dzisiejszej po 3 miesiącach, policzona z tej samej zmienności.",
          "Method C uses volatility only, with no machine learning: the range is today's price scaled by the stock's own 3-month volatility, calibrated so that in the S&P 500 backtest (2016–2026) about 80% of actual 3-month prices fell inside it (79.8% in years the model had not seen). P(±15%) is the probability that the price stays within 15% of today's level after 3 months, computed from the same volatility.",
          "Methode C verwendet ausschließlich die Volatilität, ohne maschinelles Lernen: Das Intervall ist der heutige Kurs, skaliert mit der eigenen 3-Monats-Volatilität der Aktie und so kalibriert, dass im S&P-500-Backtest (2016–2026) rund 80 % der tatsächlichen 3-Monats-Kurse innerhalb lagen (79,8 % in Jahren, die das Modell nicht gesehen hatte). P(±15 %) ist die Wahrscheinlichkeit, dass der Kurs nach 3 Monaten innerhalb von 15 % des heutigen Niveaus bleibt, berechnet aus derselben Volatilität.",
        )}
      </p>
    </section>
  );
}
