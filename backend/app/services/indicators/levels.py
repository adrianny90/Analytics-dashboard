"""Latest price levels per timeframe (close, Kijun-sen over 52 periods, simple
moving averages), stored with each ranking row so the ranking's "Setup" rule
can be re-evaluated in the browser for any chosen timeframe / MA length
without downloading anything again."""

from app.schemas.market import HistoricalBar, TimeframeLevels

KIJUN_PERIODS = 52
MA_PERIODS = (50, 100, 150, 200)


def compute_levels(bars: list[HistoricalBar]) -> TimeframeLevels | None:
    if not bars:
        return None
    kijun52 = None
    if len(bars) >= KIJUN_PERIODS:
        window = bars[-KIJUN_PERIODS:]
        kijun52 = (max(b.high for b in window) + min(b.low for b in window)) / 2
    mas: dict[str, float | None] = {}
    for n in MA_PERIODS:
        mas[f"ma{n}"] = sum(b.close for b in bars[-n:]) / n if len(bars) >= n else None
    return TimeframeLevels(close=bars[-1].close, kijun52=kijun52, **mas)
