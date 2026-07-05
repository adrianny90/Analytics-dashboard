"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { HistoricalBar } from "@/types/market";

export function PriceChart({ data }: { data: HistoricalBar[] }) {
  const chartData = data.map((bar) => ({
    date: new Date(bar.timestamp).toLocaleDateString(),
    close: bar.close,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ background: "#111827", border: "none" }} />
        <Line type="monotone" dataKey="close" stroke="#38bdf8" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
