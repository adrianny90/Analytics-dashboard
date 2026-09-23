"""Checks that every history source returns the same data as Yahoo.

Downloads the same sample of symbols from each configured source (see
app/services/providers/history_sources.py) and compares them bar by bar with the
reference source on the timestamps both have, plus the Ichimoku outlook the
ranking actually derives from them.

    python -m app.scripts.compare_sources                     # 25 per index = 100 symbols, D1/W1/H1(+H4)
    python -m app.scripts.compare_sources --per-index 40 --intervals 1d
    python -m app.scripts.compare_sources --sources yfinance,alpaca --json report.json

Slow sources are slow here too: Polygon's free plan (5 requests/min) needs
~20 minutes per interval for 100 symbols.
"""

import argparse
import asyncio
import json
import logging
import statistics
import time

import pandas as pd

from app.core.nasdaq_symbols import NASDAQ_SYMBOLS
from app.core.nyse_symbols import NYSE_SYMBOLS
from app.core.russell2000_symbols import RUSSELL2000_SYMBOLS
from app.core.sp500_symbols import SP500_SYMBOLS
from app.services.indicators.assessment import compute_assessment
from app.services.indicators.ichimoku import compute_ichimoku
from app.services.market_service import TIMEFRAME_CONFIG
from app.services.providers.history_sources import (
    HistorySource,
    SourceRateLimited,
    SourceUnavailable,
    build_sources,
)
from app.services.providers.yfinance_provider import YFinanceProvider
from app.schemas.market import Timeframe

logger = logging.getLogger("compare_sources")

INDICES = {"sp500": SP500_SYMBOLS, "nasdaq": NASDAQ_SYMBOLS, "russell2000": RUSSELL2000_SYMBOLS, "nyse": NYSE_SYMBOLS}
# interval -> the timeframes the ranking derives from it (H4 = H1 resampled).
INTERVAL_TIMEFRAMES = {"1d": [Timeframe.DAY], "1wk": [Timeframe.WEEK], "1h": [Timeframe.H1, Timeframe.H4]}
PRICE_COLUMNS = ["Open", "High", "Low", "Close"]
# A bar "matches" when every OHLC price is within this relative difference.
MATCH_TOLERANCE = 0.005


def sample_symbols(per_index: int) -> list[tuple[str, str]]:
    """Evenly spread picks from each index list (mega caps and small caps alike)."""
    picked: list[tuple[str, str]] = []
    seen: set[str] = set()
    for index, symbols in INDICES.items():
        step = max(1, len(symbols) // per_index)
        count = 0
        for symbol in symbols[::step]:
            if symbol in seen:
                continue
            seen.add(symbol)
            picked.append((index, symbol))
            count += 1
            if count >= per_index:
                break
    return picked


async def download(source: HistorySource, symbols: list[str], period: str, interval: str) -> dict[str, pd.DataFrame]:
    frames: dict[str, pd.DataFrame] = {}
    batches = [symbols[i : i + source.batch_size] for i in range(0, len(symbols), source.batch_size)]
    for n, batch in enumerate(batches, 1):
        for attempt in range(6):
            wait = source.available_in()
            if wait > 0:
                await asyncio.sleep(wait)
            try:
                frames.update(await source.fetch(batch, period, interval))
                break
            except SourceRateLimited as exc:
                logger.info("%s rate limited, waiting %.0fs", source.name, exc.retry_after)
                await asyncio.sleep(min(exc.retry_after, 120))
            except SourceUnavailable as exc:
                logger.warning("%s unavailable: %s", source.name, exc)
                return frames
            except Exception as exc:
                logger.warning("%s failed on %s: %s", source.name, batch, exc)
                break
        if n % 10 == 0 or n == len(batches):
            logger.info("%s %s: %d/%d batches, %d symbols so far", source.name, interval, n, len(batches), len(frames))
    return frames


def outlook(frame: pd.DataFrame, resample: str | None) -> str | None:
    try:
        bars = YFinanceProvider.series_from_frame(frame, [resample])[0]
        return compute_assessment(bars, compute_ichimoku(bars)).outlook
    except Exception:
        return None


def compare_frames(ref: pd.DataFrame, other: pd.DataFrame) -> dict | None:
    ref = ref.dropna(subset=["Close"])
    other = other.dropna(subset=["Close"])
    # Only the span both cover (sources differ in how far back they go), and
    # not the newest bar - the reference may show a live, still-forming bar.
    start = max(ref.index.min(), other.index.min())
    end = min(ref.index.max(), other.index.max())
    ref = ref[(ref.index >= start) & (ref.index < end)]
    other = other[(other.index >= start) & (other.index < end)]
    common = ref.index.intersection(other.index)
    if len(common) == 0:
        return None
    r, o = ref.loc[common, PRICE_COLUMNS], other.loc[common, PRICE_COLUMNS]
    rel = ((o - r).abs() / r.abs()).fillna(0)
    close_rel = rel["Close"]
    volume_ratio = (other.loc[common, "Volume"] / ref.loc[common, "Volume"].replace(0, pd.NA)).dropna()
    return {
        "bars": len(common),
        "only_ref": len(ref.index.difference(other.index)),
        "only_other": len(other.index.difference(ref.index)),
        "close_median_pct": float(close_rel.median() * 100),
        "close_max_pct": float(close_rel.max() * 100),
        "ohlc_match": float((rel.max(axis=1) <= MATCH_TOLERANCE).mean()),
        "close_match": float((close_rel <= MATCH_TOLERANCE).mean()),
        "volume_ratio": float(volume_ratio.median()) if len(volume_ratio) else None,
    }


def fmt(value, digits=2, pct=False):
    if value is None:
        return "-"
    return f"{value * 100:.1f}%" if pct else f"{value:.{digits}f}"


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--per-index", type=int, default=25)
    parser.add_argument("--intervals", default="1d,1wk,1h")
    parser.add_argument("--sources", default=None, help="comma list; default = all configured")
    parser.add_argument("--reference", default="yfinance")
    parser.add_argument("--json", default=None, help="write the per-symbol results here")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S")
    logging.getLogger("httpx").setLevel(logging.WARNING)

    names = args.sources.split(",") if args.sources else None
    sources = build_sources(names)
    by_name = {s.name: s for s in sources}
    if args.reference not in by_name:
        by_name[args.reference] = build_sources([args.reference])[0]
    reference = by_name[args.reference]
    others = [s for s in by_name.values() if s is not reference]
    if not others:
        raise SystemExit("Only the reference source is configured - add API keys to .env (see README).")

    sample = sample_symbols(args.per_index)
    symbols = [s for _, s in sample]
    index_of = dict((s, i) for i, s in sample)
    print(f"Sample: {len(symbols)} symbols ({', '.join(f'{k}={sum(1 for i, _ in sample if i == k)}' for k in INDICES)})")
    print(f"Reference: {reference.name}; compared: {', '.join(s.name for s in others)}\n")

    report: list[dict] = []
    summary_rows: list[list[str]] = []
    for interval in args.intervals.split(","):
        timeframes = INTERVAL_TIMEFRAMES[interval]
        config = TIMEFRAME_CONFIG[timeframes[0]]
        period = config["period"]
        started = time.monotonic()
        ref_frames = await download(reference, symbols, period, interval)
        logger.info("%s %s: %d/%d symbols in %.0fs", reference.name, interval, len(ref_frames), len(symbols), time.monotonic() - started)
        for source in others:
            if not source.supports(interval):
                continue
            started = time.monotonic()
            frames = await download(source, symbols, period, interval)
            elapsed = time.monotonic() - started
            stats: list[dict] = []
            outlook_hits = {tf: [0, 0] for tf in timeframes}
            for symbol in symbols:
                if symbol not in ref_frames or symbol not in frames:
                    continue
                result = compare_frames(ref_frames[symbol], frames[symbol])
                if result is None:
                    continue
                # The trend is compared on the same bars: one source may already
                # have the latest session the other hasn't published yet.
                end = min(ref_frames[symbol].index.max(), frames[symbol].index.max())
                ref_cut = ref_frames[symbol][ref_frames[symbol].index <= end]
                other_cut = frames[symbol][frames[symbol].index <= end]
                result["newer_bars"] = int((frames[symbol].index > end).sum()) - int((ref_frames[symbol].index > end).sum())
                for tf in timeframes:
                    resample = TIMEFRAME_CONFIG[tf].get("resample")
                    a, b = outlook(ref_cut, resample), outlook(other_cut, resample)
                    result[f"outlook_{tf.value}"] = [a, b]
                    if a is not None and b is not None:
                        outlook_hits[tf][1] += 1
                        outlook_hits[tf][0] += a == b
                result.update(symbol=symbol, index=index_of[symbol], source=source.name, interval=interval)
                stats.append(result)
                report.append(result)
            if not stats:
                summary_rows.append([interval, source.name, f"0/{len(symbols)}", *["-"] * 8])
                continue
            summary_rows.append(
                [
                    interval,
                    source.name,
                    f"{len(stats)}/{len(symbols)}",
                    fmt(statistics.median(s["ohlc_match"] for s in stats), pct=True),
                    fmt(statistics.median(s["close_match"] for s in stats), pct=True),
                    fmt(statistics.median(s["close_median_pct"] for s in stats), 3) + "%",
                    fmt(statistics.median(s["only_ref"] + s["only_other"] for s in stats), 0),
                    fmt(statistics.median(v for s in stats if (v := s["volume_ratio"]) is not None), 2)
                    if any(s["volume_ratio"] is not None for s in stats)
                    else "-",
                    " ".join(
                        f"{tf.value}:{hits}/{total}" for tf, (hits, total) in outlook_hits.items()
                    ),
                    f"{sum(1 for s in stats if s['newer_bars'] > 0)}/{sum(1 for s in stats if s['newer_bars'] < 0)}",
                    f"{elapsed:.0f}s",
                ]
            )
            worst = sorted(stats, key=lambda s: s["close_match"])[:5]
            for s in worst:
                if s["close_match"] < 0.99:
                    logger.info(
                        "  %s vs %s %s %s (%s): close within 0.5%% on %.0f%% of %d bars, max diff %.2f%%",
                        source.name,
                        reference.name,
                        interval,
                        s["symbol"],
                        s["index"],
                        s["close_match"] * 100,
                        s["bars"],
                        s["close_max_pct"],
                    )

    header = ["interval", "source", "symbols", "OHLC ok", "close ok", "close diff", "bar gaps", "vol ratio", "same trend", "newer +/-", "time"]
    widths = [max(len(str(row[i])) for row in [header, *summary_rows]) for i in range(len(header))]
    print("\n" + "  ".join(h.ljust(w) for h, w in zip(header, widths)))
    for row in summary_rows:
        print("  ".join(str(c).ljust(w) for c, w in zip(row, widths)))
    print(
        f"\nOHLC ok / close ok: median share of bars within {MATCH_TOLERANCE:.1%} of {reference.name}; "
        "close diff: median relative close difference; bar gaps: median bars present in only one source; "
        "vol ratio: median volume / reference volume; same trend: symbols whose Ichimoku outlook matches "
        "(on the bars both have); newer +/-: symbols where the source has newer / older latest bars than the reference."
    )
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=1, default=str)
        print(f"Per-symbol results: {args.json}")
    for source in by_name.values():
        await source.aclose()


if __name__ == "__main__":
    asyncio.run(main())
