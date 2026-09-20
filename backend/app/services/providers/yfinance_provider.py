import asyncio
import logging
import time
from datetime import datetime, timezone

import pandas as pd
import yfinance as yf

from app.core.config import settings
from app.schemas.market import HistoricalBar, Quote
from app.services.providers.base import MarketDataProvider

# yfinance logs its own "$SYMBOL: possibly delisted; no price data found"
# and "N Failed downloads" summaries straight to the 'yfinance' logger at
# ERROR level on every batch call that includes an unavailable symbol -
# which, with a handful of permanently delisted watchlist tickers, fires on
# every single poll/trend cycle forever. We already surface and handle
# those failures ourselves (see MarketService's unavailable-symbol
# backoff), so this is pure duplicate noise - silence it here rather than
# suppressing our own logger, which would hide real problems too.
logging.getLogger("yfinance").setLevel(logging.CRITICAL)

_REQUEST_TIMEOUT_SECONDS = 15
_BATCH_REQUEST_TIMEOUT_SECONDS = 45
# History batches carry far more data per symbol than a quote batch
# (H1 alone is ~1700 hourly bars/symbol), so they get more room.
_HISTORY_BATCH_REQUEST_TIMEOUT_SECONDS = 90

# Three independent throttle lanes. Background watchlist polling (~100
# symbols) would otherwise force an interactive request (a user opening a
# chart) to queue behind the entire poll cycle - up to ~2 minutes - since
# both shared one FIFO lock. Each lane keeps its own spacing so an
# interactive request only ever waits on its own lane. "trend" is its own
# lane too: the background per-symbol/per-timeframe trend assessment pass
# pulls several times more history than quote polling and must never make
# either quotes or an interactive chart load wait behind it.
_throttle_locks: dict[str, asyncio.Lock] = {
    "poll": asyncio.Lock(),
    "interactive": asyncio.Lock(),
    "trend": asyncio.Lock(),
    # Shared by every index-ranking universe (sp500/nasdaq/russell2000) -
    # deliberately one lane, not one per universe, so starting multiple
    # scans at once still serializes onto a single steady trickle instead
    # of multiplying the combined request rate against Yahoo.
    "ranking": asyncio.Lock(),
    # The Kitchin tab: a dozen macro tickers refreshed every few hours - its
    # own lane so it never queues behind (or slows down) a running ranking
    # scan, and vice versa.
    "kitchin": asyncio.Lock(),
}
_last_request_at: dict[str, float] = {
    "poll": 0.0,
    "interactive": 0.0,
    "trend": 0.0,
    "ranking": 0.0,
    "kitchin": 0.0,
}


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
        # to derive the last price. A small daily-bar window is far cheaper
        # and still reflects the live, in-progress session bar during market
        # hours. "1mo" rather than "5d": some exchanges (e.g. Warsaw, WIG20)
        # have such sparse Yahoo coverage that most days in a 5-day window
        # come back NaN, occasionally leaving zero usable rows and wrongly
        # marking the symbol "unavailable" - a wider window costs nothing
        # extra worth mentioning (still a handful of rows per symbol) but
        # makes finding at least one real close far more reliable.
        df = yf.Ticker(symbol).history(period="1mo", interval="1d")
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

    async def get_quotes_batch(self, symbols: list[str], lane: str = "poll") -> dict[str, Quote]:
        """Fetch many quotes in one yfinance call instead of one request per
        symbol - a single multi-ticker download parallelizes over yfinance's
        own thread pool, instead of the caller serially spacing out one
        request every `yfinance_request_spacing_seconds`. For ~100 watchlist
        symbols that's the difference between a ~2 minute first pass and a
        few seconds.

        Missing/failed symbols are simply absent from the returned dict -
        same "fill in progressively" contract as the single-quote path.
        """
        if not symbols:
            return {}
        if len(symbols) == 1:
            # Not worth a batch call, and yf.download's grouped-column shape
            # for a single ticker doesn't match the multi-ticker case.
            try:
                return {symbols[0]: await self.get_quote(symbols[0], lane=lane)}
            except Exception:
                return {}

        await _throttle(lane)
        return await asyncio.wait_for(
            asyncio.to_thread(self._get_quotes_batch_sync, symbols),
            timeout=_BATCH_REQUEST_TIMEOUT_SECONDS,
        )

    def _get_quotes_batch_sync(self, symbols: list[str]) -> dict[str, Quote]:
        # "1mo" rather than "5d" - see _get_quote_sync for why: sparse-coverage
        # exchanges (e.g. Warsaw/WIG20) can have every day in a narrow window
        # come back NaN, which looks identical to "no data" and wrongly trips
        # the unavailable-backoff.
        df = yf.download(
            tickers=symbols,
            period="1mo",
            interval="1d",
            group_by="ticker",
            threads=True,
            progress=False,
            auto_adjust=False,
        )
        now = datetime.now(timezone.utc)
        quotes: dict[str, Quote] = {}
        for symbol in symbols:
            try:
                if symbol not in df.columns.get_level_values(0):
                    continue
                sub = df[symbol].dropna(subset=["Close"])
                if sub.empty:
                    continue
                last = sub.iloc[-1]
                previous_close = float(sub.iloc[-2]["Close"]) if len(sub) > 1 else None
                price = float(last["Close"])
                change = price - previous_close if previous_close else None
                change_percent = (change / previous_close * 100) if change is not None and previous_close else None
                quotes[symbol] = Quote(
                    symbol=symbol,
                    price=price,
                    change=change,
                    change_percent=change_percent,
                    previous_close=previous_close,
                    day_high=float(last["High"]),
                    day_low=float(last["Low"]),
                    volume=int(last["Volume"]),
                    timestamp=now,
                    source=self.name,
                )
            except Exception:
                continue
        return quotes

    async def get_analyst_targets(self, symbol: str, lane: str = "ranking") -> dict[str, float | None] | None:
        """Analysts' price target low/median/high (next ~12 months), or None
        when Yahoo has no coverage for the symbol. Rate-limit errors
        propagate so the caller can back off."""
        await _throttle(lane)
        return await asyncio.wait_for(
            asyncio.to_thread(self._get_analyst_targets_sync, symbol), timeout=_REQUEST_TIMEOUT_SECONDS
        )

    @staticmethod
    def _get_analyst_targets_sync(symbol: str) -> dict[str, float | None] | None:
        targets = yf.Ticker(symbol).analyst_price_targets
        if not targets:
            return None
        result = {key: targets.get(key) for key in ("low", "median", "high")}
        if all(value is None for value in result.values()):
            return None
        return {key: float(value) if value is not None else None for key, value in result.items()}

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
        return self._frame_to_bars(df, resample)

    async def get_history_batch(
        self,
        symbols: list[str],
        period: str,
        interval: str,
        resample: str | None = None,
        lane: str = "trend",
    ) -> dict[str, list[HistoricalBar]]:
        """Batched counterpart to get_history - one multi-ticker download
        instead of one throttled request per symbol. This is what makes the
        W1/D1/H4/H1 trend columns (4 timeframes x every watchlist symbol)
        viable to recompute often instead of taking minutes per pass."""
        if not symbols:
            return {}
        if len(symbols) == 1:
            try:
                return {symbols[0]: await self.get_history(symbols[0], period, interval, resample, lane=lane)}
            except Exception:
                return {}

        await _throttle(lane)
        return await asyncio.wait_for(
            asyncio.to_thread(self._get_history_batch_sync, symbols, period, interval, resample),
            timeout=_HISTORY_BATCH_REQUEST_TIMEOUT_SECONDS,
        )

    async def get_history_frames(
        self, symbols: list[str], period: str, interval: str, lane: str = "trend"
    ) -> dict[str, "pd.DataFrame"]:
        """One multi-ticker download, returned as raw per-symbol DataFrames.
        Deliberately not converted to HistoricalBar lists here: a batch of
        hourly history is tens of thousands of pydantic objects, and turning
        it all into objects at once is what drove memory up. Callers convert
        one symbol at a time with series_from_frame()."""
        if not symbols:
            return {}
        await _throttle(lane)
        return await asyncio.wait_for(
            asyncio.to_thread(self._get_history_frames_sync, symbols, period, interval),
            timeout=_HISTORY_BATCH_REQUEST_TIMEOUT_SECONDS,
        )

    @staticmethod
    def _get_history_frames_sync(symbols: list[str], period: str, interval: str) -> dict[str, "pd.DataFrame"]:
        if len(symbols) == 1:
            # A one-ticker download has flat columns, unlike the multi-ticker
            # (symbol, field) layout, so use the per-ticker call instead.
            frame = yf.Ticker(symbols[0]).history(period=period, interval=interval)
            return {symbols[0]: frame} if len(frame) else {}
        df = yf.download(
            tickers=symbols,
            period=period,
            interval=interval,
            group_by="ticker",
            threads=True,
            progress=False,
            auto_adjust=False,
        )
        top = set(df.columns.get_level_values(0))
        frames = {symbol: df[symbol].dropna(subset=["Close"]) for symbol in symbols if symbol in top}
        return {symbol: frame for symbol, frame in frames.items() if len(frame)}

    @classmethod
    def series_from_frame(cls, frame: "pd.DataFrame", resamples: list[str | None]) -> list[list[HistoricalBar]]:
        """Bar series for one symbol - one per entry in `resamples` (None = as
        downloaded), so H1 and H4 (= H1 resampled to 4h) share one download."""
        return [cls._frame_to_bars(frame, resample) for resample in resamples]

    def _get_history_batch_sync(
        self, symbols: list[str], period: str, interval: str, resample: str | None
    ) -> dict[str, list[HistoricalBar]]:
        df = yf.download(
            tickers=symbols,
            period=period,
            interval=interval,
            group_by="ticker",
            threads=True,
            progress=False,
            auto_adjust=False,
        )
        result: dict[str, list[HistoricalBar]] = {}
        for symbol in symbols:
            try:
                if symbol not in df.columns.get_level_values(0):
                    continue
                bars = self._frame_to_bars(df[symbol], resample)
                if bars:
                    result[symbol] = bars
            except Exception:
                continue
        return result

    @staticmethod
    def _frame_to_bars(df, resample: str | None) -> list[HistoricalBar]:
        df = df.dropna(subset=["Close"])
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
