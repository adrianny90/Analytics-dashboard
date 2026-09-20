"""Turns price/analyst history into the features the model sees and the
outcome it learns to predict.

Every feature at date t uses only information available at the close of t
(analyst events strictly before t), so nothing leaks from the future."""

import numpy as np
import pandas as pd

from app.core.sp500_symbols import SP500_SECTORS

from app.ml.data import SECTOR_ETFS
from app.ml.config import ANALYST_WINDOW_DAYS, HORIZON_DAYS, MARKET_SYMBOL, MIN_HISTORY_DAYS, SAMPLE_EVERY


def _rsi(close: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / period, adjust=False, min_periods=period).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / period, adjust=False, min_periods=period).mean()
    return 100 - 100 / (1 + gain / loss)


def _broadcast(series: pd.Series, like: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(np.repeat(series.to_numpy()[:, None], like.shape[1], axis=1), index=like.index, columns=like.columns)


def price_features(
    close: pd.DataFrame, high: pd.DataFrame, low: pd.DataFrame, volume: pd.DataFrame, market_close: pd.Series
) -> dict[str, pd.DataFrame]:
    """One (date x symbol) frame per feature."""
    f: dict[str, pd.DataFrame] = {}
    log_ret = np.log(close).diff()

    for k in (5, 21, 63, 126, 252):
        f[f"ret_{k}"] = close / close.shift(k) - 1
    f["vol_21"] = log_ret.rolling(21).std() * np.sqrt(252)
    f["vol_63"] = log_ret.rolling(63).std() * np.sqrt(252)
    f["rsi_14"] = _rsi(close)
    for n in (50, 200):
        f[f"dist_sma{n}"] = close / close.rolling(n).mean() - 1

    # "Ranges": where price sits inside its own recent span, and how wide it is.
    hi252, lo252 = high.rolling(252).max(), low.rolling(252).min()
    f["pos_52w"] = (close - lo252) / (hi252 - lo252)
    f["drawdown_52w"] = close / hi252 - 1
    f["range_63"] = (high.rolling(63).max() - low.rolling(63).min()) / close
    f["vol_ratio"] = volume.rolling(21).mean() / volume.rolling(126).mean()

    # Ichimoku, vectorised. The cloud drawn at t is computed from t-26, so it is
    # known at t (no look-ahead).
    tenkan = (high.rolling(9).max() + low.rolling(9).min()) / 2
    kijun = (high.rolling(26).max() + low.rolling(26).min()) / 2
    senkou_a = ((tenkan + kijun) / 2).shift(26)
    senkou_b = ((high.rolling(52).max() + low.rolling(52).min()) / 2).shift(26)
    f["dist_cloud_top"] = close / np.maximum(senkou_a, senkou_b) - 1
    f["dist_cloud_bottom"] = close / np.minimum(senkou_a, senkou_b) - 1
    f["tenkan_kijun"] = tenkan / kijun - 1
    f["dist_kijun"] = close / kijun - 1

    # Market backdrop and relative strength.
    m_ret21 = market_close / market_close.shift(21) - 1
    m_ret63 = market_close / market_close.shift(63) - 1
    m_vol21 = np.log(market_close).diff().rolling(21).std() * np.sqrt(252)
    f["mkt_ret_21"] = _broadcast(m_ret21, close)
    f["mkt_ret_63"] = _broadcast(m_ret63, close)
    f["mkt_vol_21"] = _broadcast(m_vol21, close)
    f["rel_ret_63"] = f["ret_63"].sub(m_ret63, axis=0)

    # Cross-sectional ranks are robust to the overall market regime.
    for name in ("ret_63", "ret_252", "vol_63"):
        f[f"rank_{name}"] = f[name].rank(axis=1, pct=True)
    return f


def context_features(
    close: pd.DataFrame,
    volume: pd.DataFrame,
    macro: pd.DataFrame | None,
    dates: pd.DatetimeIndex,
    sectors: dict[str, str],
) -> dict[str, pd.DataFrame]:
    """Sector, macro-regime and market-breadth features, plus richer per-stock
    momentum / risk features. Frames are indexed by `dates` only."""
    cols = list(close.columns)
    log_ret = np.log(close).diff()
    f: dict[str, pd.DataFrame] = {}

    # Extra per-stock features.
    f["mom_12_1"] = (close.shift(21) / close.shift(252) - 1)  # 12-month momentum skipping the last month
    f["vol_ratio_21_63"] = log_ret.rolling(21).std() / log_ret.rolling(63).std()
    f["skew_63"] = log_ret.rolling(63).skew()
    f["worst_day_63"] = log_ret.rolling(63).min()
    f["down_vol_63"] = log_ret.clip(upper=0).rolling(63).std() * np.sqrt(252)
    f["log_dollar_vol"] = np.log((close * volume).rolling(63).mean().clip(lower=1))
    f["ret_21_prev"] = close.shift(21) / close.shift(42) - 1  # short-term reversal context

    # Market breadth from the stocks themselves.
    sma200 = close.rolling(200).mean()
    above200 = (close > sma200).astype(float).where(sma200.notna())
    f["breadth_sma200"] = pd.DataFrame(
        np.repeat(above200.mean(axis=1).to_numpy()[:, None], len(cols), axis=1), index=close.index, columns=cols
    )
    pos63 = ((close / close.shift(63) - 1) > 0).astype(float).where(close.shift(63).notna())
    f["breadth_ret63"] = pd.DataFrame(
        np.repeat(pos63.mean(axis=1).to_numpy()[:, None], len(cols), axis=1), index=close.index, columns=cols
    )

    def broadcast(series: pd.Series) -> pd.DataFrame:
        return pd.DataFrame(np.repeat(series.to_numpy()[:, None], len(cols), axis=1), index=close.index, columns=cols)

    if macro is not None:
        m = macro.reindex(close.index).ffill()
        f["vix"] = broadcast(m["^VIX"])
        f["vix_chg_21"] = broadcast(m["^VIX"] / m["^VIX"].shift(21) - 1)
        f["vix_pct_252"] = broadcast(m["^VIX"].rolling(252).rank(pct=True))
        f["tnx"] = broadcast(m["^TNX"])
        f["tnx_chg_63"] = broadcast(m["^TNX"] - m["^TNX"].shift(63))
        f["curve_10y_3m"] = broadcast(m["^TNX"] - m["^IRX"])
        f["dxy_ret_63"] = broadcast(m["DX-Y.NYB"] / m["DX-Y.NYB"].shift(63) - 1)
        f["credit_ret_63"] = broadcast((m["HYG"] / m["LQD"]) / (m["HYG"] / m["LQD"]).shift(63) - 1)
        f["gold_ret_63"] = broadcast(m["GLD"] / m["GLD"].shift(63) - 1)

        # Sector ETF of each stock: its own trend and the stock's strength relative to it.
        etf_ret63 = m / m.shift(63) - 1
        etf_ret21 = m / m.shift(21) - 1
        sector_r63 = pd.DataFrame(np.nan, index=close.index, columns=cols)
        sector_r21 = pd.DataFrame(np.nan, index=close.index, columns=cols)
        for symbol in cols:
            etf = SECTOR_ETFS.get(sectors.get(symbol, ""))
            if etf in etf_ret63.columns:
                sector_r63[symbol] = etf_ret63[etf]
                sector_r21[symbol] = etf_ret21[etf]
        f["sector_ret_63"] = sector_r63
        f["sector_ret_21"] = sector_r21
        f["rel_sector_63"] = (close / close.shift(63) - 1) - sector_r63

    codes = {name: i for i, name in enumerate(sorted(set(SP500_SECTORS.values())))}
    sector_code = np.array([codes.get(sectors.get(s, ""), -1) for s in cols], dtype=float)
    f["sector_code"] = pd.DataFrame(np.tile(sector_code, (len(close.index), 1)), index=close.index, columns=cols)
    f["month"] = pd.DataFrame(
        np.repeat(close.index.month.to_numpy(dtype=float)[:, None], len(cols), axis=1), index=close.index, columns=cols
    )
    return f


def analyst_features(
    events: pd.DataFrame, close: pd.DataFrame, dates: pd.DatetimeIndex
) -> dict[str, pd.DataFrame]:
    """Point-in-time analyst consensus: for each (date, symbol) the mean of each
    firm's latest target set in the ANALYST_WINDOW_DAYS before that date."""
    shape = (len(dates), close.shape[1])
    arrays = {name: np.full(shape, np.nan) for name in ("an_upside", "an_n", "an_net_revisions", "an_avg_change")}
    if len(events):
        col_index = {s: i for i, s in enumerate(close.columns)}
        date_days = np.asarray(dates.values, dtype="datetime64[D]")
        window = np.timedelta64(ANALYST_WINDOW_DAYS, "D")
        close_at = close.reindex(dates).to_numpy()
        for symbol, group in events.groupby("symbol"):
            j = col_index.get(symbol)
            if j is None:
                continue
            group = group.sort_values("date")
            ev_days = group["date"].to_numpy(dtype="datetime64[D]")
            firms = group["Firm"].to_numpy()
            targets = group["currentPriceTarget"].to_numpy(dtype=float)
            priors = group["priorPriceTarget"].to_numpy(dtype=float)
            actions = group["priceTargetAction"].to_numpy(dtype=object)
            starts = np.searchsorted(ev_days, date_days - window, side="left")
            ends = np.searchsorted(ev_days, date_days, side="left")  # strictly before the date
            for i in range(len(dates)):
                lo, hi = starts[i], ends[i]
                if hi <= lo:
                    continue
                latest: dict[str, float] = {}
                net = 0
                changes = []
                for k in range(lo, hi):
                    latest[firms[k]] = targets[k]
                    if actions[k] == "Raises":
                        net += 1
                    elif actions[k] == "Lowers":
                        net -= 1
                    if priors[k] > 0:
                        changes.append(targets[k] / priors[k] - 1)
                consensus = float(np.mean(list(latest.values())))
                price = close_at[i, j]
                if price and not np.isnan(price):
                    arrays["an_upside"][i, j] = consensus / price - 1
                arrays["an_n"][i, j] = len(latest)
                arrays["an_net_revisions"][i, j] = net
                if changes:
                    arrays["an_avg_change"][i, j] = float(np.mean(changes))
    return {name: pd.DataFrame(arr, index=dates, columns=close.columns) for name, arr in arrays.items()}


def _stack(frame: pd.DataFrame, dates: pd.DatetimeIndex) -> pd.Series:
    stacked = frame.loc[dates].stack(future_stack=True)
    stacked.index.names = ["date", "symbol"]
    return stacked


def build_dataset(
    panels: dict[str, pd.DataFrame],
    events: pd.DataFrame,
    symbols: list[str],
    sample_dates: pd.DatetimeIndex | None = None,
    extra_features: bool = False,
) -> tuple[pd.DataFrame, pd.Series]:
    """(features, outcome) indexed by (date, symbol). `sample_dates=None` means
    every SAMPLE_EVERY-th trading day (training); pass explicit dates to build
    features for a specific day (prediction). Outcome is the forward log return
    and is NaN where the future isn't known yet."""
    close = panels["Close"]
    market = close[MARKET_SYMBOL]
    cols = [s for s in symbols if s in close.columns and s != MARKET_SYMBOL]
    close, high, low, volume = (panels[k][cols] for k in ("Close", "High", "Low", "Volume"))

    if sample_dates is None:
        sample_dates = close.index[MIN_HISTORY_DAYS::SAMPLE_EVERY]

    frames = price_features(close, high, low, volume, market)
    if extra_features:
        # Sector / macro / breadth context. Tested in experiments.py: it did not
        # improve out-of-sample accuracy, so it is off for the production agent.
        from app.ml.data import load_macro

        frames.update(context_features(close, volume, load_macro(), sample_dates, SP500_SECTORS))
    frames.update(analyst_features(events, close, sample_dates))
    X = pd.concat({name: _stack(frame, sample_dates) for name, frame in frames.items()}, axis=1)
    y = _stack(np.log(close.shift(-HORIZON_DAYS) / close), sample_dates).rename("y")

    # Drop rows with no price info at all (symbol not trading yet on that date).
    keep = X["ret_252"].notna()
    return X[keep], y[keep]
