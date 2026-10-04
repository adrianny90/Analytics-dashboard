"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Spinner } from "@/components/Spinner";
import { StatTile as Stat } from "@/components/StatTile";
import { TradeChart, type ChartView } from "@/components/forex/TradeChart";
import { SimHelp } from "@/components/sim/SimHelp";
import { fmtDate, fmtPct, fmtPx, fmtUsd } from "@/lib/forexText";
import { useLang } from "@/lib/i18n";
import { loadSim, loadStockChart, type StockChart } from "@/lib/simData";
import { simulate, stats, windowStart, type SimStats } from "@/lib/simEngine";
import { INDEX_LABEL, addText, entryConditions, entryContext, exitShort, exitText, simRules } from "@/lib/simText";
import type { ForexTrade } from "@/types/forex";
import type { SimArrays, SimIndex, SimMeta, SimParams, SimResult, SimTrade } from "@/types/sim";

const ALL_INDICES: SimIndex[] = ["SP500", "NASDAQ", "NYSE", "RUSSELL"];

const DEFAULTS: SimParams = {
  indices: ["SP500"],
  symbols: [],
  years: 10,
  capital: 10000,
  position: 0.05,
  add: 0.05,
  maxPositions: 0,
  maxPerMonth: 0,
  stop: 0,
  maExit: 60,
  nBelow: 5,
  needProfit: true,
  seed: 1,
  minUpside: 0.2,
  maxUpside: 0,
  minFirms: 3,
  minPrice: 0,
  minTurnover: 0,
  maRising: false,
  aboveCloud: false,
  aboveWk52: false,
  minScore: null,
  marketUp: false,
  sectors: [],
};

function benchmarkFor(indices: SimIndex[]): string {
  if (indices.length === 1 && indices[0] === "NASDAQ") return "QQQ";
  if (indices.length === 1 && indices[0] === "RUSSELL") return "IWM";
  return "SPY";
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/60" title={hint}>
      {label}
      <span className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white"
        />
        {suffix && <span className="text-white/40">{suffix}</span>}
      </span>
      {hint && <span className="text-[10px] text-white/35">{hint}</span>}
    </label>
  );
}

/** Same shape as a Forex trade so the existing D1/W1 trade chart can draw it. */
function toChartTrade(meta: SimMeta, tr: SimTrade, p: SimParams): ForexTrade {
  const d = (x: number) => meta.dates[meta.sim_start + x];
  const adds: ForexTrade["adds"] = [
    { date: d(tr.entry), signal_date: d(tr.signal), px: tr.entryPx, nominal: 0, atr: 0, equity: 0, capped: false, prev_px: null },
  ];
  if (tr.add != null && tr.addPx != null) {
    adds.push({ date: d(tr.add), signal_date: d(tr.addSignal ?? tr.add), px: tr.addPx, nominal: 0, atr: 0, equity: 0, capped: false, prev_px: tr.entryPx });
  }
  const stops: ForexTrade["stops"] = [];
  if (p.stop > 0) {
    const first = tr.shares * tr.entryPx * (1 + tr.cost);
    stops.push([d(tr.entry), ((1 - p.stop) * first) / (tr.shares * (1 - tr.cost)), "init"]);
    if (tr.add != null) stops.push([d(tr.add), ((1 - p.stop) * tr.spent) / ((tr.shares + tr.addShares) * (1 - tr.cost)), "add"]);
  }
  return {
    id: tr.id,
    pair: meta.stocks[tr.stock].s,
    dir: 1,
    signal_date: d(tr.signal),
    entry_date: d(tr.entry),
    entry_px: tr.entryPx,
    exit_date: d(tr.exit),
    exit_px: tr.exitPx,
    exit_reason: tr.reason === "open" ? "end" : "stop",
    exit_signal_date: tr.exitSignal != null ? d(tr.exitSignal) : null,
    pnl: tr.pnl,
    equity_before: tr.equityAtEntry,
    equity_after: 0,
    pnl_pct: (tr.pnl / tr.equityAtEntry) * 100,
    units: tr.add != null ? 2 : 1,
    nominal_x: 0,
    swap: 0,
    atr: 0,
    adds,
    stops,
    entry_snapshot: null,
    exit_snapshot: null,
  };
}

function TradeDetail({
  meta,
  arrays,
  result,
  trade,
  onPrev,
  onNext,
}: {
  meta: SimMeta;
  arrays: SimArrays;
  result: SimResult;
  trade: SimTrade;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const { t } = useLang();
  const [chart, setChart] = useState<StockChart | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<ChartView>("full");
  const stock = meta.stocks[trade.stock];
  const p = result.params;
  const d = (x: number) => meta.dates[meta.sim_start + x];

  useEffect(() => {
    let alive = true;
    setChart(null);
    setError(false);
    loadStockChart(meta, trade.stock)
      .then((c) => alive && setChart(c))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [meta, trade.stock]);

  const chartTrade = useMemo(() => toChartTrade(meta, trade, p), [meta, trade, p]);
  const sessions = trade.exit - trade.entry;
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
            {t("Transakcja", "Trade", "Trade")} #{trade.id} · LONG
          </p>
          <h2 className="text-xl font-semibold text-white">
            {stock.s}
            {stock.sec ? <span className="ml-2 text-sm font-normal text-white/50">{stock.sec}</span> : null}
          </h2>
          <p className="text-sm text-white/60">
            {stock.idx.map((i) => INDEX_LABEL[i]).join(" · ")}
            {stock.removed ? ` · ${t("wyrzucona później z S&P 500", "later removed from the S&P 500", "später aus dem S&P 500 entfernt")}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={!onPrev} onClick={onPrev} className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 disabled:opacity-30">
            ← {t("Poprzednia", "Previous", "Vorheriger")}
          </button>
          <button type="button" disabled={!onNext} onClick={onNext} className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 disabled:opacity-30">
            {t("Następna", "Next", "Nächster")} →
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label={t("Wynik", "Result", "Ergebnis")} value={fmtUsd(trade.pnl)} tone={trade.pnl >= 0 ? "rise" : "fall"} />
        <Stat label={t("Zwrot z pozycji", "Return on position", "Rendite der Position")} value={fmtPct(trade.ret * 100)} tone={trade.ret >= 0 ? "rise" : "fall"} />
        <Stat label={t("% kapitału", "% of equity", "% des Kapitals")} value={fmtPct((trade.pnl / trade.equityAtEntry) * 100)} tone={trade.pnl >= 0 ? "rise" : "fall"} />
        <Stat label={t("Wydane (z dokładką)", "Spent (with add)", "Investiert (mit Aufstockung)")} value={fmtUsd(trade.spent)} />
        <Stat label={t("Akcje", "Shares", "Aktien")} value={String(trade.shares + trade.addShares)} />
        <Stat label={t("Czas", "Duration", "Dauer")} value={`${sessions} ${t("sesji", "sessions", "Sitzungen")}`} />
        <Stat
          label={t("Najgorszy moment", "Worst point", "Tiefster Punkt")}
          value={fmtPct((trade.worst - 1) * 100)}
          tone={trade.worst < 1 ? "fall" : undefined}
          hint={t("Najniższa wartość pozycji względem wydanej kwoty (na zamknięciach)", "Lowest position value vs the amount spent (on closes)", "Niedrigster Positionswert ggü. dem investierten Betrag (Schlusskurse)")}
        />
      </div>

      {error && <p className="mt-4 text-sm text-fall">{t("Nie udało się wczytać wykresu spółki.", "Could not load the stock chart.", "Chart konnte nicht geladen werden.")}</p>}
      {!chart && !error && (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      )}
      {chart && (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 font-medium text-white/80">
                  {t("Dlaczego wejście", "Why the entry", "Warum der Einstieg")} ({t("sygnał", "signal", "Signal")} {fmtDate(d(trade.signal))})
                </p>
                <ul className="space-y-1">
                  {entryConditions(t, meta, arrays, chart, trade, p).map((c) => (
                    <li key={c.text} className="flex gap-2">
                      <span className={c.ok ? "text-rise" : "text-fall"}>{c.ok ? "✓" : "✗"}</span>
                      <span className="text-white/80">{c.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-white/50">{entryContext(t, meta, chart, trade)}</p>
              </div>
              <div>
                <p className="mb-1 font-medium text-white/80">{t("Wejście i dokładka", "Entry and add", "Einstieg und Aufstockung")}</p>
                <ul className="space-y-1 text-white/70">
                  <li>
                    {t(
                      `Kupno ${fmtDate(d(trade.entry))}: ${trade.shares} szt. po ${fmtPx(trade.entryPx, 2)} (${fmtUsd(trade.shares * trade.entryPx * (1 + trade.cost))} z kosztami), kapitał przed wejściem ${fmtUsd(trade.equityAtEntry)}.`,
                      `Buy ${fmtDate(d(trade.entry))}: ${trade.shares} sh. at ${fmtPx(trade.entryPx, 2)} (${fmtUsd(trade.shares * trade.entryPx * (1 + trade.cost))} incl. costs), equity before entry ${fmtUsd(trade.equityAtEntry)}.`,
                      `Kauf ${fmtDate(d(trade.entry))}: ${trade.shares} St. zu ${fmtPx(trade.entryPx, 2)} (${fmtUsd(trade.shares * trade.entryPx * (1 + trade.cost))} inkl. Kosten), Kapital vor dem Einstieg ${fmtUsd(trade.equityAtEntry)}.`,
                    )}
                  </li>
                  <li>
                    {addText(t, meta, chart, trade) ??
                      (p.add > 0
                        ? t("Bez dokładki - warunek nie wystąpił albo brakło gotówki.", "No add - the condition never occurred or cash ran short.", "Keine Aufstockung - Bedingung nicht erfüllt oder zu wenig Geld.")
                        : t("Dokładki wyłączone.", "Adds switched off.", "Aufstockungen ausgeschaltet."))}
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 font-medium text-white/80">
                  {t("Dlaczego wyjście", "Why the exit", "Warum der Ausstieg")} · {exitShort(t, trade.reason)}
                </p>
                <p className="text-white/70">{exitText(t, meta, chart, trade, p)}</p>
              </div>
              <div>
                <p className="mb-1 font-medium text-white/80">{t("Stop loss", "Stop loss", "Stop-Loss")}</p>
                <p className="text-white/70">
                  {p.stop > 0
                    ? t(
                        `Twój stop ${(p.stop * 100).toFixed(0)}%: poziom ceny ${fmtPx(chartTrade.stops[chartTrade.stops.length - 1]?.[1] ?? null, 2)} (wydana kwota − ${(p.stop * 100).toFixed(0)}%, liczony na zamknięciu, po dokładce przeliczony od nowa).`,
                        `Your ${(p.stop * 100).toFixed(0)}% stop: price level ${fmtPx(chartTrade.stops[chartTrade.stops.length - 1]?.[1] ?? null, 2)} (amount spent − ${(p.stop * 100).toFixed(0)}%, checked on closes, recalculated after the add).`,
                        `Ihr ${(p.stop * 100).toFixed(0)}%-Stop: Kursniveau ${fmtPx(chartTrade.stops[chartTrade.stops.length - 1]?.[1] ?? null, 2)} (investierter Betrag − ${(p.stop * 100).toFixed(0)}%, zum Schluss geprüft, nach der Aufstockung neu berechnet).`,
                      )
                    : t(
                        `Brak stopu (metodologia): pozycji ze stratą nie sprzedajemy, ${p.maExit > 0 ? `wyjątek - ${p.maExit} sesji z rzędu pod MA200 (biała linia na wykresie).` : "a wyjście awaryjne MA200 jest wyłączone."}`,
                        `No stop (the methodology): losing positions are not sold, ${p.maExit > 0 ? `except after ${p.maExit} sessions in a row below the MA200 (white line on the chart).` : "and the MA200 emergency exit is off."}`,
                        `Kein Stop (Methodik): Verlustpositionen werden nicht verkauft, ${p.maExit > 0 ? `außer nach ${p.maExit} Sitzungen in Folge unter der MA200 (weiße Linie im Chart).` : "und der MA200-Notausstieg ist aus."}`,
                      )}
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
                className={`rounded-md border px-3 py-1 text-xs ${view === v ? "border-amber-400/60 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-4">
            <div>
              <p className="mb-1 text-sm font-medium text-white/80">D1 · {stock.s} · {t("świece dzienne", "daily candles", "Tageskerzen")}</p>
              <TradeChart data={chart.file} trade={chartTrade} tf="d1" view={view} showStop={p.stop > 0} />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-white/80">W1 · {stock.s} · {t("świece tygodniowe", "weekly candles", "Wochenkerzen")}</p>
              <TradeChart data={chart.file} trade={chartTrade} tf="w1" view={view} height={380} showStop={p.stop > 0} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function EquityChart({ meta, result, bench }: { meta: SimMeta; result: SimResult; bench: string }) {
  const { t } = useLang();
  const [log, setLog] = useState(true);
  const rows = useMemo(() => {
    const e = meta.etf[bench];
    const b0 = e?.[result.start - 1] ?? e?.[result.start] ?? null;
    const step = Math.max(1, Math.floor(result.equity.length / 600));
    const out: { date: string; eq: number; bench: number | null }[] = [];
    for (let i = 0; i < result.equity.length; i += step) {
      const day = result.start + i;
      const bv = e?.[day];
      out.push({
        date: meta.dates[meta.sim_start + day],
        eq: log ? Math.max(result.equity[i], 1) : result.equity[i],
        bench: bv != null && b0 ? (result.params.capital * bv) / b0 : null,
      });
    }
    return out;
  }, [meta, result, bench, log]);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{t("Saldo rachunku", "Account balance", "Kontostand")}</p>
        <button type="button" onClick={() => setLog((v) => !v)} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white/80">
          {log ? t("Skala logarytmiczna", "Log scale", "Log-Skala") : t("Skala liniowa", "Linear scale", "Lineare Skala")}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={rows} margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" stroke="#cbd5e1" fontSize={11} minTickGap={48} tickFormatter={(x: string) => x.slice(0, 7)} />
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
                  {payload.map((x) => (
                    <p key={String(x.dataKey)} className="tabular-nums" style={{ color: x.color }}>
                      {x.dataKey === "eq" ? t("Strategia", "Strategy", "Strategie") : bench}: {fmtUsd(Number(x.value))}
                    </p>
                  ))}
                </div>
              ) : null
            }
          />
          <Legend formatter={(v: string) => (v === "eq" ? t("Strategia", "Strategy", "Strategie") : `${bench} (${t("kup i trzymaj", "buy and hold", "Kaufen und Halten")})`)} wrapperStyle={{ fontSize: 11 }} />
          <Line dataKey="eq" stroke="#eab308" dot={false} strokeWidth={1.5} isAnimationActive={false} />
          <Line dataKey="bench" stroke="#64748b" dot={false} strokeWidth={1.25} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimPage() {
  const { t } = useLang();
  const [data, setData] = useState<{ meta: SimMeta; arrays: SimArrays } | null>(null);
  const [error, setError] = useState(false);
  const [params, setParams] = useState<SimParams>(DEFAULTS);
  const [draws, setDraws] = useState(20);
  const [result, setResult] = useState<SimResult | null>(null);
  const [dist, setDist] = useState<{ seed: number; st: SimStats }[]>([]);
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "win" | "loss" | "open">("all");
  const [sort, setSort] = useState<"date" | "pnl" | "ret">("date");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSim()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const run = useCallback(
    (p: SimParams, nDraws: number) => {
      if (!data) return;
      setRunning(true);
      // Let the "running" state paint before the (synchronous) simulations.
      setTimeout(() => {
        const out: { seed: number; st: SimStats }[] = [];
        let main: SimResult | null = null;
        const seeds = Array.from({ length: Math.max(1, nDraws) }, (_, i) => i + 1);
        if (!seeds.includes(p.seed)) seeds.push(p.seed);
        for (const s of seeds) {
          const r = simulate(data.meta, data.arrays, { ...p, seed: s });
          out.push({ seed: s, st: stats(data.meta, r) });
          if (s === p.seed) main = r;
        }
        setDist(out);
        setResult(main);
        setSelectedId(null);
        setRunning(false);
      }, 20);
    },
    [data],
  );

  // First run with the defaults once the data is in.
  useEffect(() => {
    if (data && !result && !running) run(params, draws);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof SimParams>(k: K, v: SimParams[K]) => setParams((p) => ({ ...p, [k]: v }));

  const sectors = useMemo(() => {
    const m = new Map<string, number>();
    if (data) for (const st of data.meta.stocks) if (st.sec) m.set(st.sec, (m.get(st.sec) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [data]);

  const indexCounts = useMemo(() => {
    const m: Record<string, number> = {};
    if (data) for (const s of data.meta.stocks) for (const i of s.idx) m[i] = (m[i] ?? 0) + 1;
    return m;
  }, [data]);

  const suggestions = useMemo(() => {
    if (!data || query.trim().length < 1) return [];
    const q = query.trim().toUpperCase();
    return data.meta.stocks
      .filter((s) => s.s.startsWith(q) && !params.symbols.includes(s.s) && s.idx.some((i) => params.indices.includes(i)))
      .slice(0, 12);
  }, [data, query, params.symbols, params.indices]);

  const st = useMemo(() => (data && result ? stats(data.meta, result) : null), [data, result]);
  const bench = benchmarkFor(params.indices);
  const benchFinal = useMemo(() => {
    if (!data || !result) return null;
    const e = data.meta.etf[result.params.indices.length ? benchmarkFor(result.params.indices) : "SPY"];
    const a = e?.[result.start - 1] ?? e?.[result.start];
    const b = e?.[result.end];
    return a && b ? (result.params.capital * b) / a : null;
  }, [data, result]);

  const trades = useMemo(() => {
    if (!result || !data) return [];
    let list = result.trades.filter((tr) =>
      filter === "all" ? true : filter === "open" ? tr.reason === "open" : filter === "win" ? tr.reason !== "open" && tr.pnl > 0 : tr.reason !== "open" && tr.pnl <= 0,
    );
    if (sort === "pnl") list = [...list].sort((a, b) => b.pnl - a.pnl);
    if (sort === "ret") list = [...list].sort((a, b) => b.ret - a.ret);
    return list;
  }, [result, data, filter, sort]);

  useEffect(() => {
    if (!trades.length) {
      if (selectedId != null) setSelectedId(null);
      return;
    }
    if (selectedId == null || !trades.some((x) => x.id === selectedId)) {
      setSelectedId(trades.reduce((b, x) => (x.pnl > b.pnl ? x : b), trades[0]).id);
    }
  }, [trades, selectedId]);

  if (error) {
    return (
      <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6">
        <p className="text-fall">{t("Brak danych symulacji (public/sim). Uruchom backtests/export_sim.py.", "No simulation data (public/sim). Run backtests/export_sim.py.", "Keine Simulationsdaten (public/sim). backtests/export_sim.py ausführen.")}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="flex h-[60vh] flex-col items-center justify-center gap-3 text-sm text-white/60">
        <Spinner />
        {t("Wczytywanie danych ok. 2 400 spółek (ok. 31 MB)…", "Loading data for about 2,400 stocks (about 31 MB)…", "Daten von ca. 2.400 Aktien werden geladen (ca. 31 MB)…")}
      </main>
    );
  }

  const { meta, arrays } = data;
  const selIdx = trades.findIndex((x) => x.id === selectedId);
  const selected = selIdx >= 0 ? trades[selIdx] : null;
  const finals = dist.map((x) => x.st.final).sort((a, b) => a - b);
  const median = finals.length ? finals[Math.floor(finals.length / 2)] : null;
  const beat = benchFinal != null && finals.length ? finals.filter((f) => f > benchFinal).length / finals.length : null;
  const from = result ? meta.dates[meta.sim_start + result.start] : meta.dates[meta.sim_start + windowStart(meta, params.years)];
  const to = meta.dates[meta.sim_start + meta.sim_len - 1];
  const selectClass = "rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white";

  return (
    <main className="mx-auto max-w-[1800px] space-y-5 px-4 py-6 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">{t("Symulacja", "Simulation", "Simulation")}</h1>
        <p className="max-w-4xl text-sm text-white/60">
          {t(
            "Symulacja portfela akcji według najlepszej metodologii z backtestów: „trzymaj do odbicia” (przebicie Kijun 52 + MA200 + analitycy ≥ 20%) z awaryjnym wyjściem pod MA200. Wybierasz indeksy lub spółki, okres i zasady zarządzania kapitałem; kolejność spółek przy nadmiarze sygnałów jest losowana. Dane do 18.09.2026. To wynik historyczny, nie rekomendacja.",
            "Stock portfolio simulation using the best methodology from the backtests: \"hold until it recovers\" (Kijun 52 cross + MA200 + analysts ≥ 20%) with an emergency exit below the MA200. Choose indices or stocks, the period and money-management rules; when there are more signals than cash, the order of stocks is random. Data up to 18 Sep 2026. Historical result, not a recommendation.",
            "Simulation eines Aktienportfolios nach der besten Methodik aus den Backtests: „halten bis zur Erholung“ (Kijun-52-Durchbruch + MA200 + Analysten ≥ 20%) mit Notausstieg unter der MA200. Wählen Sie Indizes oder Aktien, den Zeitraum und die Money-Management-Regeln; bei mehr Signalen als Geld wird die Reihenfolge ausgelost. Daten bis 18.09.2026. Historisches Ergebnis, keine Empfehlung.",
          )}
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80">{t("Indeksy", "Indices", "Indizes")}</p>
            <div className="flex flex-wrap gap-2">
              {ALL_INDICES.map((i) => {
                const on = params.indices.includes(i);
                return (
                  <label key={i} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${on ? "border-amber-400/60 bg-amber-400/10 text-amber-100" : "border-white/10 bg-white/5 text-white/70"}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => set("indices", on ? params.indices.filter((x) => x !== i) : [...params.indices, i])}
                      className="accent-amber-400"
                    />
                    {INDEX_LABEL[i]}
                    <span className="text-xs text-white/40">{indexCounts[i] ?? 0}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-white/40">
              {t(
                "Liczba = spółki, które w 10 latach dały choć jeden sygnał bazowy. S&P 500: skład z danego dnia (z 45 spółkami później wyrzuconymi). Nasdaq / NYSE / Russell: obecni członkowie, tylko płynne.",
                "Number = stocks with at least one base signal in 10 years. S&P 500: membership as of each day (incl. 45 stocks later removed). Nasdaq / NYSE / Russell: current members, liquid only.",
                "Zahl = Aktien mit mindestens einem Basissignal in 10 Jahren. S&P 500: Zusammensetzung am jeweiligen Tag (inkl. 45 später entfernter Aktien). Nasdaq / NYSE / Russell: aktuelle Mitglieder, nur liquide.",
              )}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80">
              {t("Tylko wybrane spółki (opcjonalnie)", "Only selected stocks (optional)", "Nur ausgewählte Aktien (optional)")}
            </p>
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Wpisz symbol, np. AAPL", "Type a symbol, e.g. AAPL", "Symbol eingeben, z. B. AAPL")}
                className="w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-white/10 bg-slate-900 text-sm shadow-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s.s}
                      type="button"
                      onClick={() => {
                        set("symbols", [...params.symbols, s.s]);
                        setQuery("");
                      }}
                      className="flex w-full justify-between px-3 py-1.5 text-left hover:bg-white/10"
                    >
                      <span className="text-white">{s.s}</span>
                      <span className="text-xs text-white/40">{s.idx.map((i) => INDEX_LABEL[i]).join(", ")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {params.symbols.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("symbols", params.symbols.filter((x) => x !== s))}
                  className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white hover:bg-red-500/20"
                  title={t("Usuń", "Remove", "Entfernen")}
                >
                  {s} ✕
                </button>
              ))}
              {params.symbols.length === 0 && (
                <span className="text-[11px] text-white/40">
                  {t("Puste = wszystkie spółki z zaznaczonych indeksów.", "Empty = all stocks of the ticked indices.", "Leer = alle Aktien der gewählten Indizes.")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          <label className="flex flex-col gap-1 text-xs text-white/60">
            {t("Okres", "Period", "Zeitraum")}
            <select value={params.years} onChange={(e) => set("years", Number(e.target.value))} className={selectClass}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
                <option key={y} value={y}>
                  {y} {t(y === 1 ? "rok" : y < 5 ? "lata" : "lat", y === 1 ? "year" : "years", y === 1 ? "Jahr" : "Jahre")} {t("wstecz", "back", "zurück")}
                </option>
              ))}
            </select>
          </label>
          <NumberField label={t("Kapitał start (USD)", "Starting capital (USD)", "Startkapital (USD)")} value={params.capital} min={100} max={100_000_000} step={1000} onChange={(v) => set("capital", v)} />
          <NumberField label={t("Wielkość pozycji", "Position size", "Positionsgröße")} value={Math.round(params.position * 1000) / 10} min={0.5} max={100} step={0.5} suffix="%" onChange={(v) => set("position", v / 100)} />
          <NumberField label={t("Dokładka", "Add size", "Aufstockung")} value={Math.round(params.add * 1000) / 10} min={0} max={100} step={0.5} suffix="%" onChange={(v) => set("add", v / 100)} hint={t("0 = bez dokładki", "0 = no add", "0 = keine")} />
          <NumberField label={t("Maks. spółek naraz", "Max stocks at once", "Max. Aktien gleichzeitig")} value={params.maxPositions} min={0} max={500} onChange={(v) => set("maxPositions", Math.round(v))} hint={t("0 = bez limitu", "0 = no limit", "0 = kein Limit")} />
          <NumberField label={t("Maks. wejść w miesiącu", "Max entries per month", "Max. Einstiege pro Monat")} value={params.maxPerMonth} min={0} max={500} onChange={(v) => set("maxPerMonth", Math.round(v))} hint={t("0 = bez limitu", "0 = no limit", "0 = kein Limit")} />
          <NumberField label={t("Stop loss", "Stop loss", "Stop-Loss")} value={Math.round(params.stop * 100)} min={0} max={95} suffix="%" onChange={(v) => set("stop", v / 100)} hint={t("0 = metodologia (bez stopu)", "0 = methodology (no stop)", "0 = Methodik (kein Stop)")} />
          <NumberField label={t("Wyjście awaryjne MA200", "MA200 emergency exit", "MA200-Notausstieg")} value={params.maExit} min={0} max={500} suffix={t("sesji", "sess.", "Sitz.")} onChange={(v) => set("maExit", Math.round(v))} hint={t("60 = metodologia, 0 = wył.", "60 = methodology, 0 = off", "60 = Methodik, 0 = aus")} />
        </div>

        <div className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-sm font-medium text-white/80">
            {t("Filtry wejścia", "Entry filters", "Einstiegsfilter")}{" "}
            <span className="text-xs font-normal text-white/40">
              {t("(zawężają sygnały; puste / 0 = wyłączone)", "(narrow the signals; empty / 0 = off)", "(grenzen Signale ein; leer / 0 = aus)")}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
            <NumberField label={t("Min. potencjał analityków", "Min. analyst upside", "Min. Analystenpotenzial")} value={Math.round(params.minUpside * 100)} min={10} max={100} suffix="%" onChange={(v) => set("minUpside", v / 100)} hint={t("20 = metodologia", "20 = methodology", "20 = Methodik")} />
            <NumberField label={t("Maks. potencjał", "Max. upside", "Max. Potenzial")} value={Math.round(params.maxUpside * 100)} min={0} max={200} suffix="%" onChange={(v) => set("maxUpside", v / 100)} hint={t("0 = bez limitu", "0 = no limit", "0 = kein Limit")} />
            <NumberField label={t("Min. liczba firm analitycznych", "Min. analyst firms", "Min. Analystenhäuser")} value={params.minFirms} min={3} max={30} onChange={(v) => set("minFirms", Math.round(v))} hint={t("3 = metodologia", "3 = methodology", "3 = Methodik")} />
            <NumberField label={t("Min. cena akcji", "Min. share price", "Min. Aktienkurs")} value={params.minPrice} min={0} max={600} suffix="USD" onChange={(v) => set("minPrice", v)} hint={t("0 = bez filtra", "0 = off", "0 = aus")} />
            <NumberField label={t("Min. obrót dzienny", "Min. daily turnover", "Min. Tagesumsatz")} value={params.minTurnover} min={0} max={5000} suffix={t("mln $", "M $", "Mio. $")} onChange={(v) => set("minTurnover", v)} hint={t("0 = bez filtra", "0 = off", "0 = aus")} />
            <label className="flex flex-col gap-1 text-xs text-white/60">
              {t("Min. ocena 5 linii Ichimoku", "Min. 5-line Ichimoku score", "Min. 5-Linien-Bewertung")}
              <select
                value={params.minScore == null ? "" : String(params.minScore)}
                onChange={(e) => set("minScore", e.target.value === "" ? null : Number(e.target.value))}
                className={selectClass}
              >
                <option value="">{t("bez filtra", "off", "aus")}</option>
                {[-1, 0, 1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    ≥ {v > 0 ? `+${v}` : v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["maRising", t("MA200 rośnie", "MA200 rising", "MA200 steigt")],
                ["aboveCloud", t("Cena nad chmurą D1", "Price above the D1 cloud", "Kurs über der D1-Wolke")],
                ["aboveWk52", t("Cena nad Kijun 52 W1", "Price above the W1 Kijun 52", "Kurs über W1-Kijun-52")],
                ["marketUp", t("Rynek: SPY nad MA200", "Market: SPY above MA200", "Markt: SPY über MA200")],
              ] as [keyof SimParams, string][]
            ).map(([k, label]) => {
              const on = params[k] === true;
              return (
                <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${on ? "border-amber-400/60 bg-amber-400/10 text-amber-100" : "border-white/10 bg-white/5 text-white/70"}`}>
                  <input type="checkbox" checked={on} onChange={() => setParams((cur) => ({ ...cur, [k]: !on }))} className="accent-amber-400" />
                  {label}
                </label>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-white/50">{t("Sektory:", "Sectors:", "Sektoren:")}</span>
            {sectors.map((sec) => {
              const on = params.sectors.includes(sec);
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => set("sectors", on ? params.sectors.filter((x) => x !== sec) : [...params.sectors, sec])}
                  className={`rounded border px-2 py-0.5 text-[11px] ${on ? "border-amber-400/60 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}
                >
                  {sec}
                </button>
              );
            })}
            <span className="text-[11px] text-white/35">
              {params.sectors.length === 0 ? t("(nic nie zaznaczone = wszystkie)", "(none ticked = all)", "(nichts gewählt = alle)") : ""}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <NumberField label={t("Losowanie (ziarno)", "Draw (seed)", "Ziehung (Seed)")} value={params.seed} min={1} max={1_000_000} onChange={(v) => set("seed", Math.round(v))} />
          <button
            type="button"
            onClick={() => {
              const s = 1 + Math.floor(Math.random() * 999_999);
              const p = { ...params, seed: s };
              setParams(p);
              run(p, draws);
            }}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            🎲 {t("Losuj nowe", "New random draw", "Neu auslosen")}
          </button>
          <NumberField label={t("Losowań do statystyki", "Draws for statistics", "Ziehungen für Statistik")} value={draws} min={1} max={100} onChange={(v) => setDraws(Math.round(v))} />
          <button
            type="button"
            disabled={running || params.indices.length === 0}
            onClick={() => run(params, draws)}
            className="rounded-md border border-amber-400/60 bg-amber-400/15 px-4 py-1.5 text-sm font-medium text-amber-100 hover:bg-amber-400/25 disabled:opacity-40"
          >
            {running ? t("Liczę…", "Running…", "Rechne…") : t("Uruchom symulację", "Run simulation", "Simulation starten")}
          </button>
          <button
            type="button"
            onClick={() => {
              setParams(DEFAULTS);
              run(DEFAULTS, draws);
            }}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 hover:bg-white/10"
          >
            {t("Ustawienia metodologii", "Methodology defaults", "Methodik-Standard")}
          </button>
        </div>
      </section>

      <SimHelp />

      {result && st && (
        <>
          <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              <p className="text-sm text-white/60">
                {fmtDate(from)} – {fmtDate(to)} · {t("losowanie", "draw", "Ziehung")} #{result.params.seed} ·{" "}
                {result.params.symbols.length ? result.params.symbols.join(", ") : result.params.indices.map((i) => INDEX_LABEL[i]).join(" + ")}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label={t("Saldo końcowe", "Final balance", "Endstand")} value={fmtUsd(st.final)} tone={st.final >= result.params.capital ? "rise" : "fall"} />
                <Stat label={`${benchmarkFor(result.params.indices)} ${t("w tym czasie", "same period", "gleicher Zeitraum")}`} value={fmtUsd(benchFinal)} />
                <Stat label={t("Rocznie (CAGR)", "Per year (CAGR)", "Pro Jahr (CAGR)")} value={fmtPct(st.cagr * 100)} />
                <Stat label={t("Maks. obsunięcie", "Max drawdown", "Max. Drawdown")} value={fmtPct(st.dd * 100, 0)} tone="fall" />
                <Stat label={t("Transakcje", "Trades", "Trades")} value={`${st.trades}`} hint={t("zamknięte + otwarte na koniec", "closed + open at the end", "geschlossen + am Ende offen")} />
                <Stat label={t("Trafne (zamknięte)", "Winners (closed)", "Gewinner (geschlossen)")} value={`${Math.round(st.win * 100)}%`} />
                <Stat label={t("Śr. zysk / strata", "Avg win / loss", "Ø Gewinn / Verlust")} value={`${fmtPct(st.avgWin * 100, 0)} / ${fmtPct(st.avgLoss * 100, 0)}`} />
                <Stat
                  label={t("Otwarte na koniec", "Open at the end", "Am Ende offen")}
                  value={`${st.openCount} (${st.openMinus} ${t("pod kreską", "under water", "im Minus")})`}
                  tone={st.openMinus > 0 ? "fall" : undefined}
                  hint={Number.isFinite(st.openWorst) ? `${t("najgorsza", "worst", "schlechteste")} ${fmtPct(st.openWorst * 100, 0)}` : undefined}
                />
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                <p>
                  {t("Rozkład", "Distribution over", "Verteilung über")} {dist.length} {t("losowań", "draws", "Ziehungen")}: {t("mediana", "median", "Median")} {fmtUsd(median)} ·{" "}
                  {t("min", "min", "Min")} {fmtUsd(finals[0])} · {t("maks", "max", "Max")} {fmtUsd(finals[finals.length - 1])}
                  {beat != null && (
                    <>
                      {" "}· {t("lepsze od", "better than", "besser als")} {benchmarkFor(result.params.indices)}: <span className={beat >= 0.5 ? "text-rise" : "text-fall"}>{Math.round(beat * 100)}%</span>
                    </>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...dist].sort((a, b) => a.seed - b.seed).map((x) => (
                    <button
                      key={x.seed}
                      type="button"
                      onClick={() => {
                        const p = { ...result.params, seed: x.seed };
                        setParams((cur) => ({ ...cur, seed: x.seed }));
                        setResult(simulate(meta, arrays, p));
                        setSelectedId(null);
                      }}
                      className={`rounded px-1.5 py-0.5 text-[11px] tabular-nums ${x.seed === result.params.seed ? "bg-amber-400/20 text-amber-100" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                      title={`#${x.seed}`}
                    >
                      #{x.seed}: {Math.round(x.st.final / 1000)}k
                    </button>
                  ))}
                </div>
                {(result.skipped > 0 || result.limitedByMonth > 0 || result.limitedByPositions > 0) && (
                  <p className="mt-2 text-xs text-white/45">
                    {t("Pominięte sygnały", "Skipped signals", "Übersprungene Signale")}: {t("brak gotówki", "no cash", "kein Geld")} {result.skipped}
                    {result.limitedByPositions > 0 && ` · ${t("limit spółek", "stock limit", "Aktienlimit")} ${result.limitedByPositions}`}
                    {result.limitedByMonth > 0 && ` · ${t("limit miesięczny", "monthly limit", "Monatslimit")} ${result.limitedByMonth}`}
                  </p>
                )}
              </div>
              <ol className="list-decimal space-y-1 pl-5 text-xs text-white/60">
                {simRules(t, result.params).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </div>
            <EquityChart meta={meta} result={result} bench={benchmarkFor(result.params.indices)} />
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="mr-auto text-sm font-medium text-white/80">
                {t("Transakcje", "Trades", "Trades")} ({trades.length})
              </p>
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className={selectClass}>
                <option value="all">{t("Wszystkie", "All", "Alle")}</option>
                <option value="win">{t("Zamknięte z zyskiem", "Closed with profit", "Mit Gewinn geschlossen")}</option>
                <option value="loss">{t("Zamknięte ze stratą", "Closed with loss", "Mit Verlust geschlossen")}</option>
                <option value="open">{t("Otwarte na koniec", "Open at the end", "Am Ende offen")}</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={selectClass}>
                <option value="date">{t("Wg daty", "By date", "Nach Datum")}</option>
                <option value="pnl">{t("Wg wyniku USD", "By USD result", "Nach USD-Ergebnis")}</option>
                <option value="ret">{t("Wg zwrotu %", "By return %", "Nach Rendite %")}</option>
              </select>
            </div>
            <div className="max-h-[380px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-950">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-white/40">
                    <th className="px-2 py-1 font-medium">#</th>
                    <th className="px-2 py-1 font-medium">{t("Spółka", "Stock", "Aktie")}</th>
                    <th className="px-2 py-1 font-medium">{t("Wejście", "Entry", "Einstieg")}</th>
                    <th className="px-2 py-1 text-right font-medium">{t("Cena", "Price", "Kurs")}</th>
                    <th className="px-2 py-1 font-medium">{t("Dokładka", "Add", "Aufst.")}</th>
                    <th className="px-2 py-1 font-medium">{t("Wyjście", "Exit", "Ausstieg")}</th>
                    <th className="px-2 py-1 text-right font-medium">{t("Cena", "Price", "Kurs")}</th>
                    <th className="px-2 py-1 font-medium">{t("Powód", "Reason", "Grund")}</th>
                    <th className="px-2 py-1 text-right font-medium">USD</th>
                    <th className="px-2 py-1 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((tr) => (
                    <tr
                      key={tr.id}
                      onClick={() => {
                        setSelectedId(tr.id);
                        requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                      }}
                      className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${tr.id === selectedId ? "bg-amber-400/10" : ""}`}
                    >
                      <td className="px-2 py-1 text-white/40">{tr.id}</td>
                      <td className="px-2 py-1">{meta.stocks[tr.stock].s}</td>
                      <td className="px-2 py-1 tabular-nums">{fmtDate(meta.dates[meta.sim_start + tr.entry])}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmtPx(tr.entryPx, 2)}</td>
                      <td className="px-2 py-1 tabular-nums text-white/60">{tr.add != null ? fmtDate(meta.dates[meta.sim_start + tr.add]) : "-"}</td>
                      <td className="px-2 py-1 tabular-nums">{fmtDate(meta.dates[meta.sim_start + tr.exit])}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{fmtPx(tr.exitPx, 2)}</td>
                      <td className="px-2 py-1 text-white/60">{exitShort(t, tr.reason)}</td>
                      <td className={`px-2 py-1 text-right tabular-nums ${tr.pnl >= 0 ? "text-rise" : "text-fall"}`}>{fmtUsd(tr.pnl)}</td>
                      <td className={`px-2 py-1 text-right tabular-nums ${tr.ret >= 0 ? "text-rise" : "text-fall"}`}>{fmtPct(tr.ret * 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div ref={detailRef} className="scroll-mt-4">
            {selected && (
              <TradeDetail
                key={`${result.params.seed}-${selected.id}`}
                meta={meta}
                arrays={arrays}
                result={result}
                trade={selected}
                onPrev={selIdx > 0 ? () => setSelectedId(trades[selIdx - 1].id) : undefined}
                onNext={selIdx < trades.length - 1 ? () => setSelectedId(trades[selIdx + 1].id) : undefined}
              />
            )}
          </div>

          <p className="text-xs text-white/40">
            {t(
              "Ograniczenia danych: Nasdaq, NYSE i Russell 2000 to obecni członkowie (bez spółek upadłych - wyniki zawyżone). S&P 500 zawiera 94 z 227 spółek wyrzuconych od 2016 (reszta to głównie przejęcia i kilka upadłości bez danych w Yahoo). Danych analityków przed 2018 jest 3-4 razy mniej, więc we wcześniejszych latach sygnałów jest mniej. Bez podatków i dywidend poza korektą cen.",
              "Data limits: Nasdaq, NYSE and Russell 2000 are current members (no bankrupt stocks - results overstated). The S&P 500 includes 94 of the 227 stocks removed since 2016 (the rest are mostly takeovers and a few bankruptcies with no Yahoo data). There are 3-4 times fewer analyst targets before 2018, so earlier years have fewer signals. No taxes; dividends only via adjusted prices.",
              "Datengrenzen: Nasdaq, NYSE und Russell 2000 sind aktuelle Mitglieder (ohne insolvente Aktien - Ergebnisse überzeichnet). Der S&P 500 enthält 94 der 227 seit 2016 entfernten Aktien (der Rest sind meist Übernahmen und einige Insolvenzen ohne Yahoo-Daten). Vor 2018 gibt es 3-4 mal weniger Analystenziele, daher weniger Signale in frühen Jahren. Ohne Steuern; Dividenden nur über bereinigte Kurse.",
            )}
          </p>
        </>
      )}
      {running && !result && (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      )}
    </main>
  );
}
