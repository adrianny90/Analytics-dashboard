import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone

import pandas as pd

from app.core.memory import release_memory
from app.schemas.market import KitchinInstrument, KitchinPhaseScore, KitchinSnapshot, PeriodChange
from app.services import index_ranking_repo
from app.services.indicators.kitchin import (
    ALL_INSTRUMENTS,
    BOND_INSTRUMENTS,
    COMMODITY_INSTRUMENTS,
    STOCK_INSTRUMENTS,
    basket_signal,
    classify_phase,
)
from app.services.providers.yfinance_provider import YFinanceProvider

logger = logging.getLogger(__name__)

_KEY = "kitchin"
_HISTORY_PERIOD = "6mo"
# Macro series move far slower than the ranking universes - no need for an
# hourly refresh, and it keeps this well clear of Yahoo's rate limits.
_REFRESH_INTERVAL = timedelta(hours=4)
_SCHEDULER_TICK_SECONDS = 300


def _period_change(closes: pd.Series, back: int) -> PeriodChange | None:
    if len(closes) <= back:
        return None
    previous = closes.iloc[-1 - back]
    if not previous:
        return None
    last = closes.iloc[-1]
    change = last - previous
    return PeriodChange(change=round(change, 4), change_percent=round(change / previous * 100, 3))


class KitchinService:
    """Backs the Kitchin tab: a dozen bond/equity/commodity macro tickers,
    refreshed every few hours, classified against the 6-state intermarket
    rotation in app/services/indicators/kitchin.py."""

    def __init__(self) -> None:
        self._provider = YFinanceProvider()
        self._snapshot: KitchinSnapshot | None = None
        self._refreshing = False
        self._scheduler_task: asyncio.Task | None = None

    async def restore(self) -> None:
        try:
            saved = await index_ranking_repo.load_ranking(_KEY)
            if saved is not None and saved.entries:
                self._snapshot = KitchinSnapshot.model_validate(saved.entries[0])
        except Exception:
            logger.exception("failed loading saved kitchin snapshot")

    def get_snapshot(self) -> KitchinSnapshot | None:
        return self._snapshot

    def _is_fresh(self) -> bool:
        return (
            self._snapshot is not None
            and self._snapshot.updated_at is not None
            and datetime.now(timezone.utc) - self._snapshot.updated_at < _REFRESH_INTERVAL
        )

    async def get_or_refresh(self) -> KitchinSnapshot:
        if not self._is_fresh():
            await self.refresh()
        assert self._snapshot is not None
        return self._snapshot

    async def refresh(self) -> KitchinSnapshot:
        if self._refreshing:
            while self._refreshing:
                await asyncio.sleep(0.2)
            assert self._snapshot is not None
            return self._snapshot
        self._refreshing = True
        try:
            symbols = [symbol for _name, symbol, _category, _region, _weight, _is_yield in ALL_INSTRUMENTS]
            frames = await self._provider.get_history_frames(symbols, _HISTORY_PERIOD, "1d", lane="kitchin")
            closes_by_symbol = {symbol: frame["Close"].dropna() for symbol, frame in frames.items()}

            instruments = [
                KitchinInstrument(
                    name=name,
                    symbol=symbol,
                    category=category,
                    region=region,
                    price=round(float(closes.iloc[-1]), 4),
                    change_1d=_period_change(closes, 1),
                    change_1w=_period_change(closes, 5),
                    change_1m=_period_change(closes, 21),
                )
                for name, symbol, category, region, _weight, _is_yield in ALL_INSTRUMENTS
                if (closes := closes_by_symbol.get(symbol)) is not None and not closes.empty
            ]
            if not instruments:
                raise RuntimeError("no price data was returned by Yahoo Finance")

            bonds = basket_signal(closes_by_symbol, BOND_INSTRUMENTS)
            stocks = basket_signal(closes_by_symbol, STOCK_INSTRUMENTS)
            commodities = basket_signal(closes_by_symbol, COMMODITY_INSTRUMENTS)
            scores, dominant = classify_phase(bonds, stocks, commodities)

            snapshot = KitchinSnapshot(
                instruments=instruments,
                phases=[KitchinPhaseScore.model_validate(s) for s in scores],
                dominant_phase=dominant,
                updated_at=datetime.now(timezone.utc),
            )
            self._snapshot = snapshot
            await index_ranking_repo.save_ranking(_KEY, [snapshot.model_dump(mode="json")])
            return snapshot
        except Exception as exc:
            logger.exception("kitchin refresh failed")
            if self._snapshot is not None:
                self._snapshot = self._snapshot.model_copy(update={"error": str(exc) or type(exc).__name__})
                return self._snapshot
            raise
        finally:
            self._refreshing = False
            release_memory()

    def start_scheduler(self) -> None:
        if self._scheduler_task is None:
            self._scheduler_task = asyncio.create_task(self._scheduler_loop())

    async def stop_scheduler(self) -> None:
        if self._scheduler_task is not None and not self._scheduler_task.done():
            self._scheduler_task.cancel()
        self._scheduler_task = None

    async def _scheduler_loop(self) -> None:
        while True:
            await asyncio.sleep(_SCHEDULER_TICK_SECONDS)
            try:
                if not self._is_fresh():
                    await self.refresh()
            except Exception:
                logger.exception("kitchin scheduler tick failed")


kitchin_service = KitchinService()
