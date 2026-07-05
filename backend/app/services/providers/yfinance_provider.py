import asyncio
import time
from datetime import datetime, timezone

import yfinance as yf

from app.core.config import settings
from app.schemas.market import HistoricalBar, Quote
from app.services.providers.base import MarketDataProvider

_throttle_lock = asyncio.Lock()
_last_request_at = 0.0


async def _throttle() -> None:
    """Serialize all yfinance calls with a minimum gap between them.

    Yahoo's unofficial API rate-limits bursts hard (YFRateLimitError). This
    turns concurrent asyncio.gather() fan-out into a steady, spaced-out
    trickle of requests regardless of how many callers fire at once.
    """
    global _last_request_at
    async with _throttle_lock:
        wait = settings.yfinance_request_spacing_seconds - (time.monotonic() - _last_request_at)
        if wait > 0:
            await asyncio.sleep(wait)
        _last_request_at = time.monotonic()


class YFinanceProvider(MarketDataProvider):
    """Free, no-key market data via the unofficial Yahoo Finance API.

    Quotes are near-real-time for individual stocks/ETFs (seconds to low
    minutes of lag) but indices themselves (^GSPC, ^IXIC, ^RUT) are delayed
    ~15-20 minutes by Yahoo regardless of client.
    """

    name = "yfinance"

    async def get_quote(self, symbol: str) -> Quote:
        await _throttle()
        return await asyncio.to_thread(self._get_quote_sync, symbol)

    def _get_quote_sync(self, symbol: str) -> Quote:
        # Deliberately avoid Ticker.fast_info: on current Yahoo restrictions
        # it can silently fall back to pulling a full year of history just
        # to derive the last price. A tiny daily-bar window is far cheaper
        # and still reflects the live, in-progress session bar during market
        # hours.
        df = yf.Ticker(symbol).history(period="5d", interval="1d")
        if df.empty:
            raise ValueError(f"no price data returned for {symbol}")

        last = df.iloc[-1]
        previous_close = float(df.iloc[-2]["Close"]) if len(df) > 1 else None
        price = float(last["Close"])
        change = price - previous_close if previous_close else None
        change_percent = (change / previous_close * 100) if change is not None and previous_close else None

        return Quote(
            symbol=symbol,
            price=price,
            change=change,
            change_percent=change_percent,
            previous_close=previous_close,
            day_high=float(last["High"]),
            day_low=float(last["Low"]),
            volume=int(last["Volume"]),
            timestamp=datetime.now(timezone.utc),
            source=self.name,
        )

    async def get_history(
        self, symbol: str, period: str = "1mo", interval: str = "1d", resample: str | None = None
    ) -> list[HistoricalBar]:
        await _throttle()
        return await asyncio.to_thread(self._get_history_sync, symbol, period, interval, resample)

    def _get_history_sync(
        self, symbol: str, period: str, interval: str, resample: str | None = None
    ) -> list[HistoricalBar]:
        df = yf.Ticker(symbol).history(period=period, interval=interval)
        if resample:
            df = df.resample(resample).agg(
                {"Open": "first", "High": "max", "Low": "min", "Close": "last", "Volume": "sum"}
            )
            df = df.dropna(subset=["Open"])
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
