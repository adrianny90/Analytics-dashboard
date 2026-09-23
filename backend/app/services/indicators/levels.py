"""Latest price levels per timeframe (close, Kijun-sen over 52 periods, simple
moving averages, current Ichimoku lines), stored with each ranking row so the
ranking's "Setup" rules (blue/yellow/green/red tiers) can be re-evaluated in
the browser for any chosen timeframe / MA length without downloading
anything again."""

from app.schemas.market import HistoricalBar, TimeframeLevels
from app.services.indicators.ichimoku import (
    DISPLACEMENT,
    KIJUN_PERIOD,
    SENKOU_B_PERIOD,
    TENKAN_PERIOD,
)

KIJUN_PERIODS = 52
MA_PERIODS = (50, 100, 150, 200)


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
        tenkan=tenkan,
        kijun=kijun,
        senkou_a=senkou_a,
        senkou_b=senkou_b,
        chikou_ref=chikou_ref,
        chikou_senkou_a=chikou_senkou_a,
        chikou_senkou_b=chikou_senkou_b,
        **mas,
    )
