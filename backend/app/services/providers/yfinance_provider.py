import asyncio
import time
from datetime import datetime, timezone

import yfinance as yf

from app.core.config import settings
from app.schemas.market import HistoricalBar, Quote
from app.services.providers.base import MarketDataProvider

_REQUEST_TIMEOUT_SECONDS = 15

# Two independent throttle lanes. Background watchlist polling (~100
# symbols) would otherwise force an interactive request (a user opening a
# chart) to queue behind the entire poll cycle - up to ~2 minutes - since
# both shared one FIFO lock. Each lane keeps its own spacing so an
# interactive request only ever waits on its own lane.
_throttle_locks: dict[str, asyncio.Lock] = {"poll": asyncio.Lock(), "interactive": asyncio.Lock()}
_last_request_at: dict[str, float] = {"poll": 0.0, "interactive": 0.0}


async def _throttle(lane: str) -> None:
    """Serialize yfinance calls within a lane, with a minimum gap between
    them, so concurrent fan-out becomes a steady trickle rather than a burst.
    """
    async with _throttle_locks[lane]:
        wait = settings.yfinance_request_spacing_seconds - (time.monotonic() - _last_request_at[lane])
        if wait > 0:
            await asyncio.sleep(wait)
        _last_request_at[lane] = time.monotonic()


class YFinanceProvider(MarketDataProvider):
    """Free, no-key market data via the unofficial Yahoo Finance API.

    Quotes are near-real-time for individual stocks/ETFs (seconds to low
    minutes of lag) but indices themselves (^GSPC, ^IXIC, ^RUT) are delayed
    ~15-20 minutes by Yahoo regardless of client.
    """

    name = "yfinance"

    async def get_quote(self, symbol: str, lane: str = "interactive") -> Quote:
        await _throttle(lane)
        return await asyncio.wait_for(asyncio.to_thread(self._get_quote_sync, symbol), timeout=_REQUEST_TIMEOUT_SECONDS)

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
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d",
        resample: str | None = None,
        lane: str = "interactive",
    ) -> list[HistoricalBar]:
        await _throttle(lane)
        return await asyncio.wait_for(
            asyncio.to_thread(self._get_history_sync, symbol, period, interval, resample),
            timeout=_REQUEST_TIMEOUT_SECONDS,
        )

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
