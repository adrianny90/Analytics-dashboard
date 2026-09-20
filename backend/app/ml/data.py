"""Downloads the raw material the forecast model learns from: long daily
price history and the history of analysts' price-target changes."""

import json
import logging
import time

import pandas as pd
import yfinance as yf
from yfinance.exceptions import YFRateLimitError

from app.ml.config import DATA_DIR, HISTORY_START, MARKET_SYMBOL

logger = logging.getLogger(__name__)

PRICE_FIELDS = ("Close", "High", "Low", "Volume")
BATCH_SIZE = 15  # same batch size the rest of the app uses against Yahoo
PAUSE_SECONDS = 1.5
RATE_LIMIT_COOLDOWN_SECONDS = 180


def _download_batch(batch: list[str]) -> pd.DataFrame | None:
    for attempt in range(4):
        try:
            df = yf.download(
                tickers=batch,
                start=HISTORY_START,
                interval="1d",
                group_by="ticker",
                auto_adjust=True,  # returns include splits/dividends
                threads=True,
                progress=False,
            )
        except YFRateLimitError:
            logger.warning("rate limited; waiting %ss", RATE_LIMIT_COOLDOWN_SECONDS)
            time.sleep(RATE_LIMIT_COOLDOWN_SECONDS)
            continue
        if df is not None and len(df):
            return df
        time.sleep(30 * (attempt + 1))  # empty result is often a silent rate limit
    return None


def download_prices(symbols: list[str]) -> dict[str, pd.DataFrame]:
    """Wide (date x symbol) frames for Close/High/Low/Volume, saved to
    ml_data/prices_<field>.parquet. Always re-downloads, so a run is fresh."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    wanted = list(dict.fromkeys([*symbols, MARKET_SYMBOL]))
    series: dict[str, list[pd.Series]] = {field: [] for field in PRICE_FIELDS}
    for i in range(0, len(wanted), BATCH_SIZE):
        batch = wanted[i : i + BATCH_SIZE]
        df = _download_batch(batch)
        if df is None:
            logger.warning("no data for batch starting %s; skipping", batch[0])
            continue
        for symbol in batch:
            frame = df if len(batch) == 1 else (df[symbol] if symbol in df.columns.get_level_values(0) else None)
            if frame is None:
                continue
            frame = frame.dropna(subset=["Close"])
            if frame.empty:
                continue
            for field in PRICE_FIELDS:
                series[field].append(frame[field].rename(symbol))
        logger.info("prices: %d/%d symbols requested", min(i + BATCH_SIZE, len(wanted)), len(wanted))
        time.sleep(PAUSE_SECONDS)

    panels = {}
    for field, parts in series.items():
        if not parts:
            raise RuntimeError("no price data could be downloaded")
        panel = pd.concat(parts, axis=1).sort_index()
        panel.index = pd.to_datetime(panel.index).tz_localize(None)
        panels[field] = panel
        panel.to_parquet(DATA_DIR / f"prices_{field.lower()}.parquet")
    logger.info("saved prices for %d symbols, %s to %s", panels["Close"].shape[1], panels["Close"].index.min().date(), panels["Close"].index.max().date())
    return panels


def load_prices() -> dict[str, pd.DataFrame]:
    return {field: pd.read_parquet(DATA_DIR / f"prices_{field.lower()}.parquet") for field in PRICE_FIELDS}


_ANALYST_COLUMNS = ["Firm", "Action", "priceTargetAction", "currentPriceTarget", "priorPriceTarget"]


def download_analyst_history(symbols: list[str], refresh: bool = False, pause: float = 1.2) -> pd.DataFrame:
    """Every recorded analyst price-target action per symbol (firm, date, new
    and previous target). Incremental: symbols already fetched are skipped
    unless refresh=True. Saved to ml_data/analyst.parquet."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    events_path = DATA_DIR / "analyst.parquet"
    done_path = DATA_DIR / "analyst_done.json"
    events = pd.read_parquet(events_path) if events_path.exists() and not refresh else pd.DataFrame()
    done: set[str] = set(json.loads(done_path.read_text())) if done_path.exists() and not refresh else set()

    parts = [events] if len(events) else []
    todo = [s for s in symbols if s not in done]
    for n, symbol in enumerate(todo, start=1):
        while True:
            try:
                history = yf.Ticker(symbol).upgrades_downgrades
                break
            except YFRateLimitError:
                logger.warning("rate limited; waiting %ss", RATE_LIMIT_COOLDOWN_SECONDS)
                time.sleep(RATE_LIMIT_COOLDOWN_SECONDS)
            except Exception:
                history = None
                break
        if history is not None and len(history) and "currentPriceTarget" in history.columns:
            part = history.reset_index().rename(columns={history.index.name or "index": "date"})
            part["date"] = pd.to_datetime(part["date"]).dt.tz_localize(None).dt.normalize()
            part = part[["date", *[c for c in _ANALYST_COLUMNS if c in part.columns]]].copy()
            part = part[part["currentPriceTarget"].fillna(0) > 0]
            part["symbol"] = symbol
            parts.append(part)
        done.add(symbol)
        if n % 50 == 0 or n == len(todo):
            _save_analyst(parts, done, events_path, done_path)
            logger.info("analyst history: %d/%d symbols", n, len(todo))
        time.sleep(pause)
    return _save_analyst(parts, done, events_path, done_path)


def _save_analyst(parts, done, events_path, done_path) -> pd.DataFrame:
    events = pd.concat(parts, ignore_index=True) if parts else pd.DataFrame(columns=["date", "symbol"])
    events.to_parquet(events_path)
    done_path.write_text(json.dumps(sorted(done)))
    return events


def load_analyst_history() -> pd.DataFrame:
    path = DATA_DIR / "analyst.parquet"
    return pd.read_parquet(path) if path.exists() else pd.DataFrame(columns=["date", "symbol"])


# Market-wide context the per-stock features lack: volatility index, rates,
# dollar, credit, and the sector ETFs (one per GICS sector used in the lists).
MACRO_SYMBOLS = ["^VIX", "^TNX", "^IRX", "DX-Y.NYB", "HYG", "LQD", "GLD"]
SECTOR_ETFS = {
    "Information Technology": "XLK", "Technology": "XLK", "Financials": "XLF", "Health Care": "XLV",
    "Energy": "XLE", "Industrials": "XLI", "Consumer Discretionary": "XLY", "Consumer Staples": "XLP",
    "Utilities": "XLU", "Materials": "XLB", "Real Estate": "XLRE", "Communication Services": "XLC",
}


def download_macro() -> pd.DataFrame:
    """Daily closes of MACRO_SYMBOLS and the sector ETFs -> ml_data/macro_close.parquet."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    wanted = list(dict.fromkeys([*MACRO_SYMBOLS, *SECTOR_ETFS.values()]))
    df = _download_batch(wanted)
    if df is None:
        raise RuntimeError("could not download macro data")
    close = pd.concat({s: df[s]["Close"] for s in wanted if s in df.columns.get_level_values(0)}, axis=1).sort_index()
    close.index = pd.to_datetime(close.index).tz_localize(None)
    close.to_parquet(DATA_DIR / "macro_close.parquet")
    logger.info("saved macro/sector-ETF closes: %s", list(close.columns))
    return close


def load_macro() -> pd.DataFrame:
    return pd.read_parquet(DATA_DIR / "macro_close.parquet")
