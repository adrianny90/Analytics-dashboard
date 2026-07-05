import asyncio
from datetime import datetime, timezone
from typing import Any

import yfinance as yf

from app.schemas.market import HistoricalBar, Quote
from app.services.providers.base import MarketDataProvider


def _pick(info: Any, *keys: str) -> float | int | None:
    """yfinance's fast_info renames keys across versions; try each candidate."""
    for key in keys:
        try:
            value = info[key]
        except (KeyError, TypeError):
            value = getattr(info, key, None)
        if value is not None:
            return value
    return None


class YFinanceProvider(MarketDataProvider):
    """Free, no-key market data via the unofficial Yahoo Finance API.

    Quotes are near-real-time for individual stocks/ETFs (seconds to low
    minutes of lag) but indices themselves (^GSPC, ^IXIC, ^RUT) are delayed
    ~15-20 minutes by Yahoo regardless of client.
    """

    name = "yfinance"

    async def get_quote(self, symbol: str) -> Quote:
        return await asyncio.to_thread(self._get_quote_sync, symbol)

    def _get_quote_sync(self, symbol: str) -> Quote:
        fast_info = yf.Ticker(symbol).fast_info
        price = _pick(fast_info, "last_price", "lastPrice")
        previous_close = _pick(fast_info, "previous_close", "previousClose", "regular_market_previous_close")
        change = price - previous_close if price is not None and previous_close else None
        change_percent = (change / previous_close * 100) if change is not None and previous_close else None

        return Quote(
            symbol=symbol,
            price=price,
            change=change,
            change_percent=change_percent,
            previous_close=previous_close,
            day_high=_pick(fast_info, "day_high", "dayHigh"),
            day_low=_pick(fast_info, "day_low", "dayLow"),
            volume=_pick(fast_info, "last_volume", "lastVolume"),
            timestamp=datetime.now(timezone.utc),
            source=self.name,
        )

    async def get_history(self, symbol: str, period: str = "1mo", interval: str = "1d") -> list[HistoricalBar]:
        return await asyncio.to_thread(self._get_history_sync, symbol, period, interval)

    def _get_history_sync(self, symbol: str, period: str, interval: str) -> list[HistoricalBar]:
        df = yf.Ticker(symbol).history(period=period, interval=interval)
        bars = []
        for index, row in df.iterrows():
            bars.append(
                HistoricalBar(
                    timestamp=index.to_pydatetime(),
                    open=row["Open"],
                    high=row["High"],
                    low=row["Low"],
                    close=row["Close"],
                    volume=int(row["Volume"]),
                )
            )
        return bars
