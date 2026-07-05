"""Ichimoku Kinko Hyo ("one glance equilibrium chart"), Goichi Hosoda, 1968.

Five lines, all derived from price alone:
  Tenkan-sen   - midpoint of the 9-period high/low
  Kijun-sen    - midpoint of the 26-period high/low
  Senkou Span A - (Tenkan + Kijun) / 2, plotted 26 periods AHEAD
  Senkou Span B - midpoint of the 52-period high/low, plotted 26 periods AHEAD
  Chikou Span  - today's close, plotted 26 periods BEHIND

Span A/B are computed from data that already exists today, so the cloud
visible ahead of the last real candle is a known shape, not a prediction.
"""

from datetime import timedelta

from app.schemas.ichimoku import IchimokuPoint
from app.schemas.market import HistoricalBar

TENKAN_PERIOD = 9
KIJUN_PERIOD = 26
SENKOU_B_PERIOD = 52
DISPLACEMENT = 26


def _rolling_midpoint(bars: list[HistoricalBar], index: int, period: int) -> float | None:
    if index + 1 < period:
        return None
    window = bars[index + 1 - period : index + 1]
    high = max(bar.high for bar in window)
    low = min(bar.low for bar in window)
    return (high + low) / 2


def compute_ichimoku(bars: list[HistoricalBar]) -> list[IchimokuPoint]:
    if not bars:
        return []

    tenkan = [_rolling_midpoint(bars, i, TENKAN_PERIOD) for i in range(len(bars))]
    kijun = [_rolling_midpoint(bars, i, KIJUN_PERIOD) for i in range(len(bars))]
    senkou_b_raw = [_rolling_midpoint(bars, i, SENKOU_B_PERIOD) for i in range(len(bars))]
    senkou_a_raw = [
        (t + k) / 2 if t is not None and k is not None else None for t, k in zip(tenkan, kijun)
    ]

    step = bars[-1].timestamp - bars[-2].timestamp if len(bars) >= 2 else timedelta(days=1)

    points: list[IchimokuPoint] = []
    for i, bar in enumerate(bars):
        lead_index = i - DISPLACEMENT
        points.append(
            IchimokuPoint(
                timestamp=bar.timestamp,
                tenkan=tenkan[i],
                kijun=kijun[i],
                senkou_a=senkou_a_raw[lead_index] if lead_index >= 0 else None,
                senkou_b=senkou_b_raw[lead_index] if lead_index >= 0 else None,
                chikou=bars[i + DISPLACEMENT].close if i + DISPLACEMENT < len(bars) else None,
                close=bar.close,
            )
        )

    # Extend DISPLACEMENT points past the last real candle so the
    # already-computable leading cloud is actually visible ahead of price,
    # as on a standard Ichimoku chart.
    last_timestamp = bars[-1].timestamp
    for offset in range(1, DISPLACEMENT + 1):
        source_index = len(bars) - 1 + offset - DISPLACEMENT
        points.append(
            IchimokuPoint(
                timestamp=last_timestamp + step * offset,
                senkou_a=senkou_a_raw[source_index] if 0 <= source_index < len(senkou_a_raw) else None,
                senkou_b=senkou_b_raw[source_index] if 0 <= source_index < len(senkou_b_raw) else None,
            )
        )

    return points
