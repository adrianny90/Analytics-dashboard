"use client";

import { useEffect, useRef, useState } from "react";

import { ProgressBar } from "@/components/RankingRunStatus";
import { getRsiScanStatus, startRsiScan } from "@/lib/api";
import { fmtTime, useLang } from "@/lib/i18n";
import type { RankingUniverse, RsiFilter, RsiScanStatus, RsiTimeframe } from "@/types/market";

const POLL_MS = 3000;

export const RSI_TIMEFRAME_OPTIONS: { value: RsiTimeframe; label: string }[] = [
  { value: "h1", label: "H1" },
  { value: "h4", label: "H4" },
  { value: "day", label: "D1" },
  { value: "week", label: "W1" },
  { value: "month", label: "M1" },
];

export const RSI_TIMEFRAME_LABELS: Record<RsiTimeframe, string> = {
  h1: "H1",
  h4: "H4",
  day: "D1",
  week: "W1",
  month: "M1",
};

const INPUT_CLASS = "w-24 rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white";

/** RSI filter: pick a timeframe and an RSI range, click Scan, and every stock
 *  in the table below is checked - only the ones inside the range stay. */
export function RankingRsiFilter({
  universe,
  applied,
  matchCount,
  totalCount,
  onApply,
  onScanned,
}: {
  universe: RankingUniverse;
  applied: RsiFilter | null;
  matchCount: number;
  totalCount: number;
  onApply: (filter: RsiFilter | null) => void;
  /** Called once a scan finished, so the page can reload the ranking (which now carries the fresh RSI values). */
  onScanned: () => Promise<void>;
}) {
  const { t } = useLang();
  const [timeframe, setTimeframe] = useState<RsiTimeframe>("day");
  const [minValue, setMinValue] = useState("10");
  const [maxValue, setMaxValue] = useState("40");
  const [scan, setScan] = useState<RsiScanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<RsiFilter | null>(null);
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
      pendingRef.current = null;
      setError(s.error ?? t("Skan nie powiódł się.", "The scan failed.", "Der Scan ist fehlgeschlagen."));
      return;
    }
    try {
      await onScanned();
      if (pendingRef.current) onApply(pendingRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    pendingRef.current = null;
  }

  function poll() {
    getRsiScanStatus(universe)
      .then((s) => {
        setScan(s);
        if (s.status !== "running") void finish(s);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    // Picks up a scan that is still running (e.g. the page was reopened).
    getRsiScanStatus(universe)
      .then((s) => {
        setScan(s);
        if (s.status === "running") timerRef.current = setInterval(poll, POLL_MS);
      })
      .catch(() => undefined);
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe]);

  const min = Number(minValue);
  const max = Number(maxValue);
  const rangeValid = minValue.trim() !== "" && maxValue.trim() !== "" && Number.isFinite(min) && Number.isFinite(max);
  const isRunning = scan?.status === "running";

  function handleScan() {
    setError(null);
    if (!rangeValid || min > max || min < 0 || max > 100) {
      setError(
        t(
          "Podaj poprawny zakres: RSI min i max między 0 a 100, min nie większe od max.",
          "Enter a valid range: RSI min and max between 0 and 100, min not greater than max.",
          "Geben Sie einen gültigen Bereich ein: RSI min und max zwischen 0 und 100, min nicht größer als max.",
        ),
      );
      return;
    }
    pendingRef.current = { timeframe, min, max };
    startRsiScan(universe, timeframe)
      .then((s) => {
        setScan(s);
        if (s.status === "running") {
          stopPolling();
          timerRef.current = setInterval(poll, POLL_MS);
        } else {
          void finish(s);
        }
      })
      .catch((err) => {
        pendingRef.current = null;
        setError(err.message);
      });
  }

  function handleClear() {
    setError(null);
    onApply(null);
  }

  return (
    <section className="mt-6 rounded-xl border border-white/10 p-4">
      <h2 className="text-sm font-semibold">{t("Filtr RSI", "RSI filter", "RSI-Filter")}</h2>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>
            <span className="font-semibold text-white">{t("Interwał", "Timeframe", "Zeitrahmen")}</span>
          </span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as RsiTimeframe)}
            disabled={isRunning}
            className={INPUT_CLASS}
          >
            {RSI_TIMEFRAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>
            <span className="font-semibold text-white">RSI min</span> (0-100)
          </span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            disabled={isRunning}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          <span>
            <span className="font-semibold text-white">RSI max</span> (0-100)
          </span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            disabled={isRunning}
            className={INPUT_CLASS}
          />
        </label>
        <button
          onClick={handleScan}
          disabled={isRunning}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? t("Skanowanie…", "Scanning…", "Scannen…") : t("Skanuj", "Scan", "Scannen")}
        </button>
        {applied && (
          <button
            onClick={handleClear}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/5"
          >
            {t("Wyczyść filtr", "Clear filter", "Filter zurücksetzen")}
          </button>
        )}
      </div>

      {isRunning && scan && (
        <div className="mt-4">
          <ProgressBar
            label={t(
              `Skanowanie RSI ${scan.timeframe ? RSI_TIMEFRAME_LABELS[scan.timeframe] : ""} dla każdej spółki`,
              `Scanning RSI ${scan.timeframe ? RSI_TIMEFRAME_LABELS[scan.timeframe] : ""} for every stock`,
              `RSI ${scan.timeframe ? RSI_TIMEFRAME_LABELS[scan.timeframe] : ""} wird für jede Aktie gescannt`,
            )}
            value={scan.total > 0 ? Math.min(100, Math.round((scan.processed / scan.total) * 100)) : 0}
          />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-fall">{error}</p>}

      {applied && !isRunning && (
        <p className="mt-3 text-xs text-white/70">
          <span className="rounded bg-rise/15 px-2 py-0.5 font-semibold text-rise">{t("Filtr aktywny", "Filter active", "Filter aktiv")}</span>{" "}
          {t(
            <>
              RSI {RSI_TIMEFRAME_LABELS[applied.timeframe]} między {applied.min} a {applied.max}: pokazano{" "}
              <span className="font-semibold text-white">{matchCount}</span> z {totalCount} spółek.
            </>,
            <>
              RSI {RSI_TIMEFRAME_LABELS[applied.timeframe]} between {applied.min} and {applied.max}: showing{" "}
              <span className="font-semibold text-white">{matchCount}</span> of {totalCount} stocks.
            </>,
            <>
              RSI {RSI_TIMEFRAME_LABELS[applied.timeframe]} zwischen {applied.min} und {applied.max}:{" "}
              <span className="font-semibold text-white">{matchCount}</span> von {totalCount} Aktien angezeigt.
            </>,
          )}
          {scan?.status === "finished" && scan.timeframe === applied.timeframe && (
            <span className="text-white/40">
              {" "}
              {t(
                `RSI ${scan.source === "cached" ? "użyto wartości wciąż aktualnych" : "pobrano na nowo"}${scan.updated_at ? `, policzono ${fmtTime(scan.updated_at)}` : ""}.`,
                `RSI ${scan.source === "cached" ? "reused values that were still current" : "downloaded again"}${scan.updated_at ? `, calculated at ${fmtTime(scan.updated_at)}` : ""}.`,
                `RSI ${scan.source === "cached" ? "aus noch aktuellen Werten übernommen" : "neu geladen"}${scan.updated_at ? `, berechnet um ${fmtTime(scan.updated_at)}` : ""}.`,
              )}
            </span>
          )}
        </p>
      )}

      <p className="mt-3 text-xs text-white/40">
        {t(
          "RSI(14), wygładzanie Wildera - dokładnie to samo co panel RSI na wykresie. Skan sprawdza każdą spółkę w tabeli i zostawia tylko te, których RSI na wybranym interwale mieści się w zakresie (np. D1, min 10, max 40). Wartości RSI policzone niedawno przez Start są reużywane; w przeciwnym razie ten interwał jest pobierany dla całej listy (M1 zawsze wymaga własnego pobrania za pierwszym razem).",
          "RSI(14) with Wilder smoothing – exactly the same as the RSI panel on the chart. The scan checks every stock in the table and keeps only those whose RSI on the chosen timeframe falls within the range (e.g. D1, min 10, max 40). RSI values calculated recently by Start are reused; otherwise that timeframe is downloaded for the whole list (M1 always needs its own download the first time).",
          "RSI(14) mit Wilder-Glättung – exakt derselbe wie im RSI-Panel des Charts. Der Scan prüft jede Aktie in der Tabelle und behält nur diejenigen, deren RSI im gewählten Zeitrahmen im Bereich liegt (z. B. D1, min 10, max 40). Kürzlich durch Start berechnete RSI-Werte werden wiederverwendet; andernfalls wird dieser Zeitrahmen für die gesamte Liste geladen (M1 muss beim ersten Mal immer separat geladen werden).",
        )}
      </p>
    </section>
  );
}
