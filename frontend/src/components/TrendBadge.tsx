import { useLang } from "@/lib/i18n";
import type { TrendOutlook } from "@/types/market";

const TREND_BADGE_STYLES: Record<TrendOutlook, string> = {
  bullish: "bg-rise/15 text-rise",
  bearish: "bg-fall/15 text-fall",
  neutral: "bg-white/10 text-white/50",
};

const TREND_BADGE_LABELS: Record<TrendOutlook, [string, string, string]> = {
  bullish: ["Byk", "Bull", "Bulle"],
  bearish: ["Niedź", "Bear", "Bär"],
  neutral: ["Neutr", "Neut", "Neutr"],
};

export function TrendBadge({ outlook }: { outlook: TrendOutlook | null | undefined }) {
  const { t } = useLang();
  if (!outlook) return <span className="text-white/20">···</span>;
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TREND_BADGE_STYLES[outlook]}`}
    >
      {t(...TREND_BADGE_LABELS[outlook])}
    </span>
  );
}
