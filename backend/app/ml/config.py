"""Settings for the price-forecast agent (see app/ml/agent.py)."""

from pathlib import Path

# Downloaded histories, trained models and evaluation reports live here.
# Git-ignored; large and reproducible from Yahoo Finance.
DATA_DIR = Path(__file__).resolve().parents[2] / "ml_data"
MODEL_DIR = DATA_DIR / "models"

# What the model predicts: the log return over the next HORIZON_DAYS trading
# days (63 ~= 3 months), turned into a price target and a low/high range.
HORIZON_DAYS = 63
QUANTILES = (0.1, 0.5, 0.9)

# Training samples are taken every SAMPLE_EVERY trading days per symbol. The
# 63-day outcomes of neighbouring days overlap almost completely, so denser
# sampling adds size but hardly any information.
SAMPLE_EVERY = 10
MIN_HISTORY_DAYS = 252  # the longest look-back any feature needs

HISTORY_START = "2008-01-01"
MARKET_SYMBOL = "SPY"

# Analyst consensus = mean of each firm's latest price target set within this
# many days before the sample date.
ANALYST_WINDOW_DAYS = 90

# Walk-forward evaluation: each test year is predicted by a model trained only
# on data that ended EMBARGO_DAYS (calendar) before that year began, so no
# training outcome overlaps the test period.
FIRST_TEST_YEAR = 2015
EMBARGO_DAYS = 95
MIN_TRAIN_ROWS = 20_000

LGBM_PARAMS = dict(
    n_estimators=300,
    learning_rate=0.03,
    num_leaves=15,
    min_child_samples=300,
    subsample=0.7,
    subsample_freq=1,
    colsample_bytree=0.7,
    reg_lambda=5.0,
    verbose=-1,
)


def universe_symbols(universe: str) -> list[str]:
    from app.core.nasdaq_symbols import NASDAQ_SYMBOLS
    from app.core.russell2000_symbols import RUSSELL2000_SYMBOLS
    from app.core.sp500_symbols import SP500_SYMBOLS

    symbols = {"sp500": SP500_SYMBOLS, "nasdaq": NASDAQ_SYMBOLS, "russell2000": RUSSELL2000_SYMBOLS}
    if universe not in symbols:
        raise ValueError(f"unknown universe {universe!r}; expected one of {sorted(symbols)}")
    return list(symbols[universe])
