"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Spinner } from "@/components/Spinner";
import { StatTile as Stat } from "@/components/StatTile";
import { TradeChart, type ChartView } from "@/components/forex/TradeChart";
import {
  addDescription,
  entryConditions,
  entryContext,
  exitDescription,
  exitReasonShort,
  fmtDate,
  fmtPct,
  fmtPx,
  fmtUsd,
  pairDescription,
  pairDigits,
  pairLabel,
  stopReasonText,
  strategyName,
  strategyRules,
} from "@/lib/forexText";
import { useLang } from "@/lib/i18n";
import type { ForexPairFile, ForexStrategy, ForexTrade, ForexTradesFile } from "@/types/forex";

type ResultFilter = "all" | "win" | "loss";
type SortKey = "date" | "pnl" | "pct";

const pairCache = new Map<string, Promise<ForexPairFile>>();

function loadPair(pair: string): Promise<ForexPairFile> {
  let p = pairCache.get(pair);
  if (!p) {
    p = fetch(`/forex/pairs/${pair}.json`).then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json() as Promise<ForexPairFile>;
    });
    pairCache.set(pair, p);
    p.catch(() => pairCache.delete(pair));
  }
  return p;
}

function EquityChart({ strategy }: { strategy: ForexStrategy }) {
  const { t } = useLang();
  const [log, setLog] = useState(true);
  const rows = useMemo(
    () => strategy.equity.map(([d, v]) => ({ date: d, eq: log ? Math.max(v, 1) : v })),
    [strategy, log],
  );
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{t("Saldo rachunku (koniec tygodnia)", "Account balance (week end)", "Kontostand (Wochenende)")}</p>
        <button
          type="button"
          onClick={() => setLog((v) => !v)}
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white/80"
        >
          {log ? t("Skala logarytmiczna", "Log scale", "Log-Skala") : t("Skala liniowa", "Linear scale", "Lineare Skala")}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={rows} margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" stroke="#cbd5e1" fontSize={11} minTickGap={48} tickFormatter={(d: string) => d.slice(0, 7)} />
          <YAxis
            stroke="#cbd5e1"
            fontSize={11}
            width={64}
            scale={log ? "log" : "linear"}
            domain={log ? ["auto", "auto"] : [0, "auto"]}
            allowDataOverflow
            tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(Math.round(v)))}
          />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs">
                  <p className="text-white/60">{fmtDate(String(label))}</p>
                  <p className="font-medium tabular-nums text-white">{fmtUsd(Number(payload[0].value))}</p>
                </div>
              ) : null
            }
          />
          <Line dataKey="eq" stroke="#eab308" dot={false} strokeWidth={1.5} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TradeDetail({ strategy, trade, onPrev, onNext }: { strategy: ForexStrategy; trade: ForexTrade; onPrev?: () => void; onNext?: () => void }) {
  const { t } = useLang();
  const [data, setData] = useState<ForexPairFile | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<ChartView>("full");
  const p = strategy.params;
  const digits = pairDigits(trade.pair);
  const cross = pairDescription(t, trade.pair, trade.dir);
  const conditions = entryConditions(t, trade, p, digits);
  const days = Math.round((new Date(trade.exit_date).getTime() - new Date(trade.entry_date).getTime()) / 86_400_000);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(false);
    loadPair(trade.pair)
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [trade.pair]);

  const views: [ChartView, string][] = [
    ["full", t("Cała transakcja", "Whole trade", "Gesamter Trade")],
    ["entry", t("Wejście", "Entry", "Einstieg")],
    ["exit", t("Wyjście", "Exit", "Ausstieg")],
  ];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">
            {t("Transakcja", "Trade", "Trade")} #{trade.id} · {trade.dir > 0 ? "LONG" : "SHORT"}
          </p>
          <h2 className="text-xl font-semibold text-white">{cross.name}</h2>
          <p className="text-sm text-white/60">{cross.meaning}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!onPrev}
            onClick={onPrev}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 disabled:opacity-30"
          >
            ← {t("Poprzednia", "Previous", "Vorheriger")}
          </button>
          <button
            type="button"
            disabled={!onNext}
            onClick={onNext}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 disabled:opacity-30"
          >
            {t("Następna", "Next", "Nächster")} →
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t("Wynik", "Result", "Ergebnis")} value={fmtUsd(trade.pnl)} tone={trade.pnl >= 0 ? "rise" : "fall"} />
        <Stat label={t("% kapitału", "% of equity", "% des Kapitals")} value={fmtPct(trade.pnl_pct)} tone={trade.pnl >= 0 ? "rise" : "fall"} />
        <Stat label={t("Kapitał przy wejściu", "Equity at entry", "Kapital beim Einstieg")} value={fmtUsd(trade.equity_before)} />
        <Stat label={t("Części (z dokładkami)", "Units (with adds)", "Einheiten (mit Aufstockungen)")} value={`${trade.units} / ${p.max_units}`} />
        <Stat label={t("Maks. nominał / kapitał", "Max notional / equity", "Max. Nominal / Kapital")} value={`x${trade.nominal_x.toFixed(1)}`} />
        <Stat label={t("Czas trwania", "Duration", "Dauer")} value={`${days} ${t("dni", "days", "Tage")}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div>
            <p className="mb-1 font-medium text-white/80">
              {t("Dlaczego wejście", "Why the entry", "Warum der Einstieg")} ({t("sygnał", "signal", "Signal")} {fmtDate(trade.signal_date)})
            </p>
            <ul className="space-y-1">
              {conditions.map((c) => (
                <li key={c.text} className="flex gap-2">
                  <span className={c.ok ? "text-rise" : "text-fall"}>{c.ok ? "✓" : "✗"}</span>
                  <span className="text-white/80">{c.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-white/50">{entryContext(t, trade, digits)}</p>
          </div>
          <div>
            <p className="mb-1 font-medium text-white/80">{t("Wejście i dokładki", "Entry and adds", "Einstieg und Aufstockungen")}</p>
            <ul className="space-y-1 text-white/70">
              {trade.adds.map((_, i) => (
                <li key={i}>{addDescription(t, trade, i, p, digits)}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="mb-1 font-medium text-white/80">{t("Stop loss - skąd taki poziom", "Stop loss - why this level", "Stop-Loss - warum dieses Niveau")}</p>
            <ul className="max-h-40 space-y-0.5 overflow-y-auto pr-1 text-white/70">
              {trade.stops.map(([d, v, why], i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {fmtDate(d)} - {stopReasonText(t, why, p)}
                    {why === "init" && trade.atr ? ` (${fmtPx(trade.entry_px, digits)} − ${p.stop_k} × ${fmtPx(trade.atr, digits)})` : ""}
                  </span>
                  <span className="shrink-0 tabular-nums text-fall">{fmtPx(v, digits)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-medium text-white/80">
              {t("Dlaczego wyjście", "Why the exit", "Warum der Ausstieg")} · {exitReasonShort(t, trade.exit_reason)}
            </p>
            <p className="text-white/70">{exitDescription(t, trade, p, digits)}</p>
            <p className="mt-1 text-xs text-white/50">
              {t("Swapy w trakcie transakcji", "Swaps during the trade", "Swaps während des Trades")}: {fmtUsd(trade.swap)} ·{" "}
              {t("kapitał po wyjściu", "equity after exit", "Kapital nach Ausstieg")}: {fmtUsd(trade.equity_after)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {views.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-md border px-3 py-1 text-xs ${
              view === v ? "border-amber-400/60 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-fall">{t("Nie udało się wczytać danych pary.", "Could not load the pair data.", "Paardaten konnten nicht geladen werden.")}</p>}
      {!data && !error && (
        <div className="flex h-60 items-center justify-center">
          <Spinner />
        </div>
      )}
      {data && (
        <div className="mt-2 space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium text-white/80">
              D1 · {pairLabel(trade.pair)} · {t("świece dzienne", "daily candles", "Tageskerzen")}
            </p>
            <TradeChart data={data} trade={trade} tf="d1" view={view} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-white/80">
              W1 · {pairLabel(trade.pair)} · {t("świece tygodniowe (filtr trendu)", "weekly candles (trend filter)", "Wochenkerzen (Trendfilter)")}
            </p>
            <TradeChart data={data} trade={trade} tf="w1" view={view} height={380} />
          </div>
        </div>
      )}
    </section>
  );
}

export function ForexPage() {
  const { t } = useLang();
  const [file, setFile] = useState<ForexTradesFile | null>(null);
  const [error, setError] = useState(false);
  const [strategyId, setStrategyId] = useState("rekord-2020");
  const [pair, setPair] = useState("all");
  const [result, setResult] = useState<ResultFilter>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/forex/trades.json")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<ForexTradesFile>;
      })
      .then(setFile)
      .catch(() => setError(true));
  }, []);

  const strategy = file?.strategies.find((s) => s.id === strategyId) ?? file?.strategies[0] ?? null;

  const trades = useMemo(() => {
    if (!strategy) return [];
    const list = strategy.trades.filter(
      (tr) => (pair === "all" || tr.pair === pair) && (result === "all" || (result === "win" ? tr.pnl > 0 : tr.pnl <= 0)),
    );
    if (sort === "pnl") return [...list].sort((a, b) => b.pnl - a.pnl);
    if (sort === "pct") return [...list].sort((a, b) => (b.pnl_pct ?? 0) - (a.pnl_pct ?? 0));
    return list;
  }, [strategy, pair, result, sort]);

  const perPair = useMemo(() => {
    if (!strategy) return [];
    const m = new Map<string, { n: number; wins: number; pnl: number }>();
    for (const tr of strategy.trades) {
      const r = m.get(tr.pair) ?? { n: 0, wins: 0, pnl: 0 };
      r.n += 1;
      r.wins += tr.pnl > 0 ? 1 : 0;
      r.pnl += tr.pnl;
      m.set(tr.pair, r);
    }
    return [...m.entries()].sort((a, b) => b[1].pnl - a[1].pnl);
  }, [strategy]);

  // Default selection: the trade with the largest profit of the current list.
  useEffect(() => {
    if (!trades.length) {
      setSelectedId(null);
      return;
    }
    if (selectedId == null || !trades.some((tr) => tr.id === selectedId)) {
      setSelectedId(trades.reduce((best, tr) => (tr.pnl > best.pnl ? tr : best), trades[0]).id);
    }
  }, [trades, selectedId]);

  const selIdx = trades.findIndex((tr) => tr.id === selectedId);
  const selected = selIdx >= 0 ? trades[selIdx] : null;

  const select = (id: number) => {
    setSelectedId(id);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  if (error) {
    return (
      <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6">
        <p className="text-fall">{t("Brak danych transakcji (public/forex/trades.json).", "No trade data (public/forex/trades.json).", "Keine Tradedaten (public/forex/trades.json).")}</p>
      </main>
    );
  }
  if (!file || !strategy) {
    return (
      <main className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </main>
    );
  }

  const st = strategy.stats;
  const selectClass = "rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white";

  return (
    <main className="mx-auto max-w-[1800px] space-y-5 px-4 py-6 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Forex · {t("transakcje z backtestu", "backtest trades", "Backtest-Trades")}</h1>
        <p className="max-w-4xl text-sm text-white/60">
          {t(
            "Każda transakcja z backtestu Ichimoku D1 z filtrem W1 i dokładkami: wykres D1 i W1 z chmurą, Tenkan/Kijun, MA100, MA200 i Kijun 52 (D1 i W1), moment i cena wejścia, dokładek i wyjścia, ścieżka stop lossa oraz opis warunków. 12 instrumentów na jednym rachunku, start 10 000 USD, swapy i koszty doliczone. To wynik historyczny, nie rekomendacja.",
            "Every trade of the Ichimoku D1 backtest with a W1 filter and pyramiding: D1 and W1 charts with the cloud, Tenkan/Kijun, MA100, MA200 and Kijun 52 (D1 and W1), the time and price of the entry, adds and exit, the stop-loss path and a description of the conditions. 12 instruments on one account, 10,000 USD start, swaps and costs included. Historical result, not a recommendation.",
            "Jeder Trade des Ichimoku-D1-Backtests mit W1-Filter und Aufstockungen: D1- und W1-Chart mit Wolke, Tenkan/Kijun, MA100, MA200 und Kijun 52 (D1 und W1), Zeitpunkt und Kurs von Einstieg, Aufstockungen und Ausstieg, Stop-Loss-Verlauf und Beschreibung der Bedingungen. 12 Instrumente auf einem Konto, Start 10.000 USD, Swaps und Kosten berücksichtigt. Historisches Ergebnis, keine Empfehlung.",
          )}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {file.strategies.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setStrategyId(s.id);
              setSelectedId(null);
            }}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              s.id === strategy.id ? "border-amber-400/60 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {strategyName(t, s)}
          </button>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t("Start", "Start", "Start")} value={`${fmtUsd(strategy.start_equity)}`} />
            <Stat label={t("Saldo końcowe", "Final balance", "Endstand")} value={fmtUsd(strategy.final)} tone={strategy.final >= strategy.start_equity ? "rise" : "fall"} />
            <Stat label={t("Maks. obsunięcie", "Max drawdown", "Max. Drawdown")} value={fmtPct((st.dd ?? 0) * 100, 0)} tone="fall" />
            <Stat label={t("Rocznie (CAGR)", "Per year (CAGR)", "Pro Jahr (CAGR)")} value={fmtPct((st.cagr ?? 0) * 100, 0)} />
            <Stat label={t("Transakcje", "Trades", "Trades")} value={String(strategy.trades.length)} />
            <Stat label={t("Trafne", "Winners", "Gewinner")} value={`${Math.round((st.plus ?? 0) * 100)}%`} />
            <Stat label="R:R" value={(st.rr ?? 0).toFixed(1)} />
            <Stat label={t("Od", "From", "Ab")} value={fmtDate(strategy.start)} />
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-white/70">
            {strategyRules(t, strategy.params).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </div>
        <EquityChart strategy={strategy} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2 text-sm font-medium text-white/80">{t("Wynik na parach", "Result by pair", "Ergebnis je Paar")}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-white/40">
                <th className="py-1 font-medium">{t("Para", "Pair", "Paar")}</th>
                <th className="py-1 text-right font-medium">{t("Tr.", "Tr.", "Tr.")}</th>
                <th className="py-1 text-right font-medium">{t("Traf.", "Win", "Gew.")}</th>
                <th className="py-1 text-right font-medium">USD</th>
              </tr>
            </thead>
            <tbody>
              {perPair.map(([p, r]) => (
                <tr
                  key={p}
                  onClick={() => setPair(pair === p ? "all" : p)}
                  className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${pair === p ? "bg-amber-400/10" : ""}`}
                >
                  <td className="py-1">{pairLabel(p)}</td>
                  <td className="py-1 text-right tabular-nums">{r.n}</td>
                  <td className="py-1 text-right tabular-nums">{r.wins}</td>
                  <td className={`py-1 text-right tabular-nums ${r.pnl >= 0 ? "text-rise" : "text-fall"}`}>{fmtUsd(r.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm font-medium text-white/80">
              {t("Transakcje", "Trades", "Trades")} ({trades.length})
            </p>
            <select value={pair} onChange={(e) => setPair(e.target.value)} className={selectClass}>
              <option value="all">{t("Wszystkie pary", "All pairs", "Alle Paare")}</option>
              {file.pairs.map((p) => (
                <option key={p} value={p}>
                  {pairLabel(p)}
                </option>
              ))}
            </select>
            <select value={result} onChange={(e) => setResult(e.target.value as ResultFilter)} className={selectClass}>
              <option value="all">{t("Zyskowne i stratne", "Wins and losses", "Gewinne und Verluste")}</option>
              <option value="win">{t("Tylko zyskowne", "Wins only", "Nur Gewinne")}</option>
              <option value="loss">{t("Tylko stratne", "Losses only", "Nur Verluste")}</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClass}>
              <option value="date">{t("Wg daty", "By date", "Nach Datum")}</option>
              <option value="pnl">{t("Wg wyniku USD", "By USD result", "Nach USD-Ergebnis")}</option>
              <option value="pct">{t("Wg % kapitału", "By % of equity", "Nach % des Kapitals")}</option>
            </select>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-950">
                <tr className="text-left text-[11px] uppercase tracking-wide text-white/40">
                  <th className="px-2 py-1 font-medium">#</th>
                  <th className="px-2 py-1 font-medium">{t("Para", "Pair", "Paar")}</th>
                  <th className="px-2 py-1 font-medium">{t("Wejście", "Entry", "Einstieg")}</th>
                  <th className="px-2 py-1 text-right font-medium">{t("Cena", "Price", "Kurs")}</th>
                  <th className="px-2 py-1 font-medium">{t("Wyjście", "Exit", "Ausstieg")}</th>
                  <th className="px-2 py-1 text-right font-medium">{t("Cena", "Price", "Kurs")}</th>
                  <th className="px-2 py-1 font-medium">{t("Powód", "Reason", "Grund")}</th>
                  <th className="px-2 py-1 text-right font-medium">{t("Części", "Units", "Einh.")}</th>
                  <th className="px-2 py-1 text-right font-medium">USD</th>
                  <th className="px-2 py-1 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((tr) => {
                  const d = pairDigits(tr.pair);
                  return (
                    <tr
                      key={tr.id}
                      onClick={() => select(tr.id)}
                      className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${tr.id === selectedId ? "bg-amber-400/10" : ""}`}
                    >
                      <td className="px-2 py-1 text-white/40">{tr.id}</td>
                      <td className="px-2 py-1">{pairLabel(tr.pair)}</td>
                      <td className="px-2 py-1 tabular-nums">{fmtDate(tr.entry_date)}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmtPx(tr.entry_px, d)}</td>
                      <td className="px-2 py-1 tabular-nums">{fmtDate(tr.exit_date)}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmtPx(tr.exit_px, d)}</td>
                      <td className="px-2 py-1 text-white/60">{exitReasonShort(t, tr.exit_reason)}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{tr.units}</td>
                      <td className={`px-2 py-1 text-right tabular-nums ${tr.pnl >= 0 ? "text-rise" : "text-fall"}`}>{fmtUsd(tr.pnl)}</td>
                      <td className={`px-2 py-1 text-right tabular-nums ${tr.pnl >= 0 ? "text-rise" : "text-fall"}`}>{fmtPct(tr.pnl_pct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div ref={detailRef} className="scroll-mt-4">
        {selected && (
          <TradeDetail
            key={`${strategy.id}-${selected.id}`}
            strategy={strategy}
            trade={selected}
            onPrev={selIdx > 0 ? () => setSelectedId(trades[selIdx - 1].id) : undefined}
            onNext={selIdx < trades.length - 1 ? () => setSelectedId(trades[selIdx + 1].id) : undefined}
          />
        )}
      </div>
    </main>
  );
}
