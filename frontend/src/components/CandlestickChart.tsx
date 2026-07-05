"use client";

import { Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { HistoricalBar } from "@/types/market";

interface CandleDatum {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  range: [number, number];
}

function CandlestickShape(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CandleDatum;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload || payload.high === payload.low) return null;

  const { open, high, low, close } = payload;
  const isUp = close >= open;
  const color = isUp ? "#16a34a" : "#dc2626";

  const scale = height / (high - low);
  const openY = y + (high - open) * scale;
  const closeY = y + (high - close) * scale;
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
  const wickX = x + width / 2;

  return (
    <g>
      <line x1={wickX} x2={wickX} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} />
    </g>
  );
}

export function CandlestickChart({ data }: { data: HistoricalBar[] }) {
  const chartData: CandleDatum[] = data.map((bar) => ({
    date: new Date(bar.timestamp).toLocaleString(),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    range: [bar.low, bar.high],
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} minTickGap={32} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "#111827", border: "none" }}
          labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          formatter={(_value, _name, item) => {
            const point = item.payload as CandleDatum;
            return [`O ${point.open} H ${point.high} L ${point.low} C ${point.close}`, "OHLC"];
          }}
        />
        <Bar dataKey="range" shape={<CandlestickShape />} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
