"""Ichimoku "wave principle" price targets.

Classical Ichimoku theory projects future price targets from the size of
recent swings ("waves"), on top of the five plotted lines. Identifying which
swings count is normally a discretionary judgment call; this module
automates it with a simple percentage-threshold zigzag over closing prices,
then applies the standard V/N/E projection formulas to the most recent
pivot triplets.

Different Ichimoku texts also describe a fourth ("NT") calculation with
slightly different definitions depending on the source - it's intentionally
left out here rather than risk stating an inconsistent formula.
"""

from app.schemas.ichimoku import WavePivot, WaveTargetSet
from app.schemas.market import HistoricalBar


def _find_zigzag_pivots(bars: list[HistoricalBar], threshold_pct: float) -> list[tuple[int, float]]:
    if len(bars) < 3:
        return []

    trend: str | None = None
    extreme_idx, extreme_price = 0, bars[0].close
    pivots: list[tuple[int, float]] = []

    for i in range(1, len(bars)):
        price = bars[i].close

        if trend is None:
            change_pct = abs(price - extreme_price) / extreme_price * 100
            if change_pct >= threshold_pct:
                trend = "up" if price > extreme_price else "down"
                pivots.append((extreme_idx, extreme_price))
                extreme_idx, extreme_price = i, price
            continue

        if trend == "up":
            if price >= extreme_price:
                extreme_idx, extreme_price = i, price
                continue
            retrace_pct = (extreme_price - price) / extreme_price * 100
            if retrace_pct >= threshold_pct:
                pivots.append((extreme_idx, extreme_price))
                trend, extreme_idx, extreme_price = "down", i, price
        else:
            if price <= extreme_price:
                extreme_idx, extreme_price = i, price
                continue
            retrace_pct = (price - extreme_price) / extreme_price * 100
            if retrace_pct >= threshold_pct:
                pivots.append((extreme_idx, extreme_price))
                trend, extreme_idx, extreme_price = "up", i, price

    pivots.append((extreme_idx, extreme_price))
    return pivots


def compute_wave_targets(
    bars: list[HistoricalBar], threshold_pct: float = 3.0, max_sets: int = 3
) -> list[WaveTargetSet]:
    pivots = _find_zigzag_pivots(bars, threshold_pct)
    if len(pivots) < 3:
        return []

    sets: list[WaveTargetSet] = []
    for end in range(len(pivots), 2, -1):
        if len(sets) >= max_sets:
            break
        (idx_a, price_a), (idx_b, price_b), (idx_c, price_c) = pivots[end - 3 : end]
        sets.append(
            WaveTargetSet(
                pivot_a=WavePivot(timestamp=bars[idx_a].timestamp, price=price_a),
                pivot_b=WavePivot(timestamp=bars[idx_b].timestamp, price=price_b),
                pivot_c=WavePivot(timestamp=bars[idx_c].timestamp, price=price_c),
                v_target=price_c - (price_b - price_a),
                n_target=price_c + (price_b - price_a),
                e_target=price_c + (price_c - price_b),
            )
        )
    return sets
