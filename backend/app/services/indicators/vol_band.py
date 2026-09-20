"""Method C: a pure-volatility 3-month price band (no machine learning).

Runs inside the server (only needs numpy-free arithmetic, so it costs no
memory) and is recomputed from the daily bars every ranking run:

    sigma   = std of the last 63 daily log returns * sqrt(63)   (3-month scale)
    median  = price * exp(MU)
    range   = price * exp(MU -/+ K * sigma)     (aims at 80% coverage)
    P(+-15%) = chance the 3-month price stays within 0.85..1.15 x today's,
               from the empirical distribution of standardised returns

MU, K and the quantile table were fitted on the S&P 500 walk-forward backtest
(2016-2026, app/ml/experiments.py). Fitted on years <= 2020 only, the band held
79.8% of the 2021-2026 outcomes it never saw (78-83% in each year) and the
+-15% probability tracked reality (predicted 68% vs realised 71%).
"""

import math
from bisect import bisect_left

MU = 0.03402  # typical 3-month log return (historical average)
K = 1.2298  # band half-width in sigmas that contains ~80% of outcomes
HORIZON_DAYS = 63
SIGMA_FLOOR = 0.03
_LOG_LOW = math.log(0.85)
_LOG_HIGH = math.log(1.15)

# Quantiles (1%..99%) of the standardised 3-month return (y - MU) / sigma.
_Z_QUANTILES = [-3.558, -2.696, -2.297, -2.047, -1.869, -1.719, -1.599, -1.498, -1.408, -1.330, -1.258, -1.192, -1.136, -1.078, -1.025, -0.975, -0.930, -0.887, -0.847, -0.808, -0.769, -0.730, -0.694, -0.659, -0.624, -0.592, -0.560, -0.528, -0.498, -0.467, -0.437, -0.408, -0.379, -0.352, -0.324, -0.297, -0.270, -0.245, -0.221, -0.196, -0.171, -0.147, -0.122, -0.098, -0.074, -0.050, -0.027, -0.003, 0.019, 0.042, 0.065, 0.089, 0.111, 0.134, 0.157, 0.179, 0.202, 0.225, 0.247, 0.270, 0.292, 0.315, 0.337, 0.359, 0.382, 0.404, 0.428, 0.451, 0.476, 0.500, 0.525, 0.549, 0.575, 0.600, 0.627, 0.654, 0.682, 0.711, 0.738, 0.768, 0.799, 0.831, 0.864, 0.899, 0.937, 0.976, 1.017, 1.060, 1.105, 1.154, 1.207, 1.264, 1.330, 1.400, 1.487, 1.593, 1.723, 1.900, 2.229]
_Z_LEVELS = [(i + 1) / 100 for i in range(99)]


def _cdf(z: float) -> float:
    """P(standardised return <= z), interpolated between the stored quantiles."""
    if z <= _Z_QUANTILES[0]:
        return 0.0
    if z >= _Z_QUANTILES[-1]:
        return 1.0
    i = bisect_left(_Z_QUANTILES, z)
    lo, hi = _Z_QUANTILES[i - 1], _Z_QUANTILES[i]
    frac = (z - lo) / (hi - lo) if hi > lo else 0.0
    return _Z_LEVELS[i - 1] + frac * (_Z_LEVELS[i] - _Z_LEVELS[i - 1])


def three_month_sigma(closes: list[float]) -> float | None:
    """3-month log-return volatility from the last HORIZON_DAYS daily changes."""
    if len(closes) < HORIZON_DAYS + 1:
        return None
    window = closes[-(HORIZON_DAYS + 1) :]
    returns = [math.log(b / a) for a, b in zip(window, window[1:]) if a > 0 and b > 0]
    if len(returns) < HORIZON_DAYS // 2:
        return None
    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
    return max(math.sqrt(variance) * math.sqrt(HORIZON_DAYS), SIGMA_FLOOR)


def band(price: float, sigma: float) -> tuple[float, float, float]:
    """(low, median, high) price for the next 3 months."""
    return (
        price * math.exp(MU - K * sigma),
        price * math.exp(MU),
        price * math.exp(MU + K * sigma),
    )


def probability_within_15pct(sigma: float) -> float:
    """Chance the price is within +-15% of today's after 3 months."""
    return max(0.0, min(1.0, _cdf((_LOG_HIGH - MU) / sigma) - _cdf((_LOG_LOW - MU) / sigma)))
