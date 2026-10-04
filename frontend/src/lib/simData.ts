// Loads the simulation data exported by backtests/export_sim.py and turns a
// stock's chart file into the same series shape the Forex trade chart uses
// (indicators computed here with the backtest's formulas).

import { decodeSim } from "@/lib/simEngine";
import type { ForexPairFile, ForexSeries } from "@/types/forex";
import type { SimArrays, SimMeta } from "@/types/sim";

let simPromise: Promise<{ meta: SimMeta; arrays: SimArrays }> | null = null;

export function loadSim(): Promise<{ meta: SimMeta; arrays: SimArrays }> {
  if (!simPromise) {
    simPromise = (async () => {
      const [metaRes, binRes, sigRes] = await Promise.all([fetch("/sim/meta.json"), fetch("/sim/sim.bin"), fetch("/sim/signals.bin")]);
      if (!metaRes.ok || !binRes.ok || !sigRes.ok) throw new Error(`${metaRes.status} / ${binRes.status} / ${sigRes.status}`);
      const meta = (await metaRes.json()) as SimMeta;
      const arrays = decodeSim(meta, await binRes.arrayBuffer(), await sigRes.arrayBuffer());
      return { meta, arrays };
    })();
    simPromise.catch(() => {
      simPromise = null;
    });
  }
  return simPromise;
}

export interface StockChart {
  /** Daily data in the shape TradeChart expects, plus the extras the descriptions need. */
  file: ForexPairFile;
  /** Index into file.d1 for every calendar day of meta.dates (-1 before the stock's first quote). */
  dayIndex: Int32Array;
  score: (number | null)[];
  upside: (number | null)[];
}

const chartCache = new Map<string, Promise<StockChart>>();

function rollingMid(h: (number | null)[], l: (number | null)[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(h.length).fill(null);
  for (let i = n - 1; i < h.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    let ok = true;
    for (let k = i - n + 1; k <= i; k++) {
      const a = h[k];
      const b = l[k];
      if (a == null || b == null) {
        ok = false;
        break;
      }
      if (a > hi) hi = a;
      if (b < lo) lo = b;
    }
    if (ok) out[i] = (hi + lo) / 2;
  }
  return out;
}

function rollingMean(c: (number | null)[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(c.length).fill(null);
  let sum = 0;
  let cnt = 0;
  for (let i = 0; i < c.length; i++) {
    const v = c[i];
    if (v != null) {
      sum += v;
      cnt++;
    }
    if (i >= n) {
      const old = c[i - n];
      if (old != null) {
        sum -= old;
        cnt--;
      }
    }
    if (i >= n - 1 && cnt === n) out[i] = sum / n;
  }
  return out;
}

function shift<T>(a: (T | null)[], k: number): (T | null)[] {
  return a.map((_, i) => (i - k >= 0 ? a[i - k] : null));
}

function indicators(t: string[], o: (number | null)[], h: (number | null)[], l: (number | null)[], c: (number | null)[]): ForexSeries {
  const tk = rollingMid(h, l, 9);
  const kj = rollingMid(h, l, 26);
  const k52 = rollingMid(h, l, 52);
  const saRaw = tk.map((v, i) => (v != null && kj[i] != null ? (v + kj[i]!) / 2 : null));
  return {
    t,
    o,
    h,
    l,
    c,
    tk,
    kj,
    sa: shift(saRaw, 26),
    sb: shift(k52, 26),
    ma100: rollingMean(c, 100),
    ma200: rollingMean(c, 200),
    k52,
  };
}

/** Friday that ends the week of an ISO date (weeks run Monday-Friday). */
function weekLabel(d: string): string {
  const x = new Date(`${d}T00:00:00Z`);
  const dow = x.getUTCDay(); // 0 Sun .. 6 Sat
  const add = dow === 6 ? 6 : dow === 0 ? 5 : 5 - dow;
  x.setUTCDate(x.getUTCDate() + add);
  return x.toISOString().slice(0, 10);
}

export function loadStockChart(meta: SimMeta, stock: number): Promise<StockChart> {
  const s = meta.stocks[stock];
  let p = chartCache.get(s.s);
  if (p) return p;
  p = (async () => {
    const res = await fetch(`/sim/charts/${encodeURIComponent(s.s)}.bin`);
    if (!res.ok) throw new Error(`${res.status}`);
    const buf = await res.arrayBuffer();
    const Tc = meta.dates.length;
    const q = (k: number) => new Uint16Array(buf, k * Tc * 2, Tc);
    const sc = new Int8Array(buf, 8 * Tc, Tc);
    const up = new Int8Array(buf, 9 * Tc, Tc);
    const k = (s.hi - s.lo) / 65534;
    const dec = (a: Uint16Array, i: number) => (a[i] ? Math.exp(s.lo + (a[i] - 1) * k) : null);
    const [qo, qh, ql, qc] = [q(0), q(1), q(2), q(3)];
    let first = 0;
    while (first < Tc && !qc[first]) first++;
    let lastI = Tc - 1;
    while (lastI > first && !qc[lastI]) lastI--;
    const t: string[] = [];
    const o: (number | null)[] = [];
    const h: (number | null)[] = [];
    const l: (number | null)[] = [];
    const c: (number | null)[] = [];
    const score: (number | null)[] = [];
    const upside: (number | null)[] = [];
    const dayIndex = new Int32Array(Tc).fill(-1);
    for (let i = first; i <= lastI; i++) {
      dayIndex[i] = t.length;
      t.push(meta.dates[i]);
      o.push(dec(qo, i));
      h.push(dec(qh, i));
      l.push(dec(ql, i));
      c.push(dec(qc, i));
      score.push(sc[i] === -128 ? null : sc[i]);
      upside.push(up[i] === -128 ? null : up[i]);
    }
    const d1 = indicators(t, o, h, l, c);

    // Weekly candles from the daily ones; a week is known after its Friday close.
    const wt: string[] = [];
    const wo: (number | null)[] = [];
    const wh: (number | null)[] = [];
    const wl: (number | null)[] = [];
    const wc: (number | null)[] = [];
    for (let i = 0; i < t.length; i++) {
      if (c[i] == null) continue;
      const lab = weekLabel(t[i]);
      if (wt[wt.length - 1] !== lab) {
        wt.push(lab);
        wo.push(o[i]);
        wh.push(h[i]);
        wl.push(l[i]);
        wc.push(c[i]);
      } else {
        const n = wt.length - 1;
        wh[n] = Math.max(wh[n] ?? -Infinity, h[i] ?? -Infinity);
        wl[n] = Math.min(wl[n] ?? Infinity, l[i] ?? Infinity);
        wc[n] = c[i];
      }
    }
    const w1 = indicators(wt, wo, wh, wl, wc);
    const wk52: (number | null)[] = new Array(t.length).fill(null);
    let w = -1;
    for (let i = 0; i < t.length; i++) {
      while (w + 1 < wt.length && wt[w + 1] <= t[i]) w++;
      wk52[i] = w >= 0 ? w1.k52[w] : null;
    }
    d1.w_k52 = wk52;
    return { file: { pair: s.s, digits: 2, d1, w1 }, dayIndex, score, upside };
  })();
  chartCache.set(s.s, p);
  p.catch(() => chartCache.delete(s.s));
  return p;
}
