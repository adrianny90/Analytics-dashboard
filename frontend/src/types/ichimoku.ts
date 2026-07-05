import type { HistoricalBar } from "@/types/market";

export interface IchimokuPoint {
  timestamp: string;
  tenkan: number | null;
  kijun: number | null;
  senkou_a: number | null;
  senkou_b: number | null;
  chikou: number | null;
  close: number | null;
}

export interface WavePivot {
  timestamp: string;
  price: number;
}

export interface WaveTargetSet {
  pivot_a: WavePivot;
  pivot_b: WavePivot;
  pivot_c: WavePivot;
  v_target: number;
  n_target: number;
  e_target: number;
}

export interface SignalBreakdownItem {
  name: string;
  bullish: boolean | null;
  detail: string;
}

export interface IchimokuAssessment {
  outlook: "bullish" | "bearish" | "neutral";
  score: number;
  max_score: number;
  lookback_candles: number;
  forecast_candles: number;
  signals: SignalBreakdownItem[];
  summary: string;
}

export interface IchimokuResponse {
  symbol: string;
  bars: HistoricalBar[];
  points: IchimokuPoint[];
  wave_targets: WaveTargetSet[];
  assessment: IchimokuAssessment;
}
