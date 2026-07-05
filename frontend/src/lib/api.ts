import type { HistoricalBar, IndexSummary, Quote } from "@/types/market";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getIndices() {
  return apiFetch<IndexSummary[]>("/api/v1/indices/");
}

export function getQuote(symbol: string) {
  return apiFetch<Quote>(`/api/v1/quotes/${symbol}`);
}

export function getHistory(symbol: string, period = "1mo", interval = "1d") {
  return apiFetch<HistoricalBar[]>(
    `/api/v1/history/${symbol}?period=${period}&interval=${interval}`
  );
}
