"use client";

import { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fmtDate, fmtPx } from "@/lib/forexText";
import { CandlestickShape } from "@/lib/candlestickShape";
import { useLang } from "@/lib/i18n";
import type { ForexPairFile, ForexSeries, ForexTrade } from "@/types/forex";

export type ChartTf = "d1" | "w1";
export type ChartView = "full" | "entry" | "exit";

const COLORS = {
  tenkan: "#38bdf8",
  kijun: "#f97316",
  k52: "#facc15",
  wk52: "#a855f7",
  ma100: "#f472b6",
  ma200: "#e2e8f0",
  stop: "#ef4444",
  entry: "#22c55e",
  add: "#86efac",
  exit: "#eab308",
};

interface Datum {
  date: string;
  range: [number, number] | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  tk: number | null;
  kj: number | null;
  k52: number | null;
  wk52: number | null;
  ma100: number | null;
  ma200: number | null;
  cloudUp: [number, number] | null;
  cloudDown: [number, number] | null;
  stop: number | null;
}

/** Index of the first bar whose date is >= `date` (bars are ISO date strings, so they sort as text). */
function barIndex(t: string[], date: string): number {
  let lo = 0;
  let hi = t.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (t[mid] < date) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function windowFor(view: ChartView, tf: ChartTf, ie: number, ix: number, n: number): [number, number] {
  const [before, after] = tf === "d1" ? [100, 25] : [60, 10];
  let a: number;
  let b: number;
  if (view === "entry") {
    a = ie - (tf === "d1" ? 120 : 80);
    b = ie + (tf === "d1" ? 40 : 20);
  } else if (view === "exit") {
    a = ix - (tf === "d1" ? 80 : 40);
    b = ix + after;
  } else {
    a = ie - before;
    b = ix + after;
  }
  return [Math.max(0, a), Math.min(n - 1, b)];
}

function stopAt(trade: ForexTrade, date: string): number | null {
  if (date < trade.entry_date || date > trade.exit_date) return null;
  let v: number | null = null;
  for (const [d, s] of trade.stops) {
    if (d <= date) v = s;
    else break;
  }
  return v;
}

function buildData(S: ForexSeries, trade: ForexTrade, tf: ChartTf, a: number, b: number): Datum[] {
  const out: Datum[] = [];
  for (let i = a; i <= b; i++) {
    const o = S.o[i];
    const h = S.h[i];
    const l = S.l[i];
    const c = S.c[i];
    const sa = S.sa[i];
    const sb = S.sb[i];
    const date = S.t[i];
    // A weekly bar (labelled with its Friday) shows the stop in force at the end of
    // that week, for every week the position was open in.
    let stop: number | null;
    if (tf === "d1") {
      stop = stopAt(trade, date);
    } else {
      const open = trade.entry_date <= date && (i === 0 || trade.exit_date > S.t[i - 1]);
      stop = open ? stopAt(trade, date < trade.exit_date ? date : trade.exit_date) : null;
    }
    out.push({
      date,
      range: h != null && l != null ? [l, h] : null,
      open: o,
      high: h,
      low: l,
      close: c,
      tk: S.tk[i],
      kj: S.kj[i],
      k52: S.k52[i],
      wk52: S.w_k52 ? S.w_k52[i] : null,
      ma100: S.ma100[i],
      ma200: S.ma200[i],
      cloudUp: sa != null && sb != null && sa >= sb ? [sb, sa] : null,
      cloudDown: sa != null && sb != null && sa < sb ? [sa, sb] : null,
      stop,
    });
  }
  return out;
}

function Marker({ cx, cy, color, up, label }: { cx?: number; cy?: number; color: string; up: boolean; label: string }) {
  if (cx == null || cy == null) return null;
  const s = 7;
  // Buy markers sit under the price, exit markers above it, pointing at it.
  const tip = up ? cy + 2 : cy - 2;
  const base = up ? tip + s * 1.6 : tip - s * 1.6;
  return (
    <g>
      <polygon points={`${cx},${tip} ${cx - s},${base} ${cx + s},${base}`} fill={color} stroke="#0f172a" strokeWidth={1} />
      <text x={cx} y={up ? base + 11 : base - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
        {label}
      </text>
    </g>
  );
}

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: { payload?: Datum }[];
  digits: number;
  tf: ChartTf;
}

function TradeTooltip({ active, label, payload, digits, tf }: TooltipProps) {
  const { t } = useLang();
  if (!active || !payload?.length || !payload[0].payload) return null;
  const p = payload[0].payload;
  const rows: [string, number | null, string][] = [
    [t("Otwarcie", "Open", "Eröffnung"), p.open, "#e2e8f0"],
    [t("Najwyższa", "High", "Hoch"), p.high, "#e2e8f0"],
    [t("Najniższa", "Low", "Tief"), p.low, "#e2e8f0"],
    [t("Zamknięcie", "Close", "Schluss"), p.close, "#e2e8f0"],
    ["Tenkan", p.tk, COLORS.tenkan],
    ["Kijun", p.kj, COLORS.kijun],
    [`Kijun 52 ${tf.toUpperCase()}`, p.k52, COLORS.k52],
    ["Kijun 52 W1", tf === "d1" ? p.wk52 : null, COLORS.wk52],
    ["MA100", p.ma100, COLORS.ma100],
    ["MA200", p.ma200, COLORS.ma200],
    ["Stop", p.stop, COLORS.stop],
  ];
  return (
    <div className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs shadow-lg">
      {label && (
        <p className="mb-1 font-medium text-white">
          {tf === "w1" ? t("Tydzień do ", "Week to ", "Woche bis ") : ""}
          {fmtDate(label)}
        </p>
      )}
      {rows
        .filter((r) => r[1] != null)
        .map(([name, v, color]) => (
          <p key={name} className="flex justify-between gap-4">
            <span style={{ color }}>{name}</span>
            <span className="font-medium tabular-nums text-white">{fmtPx(v, digits)}</span>
          </p>
        ))}
    </div>
  );
}

export function TradeChart({
  data,
  trade,
  tf,
  view,
  height = 460,
  showStop = true,
}: {
  data: ForexPairFile;
  trade: ForexTrade;
  tf: ChartTf;
  view: ChartView;
  height?: number;
  /** Hide the stop from the legend when the strategy has no stop. */
  showStop?: boolean;
}) {
  const { t } = useLang();
  const S = tf === "d1" ? data.d1 : data.w1;
  const digits = data.digits;

  const { rows, xEntry, xExit, xAdds, domain } = useMemo(() => {
    const ie = barIndex(S.t, trade.entry_date);
    const ix = barIndex(S.t, trade.exit_date);
    const [a, b] = windowFor(view, tf, ie, ix, S.t.length);
    const rows = buildData(S, trade, tf, a, b);
    let lo = Infinity;
    let hi = -Infinity;
    for (const r of rows) {
      if (r.low != null) lo = Math.min(lo, r.low);
      if (r.high != null) hi = Math.max(hi, r.high);
      if (r.stop != null) lo = Math.min(lo, r.stop);
    }
    const pad = (hi - lo) * 0.06;
    const xOf = (d: string) => S.t[Math.min(barIndex(S.t, d), S.t.length - 1)];
    return {
      rows,
      xEntry: xOf(trade.entry_date),
      xExit: xOf(trade.exit_date),
      xAdds: trade.adds.slice(1).map((ad, i) => ({ x: xOf(ad.date), y: ad.px, n: i + 1 })),
      domain: [lo - pad, hi + pad] as [number, number],
    };
  }, [S, trade, tf, view]);

  const inWindow = (x: string) => rows.length > 0 && x >= rows[0].date && x <= rows[rows.length - 1].date;
  const exitLabel =
    trade.exit_reason === "end" ? t("koniec", "end", "Ende") : trade.pnl >= 0 ? t("WYJŚCIE +", "EXIT +", "AUSSTIEG +") : t("WYJŚCIE −", "EXIT −", "AUSSTIEG −");

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            stroke="#cbd5e1"
            fontSize={11}
            minTickGap={48}
            tickFormatter={(d: string) => (tf === "w1" ? d.slice(0, 7) : d.slice(2))}
          />
          <YAxis
            stroke="#cbd5e1"
            fontSize={11}
            width={digits >= 5 ? 70 : 64}
            domain={domain}
            allowDataOverflow
            tickFormatter={(v: number) => v.toFixed(digits >= 5 ? 4 : digits === 3 ? 2 : 0)}
          />
          <Tooltip content={<TradeTooltip digits={digits} tf={tf} />} cursor={{ stroke: "rgba(255,255,255,0.3)" }} />

          {inWindow(xEntry) && (
            <ReferenceArea
              x1={xEntry}
              x2={inWindow(xExit) ? xExit : rows[rows.length - 1].date}
              fill={trade.pnl >= 0 ? "#22c55e" : "#ef4444"}
              fillOpacity={0.06}
              stroke="none"
              ifOverflow="hidden"
            />
          )}

          <Area dataKey="cloudUp" stroke="none" fill="#16a34a" fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />
          <Area dataKey="cloudDown" stroke="none" fill="#dc2626" fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />
          <Line dataKey="ma200" stroke={COLORS.ma200} dot={false} strokeWidth={1.25} isAnimationActive={false} />
          <Line dataKey="ma100" stroke={COLORS.ma100} dot={false} strokeWidth={1.25} isAnimationActive={false} />
          <Line dataKey="tk" stroke={COLORS.tenkan} dot={false} strokeWidth={1} isAnimationActive={false} />
          <Line dataKey="kj" stroke={COLORS.kijun} dot={false} strokeWidth={1.25} isAnimationActive={false} />
          <Line dataKey="k52" stroke={COLORS.k52} dot={false} strokeWidth={1.75} isAnimationActive={false} />
          {tf === "d1" && (
            <Line
              dataKey="wk52"
              type="stepAfter"
              stroke={COLORS.wk52}
              dot={false}
              strokeWidth={1.75}
              strokeDasharray="6 3"
              isAnimationActive={false}
            />
          )}
          <Line
            dataKey="stop"
            type="stepAfter"
            stroke={COLORS.stop}
            dot={false}
            strokeWidth={2}
            strokeDasharray="4 3"
            isAnimationActive={false}
            connectNulls={false}
          />

          <Bar dataKey="range" shape={<CandlestickShape />} isAnimationActive={false} />

          {inWindow(xEntry) && (
            <ReferenceLine
              segment={[
                { x: xEntry, y: trade.entry_px },
                { x: inWindow(xExit) ? xExit : rows[rows.length - 1].date, y: trade.entry_px },
              ]}
              stroke={COLORS.entry}
              strokeDasharray="2 3"
              ifOverflow="hidden"
            />
          )}
          {inWindow(xEntry) && (
            <ReferenceDot
              x={xEntry}
              y={trade.entry_px}
              ifOverflow="visible"
              shape={(p: { cx?: number; cy?: number }) => <Marker {...p} color={COLORS.entry} up label={t("KUPNO", "BUY", "KAUF")} />}
            />
          )}
          {xAdds.filter((a) => inWindow(a.x)).map((a) => (
            <ReferenceDot
              key={`add-${a.n}`}
              x={a.x}
              y={a.y}
              ifOverflow="visible"
              shape={(p: { cx?: number; cy?: number }) => <Marker {...p} color={COLORS.add} up label={`+${a.n}`} />}
            />
          ))}
          {inWindow(xExit) && (
            <ReferenceDot
              x={xExit}
              y={trade.exit_px}
              ifOverflow="visible"
              shape={(p: { cx?: number; cy?: number }) => <Marker {...p} color={COLORS.exit} up={false} label={exitLabel} />}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <Legend tf={tf} showStop={showStop} />
    </div>
  );
}

function Legend({ tf, showStop }: { tf: ChartTf; showStop: boolean }) {
  const { t } = useLang();
  const items: [string, string, boolean][] = [
    ["Tenkan 9", COLORS.tenkan, false],
    ["Kijun 26", COLORS.kijun, false],
    [`Kijun 52 ${tf.toUpperCase()}`, COLORS.k52, false],
    ...(tf === "d1" ? ([["Kijun 52 W1", COLORS.wk52, true]] as [string, string, boolean][]) : []),
    ["MA100", COLORS.ma100, false],
    ["MA200", COLORS.ma200, false],
    ...(showStop
      ? ([[t("Stop (cała pozycja)", "Stop (whole position)", "Stop (Gesamtposition)"), COLORS.stop, true]] as [string, string, boolean][])
      : []),
    [t("Kupno / dokładki", "Buy / adds", "Kauf / Aufstockungen"), COLORS.entry, false],
    [t("Wyjście", "Exit", "Ausstieg"), COLORS.exit, false],
  ];
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-2 text-[11px] text-white/60">
      {items.map(([name, color, dashed]) => (
        <span key={name} className="flex items-center gap-1.5">
          <span
            className="inline-block w-4"
            style={{ borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }}
          />
          {name}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-4 rounded-sm bg-green-600/40" />/
        <span className="inline-block h-2.5 w-4 rounded-sm bg-red-600/40" />
        {t("chmura Ichimoku", "Ichimoku cloud", "Ichimoku-Wolke")}
      </span>
    </div>
  );
}
