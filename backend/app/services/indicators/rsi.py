RSI_PERIOD = 14


def _rsi_from_averages(avg_gain: float, avg_loss: float) -> float:
    if avg_loss == 0:
        return 50.0 if avg_gain == 0 else 100.0
    return 100 - 100 / (1 + avg_gain / avg_loss)


def compute_rsi_last(closes: list[float], period: int = RSI_PERIOD) -> float | None:
    """Wilder's RSI at the last close, or None when there isn't enough
    history (needs at least `period` price changes). Same smoothing the
    chart's RSI panel uses, so scan results match what's drawn."""
    if len(closes) <= period:
        return None
    changes = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    avg_gain = sum(max(c, 0.0) for c in changes[:period]) / period
    avg_loss = sum(max(-c, 0.0) for c in changes[:period]) / period
    for change in changes[period:]:
        avg_gain = (avg_gain * (period - 1) + max(change, 0.0)) / period
        avg_loss = (avg_loss * (period - 1) + max(-change, 0.0)) / period
    return _rsi_from_averages(avg_gain, avg_loss)
