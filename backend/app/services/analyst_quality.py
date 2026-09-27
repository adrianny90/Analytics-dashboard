"""How much a symbol's analyst forecasts can be trusted, from the history of
analyst actions (Yahoo "upgrades_downgrades": firm, date, rating action, price
target action, new target). Same definitions as the offline backtest
(backtests/quality_core.py::analyst_features):

- n_firms: firms whose latest target is from the last TARGET_WINDOW_DAYS days
- dispersion: std / median of those targets (only with >= 3 firms) - high
  disagreement predicts weaker returns (Diether, Malloy & Scherbina 2002)
- stale_days: median age of those targets - old targets miss recent news
- breadth: (targets raised - lowered) / all target changes over the last
  REVISION_WINDOW_DAYS days - revisions carry more information than the level
- net_upgrades: rating upgrades - downgrades over the same window
"""

from datetime import datetime, timezone

import numpy as np
import pandas as pd

TARGET_WINDOW_DAYS = 180
REVISION_WINDOW_DAYS = 90


def analyst_signals(events: pd.DataFrame | None, price: float | None, now: datetime | None = None) -> dict:
    """`events`: yfinance Ticker.upgrades_downgrades (index = GradeDate)."""
    empty = {"n_firms": 0, "dispersion": None, "stale_days": None, "breadth": None, "net_upgrades": 0}
    if events is None or events.empty:
        return empty
    now_ts = pd.Timestamp(now or datetime.now(timezone.utc))
    if now_ts.tzinfo is not None:
        now_ts = now_ts.tz_convert(None)
    df = events.reset_index()
    dates = pd.to_datetime(df["GradeDate" if "GradeDate" in df.columns else df.columns[0]])
    df["date"] = dates.dt.tz_convert(None) if dates.dt.tz is not None else dates
    df = df[df["date"] <= now_ts].sort_values("date")

    recent = df[df["date"] > now_ts - pd.Timedelta(days=REVISION_WINDOW_DAYS)]
    pta = recent.get("priceTargetAction", pd.Series(dtype=str)).fillna("").str.lower()
    raised, lowered = int((pta == "raises").sum()), int((pta == "lowers").sum())
    action = recent.get("Action", pd.Series(dtype=str)).fillna("").str.lower()
    result = dict(empty)
    result["breadth"] = (raised - lowered) / (raised + lowered) if raised + lowered else None
    result["net_upgrades"] = int((action == "up").sum() - (action == "down").sum())

    if "currentPriceTarget" not in df.columns:
        return result
    window = df[(df["date"] > now_ts - pd.Timedelta(days=TARGET_WINDOW_DAYS)) & (df["currentPriceTarget"].fillna(0) > 0)]
    latest = window.drop_duplicates("Firm", keep="last")
    targets = latest["currentPriceTarget"].astype(float).to_numpy()
    ages = ((now_ts - latest["date"]).dt.days).to_numpy(dtype=float)
    if price:
        # Targets far from the price are data errors or pre-split leftovers.
        keep = (targets / price > 0.25) & (targets / price < 4)
        targets, ages = targets[keep], ages[keep]
    result["n_firms"] = int(len(targets))
    if len(targets):
        result["stale_days"] = float(np.median(ages))
    if len(targets) >= 3:
        median = float(np.median(targets))
        result["dispersion"] = float(np.std(targets) / median) if median > 0 else None
    return result
