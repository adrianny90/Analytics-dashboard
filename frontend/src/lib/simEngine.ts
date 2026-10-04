// Portfolio simulation of the "hold until it recovers + MA200 emergency exit"
// methodology - a port of backtests/t_hold.py sim_hold() (same order of
// operations), plus the user's limits: max open positions, max new entries
// per calendar month and an optional percentage stop.

import { FLAG, type SimArrays, type SimIndex, type SimMeta, type SimParams, type SimResult, type SimSignal, type SimTrade } from "@/types/sim";

/** Small deterministic PRNG (mulberry32) so a seed always gives the same draw. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr: number[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const SIGNAL_BYTES = 12;

/** signals.bin: uint16 stock, uint16 day, int8 upside %, uint8 firms, uint16 price x100, uint16 turnover x10 (65535 = unknown),
 * int8 score (-128 = unknown), uint8 bits (1 S&P member, 2 liquid, 4 MA200 rising, 8 above cloud, 16 above W1 Kijun 52). */
export function decodeSignals(buf: ArrayBuffer): SimSignal[] {
  const v = new DataView(buf);
  const out: SimSignal[] = [];
  for (let o = 0; o + SIGNAL_BYTES <= buf.byteLength; o += SIGNAL_BYTES) {
    const dv = v.getUint16(o + 8, true);
    const sc = v.getInt8(o + 10);
    const b = v.getUint8(o + 11);
    out.push({
      stock: v.getUint16(o, true),
      day: v.getUint16(o + 2, true),
      upside: v.getInt8(o + 4),
      firms: v.getUint8(o + 5),
      price: v.getUint16(o + 6, true) / 100,
      turnover: dv === 65535 ? null : dv / 10,
      score: sc === -128 ? null : sc,
      spMember: (b & 1) !== 0,
      liquid: (b & 2) !== 0,
      maRising: (b & 4) !== 0,
      aboveCloud: (b & 8) !== 0,
      aboveWk52: (b & 16) !== 0,
    });
  }
  return out;
}

export function decodeSim(meta: SimMeta, buf: ArrayBuffer, sigBuf: ArrayBuffer): SimArrays {
  const N = meta.n;
  const T = meta.sim_len;
  const o16 = new Uint16Array(buf, 0, N * T);
  const c16 = new Uint16Array(buf, N * T * 2, N * T);
  const f8 = new Uint8Array(buf, N * T * 4, N * T);
  const open: Float32Array[] = [];
  const close: Float32Array[] = [];
  const flags: Uint8Array[] = [];
  const lastIdx = new Int32Array(N).fill(-1);
  for (let j = 0; j < N; j++) {
    const { lo, hi } = meta.stocks[j];
    const k = (hi - lo) / 65534;
    const o = new Float32Array(T);
    const c = new Float32Array(T);
    for (let t = 0; t < T; t++) {
      const qo = o16[j * T + t];
      const qc = c16[j * T + t];
      o[t] = qo ? Math.exp(lo + (qo - 1) * k) : NaN;
      c[t] = qc ? Math.exp(lo + (qc - 1) * k) : NaN;
      if (qc) lastIdx[j] = t;
    }
    open.push(o);
    close.push(c);
    flags.push(f8.subarray(j * T, (j + 1) * T));
  }
  return { open, close, flags, lastIdx, signals: decodeSignals(sigBuf) };
}

/** Which stocks may be bought on a day, given the chosen indices / symbols. */
function eligibility(meta: SimMeta, p: SimParams) {
  const wantSp = p.indices.includes("SP500");
  const others: SimIndex[] = p.indices.filter((i) => i !== "SP500");
  const only = p.symbols.length ? new Set(p.symbols) : null;
  return meta.stocks.map((s) => {
    if (only && !only.has(s.s)) return { sp: false, other: false };
    // A hand-picked symbol is traded under every index it belongs to.
    const sp = (only ? s.idx.includes("SP500") : wantSp) && s.idx.includes("SP500");
    const other = only ? s.idx.some((i) => i !== "SP500") : s.idx.some((i) => others.includes(i));
    return { sp, other };
  });
}

/** Index membership on the signal day plus every entry filter the user switched on. */
function passes(meta: SimMeta, el: { sp: boolean; other: boolean }[], p: SimParams, s: SimSignal): boolean {
  const e = el[s.stock];
  if (!((e.sp && s.spMember) || (e.other && s.liquid))) return false;
  if (s.upside < Math.round(p.minUpside * 100)) return false;
  if (p.maxUpside > 0 && s.upside > Math.round(p.maxUpside * 100)) return false;
  if (s.firms < p.minFirms) return false;
  if (p.minPrice > 0 && s.price < p.minPrice) return false;
  // Turnover is unknown only for stocks later removed from the S&P 500 - they are kept.
  if (p.minTurnover > 0 && s.turnover != null && s.turnover < p.minTurnover) return false;
  if (p.maRising && !s.maRising) return false;
  if (p.aboveCloud && !s.aboveCloud) return false;
  if (p.aboveWk52 && !s.aboveWk52) return false;
  if (p.minScore != null && (s.score == null || s.score < p.minScore)) return false;
  if (p.marketUp && meta.etf_above_ma200.SPY?.[s.day] !== 1) return false;
  if (p.sectors.length && !p.sectors.includes(meta.stocks[s.stock].sec ?? "")) return false;
  return true;
}

export function windowStart(meta: SimMeta, years: number): number {
  const end = meta.dates[meta.sim_start + meta.sim_len - 1];
  const d = new Date(`${end}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  const iso = d.toISOString().slice(0, 10);
  for (let t = 0; t < meta.sim_len; t++) {
    if (meta.dates[meta.sim_start + t] >= iso) return Math.max(t, 1);
  }
  return 1;
}

export function simulate(meta: SimMeta, A: SimArrays, p: SimParams): SimResult {
  const N = meta.n;
  const T = meta.sim_len;
  const rand = rng(p.seed);
  const el = eligibility(meta, p);
  // Per day, the signals that pass the index choice and the entry filters (most days have only a few).
  const sigDays: number[][] = Array.from({ length: T }, () => []);
  A.signals.forEach((s, k) => {
    if (passes(meta, el, p, s)) sigDays[s.day].push(k);
  });

  const i0 = windowStart(meta, p.years);
  const i1 = T - 1;
  const cost = meta.stocks.map((s) => s.cost);
  let cash = p.capital;
  const sh = new Float64Array(N);
  const spent = new Float64Array(N);
  const held = new Uint8Array(N);
  const added = new Uint8Array(N);
  const armed = new Uint8Array(N);
  const below = new Int32Array(N);
  const underMa = new Int32Array(N);
  const pend = new Uint8Array(N);
  const last = new Float64Array(N);
  const open: (SimTrade | null)[] = new Array(N).fill(null);
  const trades: SimTrade[] = [];
  const equity = new Float64Array(i1 - i0 + 1);
  let heldCount = 0;
  let skipped = 0;
  let limitedByMonth = 0;
  let limitedByPositions = 0;
  let month = "";
  let monthEntries = 0;
  let pendReason: ("kijun" | "ma200" | "stop" | null)[] = new Array(N).fill(null);

  for (let j = 0; j < N; j++) {
    const c = A.close[j][i0 - 1];
    last[j] = Number.isFinite(c) ? c : 0;
  }

  const closePos = (j: number, px: number, t: number, reason: SimTrade["reason"]) => {
    const pr = sh[j] * px * (1 - cost[j]);
    cash += pr;
    const tr = open[j]!;
    tr.exit = t;
    tr.exitPx = px;
    tr.reason = reason;
    tr.proceeds = pr;
    tr.pnl = pr - spent[j];
    tr.ret = pr / spent[j] - 1;
    trades.push(tr);
    open[j] = null;
    sh[j] = 0;
    held[j] = 0;
    added[j] = 0;
    armed[j] = 0;
    below[j] = 0;
    spent[j] = 0;
    underMa[j] = 0;
    pendReason[j] = null;
    heldCount--;
  };

  for (let t = i0; t <= i1; t++) {
    for (let j = 0; j < N; j++) {
      if (held[j] && t > A.lastIdx[j]) closePos(j, last[j], t, "delist");
    }
    for (let j = 0; j < N; j++) {
      if (held[j] && pend[j]) {
        const o = A.open[j][t];
        closePos(j, Number.isFinite(o) ? o : last[j], t, pendReason[j] ?? "kijun");
      }
    }
    pend.fill(0);
    let eqPrev = cash;
    for (let j = 0; j < N; j++) if (held[j]) eqPrev += sh[j] * last[j];

    if (t > i0) {
      const m = meta.dates[meta.sim_start + t].slice(0, 7);
      if (m !== month) {
        month = m;
        monthEntries = 0;
      }
      const candSig = sigDays[t - 1].filter((k) => !held[A.signals[k].stock] && Number.isFinite(A.open[A.signals[k].stock][t]));
      shuffle(candSig, rand);
      const cand = candSig.map((k) => A.signals[k].stock);
      const amt = p.position * eqPrev;
      for (let k = 0; k < cand.length; k++) {
        const j = cand[k];
        if (p.maxPositions > 0 && heldCount >= p.maxPositions) {
          limitedByPositions += cand.length - k;
          break;
        }
        if (p.maxPerMonth > 0 && monthEntries >= p.maxPerMonth) {
          limitedByMonth += cand.length - k;
          break;
        }
        if (cash < amt) {
          skipped += cand.length - k;
          break;
        }
        const o = A.open[j][t];
        const n = Math.floor(amt / (o * (1 + cost[j])));
        if (n < 1) continue;
        sh[j] = n;
        spent[j] = n * o * (1 + cost[j]);
        cash -= spent[j];
        held[j] = 1;
        heldCount++;
        monthEntries++;
        open[j] = {
          id: 0,
          stock: j,
          sig: candSig[k],
          signal: t - 1,
          entry: t,
          entryPx: o,
          shares: n,
          spent: spent[j],
          cost: cost[j],
          equityAtEntry: eqPrev,
          addSignal: null,
          add: null,
          addPx: null,
          addShares: 0,
          armed: null,
          exitSignal: null,
          exit: t,
          exitPx: o,
          reason: "open",
          proceeds: 0,
          pnl: 0,
          ret: 0,
          worst: 1,
        };
      }
      if (p.add > 0) {
        const addCand: number[] = [];
        for (let j = 0; j < N; j++) {
          if (held[j] && !added[j] && open[j]!.entry < t && A.flags[j][t - 1] & FLAG.ARM && Number.isFinite(A.open[j][t])) addCand.push(j);
        }
        shuffle(addCand, rand);
        const amtA = p.add * eqPrev;
        for (const j of addCand) {
          if (cash < amtA) break;
          const o = A.open[j][t];
          const n = Math.floor(amtA / (o * (1 + cost[j])));
          if (n < 1) continue;
          const c = n * o * (1 + cost[j]);
          sh[j] += n;
          spent[j] += c;
          cash -= c;
          added[j] = 1;
          const tr = open[j]!;
          tr.addSignal = t - 1;
          tr.add = t;
          tr.addPx = o;
          tr.addShares = n;
          tr.spent = spent[j];
        }
      }
    }

    let value = 0;
    for (let j = 0; j < N; j++) {
      if (!held[j]) continue;
      const c = A.close[j][t];
      const fin = Number.isFinite(c);
      if (fin) last[j] = c;
      const f = A.flags[j][t];
      const tr = open[j]!;
      if (!armed[j] && f & FLAG.ARM) {
        armed[j] = 1;
        tr.armed = t;
      }
      const act = armed[j] === 1;
      const brk = act && fin && (f & FLAG.BELOW_K52) !== 0;
      below[j] = act ? (brk ? below[j] + 1 : 0) : 0;
      const val = sh[j] * last[j] * (1 - cost[j]);
      tr.worst = Math.min(tr.worst, val / spent[j]);
      const ok = p.needProfit ? val > spent[j] : true;
      if (act && below[j] >= p.nBelow && ok) {
        pend[j] = 1;
        pendReason[j] = "kijun";
        tr.exitSignal = t;
      }
      if (p.maExit > 0) {
        const bm = fin && (f & FLAG.BELOW_MA) !== 0;
        underMa[j] = bm ? underMa[j] + 1 : 0;
        if (!pend[j] && underMa[j] >= p.maExit) {
          pend[j] = 1;
          pendReason[j] = "ma200";
          tr.exitSignal = t;
        }
      }
      if (p.stop > 0 && !pend[j] && val <= (1 - p.stop) * spent[j]) {
        pend[j] = 1;
        pendReason[j] = "stop";
        tr.exitSignal = t;
      }
      value += sh[j] * last[j];
    }
    equity[t - i0] = cash + value;
  }

  // Positions still open at the end are valued at the last close.
  for (let j = 0; j < N; j++) {
    if (!held[j]) continue;
    const tr = open[j]!;
    const pr = sh[j] * last[j] * (1 - cost[j]);
    tr.exit = i1;
    tr.exitPx = last[j];
    tr.reason = "open";
    tr.proceeds = pr;
    tr.pnl = pr - spent[j];
    tr.ret = pr / spent[j] - 1;
    trades.push(tr);
  }
  trades.sort((a, b) => a.entry - b.entry || a.stock - b.stock);
  trades.forEach((tr, i) => (tr.id = i + 1));
  pendReason = [];
  return { params: p, start: i0, end: i1, equity, trades, skipped, limitedByMonth, limitedByPositions };
}

export interface SimStats {
  final: number;
  mult: number;
  cagr: number;
  dd: number;
  sharpe: number;
  trades: number;
  closed: number;
  win: number;
  avgWin: number;
  avgLoss: number;
  rr: number;
  openCount: number;
  openMinus: number;
  openWorst: number;
  medHold: number;
}

export function stats(meta: SimMeta, r: SimResult): SimStats {
  const eq = r.equity;
  const final = eq[eq.length - 1];
  const start = r.params.capital;
  const days =
    (new Date(meta.dates[meta.sim_start + r.end]).getTime() - new Date(meta.dates[meta.sim_start + r.start]).getTime()) / 86_400_000;
  let peak = -Infinity;
  let dd = 0;
  let sum = 0;
  let sum2 = 0;
  for (let i = 0; i < eq.length; i++) {
    peak = Math.max(peak, eq[i]);
    dd = Math.min(dd, eq[i] / peak - 1);
    if (i > 0) {
      const x = eq[i] / eq[i - 1] - 1;
      sum += x;
      sum2 += x * x;
    }
  }
  const n = eq.length - 1;
  const mean = sum / n;
  const sd = Math.sqrt(Math.max(sum2 / n - mean * mean, 0));
  const closed = r.trades.filter((t) => t.reason !== "open");
  const w = closed.filter((t) => t.ret > 0);
  const l = closed.filter((t) => t.ret <= 0);
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
  const op = r.trades.filter((t) => t.reason === "open");
  const holds = closed.map((t) => t.exit - t.entry).sort((a, b) => a - b);
  const avgWin = avg(w.map((t) => t.ret));
  const avgLoss = avg(l.map((t) => t.ret));
  return {
    final,
    mult: final / start,
    cagr: final > 0 ? Math.pow(final / start, 365 / Math.max(days, 1)) - 1 : -1,
    dd,
    sharpe: sd > 0 ? (mean / sd) * Math.sqrt(252) : 0,
    trades: r.trades.length,
    closed: closed.length,
    win: closed.length ? w.length / closed.length : NaN,
    avgWin,
    avgLoss,
    rr: Number.isFinite(avgWin) && Number.isFinite(avgLoss) && avgLoss < 0 ? avgWin / -avgLoss : NaN,
    openCount: op.length,
    openMinus: op.filter((t) => t.ret < 0).length,
    openWorst: op.length ? Math.min(...op.map((t) => t.ret)) : NaN,
    medHold: holds.length ? holds[Math.floor(holds.length / 2)] : NaN,
  };
}
