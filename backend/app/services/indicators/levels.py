"""Latest price levels per timeframe (close, Kijun-sen over 52 periods, simple
moving averages, current Ichimoku lines), stored with each ranking row so the
ranking's "Setup" rules (blue/yellow/green/red tiers) can be re-evaluated in
the browser for any chosen timeframe / MA length without downloading
anything again."""

import math

from app.schemas.market import HistoricalBar, TimeframeLevels
from app.services.indicators.ichimoku import (
    DISPLACEMENT,
    KIJUN_PERIOD,
    SENKOU_B_PERIOD,
    TENKAN_PERIOD,
)

KIJUN_PERIODS = 52
MA_PERIODS = (50, 100, 150, 200)
# How many bars ahead the "Alert" column looks for a Kijun-sen(52) cross at an unchanged price.
CROSS_LOOKAHEAD = 5
# "Rocket" filter: highest close of the last year (D1) and volatility of the last ~3 months.
HIGH_PERIODS = 252
VOL_PERIODS = 60


def _midpoint(bars: list[HistoricalBar], end: int, period: int) -> float | None:
    """(highest high + lowest low) / 2 of the `period` bars ending at index
    `end` (inclusive), or None when there isn't that much history."""
    if end < 0 or end + 1 < period:
        return None
    window = bars[end + 1 - period : end + 1]
    return (max(b.high for b in window) + min(b.low for b in window)) / 2


def _cloud_projected_from(bars: list[HistoricalBar], source: int) -> tuple[float | None, float | None]:
    """Senkou Span A/B computed on bar `source` - i.e. the cloud that sits
    DISPLACEMENT bars later on the chart."""
    tenkan = _midpoint(bars, source, TENKAN_PERIOD)
    kijun = _midpoint(bars, source, KIJUN_PERIOD)
    span_a = (tenkan + kijun) / 2 if tenkan is not None and kijun is not None else None
    return span_a, _midpoint(bars, source, SENKOU_B_PERIOD)


def _kijun52_cross_in(bars: list[HistoricalBar]) -> int | None:
    """Bars until the close would end above Kijun-sen(52) if the price stayed
    flat at today's close: old highs/lows drop out of the 52-bar window, so
    the Kijun can fall under an unchanged price. 1..CROSS_LOOKAHEAD, or None
    when the close is already above the Kijun or no cross comes that soon."""
    last = len(bars) - 1
    kijun = _midpoint(bars, last, KIJUN_PERIODS)
    close = bars[-1].close
    if kijun is None or close > kijun:
        return None
    for ahead in range(1, CROSS_LOOKAHEAD + 1):
        window = bars[last + 1 - (KIJUN_PERIODS - ahead) : last + 1]
        projected = (max(close, max(b.high for b in window)) + min(close, min(b.low for b in window))) / 2
        if close > projected:
            return ahead
    return None


def _volatility(bars: list[HistoricalBar], periods: int) -> float | None:
    """Standard deviation of per-bar log returns over the last `periods` bars
    (not annualized), or None when there isn't that much history."""
    closes = [b.close for b in bars[-(periods + 1) :]]
    if len(closes) < periods + 1 or min(closes) <= 0:
        return None
    rets = [math.log(b / a) for a, b in zip(closes, closes[1:])]
    mean = sum(rets) / len(rets)
    return math.sqrt(sum((r - mean) ** 2 for r in rets) / (len(rets) - 1))


def compute_levels(bars: list[HistoricalBar]) -> TimeframeLevels | None:
    if not bars:
        return None
    last = len(bars) - 1
    kijun52 = _midpoint(bars, last, KIJUN_PERIODS)
    mas: dict[str, float | None] = {}
    for n in MA_PERIODS:
        mas[f"ma{n}"] = sum(b.close for b in bars[-n:]) / n if len(bars) >= n else None

    # Standard Ichimoku (9/26/52) as of the last candle - used by the
    # "5-line" signal (green/red Setup tiers).
    tenkan = _midpoint(bars, last, TENKAN_PERIOD)
    kijun = _midpoint(bars, last, KIJUN_PERIOD)
    # The cloud under today's candle was projected DISPLACEMENT bars ago, so
    # Span A/B are computed on the bar DISPLACEMENT periods back.
    lead = last - DISPLACEMENT
    senkou_a, senkou_b = _cloud_projected_from(bars, lead)
    # Chikou Span is today's close plotted DISPLACEMENT bars back - "Chikou
    # above price" compares it with the close of that earlier candle.
    chikou_ref = bars[lead].close if lead >= 0 else None
    # The cloud at the spot where Chikou is drawn (DISPLACEMENT bars back),
    # itself projected another DISPLACEMENT bars earlier - for "Chikou above
    # the cloud" (pink Setup tier).
    chikou_senkou_a, chikou_senkou_b = _cloud_projected_from(bars, lead - DISPLACEMENT)

    return TimeframeLevels(
        close=bars[-1].close,
        kijun52=kijun52,
        # The previous bar, so a fresh cross of Kijun-sen(52) can be told apart from a price that is just above it.
        prev_close=bars[-2].close if last >= 1 else None,
        prev_kijun52=_midpoint(bars, last - 1, KIJUN_PERIODS),
        kijun52_cross_in=_kijun52_cross_in(bars),
        high_252=max(b.close for b in bars[-HIGH_PERIODS:]) if len(bars) >= HIGH_PERIODS else None,
        vol60=_volatility(bars, VOL_PERIODS),
        tenkan=tenkan,
        kijun=kijun,
        senkou_a=senkou_a,
        senkou_b=senkou_b,
        chikou_ref=chikou_ref,
        chikou_senkou_a=chikou_senkou_a,
        chikou_senkou_b=chikou_senkou_b,
        **mas,
    )
