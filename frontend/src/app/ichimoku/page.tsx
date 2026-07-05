"use client";

import { useEffect, useRef, useState } from "react";

import { IchimokuChart } from "@/components/IchimokuChart";
import { Spinner } from "@/components/Spinner";
import { getIchimoku, type Timeframe } from "@/lib/api";
import { TIMEFRAMES } from "@/lib/timeframes";
import type { IchimokuResponse } from "@/types/ichimoku";

export default function IchimokuPage() {
  const [symbolInput, setSymbolInput] = useState("AAPL");
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [thresholdPct, setThresholdPct] = useState(3);
  const [data, setData] = useState<IchimokuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    getIchimoku(symbol, timeframe, thresholdPct)
      .then((result) => {
        if (requestIdRef.current === requestId) setData(result);
      })
      .catch((err) => {
        if (requestIdRef.current === requestId) setError(err.message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  }, [symbol, timeframe, thresholdPct]);

  const timeframeLabel = TIMEFRAMES.find((tf) => tf.value === timeframe)?.label ?? timeframe;
  const showingStale = data !== null && (data.symbol !== symbol || loading);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Ichimoku Kinko Hyo</h1>
      <p className="mt-1 text-sm text-white/50">
        &ldquo;One glance equilibrium chart&rdquo; — a trend, momentum and support/resistance system built entirely
        from price, developed by Goichi Hosoda and published in 1968.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSymbol(symbolInput.trim().toUpperCase());
        }}
        className="mt-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label className="block text-xs text-white/50">Symbol</label>
          <input
            value={symbolInput}
            onChange={(event) => setSymbolInput(event.target.value)}
            disabled={loading}
            className="mt-1 w-28 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Load
        </button>

        <div className="flex items-center gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              type="button"
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              disabled={loading}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                timeframe === tf.value ? "bg-sky-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {tf.label}
            </button>
          ))}
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <Spinner />
              loading {timeframeLabel}…
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs text-white/50">Wave sensitivity ({thresholdPct}%)</label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={thresholdPct}
            onChange={(event) => setThresholdPct(Number(event.target.value))}
            disabled={loading}
            className="mt-2 w-40 disabled:opacity-50"
          />
        </div>
      </form>

      {error && (
        <p className="mt-6 text-fall">
          Failed to load {symbol}: {error}
        </p>
      )}

      {data && (
        <>
          <p className="mt-8 text-xs text-white/40">
            Showing <span className="font-medium text-white/70">{data.symbol}</span> · {timeframeLabel}
            {showingStale && " (refreshing…)"}
          </p>
          <div className="relative mt-2 min-h-[480px]">
            <IchimokuChart bars={data.bars} points={data.points} />
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <Spinner size={16} />
                  Loading {symbol} · {timeframeLabel}…
                </div>
              </div>
            )}
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Trend assessment</h2>
            <p className="mt-1 text-sm text-white/50">
              Based on the last {data.assessment.lookback_candles} candles, looking {data.assessment.forecast_candles}{" "}
              candles ahead.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    data.assessment.outlook === "bullish"
                      ? "bg-rise/20 text-rise"
                      : data.assessment.outlook === "bearish"
                        ? "bg-fall/20 text-fall"
                        : "bg-white/10 text-white/60"
                  }`}
                >
                  {data.assessment.outlook.toUpperCase()}
                </span>
                <span className="text-sm text-white/50">
                  {data.assessment.score > 0 ? "+" : ""}
                  {data.assessment.score} / {data.assessment.max_score} signals
                </span>
              </div>
              <p className="mt-3 text-sm text-white/70">{data.assessment.summary}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {data.assessment.signals.map((signal, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-t border-white/5 pt-2 first:border-0 first:pt-0"
                  >
                    <span className="text-white/60">{signal.name}</span>
                    <span
                      className={
                        signal.bullish === true ? "text-rise" : signal.bullish === false ? "text-fall" : "text-white/40"
                      }
                    >
                      {signal.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Wave price targets</h2>
            <p className="mt-1 text-sm text-white/50">
              Computed from the most recent zigzag swing pivots (see &ldquo;How the range tool works&rdquo; below).
              Most recent set first.
            </p>
            {data.wave_targets.length === 0 ? (
              <p className="mt-4 text-sm text-white/40">
                Not enough swing pivots found at this sensitivity — try lowering &ldquo;wave sensitivity&rdquo; or
                picking a longer timeframe.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {data.wave_targets.map((set, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40">{i === 0 ? "Current wave" : `${i + 1} waves ago`}</p>
                    <dl className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-white/50">V target</dt>
                        <dd>{set.v_target.toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-white/50">N target</dt>
                        <dd>{set.n_target.toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-white/50">E target</dt>
                        <dd>{set.e_target.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {!data && loading && (
        <div className="mt-8 flex min-h-[480px] items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <Spinner size={16} />
            Loading {symbol} · {timeframeLabel}…
          </div>
        </div>
      )}

      <section className="mt-12 space-y-4 text-sm leading-relaxed text-white/70">
        <h2 className="text-lg font-semibold text-white">How Ichimoku works</h2>
        <p>
          Ichimoku Kinko Hyo plots five lines, all derived purely from price (no separate oscillator formula):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-sky-400">Tenkan-sen</strong> (conversion line, blue) — midpoint of the 9-period
            high/low. Reacts fastest; a short-term trend gauge.
          </li>
          <li>
            <strong className="text-orange-400">Kijun-sen</strong> (base line, orange) — midpoint of the 26-period
            high/low. Slower; often traded as a dynamic support/resistance and trailing-stop level. Tenkan crossing
            above/below Kijun is the classic Ichimoku &ldquo;TK cross&rdquo; entry signal.
          </li>
          <li>
            <strong>Senkou Span A / B</strong> (the cloud, green/red) — the average of Tenkan+Kijun (Span A) and
            the 52-period high/low midpoint (Span B), both plotted 26 periods <em>ahead</em> of price. The shaded
            area between them is the &ldquo;Kumo&rdquo; (cloud): green when Span A is above Span B (bullish bias),
            red when reversed (bearish bias). Price above the cloud implies an uptrend; below implies a downtrend;
            inside implies range/transition. A thick cloud implies stronger support/resistance; a thin one (or a
            &ldquo;twist&rdquo; where A crosses B) flags a potential trend change.
          </li>
          <li>
            <strong className="text-purple-400">Chikou Span</strong> (lagging span, purple) — today&rsquo;s close
            plotted 26 periods <em>behind</em>. Chikou sitting clear of past price action in the trend&rsquo;s
            direction confirms the trend; Chikou tangled in past price suggests indecision.
          </li>
        </ul>
        <p>
          Because Span A/B are projected forward using data that already exists today, the cloud visible ahead of
          the current candle is not a prediction — it&rsquo;s a known future shape derived from the past 26-52
          periods.
        </p>

        <h2 className="text-lg font-semibold text-white">How the trend assessment works</h2>
        <p>
          The panel above the wave targets scores five standard Ichimoku signals — price vs the cloud, Tenkan vs
          Kijun, Chikou span vs price 26 periods back, price momentum over the lookback window, and the cloud&rsquo;s
          own color over the forecast window (already computable today, since it&rsquo;s built from displaced past
          data) — each contributing +1 (bullish), -1 (bearish) or 0 (neutral/insufficient data). A total of +2 or
          higher is labeled Bullish, -2 or lower is Bearish, anything between is Neutral. It is a simple rule-based
          checklist, not a statistical model — treat it as a summary of what the chart is already showing, not an
          independent prediction.
        </p>

        <h2 className="text-lg font-semibold text-white">How the range / wave target tool works</h2>
        <p>
          Beyond the five lines, classical Ichimoku theory (Hosoda&rsquo;s &ldquo;wave principle&rdquo;) includes
          price-target arithmetic based on the size of recent swings (&ldquo;waves&rdquo;). This tool automates the
          wave-identification step with a simple zigzag: it walks through closing prices and marks a new pivot
          whenever price reverses by at least the &ldquo;wave sensitivity&rdquo; percentage set above (default 3%).
          Lower it to catch smaller swings on calmer or longer timeframes; raise it to filter noise on volatile
          tickers.
        </p>
        <p>Given three consecutive pivots A (oldest) → B (middle) → C (most recent), it projects:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>N calculation</strong> — <code>C + (B − A)</code>. The most commonly used target: assumes the
            next leg repeats the size of the A→B leg, continuing in the B→C direction. Generally considered the
            most reliable of the three.
          </li>
          <li>
            <strong>V calculation</strong> — <code>C − (B − A)</code>. The mirror image of N; a target for a
            sharper reversal at C, as if tracing a V or W shape.
          </li>
          <li>
            <strong>E calculation</strong> — <code>C + (C − B)</code>. An extension target: assumes the current
            B→C leg simply repeats itself once more from C.
          </li>
        </ul>
        <p>
          These are exactly that — arithmetic projections from a heuristic pivot detector, not guarantees. Ichimoku
          practitioners treat them as one input alongside the cloud, TK cross, and Chikou confirmation, not a
          standalone signal. Different Ichimoku texts also define a fourth calculation
          (&ldquo;NT&rdquo;) slightly differently depending on the source, so it&rsquo;s intentionally left out
          here rather than risk stating it incorrectly — treat V/N/E as a starting point for your own analysis, not
          financial advice.
        </p>
      </section>
    </main>
  );
}
