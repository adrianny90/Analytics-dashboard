"use client";

import { useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/ChartTooltip";
import { CandlestickShape } from "@/lib/candlestickShape";
import { PriceTag } from "@/lib/priceTag";
import type { IchimokuPoint } from "@/types/ichimoku";
import type { HistoricalBar } from "@/types/market";

interface ChartDatum {
  date: string;
  range?: [number, number];
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  tenkan: number | null;
  kijun: number | null;
  chikou: number | null;
  bullishCloud: [number, number] | null;
  bearishCloud: [number, number] | null;
}

interface ChartMouseState {
  activePayload?: { payload?: ChartDatum }[];
}

function mergeSeries(bars: HistoricalBar[], points: IchimokuPoint[]): ChartDatum[] {
  const barsByTime = new Map(bars.map((bar) => [bar.timestamp, bar]));

  return points.map((point) => {
    const bar = barsByTime.get(point.timestamp);
    const hasCloud = point.senkou_a !== null && point.senkou_b !== null;
    const cloudLow = hasCloud ? Math.min(point.senkou_a as number, point.senkou_b as number) : null;
    const cloudHigh = hasCloud ? Math.max(point.senkou_a as number, point.senkou_b as number) : null;
    const bullish = hasCloud && (point.senkou_a as number) >= (point.senkou_b as number);

    return {
      date: new Date(point.timestamp).toLocaleDateString(),
      range: bar ? [bar.low, bar.high] : undefined,
      open: bar?.open,
      high: bar?.high,
      low: bar?.low,
      close: bar?.close,
      tenkan: point.tenkan,
      kijun: point.kijun,
      chikou: point.chikou,
      bullishCloud: bullish && cloudLow !== null && cloudHigh !== null ? [cloudLow, cloudHigh] : null,
      bearishCloud: !bullish && hasCloud && cloudLow !== null && cloudHigh !== null ? [cloudLow, cloudHigh] : null,
    };
  });
}

export function IchimokuChart({ bars, points }: { bars: HistoricalBar[]; points: IchimokuPoint[] }) {
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const data = mergeSeries(bars, points);
  const lastClose = bars.length > 0 ? bars[bars.length - 1].close : null;

  return (
    <ResponsiveContainer width="100%" height={480}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
        onMouseMove={(state: ChartMouseState) => {
          const point = state?.activePayload?.[0]?.payload;
          setHoverPrice(typeof point?.close === "number" ? point.close : null);
        }}
        onMouseLeave={() => setHoverPrice(null)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="date" stroke="#cbd5e1" fontSize={12} minTickGap={40} />
        <YAxis stroke="#cbd5e1" fontSize={12} domain={["auto", "auto"]} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.5)", strokeDasharray: "4 4" }} />

        <Area
          dataKey="bullishCloud"
          stroke="none"
          fill="#16a34a"
          fillOpacity={0.18}
          isAnimationActive={false}
          connectNulls={false}
        />
        <Area
          dataKey="bearishCloud"
          stroke="none"
          fill="#dc2626"
          fillOpacity={0.18}
          isAnimationActive={false}
          connectNulls={false}
        />

        <Line dataKey="tenkan" stroke="#38bdf8" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls />
        <Line dataKey="kijun" stroke="#f97316" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls />
        <Line dataKey="chikou" stroke="#c084fc" dot={false} strokeWidth={1.5} isAnimationActive={false} connectNulls />

        {hoverPrice !== null && <ReferenceLine y={hoverPrice} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />}
        {lastClose !== null && (
          <ReferenceLine
            y={lastClose}
            stroke="#eab308"
            strokeDasharray="3 3"
            label={(props: { viewBox?: { x?: number; y?: number; width?: number } }) => (
              <PriceTag {...props} value={lastClose} />
            )}
          />
        )}

        <Bar dataKey="range" shape={<CandlestickShape />} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
