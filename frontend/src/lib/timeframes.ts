import type { Timeframe } from "@/lib/api";

export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "h4", label: "H4" },
  { value: "h1", label: "H1" },
];
