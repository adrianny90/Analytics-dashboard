import type { IchimokuResponse } from "@/types/ichimoku";
import type {
  ChangePeriod,
  DownloadAllStatus,
  HistoricalBar,
  IndexSummary,
  KitchinSnapshot,
  PeriodChange,
  Quote,
  RankingEntry,
  RankingStatus,
  RankingUniverse,
  TargetsStatus,
  RsiScanStatus,
  RsiTimeframe,
  SymbolTrend,
  TickerSearchResult,
  WatchlistSymbol,
} from "@/types/market";

export type Timeframe = "month" | "week" | "day" | "h4" | "h1";

// 127.0.0.1 rather than localhost: on Windows "localhost" tries IPv6 (::1)
// first, and uvicorn only listens on IPv4 - that fallback cost ~150 ms per request.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://127.0.0.1:8000";

// Last response of every GET, kept for the whole browser session (module
// state survives client-side navigation), so a page opened again can render
// what it showed last time straight away and refresh it in the background.
// Bounded so a long session of opening Ichimoku charts can't grow it forever.
const MAX_CACHED_RESPONSES = 80;
const responseCache = new Map<string, { value: unknown; at: number }>();

function remember(path: string, value: unknown) {
  responseCache.delete(path); // re-insert so Map order stays least-recently-stored first
  responseCache.set(path, { value, at: Date.now() });
  if (responseCache.size > MAX_CACHED_RESPONSES) {
    const oldest = responseCache.keys().next().value;
    if (oldest !== undefined) responseCache.delete(oldest);
  }
}

/** The last response of a GET and when it arrived (ms epoch), if any. */
function peek<T>(path: string): { value: T; at: number } | undefined {
  return responseCache.get(path) as { value: T; at: number } | undefined;
}

// GETs in flight, so the same request made twice at once (React StrictMode
// runs effects twice in dev; two components wanting the same data) is sent once.
const inflight = new Map<string, Promise<unknown>>();

function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isGet = !init?.method || init.method === "GET";
  if (!isGet || init?.signal) return request<T>(path, init);
  const pending = inflight.get(path);
  if (pending) return pending as Promise<T>;
  const promise = request<T>(path, init).finally(() => inflight.delete(path));
  inflight.set(path, promise);
  return promise;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    // Content-Type only with a body: on a GET it would make every request
    // cross-origin "non-simple" and cost an extra CORS preflight round trip.
    headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
    cache: init?.cache ?? "no-store",
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
  const value = (await res.json()) as T;
  if (!init?.method || init.method === "GET") remember(path, value);
  return value;
}

const PATHS = {
  indices: "/api/v1/indices/",
  watchlistSymbols: "/api/v1/watchlist/symbols",
  watchlist: "/api/v1/watchlist/",
  watchlistTrends: "/api/v1/watchlist/trends",
  rankingStatus: (universe: RankingUniverse) => `/api/v1/ranking/${universe}/status`,
  ranking: (universe: RankingUniverse) => `/api/v1/ranking/${universe}/`,
  ichimoku: (symbol: string, timeframe: Timeframe, thresholdPct: number) =>
    `/api/v1/ichimoku/${symbol}?timeframe=${timeframe}&threshold_pct=${thresholdPct}`,
};

export const peekIndices = () => peek<IndexSummary[]>(PATHS.indices);
export const peekWatchlistSymbols = () => peek<WatchlistSymbol[]>(PATHS.watchlistSymbols);
export const peekWatchlist = () => peek<Quote[]>(PATHS.watchlist);
export const peekWatchlistTrends = () => peek<SymbolTrend[]>(PATHS.watchlistTrends);
export const peekRankingStatus = (universe: RankingUniverse) => peek<RankingStatus>(PATHS.rankingStatus(universe));
export const peekRanking = (universe: RankingUniverse) => peek<RankingEntry[]>(PATHS.ranking(universe));
export const peekIchimoku = (symbol: string, timeframe: Timeframe = "day", thresholdPct = 3) =>
  peek<IchimokuResponse>(PATHS.ichimoku(symbol, timeframe, thresholdPct));

export function getIndices() {
  return apiFetch<IndexSummary[]>(PATHS.indices);
}

export function getQuote(symbol: string) {
  return apiFetch<Quote>(`/api/v1/quotes/${symbol}`);
}

export function getWatchlistSymbols() {
  return apiFetch<WatchlistSymbol[]>(PATHS.watchlistSymbols);
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

export function getFavorites() {
  return apiFetch<string[]>("/api/v1/favorites/");
}

/** Stars (`starred: true`) or un-stars a symbol in the database. */
export async function setFavorite(symbol: string, starred: boolean) {
  const res = await fetch(`${API_BASE_URL}/api/v1/favorites/${encodeURIComponent(symbol)}`, {
    method: starred ? "PUT" : "DELETE",
  });
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = (await res.json())?.detail;
    } catch {
      detail = undefined;
    }
    throw new Error(typeof detail === "string" ? detail : `Request failed with status ${res.status}`);
  }
}

export function getWatchlist() {
  return apiFetch<Quote[]>(PATHS.watchlist);
}

export function getWatchlistTrends() {
  return apiFetch<SymbolTrend[]>(PATHS.watchlistTrends);
}

export function getHistory(symbol: string, timeframe: Timeframe = "day") {
  return apiFetch<HistoricalBar[]>(`/api/v1/history/${symbol}?timeframe=${timeframe}`);
}

export function getIchimoku(symbol: string, timeframe: Timeframe = "day", thresholdPct = 3) {
  return apiFetch<IchimokuResponse>(PATHS.ichimoku(symbol, timeframe, thresholdPct));
}

// symbol|timeframe -> when its prefetch was last asked for; the backend keeps
// bars for 5 minutes, so asking again sooner would be wasted.
const prefetchedAt = new Map<string, number>();
const PREFETCH_EVERY_MS = 4 * 60_000;

/** Fire-and-forget: asks the backend to download these timeframes' bars for
 *  `symbol` ahead (see POST /ichimoku/{symbol}/prefetch), so opening the
 *  chart is served from its cache. */
export function prefetchIchimoku(symbol: string, timeframes: Timeframe[] = ["day"]) {
  const now = Date.now();
  const wanted = timeframes.filter((tf) => now - (prefetchedAt.get(`${symbol}|${tf}`) ?? 0) > PREFETCH_EVERY_MS);
  if (wanted.length === 0) return;
  wanted.forEach((tf) => prefetchedAt.set(`${symbol}|${tf}`, now));
  const query = wanted.map((tf) => `timeframes=${tf}`).join("&");
  fetch(`${API_BASE_URL}/api/v1/ichimoku/${encodeURIComponent(symbol)}/prefetch?${query}`, { method: "POST" }).catch(
    () => undefined,
  );
}

export function startRanking(universe: RankingUniverse) {
  return apiFetch<RankingStatus>(`/api/v1/ranking/${universe}/start`, { method: "POST" });
}

export function startTargets(universe: RankingUniverse) {
  return apiFetch<TargetsStatus>(`/api/v1/ranking/${universe}/targets/start`, { method: "POST" });
}

export function getRankingStatus(universe: RankingUniverse) {
  return apiFetch<RankingStatus>(PATHS.rankingStatus(universe));
}

export function getRanking(universe: RankingUniverse) {
  // "no-cache": the browser keeps the (multi-MB) ranking and revalidates it
  // with its ETag - an unchanged ranking comes back as a bodiless 304.
  return apiFetch<RankingEntry[]>(PATHS.ranking(universe), { cache: "no-cache" });
}

/** Whether a period's changes are worth fetching on demand: only when most
 *  entries lack it (a saved run from before the scan stored that period).
 *  A handful of gaps are stocks with too short a history for the period -
 *  refetching the whole universe (a throttled pass over Yahoo, ~2 min for the
 *  big indices) wouldn't fill those in anyway. */
export function needsChangesFetch(entries: { changes?: Partial<Record<ChangePeriod, unknown>> | null }[], period: ChangePeriod) {
  if (entries.length === 0) return false;
  const missing = entries.filter((e) => !e.changes?.[period]).length;
  return missing > entries.length / 2;
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

export function startDownloadAllTargets() {
  return apiFetch<DownloadAllStatus>(`/api/v1/ranking/all/targets/start`, { method: "POST" });
}

export function getDownloadAllTargetsStatus() {
  return apiFetch<DownloadAllStatus>(`/api/v1/ranking/all/targets/status`);
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

export function getKitchin() {
  return apiFetch<KitchinSnapshot>("/api/v1/kitchin/");
}

export function refreshKitchin() {
  return apiFetch<KitchinSnapshot>("/api/v1/kitchin/refresh", { method: "POST" });
}
