export interface CandleShapeDatum {
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
}

export function CandlestickShape(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CandleShapeDatum;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload || payload.high == null || payload.low == null || payload.open == null || payload.close == null) {
    return null;
  }
  if (payload.high === payload.low) return null;

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
