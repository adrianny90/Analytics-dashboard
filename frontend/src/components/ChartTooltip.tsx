interface ChartTooltipPoint {
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  tenkan?: number | null;
  kijun?: number | null;
  chikou?: number | null;
  sma50?: number | null;
  sma100?: number | null;
  sma200?: number | null;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { payload?: ChartTooltipPoint }[];
  hiddenKeys?: (keyof ChartTooltipPoint)[];
}

const ROWS: { key: keyof ChartTooltipPoint; label: string; color: string }[] = [
  { key: "open", label: "Open", color: "#e2e8f0" },
  { key: "high", label: "High", color: "#e2e8f0" },
  { key: "low", label: "Low", color: "#e2e8f0" },
  { key: "close", label: "Close", color: "#e2e8f0" },
  { key: "tenkan", label: "Tenkan", color: "#38bdf8" },
  { key: "kijun", label: "Kijun", color: "#f97316" },
  { key: "chikou", label: "Chikou", color: "#c084fc" },
  { key: "sma50", label: "SMA 50", color: "#2dd4bf" },
  { key: "sma100", label: "SMA 100", color: "#f472b6" },
  { key: "sma200", label: "SMA 200", color: "#e2e8f0" },
];

/** Custom tooltip content - recharts' defaults can render item text in low
 * contrast colors against a dark background, so every value here is drawn
 * explicitly in white/light or a bright accent color. */
export function ChartTooltip({ active, label, payload, hiddenKeys }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  if (!point) return null;

  const rows = ROWS.filter((row) => point[row.key] != null && !hiddenKeys?.includes(row.key));
  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-white">{label}</p>}
      {rows.map((row) => (
        <p key={row.key} className="flex justify-between gap-4">
          <span style={{ color: row.color }}>{row.label}</span>
          <span className="font-medium text-white">{(point[row.key] as number).toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}
