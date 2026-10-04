// Data exported by backtests/export_forex.py into public/forex/.

export interface ForexSnapshot {
  close: number | null;
  tenkan: number | null;
  kijun: number | null;
  cloud_top: number | null;
  cloud_bot: number | null;
  close_26: number | null;
  k52: number | null;
  ma100: number | null;
  ma200: number | null;
  w_close: number | null;
  w_k52: number | null;
  w_kijun: number | null;
  w_cloud_top: number | null;
  w_cloud_bot: number | null;
  prev_tenkan: number | null;
  prev_close: number | null;
  prev_k52: number | null;
}

export interface ForexAdd {
  date: string;
  signal_date: string;
  px: number;
  nominal: number;
  atr: number;
  equity: number;
  capped: boolean;
  prev_px: number | null;
}

export type StopReason = "init" | "add" | "trail";
export type ExitReason = "w1" | "stop" | "stop_gap" | "ruin" | "end";

export interface ForexTrade {
  id: number;
  pair: string;
  dir: 1 | -1;
  signal_date: string;
  entry_date: string;
  entry_px: number;
  exit_date: string;
  exit_px: number;
  exit_reason: ExitReason;
  exit_signal_date: string | null;
  pnl: number;
  equity_before: number;
  equity_after: number;
  pnl_pct: number | null;
  units: number;
  nominal_x: number;
  swap: number;
  atr: number;
  adds: ForexAdd[];
  /** [date, stop price, why] - every change of the whole position's stop. */
  stops: [string, number, StopReason][];
  entry_snapshot: ForexSnapshot | null;
  exit_snapshot: ForexSnapshot | null;
}

export interface ForexStrategyParams {
  entry: "ichi" | "k52" | "donch";
  wf: "k52" | "cloud" | "kj" | "none";
  risk: number;
  max_units: number;
  step: number;
  stop_k: number;
  trail: boolean;
}

export interface ForexStrategy {
  id: string;
  start: string;
  params: ForexStrategyParams;
  start_equity: number;
  final: number;
  stats: {
    mult: number | null;
    cagr: number | null;
    dd: number | null;
    sharpe: number | null;
    n: number | null;
    plus: number | null;
    rr: number | null;
  };
  /** [week end date, equity] */
  equity: [string, number][];
  trades: ForexTrade[];
}

export interface ForexTradesFile {
  generated: string;
  pairs: string[];
  strategies: ForexStrategy[];
}

export interface ForexSeries {
  t: string[];
  o: (number | null)[];
  h: (number | null)[];
  l: (number | null)[];
  c: (number | null)[];
  tk: (number | null)[];
  kj: (number | null)[];
  sa: (number | null)[];
  sb: (number | null)[];
  ma100: (number | null)[];
  ma200: (number | null)[];
  k52: (number | null)[];
  /** D1 only: weekly values of the last closed week. */
  w_k52?: (number | null)[];
}

export interface ForexPairFile {
  pair: string;
  digits: number;
  d1: ForexSeries;
  w1: ForexSeries;
}
