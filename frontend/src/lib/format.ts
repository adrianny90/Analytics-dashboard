import { getLocale } from "@/lib/i18n";

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(getLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
