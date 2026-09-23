import type { Timeframe } from "@/lib/api";
import type { Translate } from "@/lib/i18n";

export const TIMEFRAMES: { value: Timeframe; label: [string, string, string] }[] = [
  { value: "month", label: ["Miesiąc", "Month", "Monat"] },
  { value: "week", label: ["Tydzień", "Week", "Woche"] },
  { value: "day", label: ["Dzień", "Day", "Tag"] },
  { value: "h4", label: ["H4", "H4", "H4"] },
  { value: "h1", label: ["H1", "H1", "H1"] },
];

export function timeframeLabel(t: Translate, value: Timeframe): string {
  const found = TIMEFRAMES.find((tf) => tf.value === value);
  return found ? t(...found.label) : value;
}
