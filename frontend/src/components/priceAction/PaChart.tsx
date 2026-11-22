/**
 * Small static candlestick sketch used to illustrate Nial Fuller price action setups.
 * Candles are given as [open, high, low, close] in arbitrary price units; the chart
 * scales them to fit. Optional horizontal levels (support / resistance, entry, stop,
 * target) and EMA-like polylines can be drawn on top, plus a marker over chosen candles.
 */

export type Ohlc = [number, number, number, number];

export interface PaLevel {
  y: number;
  label: string;
  kind: "sr" | "entry" | "stop" | "target" | "kijun" | "cloud";
  /** first candle index the line starts at (default 0) */
  from?: number;
}

export interface PaZone {
  top: number;
  bottom: number;
  from?: number;
  label?: string;
  kind: "sr" | "cloud";
}

export interface PaChartProps {
  candles: Ohlc[];
  levels?: PaLevel[];
  zones?: PaZone[];
  /** polylines, one value per candle (null = gap), e.g. 8 / 21 EMA */
  lines?: { values: (number | null)[]; label: string; color: string }[];
  /** indexes of candles to highlight (the setup) */
  mark?: number[];
  markLabel?: string;
  caption?: string;
  height?: number;
  /** EMA periods computed from closes (seeded with the first close; it's only a sketch) */
  emas?: number[];
}

const EMA_COLORS = ["#38bdf8", "#f472b6", "#a3e635"];

function ema(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  closes.forEach((c, i) => out.push(i === 0 ? c : out[i - 1] + k * (c - out[i - 1])));
  return out;
}

const LEVEL_COLOR: Record<PaLevel["kind"], string> = {
  sr: "#94a3b8",
  entry: "#38bdf8",
  stop: "#f87171",
  target: "#4ade80",
  kijun: "#c084fc",
  cloud: "#fbbf24",
};

export function PaChart({
  candles,
  levels = [],
  zones = [],
  lines: extraLines = [],
  mark = [],
  markLabel,
  caption,
  height = 200,
  emas = [],
}: PaChartProps) {
  const closes = candles.map((c) => c[3]);
  const lines = [
    ...emas.map((p, i) => ({ values: ema(closes, p), label: `EMA ${p}`, color: EMA_COLORS[i % EMA_COLORS.length] })),
    ...extraLines,
  ];
  const step = 22;
  const padL = 8;
  const padR = 92;
  const padT = 22;
  const padB = 10;
  const width = padL + candles.length * step + padR;
  const values = [
    ...candles.flatMap((c) => [c[1], c[2]]),
    ...levels.map((l) => l.y),
    ...zones.flatMap((z) => [z.top, z.bottom]),
    ...lines.flatMap((l) => l.values.filter((v): v is number => v !== null)),
  ];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const y = (v: number) => padT + ((max - v) / span) * (height - padT - padB);
  const x = (i: number) => padL + i * step + step / 2;

  return (
    <figure className="my-2 rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height * 1.4 }} role="img">
        {zones.map((z, i) => (
          <g key={`z${i}`}>
            <rect
              x={padL + (z.from ?? 0) * step}
              width={(candles.length - (z.from ?? 0)) * step}
              y={y(z.top)}
              height={Math.max(2, y(z.bottom) - y(z.top))}
              fill={z.kind === "cloud" ? "#fbbf24" : "#94a3b8"}
              fillOpacity={0.12}
            />
            {z.label && (
              <text x={width - padR + 4} y={(y(z.top) + y(z.bottom)) / 2 + 3} fontSize={9} fill="#cbd5e1">
                {z.label}
              </text>
            )}
          </g>
        ))}
        {levels.map((l, i) => (
          <g key={`l${i}`}>
            <line
              x1={padL + (l.from ?? 0) * step}
              x2={width - padR}
              y1={y(l.y)}
              y2={y(l.y)}
              stroke={LEVEL_COLOR[l.kind]}
              strokeWidth={1.2}
              strokeDasharray={l.kind === "sr" ? "0" : "4 3"}
              strokeOpacity={0.9}
            />
            <text x={width - padR + 4} y={y(l.y) + 3} fontSize={9} fill={LEVEL_COLOR[l.kind]}>
              {l.label}
            </text>
          </g>
        ))}
        {lines.map((l, i) => {
          const pts = l.values
            .map((v, j) => (v === null ? null : `${x(j)},${y(v)}`))
            .filter(Boolean)
            .join(" ");
          return (
            <g key={`p${i}`}>
              <polyline points={pts} fill="none" stroke={l.color} strokeWidth={1.4} strokeOpacity={0.85} />
              <text x={padL + 2} y={12 + i * 10} fontSize={9} fill={l.color}>
                {l.label}
              </text>
            </g>
          );
        })}
        {mark.length > 0 && (
          <rect
            x={padL + Math.min(...mark) * step + 1}
            width={(Math.max(...mark) - Math.min(...mark) + 1) * step - 2}
            y={padT - 14}
            height={height - padT - padB + 16}
            rx={4}
            fill="#38bdf8"
            fillOpacity={0.08}
            stroke="#38bdf8"
            strokeOpacity={0.4}
          />
        )}
        {markLabel && mark.length > 0 && (
          <text x={padL + Math.min(...mark) * step + 3} y={padT - 4} fontSize={9} fill="#7dd3fc">
            {markLabel}
          </text>
        )}
        {candles.map(([o, h, l, c], i) => {
          const up = c >= o;
          const color = up ? "#16a34a" : "#dc2626";
          const top = y(Math.max(o, c));
          const bot = y(Math.min(o, c));
          return (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={y(h)} y2={y(l)} stroke={color} strokeWidth={1.3} />
              <rect x={x(i) - 6} width={12} y={top} height={Math.max(1.5, bot - top)} fill={color} />
            </g>
          );
        })}
      </svg>
      {caption && <figcaption className="px-1 pt-1 text-xs text-white/50">{caption}</figcaption>}
    </figure>
  );
}
