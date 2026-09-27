"""Quality filter for the rankings: combines company fundamentals (SEC
EDGAR), the quality of analyst forecasts and price/sector momentum into one
0-100 score, plus hard rules a stock must pass.

Each component is a percentile (0-100) against the rest of the same universe,
so the score means "better than X% of this index", and the components are
averaged with WEIGHTS (components a stock has no data for are left out of its
average). The components and the threshold are the ones tested in
backtests/t_signals.py, t_quality.py and t_filter.py (results in summary.txt)
- keep them in sync.
"""

import math

from app.schemas.market import QualityScore, RankingEntry

# Components (equal weights). Chosen in the backtest over 2013-2026: revenue
# and EPS growth had no predictive value anywhere and target dispersion worked
# the wrong way on the S&P 500, so profitability replaced them.
WEIGHTS: dict[str, float] = {
    "fscore": 1.0,
    "roa": 1.0,
    "cfo_to_assets": 1.0,
    "breadth": 1.0,
    "momentum": 1.0,
    "sector": 1.0,
}
# The filter removes the weakest stocks rather than picking winners: a stock
# fails when its score is in the bottom MIN_SCORE of the scale. In the
# backtest the rejected stocks returned less than the market on Nasdaq,
# Russell 2000 and NYSE; on the S&P 500 they did not (see summary.txt).
# Hard rules (F-score >= 5, price above MA200) were tested too and did not help.
MIN_SCORE = 30.0
MIN_COMPONENTS = 3


def _momentum(entry: RankingEntry) -> float | None:
    """12-1 momentum: last 12 months without the last month."""
    year, month = entry.changes.get("1y"), entry.changes.get("1m")
    if year is None or month is None:
        return None
    return (1 + year.change_percent / 100) / (1 + month.change_percent / 100) - 1


def _value(entry: RankingEntry, key: str) -> float | None:
    f, t = entry.fundamentals, entry.targets
    if key == "fscore":
        return f.fscore if f else None
    if key == "roa":
        return f.roa if f else None
    if key == "cfo_to_assets":
        return f.cfo_to_assets if f else None
    if key == "breadth":
        return t.breadth if t else None
    if key == "momentum":
        return _momentum(entry)
    return None


def _percentiles(values: dict[str, float]) -> dict[str, float]:
    """Percentile rank 0-100 (ties share the average rank)."""
    if not values:
        return {}
    order = sorted(values.items(), key=lambda kv: kv[1])
    n = len(order)
    result: dict[str, float] = {}
    i = 0
    while i < n:
        j = i
        while j + 1 < n and order[j + 1][1] == order[i][1]:
            j += 1
        pct = ((i + j) / 2 + 1) / n * 100 if n > 1 else 50.0
        for k in range(i, j + 1):
            result[order[k][0]] = pct
        i = j + 1
    return result


def _sector_momentum(entries: list[RankingEntry]) -> dict[str, float]:
    """6-month return of the stock's sector (median) minus the universe median."""
    by_sector: dict[str, list[float]] = {}
    all_returns: list[float] = []
    for e in entries:
        change = e.changes.get("6m")
        if change is None:
            continue
        by_sector.setdefault(e.sector, []).append(change.change_percent)
        all_returns.append(change.change_percent)
    if not all_returns:
        return {}
    base = _median(all_returns)
    sector_value = {s: _median(v) - base for s, v in by_sector.items() if len(v) >= 5}
    return {e.symbol: sector_value[e.sector] for e in entries if e.sector in sector_value}


def _median(values: list[float]) -> float:
    ordered = sorted(values)
    mid = len(ordered) // 2
    return ordered[mid] if len(ordered) % 2 else (ordered[mid - 1] + ordered[mid]) / 2


def compute_quality(entries: list[RankingEntry]) -> dict[str, QualityScore]:
    raw: dict[str, dict[str, float]] = {key: {} for key in WEIGHTS}
    for e in entries:
        for key in WEIGHTS:
            if key == "sector":
                continue
            value = _value(e, key)
            if value is not None and math.isfinite(value):
                raw[key][e.symbol] = value
    raw["sector"] = _sector_momentum(entries)
    pct = {key: _percentiles(values) for key, values in raw.items()}

    result: dict[str, QualityScore] = {}
    for e in entries:
        parts = {key: round(pct[key][e.symbol], 1) for key in WEIGHTS if e.symbol in pct[key]}
        total_weight = sum(WEIGHTS[k] for k in parts)
        score = sum(WEIGHTS[k] * v for k, v in parts.items()) / total_weight if total_weight else None
        fails: list[str] = []
        if len(parts) < MIN_COMPONENTS:
            fails.append("data")
        elif score is not None and score < MIN_SCORE:
            fails.append("score")
        result[e.symbol] = QualityScore(
            score=round(score, 1) if score is not None else None,
            passes=not fails,
            parts=parts,
            fails=fails,
        )
    return result
