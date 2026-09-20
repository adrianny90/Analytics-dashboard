# Price-forecast agent (method A) and the other two forecast columns

Learns from Yahoo Finance history to estimate where a stock's price may be in
~3 months, and shows it in the ranking tables as **Hypothetical target 3M**
(median estimate; hover for the low-high range).

It is an experiment, not advice. Before any forecast is shown, the agent
measures the model out of sample against simple baselines and records a
verdict (`edge` / `no_edge`); the UI dims values from a model without an edge.

## Runs locally, not on the server

Training needs `lightgbm` / `scikit-learn`, which add well over 100 MB of memory
- more than the 512 MB Render instance can spare. So the agent runs on your
machine and publishes only the results to the database; the server just reads
them (row `<universe>_forecast` in the `index_ranking` table).

```
pip install -r requirements-ml.txt          # once, locally only

python -m app.ml.agent run                  # train + evaluate + predict + PUBLISH to the database (data already downloaded)
python -m app.ml.agent all                  # collect + train + evaluate + predict + publish (S&P 500)
python -m app.ml.agent collect              # only download data (prices, analyst history)
python -m app.ml.agent train                # only train + print the evaluation report
python -m app.ml.agent predict              # only forecast with the saved model (+ publish)
python -m app.ml.agent predict --no-publish # write ml_data/forecast_<universe>.json only
```

Publishing needs `DATABASE_NEON` in `backend/.env` (the same database Render uses).
Re-run `all` now and then (weekly is plenty) - analysts' targets and prices go stale.

## What it does

| Step | File | |
|---|---|---|
| Data | `data.py` | Daily prices since 2008 (splits/dividends adjusted) and every analyst price-target action per stock |
| Features | `features.py` | Multi-horizon returns, volatility, RSI, SMA distances, position in the 52-week range, drawdown, 63-day range, volume trend, Ichimoku cloud/Tenkan/Kijun distances, market backdrop (SPY), cross-sectional ranks, and a point-in-time analyst consensus (upside, number of firms, net revisions) |
| Model | `train.py` | LightGBM quantile regression (10th / 50th / 90th percentile of the 63-day log return), one model for all stocks |
| Honesty check | `train.py` | Walk-forward test: every year is predicted by a model trained only on data ending 95 days before it. Compared with "no change", historical average, analyst consensus and momentum |
| Range | `train.py` | Conformal calibration widens the low-high range so it really contains the outcome ~80% of the time |
| Forecast | `predict.py` | Latest features -> price x exp(quantile) -> low / median / high target |

Features at date t only use information available at t (verified: truncating the
future leaves them unchanged), and analyst events count only if dated strictly
before t.

## Known limits

- **Survivorship bias:** the stock lists are today's index members, so history
  over-represents companies that did well. This flatters any backtest.
- Analyst history exists only where Yahoo has it (sparse for small caps).
- Earnings, news and shocks are not in the data, so they are not predictable
  here. Expect at best a weak ranking signal, not accurate prices.
- Data lives in `ml_data/` (git-ignored) and is re-created by `collect`.

## The three forecast columns

| Column | Method | Where it runs | Saved to the database |
|---|---|---|---|
| **ML target 3M (A)** | LightGBM quantile regression + calibrated 80% range (this agent) | locally (`python -m app.ml.agent run`) | straight away, row `<universe>_forecast` |
| **Volatility band 3M (C)** | 3-month price band from the stock's own volatility, no ML (`app/services/indicators/vol_band.py`) | on the server: every Start, and the "Calculate volatility forecast" button above the table | with the ranking, row `<universe>` |
| **P(±15%) 3M** | chance the price stays within 0.85x-1.15x of today's after 3 months, from the same volatility | same as C | same as C |

Backtest (S&P 500, walk-forward, 2016-2026, `app/ml/experiments.py`): both A and C
put ~80% of real 3-month prices inside their range on average (A 81.5% on unseen
later years, C 79.8%; individual years range roughly 67-85%, weakest in 2020/2022).
The range is wide (about +-18% of price), and the point estimate does not beat a
plain historical average - the ML adds almost nothing over the volatility band.
