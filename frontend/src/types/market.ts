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
