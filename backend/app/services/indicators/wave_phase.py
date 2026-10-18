"""Hosoda wave reading for the ranking's "Wave" column.

Hosoda's wave theory reads a chart as a chain of a few basic shapes:
  I - a single impulse, e.g. the first leg out of a range
  V - an impulse and its full reversal
  N - impulse, correction, then a move past the first impulse's end (the basic trend wave)
  P - contracting swings (lower highs, higher lows) or a flat range - consolidation
  Y - expanding swings (higher highs AND lower lows)

Which swings count depends on the reversal size they are drawn with (Hosoda's own Kagi example compares 500 and
200 yen), so the chart is read with a closing-price zigzag at five reversal sizes (2-5x ATR(26)), and the share of
readings that agree is the confidence of the result. It describes the chart as of the last candle - it is not a
forecast: backtests/t_wave*.py found no shape or phase that changes the odds of the next 26 candles.

The phase is M. Sobotka's six-phase cycle ("Fazy zmiany trendu") from the order of price, Tenkan, Kijun and the
current - not displaced - Senkou B.
"""

from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta

import pandas as pd

from app.schemas.market import HistoricalBar, WaveDrawing, WaveLeg, WavePoint, WaveReading, WaveTimeTarget

SENSITIVITIES = (2.0, 2.5, 3.0, 4.0, 5.0)
ATR_PERIOD = 26
# Two highs (or lows) closer than this share of the reversal size count as equal.
TOLERANCE = 0.3
MIN_BARS = 80


@dataclass
class _Pivot:
    idx: int
    price: float
    kind: int  # +1 high, -1 low


@dataclass
class _Reading:
    label: str  # "N_up" | "N_down" | "V_up" | "V_down" | "I_up" | "I_down" | "P" | "Y"
    stage: str
    tilt: str | None = None
    target: float | None = None
    invalidation: float | None = None
    box_high: float | None = None
    box_low: float | None = None
    since_idx: int | None = None


def _atr(highs: list[float], lows: list[float], closes: list[float], period: int = ATR_PERIOD) -> list[float | None]:
    tr = [highs[0] - lows[0]] + [
        max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1])) for i in range(1, len(closes))
    ]
    out: list[float | None] = [None] * len(closes)
    running = 0.0
    for i, value in enumerate(tr):
        running += value
        if i >= period:
            running -= tr[i - period]
        if i >= period - 1:
            out[i] = running / period
    return out


def _zigzag(closes: list[float], atrs: list[float | None], k: float) -> tuple[list[_Pivot], int, _Pivot | None]:
    """Closing-price zigzag: a swing is confirmed once price moves k*ATR back from its extreme. Returns the
    confirmed pivots, the current leg's direction (+1/-1, 0 before the first swing) and its running extreme."""
    pivots: list[_Pivot] = []
    direction = 0
    ext: _Pivot | None = None
    low: _Pivot | None = None
    for i, price in enumerate(closes):
        atr = atrs[i]
        if atr is None:
            continue
        if direction == 0:
            if ext is None:
                ext, low = _Pivot(i, price, 1), _Pivot(i, price, -1)
                continue
            if price > ext.price:
                ext = _Pivot(i, price, 1)
            if price < low.price:
                low = _Pivot(i, price, -1)
            if ext.price - low.price >= k * atr:
                if ext.idx > low.idx:
                    pivots.append(low)
                    direction = 1
                else:
                    pivots.append(ext)
                    direction, ext = -1, low
            continue
        if direction == 1:
            if price >= ext.price:
                ext = _Pivot(i, price, 1)
            elif ext.price - price >= k * atr:
                pivots.append(ext)
                direction, ext = -1, _Pivot(i, price, -1)
        else:
            if price <= ext.price:
                ext = _Pivot(i, price, -1)
            elif price - ext.price >= k * atr:
                pivots.append(ext)
                direction, ext = 1, _Pivot(i, price, 1)
    return pivots, direction, ext


def _cmp(new: float, old: float, tol: float) -> int:
    return 1 if new > old + tol else -1 if new < old - tol else 0


def _read(pivots: list[_Pivot], direction: int, ext: _Pivot, close: float, tol: float) -> _Reading | None:
    """Classifies the latest swings. The running extreme only counts as a new high/low once it has gone past the
    previous one - until then the current leg is "in progress" and the structure is read from confirmed pivots."""
    highs = [p for p in pivots if p.kind == 1]
    lows = [p for p in pivots if p.kind == -1]
    if direction == 1 and highs and ext.price > highs[-1].price + tol:
        highs = highs + [ext]
    if direction == -1 and lows and ext.price < lows[-1].price - tol:
        lows = lows + [ext]
    if len(highs) < 3 or len(lows) < 3:
        return None
    h1, h2, h3 = highs[-1], highs[-2], highs[-3]
    l1, l2, l3 = lows[-1], lows[-2], lows[-3]
    sh, sl = _cmp(h1.price, h2.price, tol), _cmp(l1.price, l2.price, tol)
    leg_up = direction == 1
    since = min(h2.idx, l2.idx)

    # N target C + (B - A) from the last three confirmed pivots, once the leg after C runs with the trend.
    a, b, c = pivots[-3:]
    if sh == 1 and sl == 1:
        if leg_up:
            stage = "n_impulse" if h1 is ext else "n_leg3"
            target = c.price + (b.price - a.price)
        else:
            stage, target = "n_correction", None
        last_low = lows[-2] if l1 is ext else l1
        return _Reading("N_up", stage, target=target, invalidation=last_low.price, since_idx=since)
    if sh == -1 and sl == -1:
        if not leg_up:
            stage = "n_impulse" if l1 is ext else "n_leg3"
            target = c.price - (a.price - b.price)
        else:
            stage, target = "n_correction", None
        last_high = highs[-2] if h1 is ext else h1
        return _Reading("N_down", stage, target=target, invalidation=last_high.price, since_idx=since)
    if sh == 1 and sl == -1:
        # A higher high and a lower low. Two expansions in a row are a Y; a single one is a V only when the last
        # leg went past where the move it reverses began - otherwise price is back inside the earlier range (P).
        if _cmp(h2.price, h3.price, tol) == 1 and _cmp(l2.price, l3.price, tol) == -1:
            return _Reading("Y", "y_expanding", box_high=h1.price, box_low=l1.price, since_idx=min(h3.idx, l3.idx))
        if h1.idx > l1.idx:  # lower low, then a rally
            if h1.price > max(h2.price, h3.price) + tol:
                return _Reading("V_up", "v_reversal" if leg_up else "v_retest", invalidation=l1.price, since_idx=l1.idx)
        elif l1.price < min(l2.price, l3.price) - tol:  # higher high, then a drop
            return _Reading("V_down", "v_reversal" if not leg_up else "v_retest", invalidation=h1.price, since_idx=h1.idx)
        top, bottom = max(h1, h2, h3, key=lambda p: p.price), min(l1, l2, l3, key=lambda p: p.price)
        return _Reading("P", "p_range", box_high=top.price, box_low=bottom.price, since_idx=min(top.idx, bottom.idx))
    # I: a break out of a flat range. It only holds while it is the latest swing and price has not closed back
    # inside the range - otherwise the "breakout" was just the edge of the range.
    if sh == 1 and sl == 0 and h1.idx > l1.idx and close > h2.price:
        return _Reading("I_up", "i_breakout" if leg_up else "i_pullback", invalidation=h2.price, box_high=h2.price,
                        box_low=min(l1.price, l2.price), since_idx=since)
    if sh == 0 and sl == -1 and l1.idx > h1.idx and close < l2.price:
        return _Reading("I_down", "i_breakout" if not leg_up else "i_pullback", invalidation=l2.price,
                        box_high=max(h1.price, h2.price), box_low=l2.price, since_idx=since)
    tilt = {(-1, 1): None, (0, 0): None, (0, 1): "up", (-1, 0): "down", (1, 0): None, (0, -1): None}[(sh, sl)]
    stage = "p_contracting" if (sh, sl) == (-1, 1) else "p_range" if tilt is None else f"p_{'ascending' if tilt == 'up' else 'descending'}"
    return _Reading("P", stage, tilt=tilt, box_high=max(h1.price, h2.price), box_low=min(l1.price, l2.price),
                    since_idx=since)


def _midpoint(highs: list[float], lows: list[float], end: int, period: int) -> float:
    return (max(highs[end + 1 - period : end + 1]) + min(lows[end + 1 - period : end + 1])) / 2


def ichimoku_phase(highs: list[float], lows: list[float], closes: list[float], lookback: int = 300) -> tuple[str | None, int]:
    """Sobotka's phase as of the last candle, and how many candles it has lasted. Stable phases come from the order
    of price, Tenkan (9), Kijun (26) and current Senkou B (52); the in-between ones depend on which stable phase
    came last (phases change step by step), split by price crossing Senkou B."""
    phase: str | None = None
    since = 0
    last_stable: str | None = None
    for i in range(max(51, len(closes) - lookback), len(closes)):
        ts, ks, ssb = _midpoint(highs, lows, i, 9), _midpoint(highs, lows, i, 26), _midpoint(highs, lows, i, 52)
        close = closes[i]
        if close > ts > ks > ssb:
            current, last_stable = "stable_up", "up"
        elif close < ts < ks < ssb:
            current, last_stable = "stable_down", "down"
        elif last_stable == "up" or (last_stable is None and ks >= ssb):
            current = "end_up" if close >= ssb else "entry_down"
        else:
            current = "end_down" if close <= ssb else "entry_up"
        since = since + 1 if current == phase else 1
        phase = current
    return phase, since


def _readings(highs: list[float], lows: list[float], closes: list[float]):
    """Reading per sensitivity: k -> (reading, confirmed pivots, current leg direction, running extreme)."""
    atrs = _atr(highs, lows, closes)
    out: dict[float, tuple[_Reading, list[_Pivot], int, _Pivot]] = {}
    for k in SENSITIVITIES:
        pivots, direction, ext = _zigzag(closes, atrs, k)
        if ext is None or direction == 0:
            continue
        reading = _read(pivots, direction, ext, closes[-1], TOLERANCE * k * atrs[-1])
        if reading is not None:
            out[k] = (reading, pivots, direction, ext)
    return out


def _representatives(readings: dict) -> tuple[Counter, dict[str, float]]:
    """Votes per label and, for each label, the sensitivity it is drawn from - the one closest to the middle."""
    votes = Counter(r[0].label for r in readings.values())
    middle = SENSITIVITIES[len(SENSITIVITIES) // 2]
    chosen = {lbl: min((k for k, r in readings.items() if r[0].label == lbl), key=lambda k: abs(k - middle)) for lbl in votes}
    return votes, chosen


def _ranked_labels(votes: Counter, chosen: dict[str, float]) -> list[str]:
    """Most votes first; ties go to the label read closest to the middle sensitivity."""
    middle = SENSITIVITIES[len(SENSITIVITIES) // 2]
    return sorted(votes, key=lambda lbl: (-votes[lbl], abs(chosen[lbl] - middle)))


def read_wave_series(highs: list[float], lows: list[float], closes: list[float]) -> WaveReading | None:
    if len(closes) < MIN_BARS:
        return None
    readings = _readings(highs, lows, closes)
    if not readings:
        return None
    phase, phase_bars = ichimoku_phase(highs, lows, closes)
    votes, chosen = _representatives(readings)
    best = _ranked_labels(votes, chosen)[0]
    reading = readings[chosen[best]][0]
    wave, _, direction = best.partition("_")
    total = len(SENSITIVITIES)
    return WaveReading(
        wave=wave,
        direction=direction or reading.tilt,
        probability=round(votes[best] / total, 2),
        alternatives={lbl: round(n / total, 2) for lbl, n in votes.most_common()},
        stage=reading.stage,
        phase=phase,
        phase_bars=phase_bars,
        target=round(reading.target, 4) if reading.target is not None else None,
        invalidation=round(reading.invalidation, 4) if reading.invalidation is not None else None,
        box_high=round(reading.box_high, 4) if reading.box_high is not None else None,
        box_low=round(reading.box_low, 4) if reading.box_low is not None else None,
        bars=len(closes) - 1 - reading.since_idx if reading.since_idx is not None else None,
    )


def read_wave(bars: list[HistoricalBar]) -> WaveReading | None:
    return read_wave_series([b.high for b in bars], [b.low for b in bars], [b.close for b in bars])


# --- Drawing the wave on the chart, with Hosoda's time theory -------------------------------------------------

# Hosoda's basic numbers (kihon suchi): 9, 17, 26 and their combinations.
BASIC_NUMBERS = (9, 17, 26, 33, 42, 65, 76, 129, 172, 226, 257)
CONTEXT_PIVOTS = 2  # earlier swings drawn before A, for context
CLUSTER_BARS = 2  # projections this close together reinforce each other (a "day of change")
MAX_AHEAD = 129  # the chart axis is extended for time projections at most this many candles ahead


def nearest_basic(bars: int) -> int:
    return min(BASIC_NUMBERS, key=lambda n: abs(n - bars))


def timestamp_at(bars: list[HistoricalBar], index: int) -> datetime:
    """Timestamp of bar `index` - real for past bars, estimated past the last one (weekdays for daily bars)."""
    last = len(bars) - 1
    if index <= last:
        return bars[index].timestamp
    gaps = sorted(bars[i].timestamp - bars[i - 1].timestamp for i in range(max(1, last - 20), last + 1))
    step = gaps[len(gaps) // 2] if gaps else timedelta(days=1)
    ahead = index - last
    start = pd.Timestamp(bars[-1].timestamp)
    if step < timedelta(hours=20):
        # Intraday: whole sessions are skipped as weekdays, the rest in candle steps.
        per_day = Counter(b.timestamp.date() for b in bars[-200:])
        bars_per_day = max(1, sorted(per_day.values())[len(per_day) // 2])
        days, rest = divmod(ahead, bars_per_day)
        return (start + pd.offsets.BDay(days) + step * rest).to_pydatetime()
    if step <= timedelta(days=4):
        return (start + pd.offsets.BDay(ahead)).to_pydatetime()
    if step >= timedelta(days=25):
        return (start + pd.DateOffset(months=ahead)).to_pydatetime()
    return bars[-1].timestamp + step * ahead


def _leg(start: WavePoint, end_label: str, end_index: int, end_price: float) -> WaveLeg:
    n = end_index - start.index
    basic = nearest_basic(n)
    return WaveLeg(start=start.label or "·", end=end_label, bars=n, nearest=basic, diff=n - basic,
                   change_pct=round((end_price / start.price - 1) * 100, 2))


def _drawing(bars: list[HistoricalBar], label: str, share: float, k: float, reading: _Reading,
             pivots: list[_Pivot], ext: _Pivot) -> WaveDrawing:
    last = len(bars) - 1
    a, b, c = pivots[-3:]
    points = [
        WavePoint(index=p.idx, timestamp=bars[p.idx].timestamp, price=p.price, label="", confirmed=True)
        for p in pivots[-3 - CONTEXT_PIVOTS : -3]
    ]
    points += [
        WavePoint(index=p.idx, timestamp=bars[p.idx].timestamp, price=p.price, label=name, confirmed=True)
        for p, name in zip((a, b, c), "ABC")
    ]
    points.append(WavePoint(index=ext.idx, timestamp=bars[ext.idx].timestamp, price=ext.price, label="D", confirmed=False))
    legs = [_leg(p0, p1.label, p1.index, p1.price) for p0, p1 in zip(points, points[1:])]
    legs.append(_leg(points[-2], "now", last, bars[-1].close))

    # When does leg C->D turn ("day of change")? Equal numbers are measured from the actual legs - a 15-candle
    # impulse projects 15 candles, not the textbook 9 - and shown even once passed, flagged when D turned there.
    # Basic numbers are counted from C (the last one passed and the next two) and from A (the next two).
    candidates = [
        ("AB=CD", c.idx + (b.idx - a.idx)),
        ("AC=CD", c.idx + (c.idx - a.idx)),
        ("AB=BD", b.idx + (b.idx - a.idx)),
        ("BC=CD", c.idx + (c.idx - b.idx)),
    ]
    from_c = [n for n in BASIC_NUMBERS if c.idx + n > last - CLUSTER_BARS]
    passed_c = [n for n in BASIC_NUMBERS if c.idx + n <= last - CLUSTER_BARS][-1:]
    candidates += [(f"C+{n}", c.idx + n) for n in passed_c + from_c[:2]]
    candidates += [(f"A+{n}", a.idx + n) for n in BASIC_NUMBERS if a.idx + n > last - CLUSTER_BARS][:2]
    time_targets = [
        WaveTimeTarget(
            rule=rule,
            index=index,
            bars_ahead=index - last,
            timestamp=timestamp_at(bars, index),
            cluster=sum(1 for other_rule, other in candidates if other_rule != rule and abs(other - index) <= CLUSTER_BARS),
            hit=index <= last and abs(index - ext.idx) <= CLUSTER_BARS,
        )
        for rule, index in sorted(candidates, key=lambda x: x[1])
        if index > c.idx
    ]

    # Hosoda's targets for leg C->D; ones on the wrong side of C (A-B-C is not a clean impulse-correction) are left out.
    up = c.kind == -1
    raw = {
        "E": b.price + (b.price - a.price),
        "V": b.price + (b.price - c.price),
        "N": c.price + (b.price - a.price),
        "NT": c.price + (c.price - a.price),
    }
    targets = {name: round(v, 4) for name, v in raw.items() if (v > c.price if up else v < c.price)}

    wave, _, direction = label.partition("_")

    def r4(v: float | None) -> float | None:
        return round(v, 4) if v is not None else None

    return WaveDrawing(
        label=label,
        wave=wave,
        direction=direction or reading.tilt,
        share=share,
        sensitivity=k,
        stage=reading.stage,
        leg_direction="up" if up else "down",
        points=points,
        legs=legs,
        targets=targets,
        invalidation=r4(reading.invalidation),
        box_high=r4(reading.box_high),
        box_low=r4(reading.box_low),
        time_targets=time_targets,
    )


def wave_drawings(bars: list[HistoricalBar]) -> list[WaveDrawing]:
    """One drawing per wave read on the chart (the most likely first), for "draw the wave" on the chart page."""
    if len(bars) < MIN_BARS:
        return []
    readings = _readings([b.high for b in bars], [b.low for b in bars], [b.close for b in bars])
    if not readings:
        return []
    votes, chosen = _representatives(readings)
    out = []
    for lbl in _ranked_labels(votes, chosen):
        reading, pivots, _direction, ext = readings[chosen[lbl]]
        if len(pivots) >= 3:
            out.append(_drawing(bars, lbl, round(votes[lbl] / len(SENSITIVITIES), 2), chosen[lbl], reading, pivots, ext))
    return out


def wave_timeline(bars: list[HistoricalBar], drawings: list[WaveDrawing], start: int) -> list[datetime]:
    """Timestamps of the candles from index `start` up to the furthest time projection (at most MAX_AHEAD past the
    last candle), so the chart axis can be extended to show the projections."""
    last = len(bars) - 1
    ends = [tt.index for d in drawings for tt in d.time_targets if tt.index - last <= MAX_AHEAD]
    return [timestamp_at(bars, i) for i in range(start, max(ends, default=start - 1) + 1)]
