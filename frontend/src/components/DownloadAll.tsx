"use client";

import { useEffect, useRef, useState } from "react";

import { ProgressBar } from "@/components/RankingRunStatus";
import { getDownloadAllStatus, startDownloadAll } from "@/lib/api";
import type { DownloadAllItem, DownloadAllState, DownloadAllStatus, RankingUniverse } from "@/types/market";

const POLL_MS = 5000;

const UNIVERSE_LABELS: Record<RankingUniverse, string> = {
  sp500: "S&P 500",
  nasdaq: "Nasdaq",
  russell2000: "Russell 2000",
  nyse: "NYSE",
};

const STATE_STYLES: Record<DownloadAllState, string> = {
  pending: "bg-white/10 text-white/50",
  running: "bg-white/15 text-white",
  cached: "bg-white/10 text-white/70",
  finished: "bg-rise/15 text-rise",
  failed: "bg-fall/15 text-fall",
};

const STATE_LABELS: Record<DownloadAllState, string> = {
  pending: "Oczekuje",
  running: "Pobieranie",
  cached: "Z cache",
  finished: "Zapisano",
  failed: "Błąd",
};

function itemDetail(item: DownloadAllItem) {
  if (item.state === "running" && item.total > 0) {
    return `${Math.round((item.processed / item.total) * 100)}%`;
  }
  if (item.state === "cached") return "użyto ostatniego przebiegu";
  if (item.state === "failed") return item.error ?? "nieznany błąd";
  return "";
}

/** Top-of-dashboard "Download all": S&P 500, then Nasdaq, then Russell 2000, then NYSE,
 *  each saved to the database and reused while still inside the cache window. */
export function DownloadAll() {
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
          {isRunning ? "Pobieranie…" : "Pobierz wszystko"}
        </button>
        <span className="text-xs text-white/50">
          Pobiera S&amp;P 500, potem Nasdaq, potem Russell 2000, potem NYSE za jednym razem i zapisuje wszystko w bazie danych.
          Uniwersa pobrane w ciągu ostatnich 24 godzin są zamiast tego reużywane. Wyniki zapisują się etapami (po
          każdym kroku D1 / W1 / H4+H1), więc już w trakcie pobierania możesz korzystać z tego, co jest gotowe.
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-fall">Pobieranie wszystkiego nie powiodło się: {error}</p>}

      {status && status.status !== "idle" && (
        <div className="mt-4 space-y-3">
          {isRunning && (
            <ProgressBar
              label={`Pobieranie ${status.current ? UNIVERSE_LABELS[status.current] : "…"}`}
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
                    {STATE_LABELS[item.state]}
                  </span>
                </div>
                <p className="mt-1 text-white/40">{itemDetail(item)}</p>
              </li>
            ))}
          </ul>
          {status.status === "finished" && (
            <p className="text-xs text-white/60">
              Zakończono{status.finished_at ? ` o ${new Date(status.finished_at).toLocaleString()}` : ""}. Wszystko
              zapisano w bazie danych - otwórz zakładkę S&amp;P 500, Nasdaq, Russell 2000 lub NYSE, żeby zobaczyć rankingi.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
