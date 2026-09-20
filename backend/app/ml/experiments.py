"""Research harness: compares ways of building the forecaster with one strict
walk-forward protocol, so "does it reach 80%?" is answered with data.

For every test year Y the data is split, in time order, into
    train  (older)  |  embargo  |  calibration (2 years)  |  embargo  |  test (year Y)
so nothing the model or its calibration sees overlaps the test outcomes.

    python -m app.ml.experiments
"""

import logging

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.isotonic import IsotonicRegression

from app.ml.config import EMBARGO_DAYS, HORIZON_DAYS, LGBM_PARAMS, MARKET_SYMBOL, MIN_TRAIN_ROWS, QUANTILES, universe_symbols
from app.ml.data import load_analyst_history, load_prices
from app.ml.features import build_dataset

logger = logging.getLogger(__name__)

CALIB_DAYS = 730
FIRST_TEST_YEAR = 2016
COVERAGE_TARGET = 0.8
VOL_FLOOR = 0.03  # floor for the per-stock 3-month volatility scale (log-return units)
TAUS = (0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9)


def _splits(dates: pd.DatetimeIndex, labeled: pd.Series):
    for year in sorted(set(dates.year)):
        if year < FIRST_TEST_YEAR:
            continue
        t0 = pd.Timestamp(f"{year}-01-01")
        calib_hi = t0 - pd.Timedelta(days=EMBARGO_DAYS)
        calib_lo = calib_hi - pd.Timedelta(days=CALIB_DAYS)
        train_hi = calib_lo - pd.Timedelta(days=EMBARGO_DAYS)
        train = (dates < train_hi) & labeled.to_numpy()
        calib = (dates >= calib_lo) & (dates < calib_hi) & labeled.to_numpy()
        test = (dates.year == year) & labeled.to_numpy()
        if train.sum() >= MIN_TRAIN_ROWS and calib.sum() > 1000 and test.sum() > 0:
            yield year, train, calib, test


def _fit_quantiles(X, y):
    return {q: lgb.LGBMRegressor(objective="quantile", alpha=q, **LGBM_PARAMS).fit(X, y) for q in QUANTILES}


def _predict_q(models, X) -> np.ndarray:
    return np.sort(np.column_stack([models[q].predict(X) for q in QUANTILES]), axis=1)


def _conformal_shift(q: np.ndarray, y: np.ndarray) -> float:
    scores = np.maximum(q[:, 0] - y, y - q[:, 2])
    return float(max(np.quantile(scores, COVERAGE_TARGET), 0.0))


def _fit_classifier(X, label):
    return lgb.LGBMClassifier(objective="binary", **LGBM_PARAMS).fit(X, label)


def _precision_tau(p: np.ndarray, correct_up: np.ndarray, min_calls: int = 300) -> float | None:
    """Smallest confidence threshold whose 'up' calls were right >= 80% of the time (on calibration data)."""
    for tau in np.arange(0.5, 0.99, 0.01):
        calls = p > tau
        if calls.sum() >= min_calls and correct_up[calls].mean() >= COVERAGE_TARGET:
            return float(tau)
    return None


def run(universe: str = "sp500") -> dict:
    symbols = universe_symbols(universe)
    panels = load_prices()
    X, y = build_dataset(panels, load_analyst_history(), symbols, extra_features=True)
    close = panels["Close"]
    market_fwd = np.log(close[MARKET_SYMBOL].shift(-HORIZON_DAYS) / close[MARKET_SYMBOL])
    y_excess = y - market_fwd.reindex(X.index.get_level_values("date")).to_numpy()

    dates = X.index.get_level_values("date")
    labeled = y.notna() & y_excess.notna() & X["vol_63"].notna()
    scale_all = (X["vol_63"] / 2).clip(lower=VOL_FLOOR)  # annualised vol -> 3-month log-return scale
    logger.info("dataset %s, %d labelled rows, %d features", X.shape, labeled.sum(), X.shape[1])

    rows = []
    for year, train, calib, test in _splits(dates, labeled):
        logger.info("test year %d: train %d | calib %d | test %d", year, train.sum(), calib.sum(), test.sum())
        Xtr, Xca, Xte = X[train], X[calib], X[test]
        ytr, yca, yte = y[train].to_numpy(), y[calib].to_numpy(), y[test].to_numpy()
        s_tr, s_ca, s_te = (scale_all[m].to_numpy() for m in (train, calib, test))
        out = pd.DataFrame({"y": yte, "s": s_te, "year": year}, index=X.index[test])

        # A) raw quantile regression on the log return + conformal range
        mA = _fit_quantiles(Xtr, ytr)
        cA = _conformal_shift(_predict_q(mA, Xca), yca)
        qA = _predict_q(mA, Xte)
        out["A_lo"], out["A_mid"], out["A_hi"] = qA[:, 0] - cA, qA[:, 1], qA[:, 2] + cA

        # B) the same, but on the return divided by the stock's own volatility -> range scales with risk
        mB = _fit_quantiles(Xtr, ytr / s_tr)
        cB = _conformal_shift(_predict_q(mB, Xca), yca / s_ca)
        qB = _predict_q(mB, Xte)
        out["B_lo"], out["B_mid"], out["B_hi"] = (qB[:, 0] - cB) * s_te, qB[:, 1] * s_te, (qB[:, 2] + cB) * s_te

        # C) no ML: symmetric band = k * volatility, k calibrated the same way
        k = float(np.quantile(np.abs(yca - ytr.mean()) / s_ca, COVERAGE_TARGET))
        out["C_lo"], out["C_mid"], out["C_hi"] = ytr.mean() - k * s_te, ytr.mean(), ytr.mean() + k * s_te

        # D) direction classifier (absolute) - calibrated probability of a rise
        clf = _fit_classifier(Xtr, (ytr > 0).astype(int))
        iso = IsotonicRegression(out_of_bounds="clip").fit(clf.predict_proba(Xca)[:, 1], (yca > 0).astype(int))
        out["p_up"] = iso.predict(clf.predict_proba(Xte)[:, 1])
        tau = _precision_tau(iso.predict(clf.predict_proba(Xca)[:, 1]), (yca > 0))
        out["tau_up"] = np.nan if tau is None else tau

        # E) direction classifier vs the market (does the stock beat SPY?)
        yex_tr, yex_ca, yex_te = (y_excess[m].to_numpy() for m in (train, calib, test))
        clf2 = _fit_classifier(Xtr, (yex_tr > 0).astype(int))
        iso2 = IsotonicRegression(out_of_bounds="clip").fit(clf2.predict_proba(Xca)[:, 1], (yex_ca > 0).astype(int))
        out["ex"] = yex_te
        out["p_beat"] = iso2.predict(clf2.predict_proba(Xte)[:, 1])
        tau2 = _precision_tau(iso2.predict(clf2.predict_proba(Xca)[:, 1]), (yex_ca > 0))
        out["tau_beat"] = np.nan if tau2 is None else tau2
        rows.append(out)

    res = pd.concat(rows)
    report(res)
    res.to_parquet(str(__import__("app.ml.config", fromlist=["DATA_DIR"]).DATA_DIR / f"experiments_{universe}.parquet"))
    return {"n": len(res)}


def _band_stats(res: pd.DataFrame, name: str) -> dict:
    inside = (res["y"] >= res[f"{name}_lo"]) & (res["y"] <= res[f"{name}_hi"])
    width_pct = (np.exp(res[f"{name}_hi"]) - np.exp(res[f"{name}_lo"])).mean() * 100
    by_year = inside.groupby(res["year"]).mean()
    return {
        "coverage": inside.mean(),
        "min_year": by_year.min(),
        "width_pct": width_pct,
        "half_width_pct": (np.exp(res[f"{name}_hi"]) - np.exp(res[f"{name}_lo"])).mean() * 50,
    }


def _selective(res: pd.DataFrame, p_col: str, truth: pd.Series, label: str) -> None:
    base = float(truth.mean())
    print(f"  {label}: share of cases where the outcome is 'yes' (base rate) = {base * 100:.1f}%")
    print("    confidence  |  calls      share   accuracy  (up-calls: p>tau; down-calls: p<1-tau)")
    for tau in TAUS:
        up = res[p_col] > tau
        dn = res[p_col] < 1 - tau
        calls = up | dn
        if calls.sum() == 0:
            print(f"      >{tau:.2f}      |  none")
            continue
        correct = np.where(up[calls], truth[calls], ~truth[calls].astype(bool)).mean()
        print(f"      >{tau:.2f}      | {int(calls.sum()):>7}   {calls.mean() * 100:5.1f}%   {correct * 100:5.1f}%")
    # threshold picked on the calibration data only, applied to the untouched test year
    tau_col = "tau_up" if p_col == "p_up" else "tau_beat"
    picked = res[tau_col].notna()
    if picked.any():
        up = picked & (res[p_col] > res[tau_col])
        if up.sum():
            print(f"    threshold chosen on calibration data (precision>=80% there): {int(up.sum())} up-calls "
                  f"({up.mean() * 100:.1f}% of cases), {truth[up].mean() * 100:.1f}% correct on unseen test years")
    else:
        print("    no confidence threshold reached 80% precision even on the calibration data")


def report(res: pd.DataFrame) -> None:
    print(f"\n===== Backtest of ways to build the forecaster ({len(res)} out-of-sample forecasts, "
          f"{res['year'].min()}-{res['year'].max()}) =====\n")
    print("1) PRICE RANGE: does the realised 3-month price fall inside the predicted low-high band? (target 80%)")
    print("   method                                    coverage   worst year   avg band width (% of price)")
    labels = {"A": "A  quantile ML, raw return + calibration", "B": "B  quantile ML, volatility-scaled + calib.",
              "C": "C  no ML: volatility band + calibration"}
    for name in ("A", "B", "C"):
        st = _band_stats(res, name)
        print(f"   {labels[name]:<42}  {st['coverage'] * 100:5.1f}%     {st['min_year'] * 100:5.1f}%       {st['width_pct']:5.1f}%")

    print("\n2) POINT FORECAST accuracy (median of method B):")
    for label, mid in (("model", res["B_mid"]), ("'no change'", 0 * res["B_mid"]), ("historical mean", res["C_mid"])):
        print(f"   MAE of 3-month log return, {label:<16} {(res['y'] - mid).abs().mean():.4f}")
    hit = (np.sign(res["B_mid"]) == np.sign(res["y"])).mean()
    print(f"   direction hit rate of the median: {hit * 100:.1f}%  (always guessing 'up' would be right {(res['y'] > 0).mean() * 100:.1f}%)")
    within = {h: ((res["y"] - res["B_mid"]).abs() <= h).mean() for h in (0.05, 0.10, 0.15, 0.20, 0.25)}
    print("   share of forecasts within +/- X of the realised log return: " + ", ".join(f"{int(h * 100)}%: {v * 100:.0f}%" for h, v in within.items()))

    print("\n3) DIRECTION with a confidence filter (calibrated probabilities, walk-forward):")
    _selective(res, "p_up", res["y"] > 0, "Will the price be higher in 3 months?")
    _selective(res, "p_beat", res["ex"] > 0, "Will the stock beat the S&P 500 (SPY)?")
    print()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S")
    run()
