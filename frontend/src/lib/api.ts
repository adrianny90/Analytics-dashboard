import type { IchimokuResponse } from "@/types/ichimoku";
import type {
  ChangePeriod,
  DownloadAllStatus,
  HistoricalBar,
  IndexSummary,
  PeriodChange,
  Quote,
  RankingEntry,
  RankingStatus,
  RankingUniverse,
  RsiScanStatus,
  RsiTimeframe,
  SymbolTrend,
  TickerSearchResult,
  WatchlistSymbol,
} from "@/types/market";

export type Timeframe = "month" | "week" | "day" | "h4" | "h1";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    // Prefer the backend's own explanation (FastAPI puts it in `detail`).
    let detail: unknown;
    try {
      detail = (await res.json())?.detail;
    } catch {
      detail = undefined;
    }
    throw new Error(typeof detail === "string" ? detail : `Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getIndices() {
  return apiFetch<IndexSummary[]>("/api/v1/indices/");
}

export function getQuote(symbol: string) {
  return apiFetch<Quote>(`/api/v1/quotes/${symbol}`);
}

export function getWatchlistSymbols() {
  return apiFetch<WatchlistSymbol[]>("/api/v1/watchlist/symbols");
}

export function searchTickers(query: string, signal?: AbortSignal) {
  return apiFetch<TickerSearchResult[]>(`/api/v1/watchlist/search?q=${encodeURIComponent(query)}`, { signal });
}

export async function addWatchlistSymbol(symbol: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/watchlist/symbols`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail ?? `Request failed with status ${res.status}`);
  }
  return data as WatchlistSymbol;
}

export function getWatchlist() {
  return apiFetch<Quote[]>("/api/v1/watchlist/");
}

export function getWatchlistTrends() {
  return apiFetch<SymbolTrend[]>("/api/v1/watchlist/trends");
}

export function getHistory(symbol: string, timeframe: Timeframe = "day") {
  return apiFetch<HistoricalBar[]>(`/api/v1/history/${symbol}?timeframe=${timeframe}`);
}

export function getIchimoku(symbol: string, timeframe: Timeframe = "day", thresholdPct = 3) {
  return apiFetch<IchimokuResponse>(`/api/v1/ichimoku/${symbol}?timeframe=${timeframe}&threshold_pct=${thresholdPct}`);
}

export function startRanking(universe: RankingUniverse) {
  return apiFetch<RankingStatus>(`/api/v1/ranking/${universe}/start`, { method: "POST" });
}

export function getRankingStatus(universe: RankingUniverse) {
  return apiFetch<RankingStatus>(`/api/v1/ranking/${universe}/status`);
}

export function getRanking(universe: RankingUniverse) {
  return apiFetch<RankingEntry[]>(`/api/v1/ranking/${universe}/`);
}

export function getRankingChanges(universe: RankingUniverse, period: ChangePeriod) {
  return apiFetch<Record<string, PeriodChange>>(`/api/v1/ranking/${universe}/changes?period=${period}`);
}

export function startDownloadAll() {
  return apiFetch<DownloadAllStatus>(`/api/v1/ranking/all/start`, { method: "POST" });
}

export function getDownloadAllStatus() {
  return apiFetch<DownloadAllStatus>(`/api/v1/ranking/all/status`);
}

export function startRsiScan(universe: RankingUniverse, timeframe: RsiTimeframe) {
  return apiFetch<RsiScanStatus>(`/api/v1/ranking/${universe}/rsi-scan?timeframe=${timeframe}`, { method: "POST" });
}

export function getRsiScanStatus(universe: RankingUniverse) {
  return apiFetch<RsiScanStatus>(`/api/v1/ranking/${universe}/rsi-scan/status`);
}

export function startForecastScan(universe: RankingUniverse) {
  return apiFetch<RsiScanStatus>(`/api/v1/ranking/${universe}/forecast-scan`, { method: "POST" });
}

export function getForecastScanStatus(universe: RankingUniverse) {
  return apiFetch<RsiScanStatus>(`/api/v1/ranking/${universe}/forecast-scan/status`);
}
