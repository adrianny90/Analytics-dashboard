"""Intermarket read for the Kitchin tab: classifies where we are on the
classic "bonds lead stocks lead commodities" rotation (see Cykl Kitchina.jpg,
source: infoinwestor) from real price trends, instead of a fixed rule.

The reference chart encodes exactly 6 states (bonds/stocks/commodities each
either up or down), cycling in order - each transition flips exactly one of
the three:

    # bonds stocks commodities  chart header
    1   down  up    up           wzrost (early)
    2   down  down  up           wzrost (late) / spowolnienie
    3   down  down  down         spowolnienie
    4   up    down  down         recesja (early)
    5   up    up    down         recesja (late) / ozywienie
    6   up    up    up           ozywienie -> back to 1

Ticker/weight choices (bonds, stocks, commodities) are documented in the
Kitchin plan; commodity weights (DBC 45 / copper 30 / oil 15 / gold 10) come
from a historical check (2006-2026 monthly data): oil has by far the highest
volatility and a strong positive skew (supply-shock spikes, e.g. 2020/2022),
gold is almost uncorrelated with equities and *negatively* correlated with
yield changes (a safe-haven/real-rate asset, not a growth-cycle commodity),
while copper and the broad index both track the equity/yield cycle closely
copper as the cleanest single instrument, the index for its lower volatility.
"""

import math
from dataclasses import dataclass

import pandas as pd

# (name, symbol, region, weight, is_yield) per basket. Weights within bonds
# and stocks mirror each other (US 55% / Japan 25% / Europe 20%), per the
# regional importance the user gave for the equity side.
#
# "is_yield" instruments (the two US Treasuries) report a YIELD, whose
# *price* direction (what the chart means by "obligacje") is the inverse of
# the yield's own move - basket_signal() negates only those. The Japan/
# Germany/UK instruments are bond-PRICE ETFs, already in the right direction:
#   - Japan: 2510.T, "NEXT FUNDS Japan Bond NOMURA-BPI ETF" (broad JGB-heavy
#     aggregate bond index fund - Japan has no widely tracked Yahoo yield index)
#   - Germany: IS0L.DE, "iShares Germany Govt Bond UCITS ETF" (Bunds only)
#   - UK: IGLT.L, "iShares Core UK Gilts UCITS ETF"
# France has no standalone govt-bond ETF on Yahoo; French OAT yields move
# tightly with German Bunds (both euro-area, ECB-driven), so the Germany
# instrument stands in for continental Europe alongside UK gilts.
BOND_INSTRUMENTS = [
    ("US 10Y", "^TNX", "US", 0.55 * 0.6, True),
    ("US 2Y", "2YY=F", "US", 0.55 * 0.4, True),
    ("Japan govt bonds", "2510.T", "Japan", 0.25, False),
    ("Germany govt bonds (Bund)", "IS0L.DE", "Europe", 0.20 * 0.5, False),
    ("UK gilts", "IGLT.L", "Europe", 0.20 * 0.5, False),
]
STOCK_INSTRUMENTS = [
    ("S&P 500", "^GSPC", "US", 0.55 / 3, False),
    ("Nasdaq", "^IXIC", "US", 0.55 / 3, False),
    ("Dow Jones", "^DJI", "US", 0.55 / 3, False),
    ("Nikkei 225", "^N225", "Japan", 0.25, False),
    ("FTSE 100", "^FTSE", "Europe", 0.20 / 3, False),
    ("DAX", "^GDAXI", "Europe", 0.20 / 3, False),
    ("CAC 40", "^FCHI", "Europe", 0.20 / 3, False),
]
COMMODITY_INSTRUMENTS = [
    ("Commodity Index", "DBC", "Global", 0.45, False),
    ("Copper", "HG=F", "Global", 0.30, False),
    ("Crude Oil", "CL=F", "Global", 0.15, False),
    ("Gold", "GC=F", "Global", 0.10, False),
]

ALL_INSTRUMENTS = [
    (name, symbol, "bonds", region, weight, is_yield) for name, symbol, region, weight, is_yield in BOND_INSTRUMENTS
] + [
    (name, symbol, "stocks", region, weight, is_yield) for name, symbol, region, weight, is_yield in STOCK_INSTRUMENTS
] + [
    (name, symbol, "commodities", region, weight, is_yield)
    for name, symbol, region, weight, is_yield in COMMODITY_INSTRUMENTS
]

# (bonds_up, stocks_up, commodities_up, label, header) in cycle order.
PHASES: list[tuple[bool, bool, bool, str, str]] = [
    (False, True, True, "Wczesny wzrost", "wzrost"),
    (False, False, True, "Szczyt wzrostu", "wzrost"),
    (False, False, False, "Spowolnienie", "spowolnienie"),
    (True, False, False, "Wczesna recesja", "recesja"),
    (True, True, False, "Dolek / konca recesji", "recesja"),
    (True, True, True, "Ozywienie", "ozywienie"),
]

# Softmax sharpness: how strongly a clean 3/3 match dominates over partial
# matches. Picked so a full, high-conviction match (e.g. bonds falling for
# weeks while stocks and commodities both still rise) lands the dominant
# phase in the 90%+ range, matching "niemal pewne" - see kitchin plan.
_SHARPNESS = 2.0
# Trend window for the phase read ("od kilku tygodni" per the user's own
# framing) - 30 trading sessions is about 6 weeks.
TREND_WINDOW_DAYS = 30


@dataclass
class BasketSignal:
    direction: float  # +1 up, -1 down, 0 flat/unknown
    conviction: float  # 0..1


def _log_returns(closes: pd.Series) -> pd.Series:
    return (closes / closes.shift(1)).apply(math.log).dropna()


def instrument_trend(closes: pd.Series, window: int = TREND_WINDOW_DAYS) -> tuple[float, float]:
    """(direction, conviction) for one instrument's trend over `window`
    trading days: conviction is how large that move is relative to the
    instrument's own typical `window`-day volatility (capped at 1), so a
    quiet stock moving 2% doesn't score the same as a volatile one doing the
    same - each is judged against its own normal range."""
    if len(closes) < window + 20:
        return 0.0, 0.0
    log_rets = _log_returns(closes)
    if len(log_rets) < window:
        return 0.0, 0.0
    window_return = math.log(closes.iloc[-1] / closes.iloc[-1 - window])
    sigma_window = log_rets.std() * math.sqrt(window)
    if sigma_window <= 0 or math.isnan(sigma_window):
        return (1.0 if window_return > 0 else -1.0 if window_return < 0 else 0.0), 0.0
    conviction = min(abs(window_return) / (1.5 * sigma_window), 1.0)
    direction = 1.0 if window_return >= 0 else -1.0
    return direction, conviction


def basket_signal(
    closes_by_symbol: dict[str, pd.Series],
    instruments: list[tuple[str, str, str, float, bool]],
) -> BasketSignal:
    """Weighted net (direction*conviction) across an asset class's
    instruments, collapsed back to one direction + conviction. Disagreement
    between instruments (e.g. US stocks up, Japan down) partially cancels,
    which is the point: a basket only reads as confidently "up" when its
    instruments actually agree. Yield instruments (is_yield=True) are
    negated first, since a rising yield means a falling bond price."""
    total_weight = 0.0
    net = 0.0
    for _name, symbol, _region, weight, is_yield in instruments:
        closes = closes_by_symbol.get(symbol)
        if closes is None or closes.empty:
            continue
        direction, conviction = instrument_trend(closes)
        signed = direction * conviction
        if is_yield:
            signed = -signed
        net += weight * signed
        total_weight += weight
    if total_weight <= 0:
        return BasketSignal(0.0, 0.0)
    net /= total_weight
    direction = 1.0 if net >= 0 else -1.0
    return BasketSignal(direction, min(abs(net), 1.0))


def classify_phase(
    bonds: BasketSignal, stocks: BasketSignal, commodities: BasketSignal
) -> tuple[list[dict], int]:
    """Scores each of the 6 canonical phases and returns (scores, dominant
    phase number). Each phase's raw score rewards matching baskets and
    penalizes mismatching ones (both scaled by that basket's conviction), so
    a phase that matches on all 3 with high conviction pulls sharply ahead
    of a phase that matches on only 1-2 - softmax then turns that gap into a
    percentage."""
    baskets = (bonds, stocks, commodities)
    raw_scores = []
    for bonds_up, stocks_up, commodities_up, _label, _header in PHASES:
        phase_signs = (1.0 if bonds_up else -1.0, 1.0 if stocks_up else -1.0, 1.0 if commodities_up else -1.0)
        score = sum(
            basket.conviction * (1.0 if basket.direction == sign else -1.0)
            for basket, sign in zip(baskets, phase_signs)
        )
        raw_scores.append(score)

    exp_scores = [math.exp(_SHARPNESS * s) for s in raw_scores]
    total = sum(exp_scores)
    percents = [100.0 * e / total for e in exp_scores]

    scores = [
        {
            "phase": i + 1,
            "label": label,
            "header": header,
            "bonds_up": bonds_up,
            "stocks_up": stocks_up,
            "commodities_up": commodities_up,
            "percent": round(pct, 1),
        }
        for i, ((bonds_up, stocks_up, commodities_up, label, header), pct) in enumerate(zip(PHASES, percents))
    ]
    dominant = max(scores, key=lambda s: s["percent"])["phase"]
    return scores, dominant
