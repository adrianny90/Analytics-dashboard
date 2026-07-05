"""Composite bullish/bearish assessment from standard Ichimoku signals.

Evaluates five components commonly used together as an Ichimoku trend
checklist - price vs cloud, Tenkan/Kijun relationship, Chikou span vs price,
price momentum over the lookback window, and the cloud's own color over the
forecast window (which we already know, since Senkou A/B are computed from
data that exists today and displaced forward). Each contributes +1 (bullish),
-1 (bearish) or 0 (neutral/insufficient data); the total score classifies the
overall outlook.
"""

from app.schemas.ichimoku import IchimokuAssessment, IchimokuPoint, SignalBreakdownItem
from app.schemas.market import HistoricalBar

DISPLACEMENT = 26
BULLISH_THRESHOLD = 2
BEARISH_THRESHOLD = -2


def compute_assessment(
    bars: list[HistoricalBar],
    points: list[IchimokuPoint],
    lookback: int = 76,
    forecast: int = 17,
) -> IchimokuAssessment:
    signals: list[SignalBreakdownItem] = []
    score = 0

    window = bars[-lookback:] if len(bars) >= lookback else bars
    real_points = points[: len(bars)]
    last_bar = bars[-1]
    last_point = real_points[-1]

    # 1. Price vs cloud
    if last_point.senkou_a is not None and last_point.senkou_b is not None:
        cloud_top = max(last_point.senkou_a, last_point.senkou_b)
        cloud_bottom = min(last_point.senkou_a, last_point.senkou_b)
        if last_bar.close > cloud_top:
            score += 1
            signals.append(SignalBreakdownItem(name="Price vs cloud", bullish=True, detail="Price is above the cloud"))
        elif last_bar.close < cloud_bottom:
            score -= 1
            signals.append(SignalBreakdownItem(name="Price vs cloud", bullish=False, detail="Price is below the cloud"))
        else:
            signals.append(
                SignalBreakdownItem(name="Price vs cloud", bullish=None, detail="Price is inside the cloud (range/transition)")
            )
    else:
        signals.append(SignalBreakdownItem(name="Price vs cloud", bullish=None, detail="Not enough history to compute the cloud yet"))

    # 2. Tenkan/Kijun relationship
    if last_point.tenkan is not None and last_point.kijun is not None:
        if last_point.tenkan > last_point.kijun:
            score += 1
            signals.append(SignalBreakdownItem(name="Tenkan vs Kijun", bullish=True, detail="Tenkan-sen is above Kijun-sen"))
        elif last_point.tenkan < last_point.kijun:
            score -= 1
            signals.append(SignalBreakdownItem(name="Tenkan vs Kijun", bullish=False, detail="Tenkan-sen is below Kijun-sen"))
        else:
            signals.append(SignalBreakdownItem(name="Tenkan vs Kijun", bullish=None, detail="Tenkan-sen and Kijun-sen are level"))
    else:
        signals.append(SignalBreakdownItem(name="Tenkan vs Kijun", bullish=None, detail="Not enough history yet"))

    # 3. Chikou span vs price 26 periods ago
    chikou_ref_idx = len(bars) - 1 - DISPLACEMENT
    if chikou_ref_idx >= 0:
        past_close = bars[chikou_ref_idx].close
        if last_bar.close > past_close:
            score += 1
            signals.append(
                SignalBreakdownItem(name="Chikou span", bullish=True, detail="Current close is above the close from 26 periods ago")
            )
        elif last_bar.close < past_close:
            score -= 1
            signals.append(
                SignalBreakdownItem(name="Chikou span", bullish=False, detail="Current close is below the close from 26 periods ago")
            )
        else:
            signals.append(SignalBreakdownItem(name="Chikou span", bullish=None, detail="Unchanged versus 26 periods ago"))
    else:
        signals.append(SignalBreakdownItem(name="Chikou span", bullish=None, detail="Not enough history yet"))

    # 4. Momentum over the lookback window
    if len(window) >= 2 and window[0].close:
        change_pct = (window[-1].close - window[0].close) / window[0].close * 100
        if change_pct > 1:
            score += 1
            signals.append(
                SignalBreakdownItem(name=f"{len(window)}-candle momentum", bullish=True, detail=f"Up {change_pct:.1f}% over the window")
            )
        elif change_pct < -1:
            score -= 1
            signals.append(
                SignalBreakdownItem(name=f"{len(window)}-candle momentum", bullish=False, detail=f"Down {change_pct:.1f}% over the window")
            )
        else:
            signals.append(
                SignalBreakdownItem(
                    name=f"{len(window)}-candle momentum", bullish=None, detail=f"Roughly flat ({change_pct:+.1f}%) over the window"
                )
            )
    else:
        signals.append(SignalBreakdownItem(name="Momentum", bullish=None, detail="Not enough history yet"))

    # 5. Forward cloud color over the forecast horizon (already knowable today)
    future_points = points[len(bars) : len(bars) + forecast]
    bullish_count = sum(
        1 for p in future_points if p.senkou_a is not None and p.senkou_b is not None and p.senkou_a > p.senkou_b
    )
    bearish_count = sum(
        1 for p in future_points if p.senkou_a is not None and p.senkou_b is not None and p.senkou_a < p.senkou_b
    )
    total = len(future_points)
    if bullish_count > bearish_count:
        score += 1
        signals.append(
            SignalBreakdownItem(
                name=f"Cloud over next {forecast} candles",
                bullish=True,
                detail=f"Green (bullish) for {bullish_count}/{total} projected candles",
            )
        )
    elif bearish_count > bullish_count:
        score -= 1
        signals.append(
            SignalBreakdownItem(
                name=f"Cloud over next {forecast} candles",
                bullish=False,
                detail=f"Red (bearish) for {bearish_count}/{total} projected candles",
            )
        )
    else:
        signals.append(
            SignalBreakdownItem(
                name=f"Cloud over next {forecast} candles", bullish=None, detail="Cloud is twisting - no clear color majority ahead"
            )
        )

    max_score = len(signals)
    if score >= BULLISH_THRESHOLD:
        outlook = "bullish"
    elif score <= BEARISH_THRESHOLD:
        outlook = "bearish"
    else:
        outlook = "neutral"

    direction_word = {"bullish": "up", "bearish": "down", "neutral": "in mixed directions"}[outlook]
    summary = (
        f"{outlook.capitalize()} bias: {score:+d} of {max_score} Ichimoku signals point {direction_word} "
        f"over the last {len(window)} candles, with the already-projected cloud "
        f"{'reinforcing' if outlook != 'neutral' else 'not clearly confirming'} that view for the next {forecast} candles."
    )

    return IchimokuAssessment(
        outlook=outlook,
        score=score,
        max_score=max_score,
        lookback_candles=len(window),
        forecast_candles=forecast,
        signals=signals,
        summary=summary,
    )
