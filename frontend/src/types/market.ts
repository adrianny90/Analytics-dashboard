export interface Quote {
  symbol: string;
  price: number;
  change: number | null;
  change_percent: number | null;
  previous_close: number | null;
  day_high: number | null;
  day_low: number | null;
  volume: number | null;
  timestamp: string;
  source: string;
  sector: string | null;
  stale: boolean;
}

export interface HistoricalBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndexSummary {
  name: string;
  index_symbol: string;
  proxy_symbol: string;
  quote: Quote;
}

export interface WatchlistSymbol {
  symbol: string;
  sector: string;
}

export interface TickerSearchResult {
  symbol: string;
  name: string | null;
  exchange: string | null;
}

export type TrendOutlook = "bullish" | "bearish" | "neutral";

export interface SymbolTrend {
  symbol: string;
  week: TrendOutlook | null;
  day: TrendOutlook | null;
  h4: TrendOutlook | null;
  h1: TrendOutlook | null;
}

export type ChangePeriod = "1d" | "1w" | "1m" | "6m" | "1y";

export interface PeriodChange {
  change: number;
  change_percent: number;
}

export interface HypotheticalForecast {
  low: number;
  median: number;
  high: number;
  as_of: string;
  horizon_days: number;
  model_version: string;
  /** "edge": the model beat simple baselines out of sample; "no_edge": it did not. */
  verdict: "edge" | "no_edge";
  /** Out-of-sample backtest of this model's range: share of outcomes that fell inside it, and its average width. */
  backtest_coverage?: number | null;
  backtest_width?: number | null;
}

/** Method C: a 3-month price band from volatility alone (no ML), and the chance of staying within +-15%. */
export interface VolForecast {
  price: number;
  low: number;
  median: number;
  high: number;
  sigma: number;
  /** Probability (0-1) that the 3-month price stays within 0.85x-1.15x of `price`. */
  p15: number;
  as_of: string;
}

export interface TimeframeLevels {
  close: number;
  kijun52: number | null;
  ma50: number | null;
  ma100: number | null;
  ma150: number | null;
  ma200: number | null;
}

export interface RankingEntry {
  rank: number;
  symbol: string;
  sector: string;
  score: number;
  week: TrendOutlook | null;
  day: TrendOutlook | null;
  h4: TrendOutlook | null;
  h1: TrendOutlook | null;
  quote: Quote | null;
  changes?: Partial<Record<ChangePeriod, PeriodChange>>;
  targets?: AnalystTargets | null;
  rsi?: Partial<Record<RsiTimeframe, number>>;
  forecast?: HypotheticalForecast | null;
  vol_forecast?: VolForecast | null;
  levels?: Partial<Record<"week" | "day" | "h4" | "h1", TimeframeLevels>>;
}

export type RankingRunStatus = "idle" | "running" | "finished" | "failed";

export interface RankingSummary {
  symbols_total: number;
  with_prices: number;
  with_changes: number;
  with_trend_d1: number;
  with_trend_w1: number;
  with_trend_h4: number | null;
  with_trend_h1: number | null;
  with_targets: number;
  targets_fetched: number;
  targets_reused: number;
  finished_at: string;
}

export interface RankingStatus {
  status: RankingRunStatus;
  processed: number;
  total: number;
  updated_at: string | null;
  phase: "prices" | "targets" | null;
  error: string | null;
  summary: RankingSummary | null;
  intraday_updated_at: string | null;
  background_status: RankingRunStatus;
  background_processed: number;
  background_total: number;
}

export type RankingUniverse = "sp500" | "nasdaq" | "russell2000" | "nyse";

export interface AnalystTargets {
  low: number | null;
  median: number | null;
  high: number | null;
  fetched_at: string;
}

export type DownloadAllState = "pending" | "running" | "cached" | "finished" | "failed";

export interface DownloadAllItem {
  universe: RankingUniverse;
  state: DownloadAllState;
  processed: number;
  total: number;
  error: string | null;
}

export interface DownloadAllStatus {
  status: "idle" | "running" | "finished";
  percent: number;
  current: RankingUniverse | null;
  items: DownloadAllItem[];
  finished_at: string | null;
}

export type RsiTimeframe = "h1" | "h4" | "day" | "week" | "month";

export interface RsiScanStatus {
  status: "idle" | "running" | "finished" | "failed";
  timeframe: RsiTimeframe | null;
  processed: number;
  total: number;
  source: "cached" | "downloaded" | null;
  updated_at: string | null;
  error: string | null;
}

/** An applied RSI filter: only symbols whose RSI on `timeframe` is within
 *  [min, max] (inclusive) stay in the table. */
export interface RsiFilter {
  timeframe: RsiTimeframe;
  min: number;
  max: number;
}

export type KitchinCategory = "bonds" | "stocks" | "commodities";
export type KitchinRegion = "US" | "Japan" | "Europe" | "Global";

export interface KitchinInstrument {
  name: string;
  symbol: string;
  category: KitchinCategory;
  region: KitchinRegion;
  price: number;
  change_1d: PeriodChange | null;
  change_1w: PeriodChange | null;
  change_1m: PeriodChange | null;
}

export type KitchinHeader = "wzrost" | "spowolnienie" | "recesja" | "ozywienie";

export interface KitchinPhaseScore {
  phase: number;
  label: string;
  header: KitchinHeader;
  bonds_up: boolean;
  stocks_up: boolean;
  commodities_up: boolean;
  percent: number;
}

export interface KitchinSnapshot {
  instruments: KitchinInstrument[];
  phases: KitchinPhaseScore[];
  dominant_phase: number;
  updated_at: string | null;
  error: string | null;
}
