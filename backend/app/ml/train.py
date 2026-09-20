"""Trains the forecast model and - before trusting it - measures whether it is
any good, honestly, on data it never saw."""

import json
import logging
from datetime import datetime, timezone

import lightgbm as lgb
import numpy as np
import pandas as pd

from app.ml.config import (
    EMBARGO_DAYS,
    FIRST_TEST_YEAR,
    HORIZON_DAYS,
    LGBM_PARAMS,
    MIN_TRAIN_ROWS,
    MODEL_DIR,
    QUANTILES,
    SAMPLE_EVERY,
    DATA_DIR,
    universe_symbols,
)
from app.ml.data import load_analyst_history, load_prices
from app.ml.features import build_dataset

logger = logging.getLogger(__name__)

Q_LABELS = {q: f"q{int(round(q * 100))}" for q in QUANTILES}
# Each label's outcome window overlaps its neighbours', so per-date results are
# not independent; this many consecutive sample dates share one outcome window.
OVERLAP = int(np.ceil(HORIZON_DAYS / SAMPLE_EVERY))


def fit_quantiles(X: pd.DataFrame, y: pd.Series) -> dict[float, lgb.LGBMRegressor]:
    models = {}
    for q in QUANTILES:
        model = lgb.LGBMRegressor(objective="quantile", alpha=q, **LGBM_PARAMS)
        model.fit(X, y)
        models[q] = model
    return models


def predict_quantiles(models: dict[float, lgb.LGBMRegressor], X: pd.DataFrame) -> pd.DataFrame:
    raw = np.column_stack([models[q].predict(X) for q in QUANTILES])
    raw.sort(axis=1)  # independently fitted quantiles can cross; enforce low <= mid <= high
    return pd.DataFrame(raw, index=X.index, columns=[Q_LABELS[q] for q in QUANTILES])


def walk_forward(X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
    """Predicts each test year with a model trained only on data that ended
    EMBARGO_DAYS before the year began. Returns one row per test sample with
    the model's quantiles, the real outcome and the baselines' predictions."""
    dates = X.index.get_level_values("date")
    labeled = y.notna()
    folds = []
    for year in sorted(set(dates.year)):
        if year < FIRST_TEST_YEAR:
            continue
        cutoff = pd.Timestamp(f"{year}-01-01") - pd.Timedelta(days=EMBARGO_DAYS)
        train = (dates < cutoff) & labeled
        test = (dates.year == year) & labeled
        if train.sum() < MIN_TRAIN_ROWS or test.sum() == 0:
            continue
        logger.info("fold %d: train %d rows (to %s), test %d rows", year, train.sum(), cutoff.date(), test.sum())
        models = fit_quantiles(X[train], y[train])
        out = predict_quantiles(models, X[test])
        out["y"] = y[test]
        train_mean = float(y[train].mean())
        out["base_zero"] = 0.0
        out["base_mean"] = train_mean
        out["base_analyst"] = (X.loc[test, "an_upside"] / 4).clip(-0.3, 0.3).fillna(train_mean)
        out["base_momentum"] = 0.25 * X.loc[test, "ret_63"]
        folds.append(out)
    if not folds:
        raise RuntimeError("not enough history for a walk-forward test")
    return pd.concat(folds)


RANGE_COVERAGE_TARGET = 0.8


def range_shift(pred: pd.DataFrame) -> float:
    """Conformal calibration of the low/high range: how much (in log-return
    terms) both ends must be widened so that the real outcome falls inside
    RANGE_COVERAGE_TARGET of the time on out-of-sample data. Raw quantile
    models are typically too narrow."""
    scores = np.maximum(pred["q10"] - pred["y"], pred["y"] - pred["q90"])
    return float(max(np.quantile(scores, RANGE_COVERAGE_TARGET), 0.0))


def _coverage(pred: pd.DataFrame, shift: float) -> float:
    return float(((pred["y"] >= pred["q10"] - shift) & (pred["y"] <= pred["q90"] + shift)).mean())


def _per_date_ic(df: pd.DataFrame, col: str) -> pd.Series:
    def ic(group: pd.DataFrame) -> float:
        return group[col].corr(group["y"], method="spearman") if len(group) >= 30 else np.nan

    return df.groupby(level="date").apply(ic).dropna()


def _decile_spread(df: pd.DataFrame, col: str) -> float:
    def spread(group: pd.DataFrame) -> float:
        if len(group) < 50:
            return np.nan
        pct = group[col].rank(pct=True)
        return group.loc[pct >= 0.9, "y"].mean() - group.loc[pct <= 0.1, "y"].mean()

    return float(df.groupby(level="date").apply(spread).dropna().mean())


def evaluate(pred: pd.DataFrame) -> dict:
    """Model vs. simple baselines, out of sample."""
    report: dict = {"test_rows": int(len(pred)), "test_dates": int(pred.index.get_level_values("date").nunique())}
    mae = {}
    for col in ("q50", "base_zero", "base_mean", "base_analyst", "base_momentum"):
        mae[col] = float((pred["y"] - pred[col]).abs().mean())
    report["mae_log_return"] = mae

    ic = _per_date_ic(pred, "q50")
    n_eff = max(len(ic) / OVERLAP, 1.0)
    report["ic_mean"] = float(ic.mean())
    report["ic_t_stat"] = float(ic.mean() / (ic.std() / np.sqrt(n_eff))) if ic.std() > 0 else 0.0
    report["ic_baseline_analyst"] = float(_per_date_ic(pred, "base_analyst").mean())
    report["ic_baseline_momentum"] = float(_per_date_ic(pred, "base_momentum").mean())
    report["decile_spread"] = _decile_spread(pred, "q50")  # top-decile minus bottom-decile forward return

    report["hit_rate"] = float((np.sign(pred["q50"]) == np.sign(pred["y"])).mean())
    report["share_positive_outcomes"] = float((pred["y"] > 0).mean())
    report["range_coverage_p10_p90"] = float(((pred["y"] >= pred["q10"]) & (pred["y"] <= pred["q90"])).mean())
    report["mean_range_width"] = float((pred["q90"] - pred["q10"]).mean())

    # Honest check of the calibration: fit the shift on the earlier 2/3 of the
    # test dates and measure coverage on the later 1/3 it never saw.
    dates = pred.index.get_level_values("date")
    split = dates.unique().sort_values()[int(dates.nunique() * 2 / 3)]
    report["range_shift"] = range_shift(pred)
    report["range_coverage_calibrated_holdout"] = _coverage(pred[dates >= split], range_shift(pred[dates < split]))
    report["mean_range_width_calibrated"] = report["mean_range_width"] + 2 * report["range_shift"]

    by_year = {}
    for year, group in pred.groupby(pred.index.get_level_values("date").year):
        yearly_ic = _per_date_ic(group, "q50")
        by_year[int(year)] = {
            "ic": float(yearly_ic.mean()) if len(yearly_ic) else None,
            "mae_model": float((group["y"] - group["q50"]).abs().mean()),
            "mae_base_mean": float((group["y"] - group["base_mean"]).abs().mean()),
        }
    report["by_year"] = by_year

    beats_baselines = mae["q50"] < min(mae["base_zero"], mae["base_mean"], mae["base_analyst"], mae["base_momentum"])
    report["beats_all_baselines_on_mae"] = bool(beats_baselines)
    report["verdict"] = "edge" if (beats_baselines and report["ic_mean"] > 0.02 and report["ic_t_stat"] > 2) else "no_edge"
    return report


def format_report(universe: str, report: dict) -> str:
    mae = report["mae_log_return"]
    lines = [
        f"=== Forecast model evaluation - {universe} (horizon {HORIZON_DAYS} trading days) ===",
        f"Out-of-sample rows: {report['test_rows']} over {report['test_dates']} dates (walk-forward, {EMBARGO_DAYS}-day embargo)",
        "",
        "Mean absolute error of the predicted 3-month log return (lower is better):",
        f"  model (median)          {mae['q50']:.4f}",
        f"  'no change'             {mae['base_zero']:.4f}",
        f"  historical average      {mae['base_mean']:.4f}",
        f"  analyst consensus       {mae['base_analyst']:.4f}",
        f"  momentum                {mae['base_momentum']:.4f}",
        "",
        f"Rank correlation (IC) of prediction vs outcome: {report['ic_mean']:+.4f}  (t-stat ~ {report['ic_t_stat']:.1f}, "
        f"analyst baseline {report['ic_baseline_analyst']:+.4f}, momentum {report['ic_baseline_momentum']:+.4f})",
        f"Top-decile minus bottom-decile forward return: {report['decile_spread'] * 100:+.2f}%",
        f"Direction hit rate: {report['hit_rate'] * 100:.1f}%  (share of positive outcomes: {report['share_positive_outcomes'] * 100:.1f}%)",
        f"Range coverage (target 80%): raw {report['range_coverage_p10_p90'] * 100:.1f}% (width {report['mean_range_width'] * 100:.1f}%)"
        f" -> calibrated {report['range_coverage_calibrated_holdout'] * 100:.1f}% on later unseen dates (width {report['mean_range_width_calibrated'] * 100:.1f}%)",
        "",
        "By year (IC | model MAE vs historical-average MAE):",
    ]
    for year, row in report["by_year"].items():
        ic = "  n/a " if row["ic"] is None else f"{row['ic']:+.3f}"
        lines.append(f"  {year}: IC {ic} | {row['mae_model']:.4f} vs {row['mae_base_mean']:.4f}")
    lines += ["", f"VERDICT: {'the model shows an edge over the baselines' if report['verdict'] == 'edge' else 'NO RELIABLE EDGE over simple baselines - treat forecasts as illustrative only'}"]
    return "\n".join(lines)


def train(universe: str) -> dict:
    """Walk-forward evaluation, then a final model on all labelled data. Saves
    the models, a report and metadata under ml_data/."""
    symbols = universe_symbols(universe)
    panels = load_prices()
    events = load_analyst_history()
    logger.info("building dataset...")
    X, y = build_dataset(panels, events, symbols)
    logger.info("dataset: %d rows, %d features, %d symbols", len(X), X.shape[1], X.index.get_level_values("symbol").nunique())

    oos = walk_forward(X, y)
    report = evaluate(oos)
    print(format_report(universe, report))

    labeled = y.notna()
    models = fit_quantiles(X[labeled], y[labeled])
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for q, model in models.items():
        model.booster_.save_model(str(MODEL_DIR / f"{universe}_{Q_LABELS[q]}.txt"))
    trained_until = X.index.get_level_values("date")[labeled.to_numpy()].max()
    meta = {
        "universe": universe,
        "version": datetime.now(timezone.utc).strftime("%Y%m%d-%H%M"),
        "horizon_days": HORIZON_DAYS,
        "features": list(X.columns),
        "train_rows": int(labeled.sum()),
        "trained_until": str(trained_until.date()),
        "verdict": report["verdict"],
        "ic_mean": report["ic_mean"],
        "range_shift": range_shift(oos),
        # Out-of-sample check of the calibrated range, shown next to every forecast.
        "backtest_coverage": report["range_coverage_calibrated_holdout"],
        "backtest_width": report["mean_range_width_calibrated"],
    }
    (MODEL_DIR / f"{universe}_meta.json").write_text(json.dumps(meta, indent=2))
    (DATA_DIR / f"report_{universe}.json").write_text(json.dumps(report, indent=2))
    return report
