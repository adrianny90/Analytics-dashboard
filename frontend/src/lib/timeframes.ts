import type { Timeframe } from "@/lib/api";

export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "month", label: "Miesiąc" },
  { value: "week", label: "Tydzień" },
  { value: "day", label: "Dzień" },
  { value: "h4", label: "H4" },
  { value: "h1", label: "H1" },
];
