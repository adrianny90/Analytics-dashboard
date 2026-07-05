"use client";

import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/ChartTooltip";
import { CandlestickShape } from "@/lib/candlestickShape";
import { PriceTag } from "@/lib/priceTag";
import type { HistoricalBar } from "@/types/market";

interface CandleDatum {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  range: [number, number];
}

interface ChartMouseState {
  activePayload?: { payload?: CandleDatum }[];
}

export function CandlestickChart({ data }: { data: HistoricalBar[] }) {
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);

  const chartData: CandleDatum[] = data.map((bar) => ({
    date: new Date(bar.timestamp).toLocaleString(),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    range: [bar.low, bar.high],
  }));
  const lastClose = chartData.length > 0 ? chartData[chartData.length - 1].close : null;

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart
        data={chartData}
        margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
        onMouseMove={(state: ChartMouseState) => {
          const point = state?.activePayload?.[0]?.payload;
          setHoverPrice(typeof point?.close === "number" ? point.close : null);
        }}
        onMouseLeave={() => setHoverPrice(null)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="date" stroke="#cbd5e1" fontSize={12} minTickGap={32} />
        <YAxis stroke="#cbd5e1" fontSize={12} domain={["auto", "auto"]} />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "rgba(255,255,255,0.5)", strokeDasharray: "4 4" }}
        />

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
