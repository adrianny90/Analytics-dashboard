"""The price-forecast agent: collects data, learns from it, checks itself
against baselines, and publishes a 3-month "hypothetical target" per stock.

Run locally (it needs the extras in requirements-ml.txt, which the server does
not install - the server only reads the published forecasts from the database):

    python -m app.ml.agent collect  [--universe sp500] [--refresh-analysts]
    python -m app.ml.agent train    [--universe sp500]
    python -m app.ml.agent predict  [--universe sp500] [--no-publish]
    python -m app.ml.agent run      [--universe sp500]     # train + predict + publish (data already downloaded)
    python -m app.ml.agent all      [--universe sp500]     # collect + train + predict + publish

Every command that produces forecasts saves them straight to the database
(DATABASE_NEON) so the server picks them up; pass --no-publish to only write
ml_data/forecast_<universe>.json.
"""

import argparse
import logging
import time

from app.ml import data
from app.ml.config import universe_symbols
from app.ml.predict import make_forecasts, publish_forecasts
from app.ml.train import train


def collect(universe: str, refresh_analysts: bool = False) -> None:
    symbols = universe_symbols(universe)
    data.download_prices(symbols)
    data.download_analyst_history(symbols, refresh=refresh_analysts)


def predict(universe: str, publish: bool = True) -> None:
    forecasts = make_forecasts(universe)
    if not publish:
        print(f"{len(forecasts)} forecasts written to ml_data/forecast_{universe}.json (not published)")
        return
    if publish_forecasts(universe, forecasts):
        print(f"published {len(forecasts)} forecasts to the database ({universe}_forecast)")
    else:
        print("DATABASE_NEON is not set - forecasts were only written to ml_data/forecast_*.json")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=["collect", "train", "predict", "run", "all"])
    parser.add_argument("--universe", default="sp500", choices=["sp500", "nasdaq", "russell2000", "nyse"])
    parser.add_argument("--refresh-analysts", action="store_true", help="re-download analyst history for every symbol")
    parser.add_argument("--no-publish", action="store_true", help="predict only writes the local JSON file")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S")
    started = time.time()
    if args.command in ("collect", "all"):
        collect(args.universe, args.refresh_analysts)
    if args.command in ("train", "run", "all"):
        train(args.universe)
    if args.command in ("predict", "run", "all"):
        predict(args.universe, publish=not args.no_publish)
    print(f"done in {time.time() - started:.0f}s")


if __name__ == "__main__":
    main()
