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
  rsi?: number | null;
}

const SMA_PERIODS = [50, 100, 200] as const;
type SmaPeriod = (typeof SMA_PERIODS)[number];

const SMA_COLORS: Record<SmaPeriod, string> = {
  50: "#2dd4bf",
  100: "#f472b6",
  200: "#e2e8f0",
};

const RSI_PERIOD = 14;
const RSI_COLOR = "#a3e635";
const RSI_LEVEL_COLOR = "#eab308";
const RSI_LEVELS = [20, 80] as const;
const RSI_PANEL_HEIGHT = 140;
// Both the price chart and the RSI panel use these exact side margins and Y
// axis width, so their plot areas (and therefore their candles) line up.
const CHART_MARGIN_LEFT = 8;
const CHART_MARGIN_RIGHT = 56;
const Y_AXIS_WIDTH = 60;

function rsiFromAverages(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

/** Wilder's RSI over `values` - null until `period` price changes have
 * accumulated, and for points with no close (e.g. the projected cloud
 * candles past the last real bar). */
function computeRsi(values: (number | undefined)[], period = RSI_PERIOD): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  let prev: number | null = null;
  let avgGain = 0;
  let avgLoss = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null) continue;
    if (prev == null) {
      prev = v;
      continue;
    }
    const diff = v - prev;
    prev = v;
    const gain = Math.max(diff, 0);
    const loss = Math.max(-diff, 0);
    count++;
    if (count <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (count === period) {
        avgGain /= period;
        avgLoss /= period;
        out[i] = rsiFromAverages(avgGain, avgLoss);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      out[i] = rsiFromAverages(avgGain, avgLoss);
    }
  }
  return out;
}

function RsiTooltip({ active, payload }: { active?: boolean; payload?: { payload?: ChartDatum }[] }) {
  const datum = payload?.[0]?.payload;
  if (!active || !datum || datum.rsi == null) return null;
  return (
    <div className="rounded-md border border-white/10 bg-slate-900/95 px-2 py-1 text-xs">
      <div className="text-white/50">{datum.date}</div>
      <div style={{ color: RSI_COLOR }}>RSI {datum.rsi.toFixed(1)}</div>
    </div>
  );
}

/** Rounds a price bound outward (down for a low bound, up for a high one)
 * to a "nice" precision scaled to its own magnitude - e.g. 25.84 -> 25,
 * 194.67 -> 200, 0.6317 -> 0.64 - instead of leaving raw floating-point
 * padding artifacts (25.84074935913086) for recharts to build ugly,
 * unevenly-spaced tick marks from. */
function roundPriceBound(value: number, direction: "down" | "up"): number {
  const magnitude = Math.max(Math.abs(value), 1e-6);
  const step = Math.pow(10, Math.floor(Math.log10(magnitude)) - 1);
  const rounded = direction === "down" ? Math.floor(value / step) * step : Math.ceil(value / step) * step;
  // Clamp to a handful of decimal places to strip any residual float noise
  // from the division/multiplication above.
  return Math.round(rounded * 1e6) / 1e6;
}

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
  const wheelZoomRef = useRef<HTMLDivElement>(null);
  // Absolute index (into fullData) of whatever candle the mouse was last
  // over, kept as a ref (not state) so the wheel listener below - a native
  // listener registered once - can read it without needing to be
  // re-registered on every hover tick. Lets Ctrl+scroll zoom pivot around
  // the cursor instead of always zooming toward the current view's
  // midpoint.
  const hoverIndexRef = useRef<number | null>(null);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState<ChartDatum | null>(null);
  const [crosshairX, setCrosshairX] = useState<number | null>(null);
  const [boxZoomActive, setBoxZoomActive] = useState(false);
  const [dragStart, setDragStart] = useState<DragPoint | null>(null);
  const [dragCurrent, setDragCurrent] = useState<DragPoint | null>(null);
  // Defaults to the most recent third of the fetched history (for every
  // timeframe) rather than the whole period at once - the full range is
  // still fetched and just a scroll/pan away (Ctrl+drag, Ctrl+scroll, or
  // "Reset zoom"), but a chart that opens already zoomed into what's
  // recent is bigger and more legible without losing anything.
  const [zoomWindow, setZoomWindow] = useState<ZoomWindow | null>(() => {
    const MIN_BARS_TO_DEFAULT_ZOOM = 20;
    if (bars.length < MIN_BARS_TO_DEFAULT_ZOOM) return null;
    const start = Math.floor((bars.length * 2) / 3);
    const end = points.length - 1;
    return start < end ? { start, end } : null;
  });
  const [zoomYDomain, setZoomYDomain] = useState<[number, number] | null>(null);
  const [activeSmas, setActiveSmas] = useState<Set<SmaPeriod>>(new Set());
  const [ichimokuVisible, setIchimokuVisible] = useState(true);
  const [toolkitVisible, setToolkitVisible] = useState(false);
  const [rsiVisible, setRsiVisible] = useState(false);
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const [panActive, setPanActive] = useState(false);
  const [panLastIndex, setPanLastIndex] = useState<number | null>(null);
  const [panLastPrice, setPanLastPrice] = useState<number | null>(null);
  // Touchscreens (e.g. phones) have no Ctrl key, so the desktop
  // Ctrl+drag-to-pan gesture is unreachable there - on a coarse pointer we
  // let a plain drag pan instead, whenever box zoom isn't active.
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    setIsCoarsePointer(query.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsCoarsePointer(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

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
    // Like the SMAs, RSI is computed over the whole history so its first
    // visible values aren't distorted by the current zoom window.
    const rsiSeries = rsiVisible ? computeRsi(closes) : null;
    return mergedData.map((datum, i) => {
      const smaValues: Partial<Record<`sma${SmaPeriod}`, number | null>> = {};
      for (const period of activeSmas) {
        smaValues[`sma${period}`] = smaSeriesByPeriod.get(period)![i];
      }
      return { ...datum, ...smaValues, ...(rsiSeries ? { rsi: rsiSeries[i] } : {}) };
    });
  }, [mergedData, activeSmas, rsiVisible]);

  const data = useMemo(
    () => (zoomWindow ? fullData.slice(zoomWindow.start, zoomWindow.end + 1) : fullData),
    [fullData, zoomWindow],
  );

  // The real low/high span of the whole dataset - a sanity bound. Nothing
  // the user does should ever produce a Y-axis domain wildly outside this,
  // so it backstops any bad value regardless of which code path produced
  // it (box-zoom, pan, or a future one), rather than trusting each call
  // site to get pixel-to-price inversion right on every browser/timing.
  const overallPriceRange = useMemo((): [number, number] | null => {
    const lows = fullData.map((d) => d.low).filter((v): v is number => v != null);
    const highs = fullData.map((d) => d.high).filter((v): v is number => v != null);
    return lows.length && highs.length ? [Math.min(...lows), Math.max(...highs)] : null;
  }, [fullData]);

  // Rendered Y-axis domain. Deliberately does NOT delegate to recharts'
  // own "auto" domain scan (letting it compute min/max itself across
  // every series sharing this axis - the range Bar, both cloud Areas,
  // Tenkan/Kijun/Chikou lines, any active SMAs): when not zoomed, it's the
  // real dataset range (padded slightly) computed here from verified
  // price data; when zoomed, it's zoomYDomain if that falls within a
  // sane bound of the real range, otherwise the real zoomed-window range
  // recomputed fresh - never a raw "auto" pass we don't control the
  // inputs to.
  const renderedYDomain = useMemo((): [number, number] | ["auto", "auto"] => {
    if (!overallPriceRange) return ["auto", "auto"];
    const [overallLo, overallHi] = overallPriceRange;
    const overallSpan = overallHi - overallLo || Math.abs(overallHi) || 1;

    if (!zoomWindow) {
      const pad = overallSpan * 0.05;
      return [roundPriceBound(overallLo - pad, "down"), roundPriceBound(overallHi + pad, "up")];
    }

    if (zoomYDomain) {
      const min = overallLo - overallSpan * 5;
      const max = overallHi + overallSpan * 5;
      const [a, b] = zoomYDomain;
      if (a >= min && a <= max && b >= min && b <= max) return zoomYDomain;
    }

    const windowLows = data.map((d) => d.low).filter((v): v is number => v != null);
    const windowHighs = data.map((d) => d.high).filter((v): v is number => v != null);
    if (windowLows.length && windowHighs.length) {
      const lo = Math.min(...windowLows);
      const hi = Math.max(...windowHighs);
      const pad = (hi - lo || Math.abs(hi) || 1) * 0.05;
      return [roundPriceBound(lo - pad, "down"), roundPriceBound(hi + pad, "up")];
    }
    return ["auto", "auto"];
  }, [zoomYDomain, zoomWindow, overallPriceRange, data]);

  // Kept fresh every render so the wheel/touch listeners below (registered
  // once, native rather than React's synthetic events) never close over a
  // stale fullData/zoomWindow from an earlier render.
  const fullDataRef = useRef(fullData);
  fullDataRef.current = fullData;
  const zoomWindowRef = useRef(zoomWindow);
  zoomWindowRef.current = zoomWindow;

  /** Resizes the zoom window to whatever `computeNewSize(currentSize,
   * lastIndex)` returns, keeping `anchor`'s position within the window
   * fixed (so the resize pivots around that index rather than the
   * window's own midpoint) - shared by Ctrl+scroll (anchor = hovered
   * candle) and pinch-to-zoom (anchor = the touch midpoint), which only
   * differ in how they derive the target size and anchor. `anchor: null`
   * falls back to the current window's own midpoint. */
  const applyZoom = (
    fullData: ChartDatum[],
    computeNewSize: (currentSize: number, lastIndex: number) => number,
    anchorRaw: number | null,
  ) => {
    const lastIndex = fullData.length - 1;
    if (lastIndex < 1) return;
    const minVisible = Math.min(10, lastIndex);

    setZoomWindow((prev) => {
      const currentStart = prev?.start ?? 0;
      const currentEnd = prev?.end ?? lastIndex;
      const size = currentEnd - currentStart;

      let newSize = Math.round(computeNewSize(size, lastIndex));
      newSize = Math.max(minVisible, Math.min(lastIndex, newSize));
      if (newSize === size) return prev; // already fully zoomed in/out

      const anchor = Math.min(Math.max(anchorRaw ?? (currentStart + currentEnd) / 2, currentStart), currentEnd);
      const leftRatio = size > 0 ? (anchor - currentStart) / size : 0.5;

      let start = Math.round(anchor - leftRatio * newSize);
      let end = start + newSize;
      if (start < 0) {
        start = 0;
        end = newSize;
      } else if (end > lastIndex) {
        end = lastIndex;
        start = end - newSize;
      }

      if (start <= 0 && end >= lastIndex) {
        setZoomYDomain(null);
        return null;
      }

      const windowData = fullData.slice(start, end + 1);
      const lows = windowData.map((d) => d.low).filter((v): v is number => v != null);
      const highs = windowData.map((d) => d.high).filter((v): v is number => v != null);
      setZoomYDomain(
        lows.length && highs.length
          ? [roundPriceBound(Math.min(...lows), "down"), roundPriceBound(Math.max(...highs), "up")]
          : null,
      );

      return { start, end };
    });
  };

  /** Approximates the chart-data index under a screen X position, from the
   * container's own bounding rect and the ComposedChart's known margins
   * (plus a rough allowance for the auto-sized Y-axis label gutter, which
   * recharts doesn't expose a way to measure exactly). Good enough to pinch
   * roughly where the fingers are without needing recharts' undocumented
   * X-scale internals - unlike the Y-axis (see getYScaleByAxisId elsewhere
   * in this file), there's no equivalent hook for the X axis to invert
   * exactly. */
  const touchClientXToIndex = (clientX: number, container: HTMLDivElement, dataLength: number): number => {
    const rect = container.getBoundingClientRect();
    const leftGutter = 8 + 40; // chart margin.left + approx Y-axis label width
    const rightGutter = 56; // chart margin.right
    const plotWidth = Math.max(1, rect.width - leftGutter - rightGutter);
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left - leftGutter) / plotWidth));
    return Math.round(ratio * (dataLength - 1));
  };

  // Ctrl+scroll zoom, in/out, pivoting around whatever candle is under the
  // cursor (via hoverIndexRef) rather than the current view's midpoint -
  // the same "zoom toward the pointer" behavior as Google Maps/TradingView.
  // Two-finger pinch does the same thing for touch, pivoting around the
  // midpoint between the fingers. Both are native listeners with
  // { passive: false } - React's onWheel/onTouchMove are passive by
  // default since v17, so e.preventDefault() inside them is a silent
  // no-op and the page would scroll/zoom instead of the chart.
  useEffect(() => {
    const el = wheelZoomRef.current;
    if (!el) return;

    function handleWheelZoom(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const fullData = fullDataRef.current;
      const zoomingIn = e.deltaY < 0;
      applyZoom(
        fullData,
        (size) => {
          const step = Math.max(1, Math.round(size * 0.15));
          return zoomingIn ? size - step * 2 : size + step * 2;
        },
        hoverIndexRef.current,
      );
    }

    // Pinch state for the gesture currently in progress, or null between
    // gestures - reset whenever the second finger lifts.
    let pinch: { initialDistance: number; initialSize: number; anchor: number } | null = null;

    function touchDistance(t0: Touch, t1: Touch): number {
      return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2 || !el) return;
      e.preventDefault();
      // A second finger landing mid-gesture means whatever single-finger
      // pan/box-zoom-drag the first finger may have started (via recharts'
      // own touch-to-mouse-event handling) needs to stand down, so it
      // doesn't fight the pinch for the same zoom/pan state.
      setPanActive(false);
      setPanLastIndex(null);
      setPanLastPrice(null);
      setDragStart(null);
      setDragCurrent(null);
      const fullData = fullDataRef.current;
      const currentWindow = zoomWindowRef.current;
      const lastIndex = fullData.length - 1;
      const size = (currentWindow?.end ?? lastIndex) - (currentWindow?.start ?? 0);
      const [t0, t1] = [e.touches[0], e.touches[1]];
      pinch = {
        initialDistance: touchDistance(t0, t1),
        initialSize: size,
        anchor: touchClientXToIndex((t0.clientX + t1.clientX) / 2, el, fullData.length),
      };
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !pinch) return;
      e.preventDefault();
      const [t0, t1] = [e.touches[0], e.touches[1]];
      const newDistance = touchDistance(t0, t1);
      if (pinch.initialDistance < 1) return;
      // Fingers spreading apart (scale > 1) should zoom IN, i.e. shrink
      // the visible window - hence dividing rather than multiplying.
      const scale = newDistance / pinch.initialDistance;
      const targetSize = pinch.initialSize / scale;
      applyZoom(fullDataRef.current, () => targetSize, pinch.anchor);
    }

    function handleTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinch = null;
    }

    el.addEventListener("wheel", handleWheelZoom, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: false });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelZoom);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);
  const lastClose = bars.length > 0 ? bars[bars.length - 1].close : null;
  const isZoomed = zoomWindow !== null;
  // Toolkit readout: whatever's under the cursor, or the most recent
  // visible candle when nothing's being hovered.
  const toolkitPoint = hoverPoint ?? data[data.length - 1] ?? null;
  const showDotMarkers = toolkitVisible && data.length <= DOT_MARKER_LIMIT;
  // RSI header readout: value under the cursor, else the latest real candle's.
  const rsiReadout = hoverPoint?.rsi ?? [...data].reverse().find((d) => d.rsi != null)?.rsi ?? null;

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

  /** +/- zoom buttons, for desktop pointers that have neither Ctrl+scroll
   * nor a pinch gesture handy - same applyZoom used by both of those, but
   * anchored on the most recent real candle (not the window's own
   * midpoint) so zooming in/out keeps today's price and bars in view
   * instead of drifting toward whatever the view currently happens to be
   * centered on. applyZoom clamps the anchor into the visible window, so
   * if the user has panned away from the present, this pins to the
   * current view's right edge instead of jumping back to today. */
  const zoomStep = (zoomingIn: boolean) => {
    applyZoom(
      fullDataRef.current,
      (size) => {
        const step = Math.max(1, Math.round(size * 0.25));
        return zoomingIn ? size - step : size + step;
      },
      bars.length - 1,
    );
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
    if (typeof price !== "number" || !Number.isFinite(price)) return null;
    // getYScaleByAxisId is an undocumented recharts internal that can
    // occasionally return a scale that hasn't caught up with the current
    // render, inverting a pixel to a wildly wrong "price". Reject
    // anything far outside the dataset's real range here, at the source,
    // rather than letting it feed into pan's cumulative delta.
    if (overallPriceRange) {
      const [lo, hi] = overallPriceRange;
      const span = hi - lo || Math.abs(hi) || 1;
      if (price < lo - span * 5 || price > hi + span * 5) return null;
    }
    return price;
  };

  /** Low/high price range actually spanned by fullData[start..end], or
   * null if none of those candles have price data. Used to auto-fit the
   * Y-axis to a zoomed index range from real data, rather than trusting
   * getYScaleByAxisId's pixel-to-price inversion - an undocumented
   * recharts internal that can occasionally hand back a scale that hasn't
   * caught up with the latest render, corrupting zoomYDomain with a
   * nonsensical absolute value that then sticks. */
  const priceRangeForWindow = (start: number, end: number): [number, number] | null => {
    const windowData = fullData.slice(start, end + 1);
    const lows = windowData.map((d) => d.low).filter((v): v is number => v != null);
    const highs = windowData.map((d) => d.high).filter((v): v is number => v != null);
    return lows.length && highs.length
      ? [roundPriceBound(Math.min(...lows), "down"), roundPriceBound(Math.max(...highs), "up")]
      : null;
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

    if (state.activeTooltipIndex != null) {
      // activeTooltipIndex is relative to the currently rendered (possibly
      // already-zoomed) data - offset by the window's start to get the
      // absolute index into fullData that Ctrl+scroll zoom anchors on.
      hoverIndexRef.current = (zoomWindow?.start ?? 0) + state.activeTooltipIndex;
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

    if ((ctrlHeld || (isCoarsePointer && !boxZoomActive)) && isZoomed) {
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

      if (pixelDx >= MIN_DRAG_PX && endIndex > startIndex) {
        const offset = zoomWindow?.start ?? 0;
        const start = offset + startIndex;
        const end = offset + endIndex;
        setZoomWindow({ start, end });
        setZoomYDomain(priceRangeForWindow(start, end));
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
    hoverIndexRef.current = null;
  };

  return (
    <div ref={wheelZoomRef}>
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setBoxZoomActive((v) => !v)}
          title="Zoom prostokątny: przeciągnij prostokąt na wykresie, żeby przybliżyć ten zakres ceny/daty. Ctrl+scroll, żeby dowolnie przybliżać/oddalać, albo Ctrl+przeciągnij po przybliżeniu, żeby przesuwać widok."
          aria-pressed={boxZoomActive}
          className={`rounded-md border p-1.5 transition ${
            boxZoomActive
              ? "border-sky-400 bg-sky-500/20 text-sky-300"
              : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          <MagnifierIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomStep(true)}
          title="Przybliż (albo Ctrl+scroll / rozsuń palce na wykresie)"
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm font-semibold leading-none text-white/50 transition hover:bg-white/10 hover:text-white/80"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomStep(false)}
          title="Oddal (albo Ctrl+scroll / zsuń palce na wykresie)"
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm font-semibold leading-none text-white/50 transition hover:bg-white/10 hover:text-white/80"
        >
          −
        </button>
        <div className="h-5 w-px shrink-0 bg-white/10" />
        <button
          type="button"
          onClick={() => setIchimokuVisible((v) => !v)}
          title="Pokaż/ukryj wskaźnik Ichimoku (chmura, Tenkan, Kijun, Chikou)"
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
            title="Pokaż/ukryj wartości Tenkan/Kijun/Chikou i znaczniki punktów na wykresie"
            aria-pressed={toolkitVisible}
            className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
              toolkitVisible
                ? "border-sky-400 bg-sky-500/20 text-sky-300"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            Narzędzia
          </button>
        )}
        <div className="h-5 w-px shrink-0 bg-white/10" />
        {SMA_PERIODS.map((period) => {
          const active = activeSmas.has(period);
          return (
            <button
              key={period}
              type="button"
              onClick={() => toggleSma(period)}
              title={`${period} SMA - prosta średnia krocząca z ostatnich ${period} świec`}
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
        <div className="h-5 w-px shrink-0 bg-white/10" />
        <button
          type="button"
          onClick={() => setRsiVisible((v) => !v)}
          title={`RSI (${RSI_PERIOD}) w panelu pod wykresem, z poziomami na ${RSI_LEVELS[0]} i ${RSI_LEVELS[1]}`}
          aria-pressed={rsiVisible}
          style={rsiVisible ? { borderColor: RSI_COLOR, color: RSI_COLOR } : undefined}
          className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
            rsiVisible ? "bg-white/10" : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          RSI
        </button>
        {isZoomed && (
          <button
            type="button"
            onClick={resetZoom}
            title="Resetuj przybliżenie (albo dwuklik na wykresie)"
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white/80"
          >
            Resetuj zoom
          </button>
        )}
      </div>
      <div>
      <ResponsiveContainer width="100%" height={480}>
        <ComposedChart
          ref={chartRef}
          data={data}
          margin={{ top: 8, right: CHART_MARGIN_RIGHT, left: CHART_MARGIN_LEFT, bottom: 24 }}
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
          <YAxis
            width={Y_AXIS_WIDTH}
            stroke="#cbd5e1"
            fontSize={12}
            domain={renderedYDomain}
            tickFormatter={(v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2))}
          />
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
      </div>

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

    {rsiVisible && (
      <div className="relative mt-1">
        <div className="mb-1 flex items-center gap-2 pl-2 text-xs">
          <span className="font-semibold text-white/80">RSI ({RSI_PERIOD})</span>
          {rsiReadout != null && <span style={{ color: RSI_COLOR }}>{rsiReadout.toFixed(1)}</span>}
        </div>
        <ResponsiveContainer width="100%" height={RSI_PANEL_HEIGHT}>
          <ComposedChart
            data={data}
            margin={{ top: 4, right: CHART_MARGIN_RIGHT, left: CHART_MARGIN_LEFT, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" hide />
            <YAxis
              width={Y_AXIS_WIDTH}
              stroke="#cbd5e1"
              fontSize={12}
              domain={[0, 100]}
              ticks={[0, ...RSI_LEVELS, 100]}
            />
            <Tooltip content={<RsiTooltip />} cursor={{ stroke: "rgba(255,255,255,0.35)", strokeDasharray: "3 3" }} />
            {RSI_LEVELS.map((level) => (
              <ReferenceLine key={level} y={level} stroke={RSI_LEVEL_COLOR} strokeDasharray="4 4" strokeWidth={1.25} />
            ))}
            <Line
              dataKey="rsi"
              stroke={RSI_COLOR}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )}
    </div>
  );
}
