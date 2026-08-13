"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/ChartTooltip";
import type { Timeframe } from "@/lib/api";
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

const SMA_PERIODS = [50, 100, 200] as const;
type SmaPeriod = (typeof SMA_PERIODS)[number];

const SMA_COLORS: Record<SmaPeriod, string> = {
  50: "#2dd4bf",
  100: "#f472b6",
  200: "#e2e8f0",
};

/** Simple moving average of `values` over `period` points - null until
 * enough history has accumulated, and null again if the window straddles a
 * gap (a missing close means the average would be misleading). */
function computeSma(values: (number | undefined)[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const v = values[j];
      if (v == null) return null;
      sum += v;
    }
    return sum / period;
  });
}

interface ChartMouseState {
  chartX?: number;
  chartY?: number;
  activeTooltipIndex?: number;
  activePayload?: { payload?: ChartDatum }[];
}

/** Structural subset of recharts' internal chart instance - just enough to
 * invert a mouse pixel position back into a data value on the y-axis. */
interface ChartHandle {
  getYScaleByAxisId: (axisId: string) => { invert?: (value: number) => number } | undefined;
}

interface DragPoint {
  x: number;
  y: number;
  index: number;
}

interface ZoomWindow {
  start: number;
  end: number;
}

/** Minimum on-screen drag distance (px) before a box-zoom gesture counts as
 * intentional rather than a stray click. */
const MIN_DRAG_PX = 8;

/** Toolkit point markers render one SVG dot per visible candle per line
 * (Tenkan/Kijun/Chikou) - past this many visible candles they'd overlap
 * into a smear anyway, and re-rendering thousands of them on every mouse
 * move is what froze the page, so they're capped to when zoomed in enough
 * to actually be legible. */
const DOT_MARKER_LIMIT = 200;

function MagnifierIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function mergeSeries(
  bars: HistoricalBar[],
  points: IchimokuPoint[],
  timeframe: Timeframe,
): ChartDatum[] {
  const barsByTime = new Map(bars.map((bar) => [bar.timestamp, bar]));
  // Day+ timeframes only need a calendar date, but H4/H1 candles share a
  // date within the same day - without the time, every intraday label on a
  // given day collides, which breaks anything that looks candles up by their
  // x-axis label (tooltip, category positioning).
  const isIntraday = timeframe === "h4" || timeframe === "h1";

  return points.map((point) => {
    const bar = barsByTime.get(point.timestamp);
    const hasCloud = point.senkou_a !== null && point.senkou_b !== null;
    const cloudLow = hasCloud
      ? Math.min(point.senkou_a as number, point.senkou_b as number)
      : null;
    const cloudHigh = hasCloud
      ? Math.max(point.senkou_a as number, point.senkou_b as number)
      : null;
    const bullish =
      hasCloud && (point.senkou_a as number) >= (point.senkou_b as number);
    const timestamp = new Date(point.timestamp);

    return {
      date: isIntraday
        ? `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : timestamp.toLocaleDateString(),
      range: bar ? [bar.low, bar.high] : undefined,
      open: bar?.open,
      high: bar?.high,
      low: bar?.low,
      close: bar?.close,
      tenkan: point.tenkan,
      kijun: point.kijun,
      chikou: point.chikou,
      bullishCloud:
        bullish && cloudLow !== null && cloudHigh !== null
          ? [cloudLow, cloudHigh]
          : null,
      bearishCloud:
        !bullish && hasCloud && cloudLow !== null && cloudHigh !== null
          ? [cloudLow, cloudHigh]
          : null,
    };
  });
}

export function IchimokuChart({
  bars,
  points,
  timeframe,
}: {
  bars: HistoricalBar[];
  points: IchimokuPoint[];
  timeframe: Timeframe;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts doesn't export a usable ref type for ComposedChart
  const chartRef = useRef<any>(null);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<ChartDatum | null>(null);
  const [crosshairX, setCrosshairX] = useState<number | null>(null);
  const [boxZoomActive, setBoxZoomActive] = useState(false);
  const [dragStart, setDragStart] = useState<DragPoint | null>(null);
  const [dragCurrent, setDragCurrent] = useState<DragPoint | null>(null);
  const [zoomWindow, setZoomWindow] = useState<ZoomWindow | null>(null);
  const [zoomYDomain, setZoomYDomain] = useState<[number, number] | null>(null);
  const [activeSmas, setActiveSmas] = useState<Set<SmaPeriod>>(new Set());
  const [ichimokuVisible, setIchimokuVisible] = useState(true);
  const [toolkitVisible, setToolkitVisible] = useState(false);
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const [panActive, setPanActive] = useState(false);
  const [panLastIndex, setPanLastIndex] = useState<number | null>(null);
  const [panLastPrice, setPanLastPrice] = useState<number | null>(null);

  // Ctrl is tracked globally (not just via chart mouse events) so the
  // grab cursor shows up the instant the key is pressed, even before the
  // mouse next moves over the chart - and so releasing Ctrl always stops
  // an in-progress pan, even if focus or the mouse has left the chart.
  useEffect(() => {
    function stopCtrl() {
      setCtrlHeld(false);
      setPanActive(false);
      setPanLastIndex(null);
      setPanLastPrice(null);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Control") setCtrlHeld(true);
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "Control") stopCtrl();
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", stopCtrl);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", stopCtrl);
    };
  }, []);

  // mergeSeries/SMA are non-trivial over a dataset that can now run to
  // ~1700+ candles (see TIMEFRAME_CONFIG), and hover/pan update state on
  // every mouse move - without memoizing, that recomputed all of this from
  // scratch on every single tick while the mouse was moving over the chart.
  const mergedData = useMemo(() => mergeSeries(bars, points, timeframe), [bars, points, timeframe]);

  // SMAs are computed over the full (unzoomed) close series - zooming only
  // windows which points are drawn, it shouldn't shorten the lookback an
  // average is based on.
  const fullData = useMemo(() => {
    const closes = mergedData.map((d) => d.close);
    const smaSeriesByPeriod = new Map(
      Array.from(activeSmas, (period) => [period, computeSma(closes, period)] as const),
    );
    return mergedData.map((datum, i) => {
      const smaValues: Partial<Record<`sma${SmaPeriod}`, number | null>> = {};
      for (const period of activeSmas) {
        smaValues[`sma${period}`] = smaSeriesByPeriod.get(period)![i];
      }
      return { ...datum, ...smaValues };
    });
  }, [mergedData, activeSmas]);

  const data = useMemo(
    () => (zoomWindow ? fullData.slice(zoomWindow.start, zoomWindow.end + 1) : fullData),
    [fullData, zoomWindow],
  );
  const lastClose = bars.length > 0 ? bars[bars.length - 1].close : null;
  const isZoomed = zoomWindow !== null;
  // Toolkit readout: whatever's under the cursor, or the most recent
  // visible candle when nothing's being hovered.
  const toolkitPoint = hoverPoint ?? data[data.length - 1] ?? null;
  const showDotMarkers = toolkitVisible && data.length <= DOT_MARKER_LIMIT;

  const clearHover = () => {
    setHoverPrice(null);
    setHoverDate(null);
    setHoverPoint(null);
    setCrosshairX(null);
  };

  const resetZoom = () => {
    setZoomWindow(null);
    setZoomYDomain(null);
  };

  const toggleSma = (period: SmaPeriod) => {
    setActiveSmas((prev) => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  };

  const priceAtPixel = (y: number): number | null => {
    const handle = chartRef.current as ChartHandle | null;
    const yScale = handle?.getYScaleByAxisId("0");
    const price = yScale?.invert ? yScale.invert(y) : null;
    return typeof price === "number" ? price : null;
  };

  /** Shifts the zoomed window by `deltaIndex` candles, keeping its width
   * (and therefore the zoom level) fixed, clamped to the data's edges. */
  const shiftZoomWindow = (deltaIndex: number) => {
    setZoomWindow((prev) => {
      if (!prev || deltaIndex === 0) return prev;
      const size = prev.end - prev.start;
      let start = prev.start + deltaIndex;
      let end = prev.end + deltaIndex;
      if (start < 0) {
        start = 0;
        end = size;
      } else if (end > fullData.length - 1) {
        end = fullData.length - 1;
        start = end - size;
      }
      return { start, end };
    });
  };

  const handleMouseMove = (state: ChartMouseState) => {
    if (state.chartX == null || state.chartY == null) {
      clearHover();
      return;
    }

    if (panActive) {
      // The window (and Y domain) shifted since the last tick, but its
      // *size* never changes mid-pan, so the pixel<->index/price mapping
      // recharts uses is identical before and after each shift - meaning a
      // plain incremental delta from the last observed position is exact,
      // without ever having to know the plot's pixel dimensions.
      if (state.activeTooltipIndex != null && panLastIndex != null && state.activeTooltipIndex !== panLastIndex) {
        shiftZoomWindow(panLastIndex - state.activeTooltipIndex);
        setPanLastIndex(state.activeTooltipIndex);
      }
      const currentPrice = priceAtPixel(state.chartY);
      if (currentPrice != null && panLastPrice != null && currentPrice !== panLastPrice) {
        const priceShift = panLastPrice - currentPrice;
        setZoomYDomain((prev) => (prev ? [prev[0] + priceShift, prev[1] + priceShift] : prev));
        setPanLastPrice(currentPrice);
      }
      return;
    }

    // The vertical/horizontal lines below follow the raw mouse pixel
    // directly rather than snapping to the nearest candle/value - that pixel
    // is inverted through the y-axis scale to get the actual price under the
    // cursor, instead of reading the nearest candle's close.
    const price = priceAtPixel(state.chartY);
    const point = state.activePayload?.[0]?.payload;

    setHoverPrice(price);
    setHoverDate(point?.date ?? null);
    setHoverPoint(point ?? null);
    setCrosshairX(state.chartX);

    if (dragStart) {
      setDragCurrent({
        x: state.chartX,
        y: state.chartY,
        index: state.activeTooltipIndex ?? dragCurrent?.index ?? dragStart.index,
      });
    }
  };

  const handleMouseDown = (state: ChartMouseState) => {
    if (state.chartX == null || state.chartY == null) return;

    if (ctrlHeld && isZoomed) {
      if (state.activeTooltipIndex == null) return;
      setPanActive(true);
      setPanLastIndex(state.activeTooltipIndex);
      setPanLastPrice(priceAtPixel(state.chartY));
      return;
    }

    if (!boxZoomActive || state.activeTooltipIndex == null) return;
    const point: DragPoint = { x: state.chartX, y: state.chartY, index: state.activeTooltipIndex };
    setDragStart(point);
    setDragCurrent(point);
  };

  const handleMouseUp = () => {
    if (panActive) {
      setPanActive(false);
      setPanLastIndex(null);
      setPanLastPrice(null);
      return;
    }

    if (dragStart && dragCurrent) {
      const pixelDx = Math.abs(dragCurrent.x - dragStart.x);
      const startIndex = Math.min(dragStart.index, dragCurrent.index);
      const endIndex = Math.max(dragStart.index, dragCurrent.index);
      const priceA = priceAtPixel(dragStart.y);
      const priceB = priceAtPixel(dragCurrent.y);

      if (pixelDx >= MIN_DRAG_PX && endIndex > startIndex && priceA !== null && priceB !== null) {
        const offset = zoomWindow?.start ?? 0;
        setZoomWindow({ start: offset + startIndex, end: offset + endIndex });
        setZoomYDomain([Math.min(priceA, priceB), Math.max(priceA, priceB)]);
        setBoxZoomActive(false);
      }
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const handleMouseLeave = () => {
    clearHover();
    setDragStart(null);
    setDragCurrent(null);
    setPanActive(false);
    setPanLastIndex(null);
    setPanLastPrice(null);
  };

  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setBoxZoomActive((v) => !v)}
          title="Box zoom: drag a rectangle on the chart to zoom into that price/date range"
          aria-pressed={boxZoomActive}
          className={`rounded-md border p-1.5 transition ${
            boxZoomActive
              ? "border-sky-400 bg-sky-500/20 text-sky-300"
              : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          <MagnifierIcon className="h-4 w-4" />
        </button>
        <div className="h-5 w-px bg-white/10" />
        <button
          type="button"
          onClick={() => setIchimokuVisible((v) => !v)}
          title="Show/hide the Ichimoku indicator (cloud, Tenkan, Kijun, Chikou)"
          aria-pressed={ichimokuVisible}
          className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
            ichimokuVisible
              ? "border-sky-400 bg-sky-500/20 text-sky-300"
              : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          Ichi
        </button>
        {ichimokuVisible && (
          <button
            type="button"
            onClick={() => setToolkitVisible((v) => !v)}
            title="Show/hide Tenkan/Kijun/Chikou values and point markers on the chart"
            aria-pressed={toolkitVisible}
            className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
              toolkitVisible
                ? "border-sky-400 bg-sky-500/20 text-sky-300"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            Toolkit
          </button>
        )}
        <div className="h-5 w-px bg-white/10" />
        {SMA_PERIODS.map((period) => {
          const active = activeSmas.has(period);
          return (
            <button
              key={period}
              type="button"
              onClick={() => toggleSma(period)}
              title={`${period} SMA - simple moving average over the last ${period} candles`}
              aria-pressed={active}
              style={active ? { borderColor: SMA_COLORS[period], color: SMA_COLORS[period] } : undefined}
              className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                active
                  ? "bg-white/10"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {period}
            </button>
          );
        })}
        {isZoomed && (
          <button
            type="button"
            onClick={resetZoom}
            title="Reset zoom (or double-click the chart)"
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white/80"
          >
            Reset zoom
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={480}>
        <ComposedChart
          ref={chartRef}
          data={data}
          margin={{ top: 8, right: 56, left: 8, bottom: 24 }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={resetZoom}
          onMouseLeave={handleMouseLeave}
          className={
            boxZoomActive
              ? "cursor-crosshair select-none"
              : panActive
                ? "cursor-grabbing select-none"
                : ctrlHeld && isZoomed
                  ? "cursor-grab"
                  : undefined
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="#cbd5e1" fontSize={12} minTickGap={40} />
          <YAxis stroke="#cbd5e1" fontSize={12} domain={zoomYDomain ?? ["auto", "auto"]} />
          <Tooltip
            content={<ChartTooltip hiddenKeys={ichimokuVisible ? [] : ["tenkan", "kijun", "chikou"]} />}
            cursor={false}
          />

          {ichimokuVisible && [
            <Area
              key="bullishCloud"
              dataKey="bullishCloud"
              stroke="none"
              fill="#16a34a"
              fillOpacity={0.18}
              isAnimationActive={false}
              connectNulls={false}
            />,
            <Area
              key="bearishCloud"
              dataKey="bearishCloud"
              stroke="none"
              fill="#dc2626"
              fillOpacity={0.18}
              isAnimationActive={false}
              connectNulls={false}
            />,
            <Line
              key="tenkan"
              dataKey="tenkan"
              stroke="#38bdf8"
              dot={showDotMarkers ? { r: 2.5, strokeWidth: 0, fill: "#38bdf8" } : false}
              strokeWidth={1.5}
              isAnimationActive={false}
              connectNulls
            />,
            <Line
              key="kijun"
              dataKey="kijun"
              stroke="#f97316"
              dot={showDotMarkers ? { r: 2.5, strokeWidth: 0, fill: "#f97316" } : false}
              strokeWidth={1.5}
              isAnimationActive={false}
              connectNulls
            />,
            <Line
              key="chikou"
              dataKey="chikou"
              stroke="#c084fc"
              dot={showDotMarkers ? { r: 2.5, strokeWidth: 0, fill: "#c084fc" } : false}
              strokeWidth={1.5}
              isAnimationActive={false}
              connectNulls
            />,
          ]}

          {SMA_PERIODS.filter((period) => activeSmas.has(period)).map((period) => (
            <Line
              key={period}
              dataKey={`sma${period}`}
              stroke={SMA_COLORS[period]}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}

          {hoverPrice !== null && (
            <ReferenceLine
              y={hoverPrice}
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="3 3"
              label={(props: {
                viewBox?: { x?: number; y?: number; width?: number };
              }) => <PriceTag {...props} value={hoverPrice} color="#64748b" />}
            />
          )}
          {lastClose !== null && (
            <ReferenceLine
              y={lastClose}
              stroke="#eab308"
              strokeDasharray="3 3"
              label={(props: {
                viewBox?: { x?: number; y?: number; width?: number };
              }) => <PriceTag {...props} value={lastClose} />}
            />
          )}

          <Bar
            dataKey="range"
            shape={<CandlestickShape />}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Toolkit readout - current Tenkan/Kijun/Chikou values, following the
          hovered candle (or the latest one, when nothing's hovered). */}
      {ichimokuVisible && toolkitVisible && toolkitPoint && (
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-0.5 rounded-md bg-slate-950/70 px-2 py-1.5 text-[11px] font-medium backdrop-blur-sm">
          {toolkitPoint.tenkan != null && (
            <span style={{ color: "#38bdf8" }}>Tenkan {toolkitPoint.tenkan.toFixed(2)}</span>
          )}
          {toolkitPoint.kijun != null && <span style={{ color: "#f97316" }}>Kijun {toolkitPoint.kijun.toFixed(2)}</span>}
          {toolkitPoint.chikou != null && (
            <span style={{ color: "#c084fc" }}>Chikou {toolkitPoint.chikou.toFixed(2)}</span>
          )}
        </div>
      )}

      {/* Vertical crosshair line + date tag - plain pixel overlay, not a
          recharts ReferenceLine, so it tracks the cursor continuously
          instead of snapping to the nearest category tick (which also
          silently failed to render on H4/H1, where several candles share
          the same calendar-date label). */}
      {crosshairX !== null && hoverDate !== null && !dragStart && !panActive && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-0 h-[calc(100%-24px)] border-l border-dashed border-white/35"
            style={{ left: crosshairX }}
          />
          <div
            className="absolute -translate-x-1/2 whitespace-nowrap rounded bg-slate-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-950"
            style={{ left: crosshairX, top: "calc(100% - 20px)" }}
          >
            {hoverDate}
          </div>
        </div>
      )}

      {/* Box-zoom drag rectangle - the region the user is selecting to zoom
          into once they release the mouse. */}
      {dragStart && dragCurrent && (
        <div
          className="pointer-events-none absolute border border-sky-400/70 bg-sky-400/10"
          style={{
            left: Math.min(dragStart.x, dragCurrent.x),
            top: Math.min(dragStart.y, dragCurrent.y),
            width: Math.abs(dragCurrent.x - dragStart.x),
            height: Math.abs(dragCurrent.y - dragStart.y),
          }}
        />
      )}
    </div>
  );
}
