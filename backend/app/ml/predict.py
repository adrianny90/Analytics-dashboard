"""Applies the trained model to today's data and publishes the forecasts."""

import asyncio
import json
import logging

import lightgbm as lgb
import numpy as np
import pandas as pd

from app.ml.config import DATA_DIR, HORIZON_DAYS, MODEL_DIR, QUANTILES, universe_symbols
from app.ml.data import load_analyst_history, load_prices
from app.ml.features import build_dataset

logger = logging.getLogger(__name__)


def forecast_key(universe: str) -> str:
    # Stored in the existing index_ranking table under this row id (<= 20 chars).
    return f"{universe}_forecast"


def make_forecasts(universe: str) -> list[dict]:
    meta = json.loads((MODEL_DIR / f"{universe}_meta.json").read_text())
    boosters = [lgb.Booster(model_file=str(MODEL_DIR / f"{universe}_q{int(round(q * 100))}.txt")) for q in QUANTILES]

    panels = load_prices()
    close = panels["Close"]
    # Latest date that (almost) all symbols have a price for - a half-filled last
    # day would silently drop most of the universe.
    symbols = universe_symbols(universe)
    coverage = close.reindex(columns=[s for s in symbols if s in close.columns]).notna().mean(axis=1)
    as_of = coverage[coverage >= 0.9].index.max()

    X, _ = build_dataset(panels, load_analyst_history(), symbols, sample_dates=pd.DatetimeIndex([as_of]))
    X = X.reindex(columns=meta["features"])
    raw = np.sort(np.column_stack([b.predict(X) for b in boosters]), axis=1)
    shift = float(meta.get("range_shift", 0.0))  # widening that makes the range hit ~80% out of sample

    forecasts = []
    for (date, symbol), (low, mid, high) in zip(X.index, raw):
        price = float(close.at[as_of, symbol])
        forecasts.append(
            {
                "symbol": symbol,
                "as_of": str(as_of.date()),
                "horizon_days": HORIZON_DAYS,
                "price": round(price, 4),
                "low": round(price * float(np.exp(low - shift)), 2),
                "median": round(price * float(np.exp(mid)), 2),
                "high": round(price * float(np.exp(high + shift)), 2),
                "model_version": meta["version"],
                "verdict": meta["verdict"],
                "backtest_coverage": round(float(meta.get("backtest_coverage", 0.0)), 4) or None,
                "backtest_width": round(float(meta.get("backtest_width", 0.0)), 4) or None,
            }
        )
    (DATA_DIR / f"forecast_{universe}.json").write_text(json.dumps(forecasts))
    logger.info("forecasts for %d symbols as of %s (model %s, %s)", len(forecasts), as_of.date(), meta["version"], meta["verdict"])
    return forecasts


async def _publish(universe: str, forecasts: list[dict]) -> bool:
    from app.core.database import async_session_maker, engine
    from app.services import index_ranking_repo

    if async_session_maker is None:
        return False
    await index_ranking_repo.save_ranking(forecast_key(universe), forecasts)
    if engine is not None:
        await engine.dispose()
    return True


def publish_forecasts(universe: str, forecasts: list[dict]) -> bool:
    """Saves the forecasts to the database (where the server reads them).
    Returns False when no database is configured (DATABASE_NEON unset)."""
    return asyncio.run(_publish(universe, forecasts))
