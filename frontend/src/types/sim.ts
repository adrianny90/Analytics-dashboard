// Data exported by backtests/export_sim.py into public/sim/.

export type SimIndex = "SP500" | "NASDAQ" | "NYSE" | "RUSSELL";

export interface SimStock {
  s: string;
  idx: SimIndex[];
  sec: string | null;
  removed: boolean;
  cost: number;
  lo: number;
  hi: number;
}

export interface SimMeta {
  generated: string;
  dates: string[];
  sim_start: number;
  sim_len: number;
  n: number;
  stocks: SimStock[];
  n_signals: number;
  etf: Record<string, (number | null)[]>;
  /** 1 when the ETF closed above its 200-day average that day. */
  etf_above_ma200: Record<string, number[]>;
  method: {
    kijun: number;
    ma: number;
    upside: number;
    min_firms: number;
    window_days: number;
    n_below: number;
    ma_exit: number;
    base_upside: number;
    base_firms: number;
  };
}

/** One base signal (Kijun 52 cross + MA200 + analysts >= 10% with >= 3 firms) with the details the filters use. */
export interface SimSignal {
  stock: number;
  /** Window-relative day of the signal close. */
  day: number;
  /** Analyst upside in whole percent, rounded down. */
  upside: number;
  firms: number;
  /** Close adjusted for splits only (closest to the quote of that day), USD; capped at 655.35. */
  price: number;
  /** Median daily turnover over 60 sessions, million USD; null when unknown. */
  turnover: number | null;
  /** 5-line Ichimoku score, null when unknown. */
  score: number | null;
  spMember: boolean;
  liquid: boolean;
  maRising: boolean;
  aboveCloud: boolean;
  aboveWk52: boolean;
}

/** Decoded sim window: prices per stock (NaN = no quote), daily flag bits and the signal list. */
export interface SimArrays {
  open: Float32Array[];
  close: Float32Array[];
  flags: Uint8Array[];
  /** Last day index (window-relative) with a quote, -1 if none. */
  lastIdx: Int32Array;
  signals: SimSignal[];
}

export const FLAG = {
  ARM: 2,
  BELOW_K52: 4,
  BELOW_MA: 8,
} as const;

export interface SimParams {
  indices: SimIndex[];
  /** When non-empty, only these symbols are traded (still subject to index membership on the day). */
  symbols: string[];
  years: number;
  capital: number;
  /** Fractions of equity, e.g. 0.05. */
  position: number;
  add: number;
  /** 0 = unlimited. */
  maxPositions: number;
  maxPerMonth: number;
  /** Fraction, 0 = no stop (the methodology). */
  stop: number;
  /** Consecutive closes under MA200 that force an exit, 0 = off. */
  maExit: number;
  nBelow: number;
  needProfit: boolean;
  seed: number;
  /** Entry filters (fractions / USD / million USD); 0 or false = off. */
  minUpside: number;
  maxUpside: number;
  minFirms: number;
  minPrice: number;
  minTurnover: number;
  maRising: boolean;
  aboveCloud: boolean;
  aboveWk52: boolean;
  /** null = off. */
  minScore: number | null;
  marketUp: boolean;
  /** Empty = all sectors. */
  sectors: string[];
}

export type SimExitReason = "kijun" | "ma200" | "stop" | "delist" | "open";

export interface SimTrade {
  id: number;
  stock: number;
  /** Index into SimArrays.signals of the signal that opened the trade. */
  sig: number;
  /** Window-relative day indexes. */
  signal: number;
  entry: number;
  entryPx: number;
  shares: number;
  spent: number;
  cost: number;
  equityAtEntry: number;
  addSignal: number | null;
  add: number | null;
  addPx: number | null;
  addShares: number;
  armed: number | null;
  exitSignal: number | null;
  exit: number;
  exitPx: number;
  reason: SimExitReason;
  proceeds: number;
  pnl: number;
  ret: number;
  /** Lowest position value / cost basis seen while held (close-based). */
  worst: number;
}

export interface SimResult {
  params: SimParams;
  start: number;
  end: number;
  equity: Float64Array;
  trades: SimTrade[];
  skipped: number;
  limitedByMonth: number;
  limitedByPositions: number;
}
