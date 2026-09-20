import type { TrendOutlook } from "@/types/market";

const TREND_BADGE_STYLES: Record<TrendOutlook, string> = {
  bullish: "bg-rise/15 text-rise",
  bearish: "bg-fall/15 text-fall",
  neutral: "bg-white/10 text-white/50",
};

const TREND_BADGE_LABELS: Record<TrendOutlook, string> = {
  bullish: "Byk",
  bearish: "Niedź",
  neutral: "Neutr",
};

export function TrendBadge({ outlook }: { outlook: TrendOutlook | null | undefined }) {
  if (!outlook) return <span className="text-white/20">···</span>;
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TREND_BADGE_STYLES[outlook]}`}
    >
      {TREND_BADGE_LABELS[outlook]}
    </span>
  );
}
