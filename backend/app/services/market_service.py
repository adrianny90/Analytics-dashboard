import asyncio
import logging
import time
from datetime import datetime, timezone

from yfinance.exceptions import YFRateLimitError

from app.core.config import settings
from app.core.symbols import SYMBOL_SECTORS, WATCHLIST_SYMBOLS, resolve_symbol
from app.schemas.market import HistoricalBar, IndexSummary, Quote, SymbolTrend, Timeframe
from app.services.indicators.assessment import compute_assessment
from app.services.indicators.ichimoku import compute_ichimoku
from app.services.providers.finnhub_provider import FinnhubQuoteFallback, FinnhubStreamClient
from app.services.providers.yfinance_provider import YFinanceProvider
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)

# Free real-time feeds don't cover the raw indices themselves, so each index
# is tracked through a highly liquid ETF that shadows it almost tick-for-tick.
INDEX_DEFINITIONS = [
    {"name": "S&P 500", "index_symbol": "^GSPC", "proxy_symbol": "SPY"},
    {"name": "Nasdaq Composite", "index_symbol": "^IXIC", "proxy_symbol": "QQQ"},
    {"name": "Russell 2000", "index_symbol": "^RUT", "proxy_symbol": "IWM"},
]

# Yahoo has no native 4-hour interval, so H4 is synthesized by resampling
# hourly bars.
#
# Each period is sized to comfortably clear a 200-period SMA's warm-up (the
# longest lookback any indicator on this chart needs) with room to spare, so
# the SMA/Ichimoku lines are fully drawn across most of the visible chart
# instead of only picking up partway through. "1h" tops out around 2y of
# history on Yahoo's end, well above what H1/H4 ask for here.
TIMEFRAME_CONFIG: dict[Timeframe, dict] = {
    Timeframe.MONTH: {"interval": "1mo", "period": "max"},
    Timeframe.WEEK: {"interval": "1wk", "period": "10y"},
    Timeframe.DAY: {"interval": "1d", "period": "5y"},
    Timeframe.H1: {"interval": "1h", "period": "12mo"},
    Timeframe.H4: {"interval": "1h", "period": "12mo", "resample": "4h"},
}

# The watchlist trend columns (W1/D1/H4/H1) - deliberately excludes MONTH,
# which isn't shown there.
TREND_TIMEFRAMES: list[Timeframe] = [Timeframe.WEEK, Timeframe.DAY, Timeframe.H4, Timeframe.H1]


def _is_plain_equity(resolved_symbol: str) -> bool:
    """True for ordinary US tickers (not index symbols like ^GSPC or
    foreign-exchange-suffixed ones like 000001.SS) - the only kind the
    Finnhub REST fallback can answer."""
    return not resolved_symbol.startswith("^") and "." not in resolved_symbol


class MarketService:
    def __init__(self) -> None:
        self._provider = YFinanceProvider()
        self._finnhub_fallback = FinnhubQuoteFallback()
        self._cache: dict[str, Quote] = {}
        self._history_cache: dict[tuple[str, str], tuple[list[HistoricalBar], float]] = {}
        # symbol -> {timeframe.value: "bullish" | "bearish" | "neutral"},
        # filled in progressively by _trend_poll_loop.
        self._trend_cache: dict[str, dict[str, str]] = {}
        self._watchlist: set[str] = {d["proxy_symbol"] for d in INDEX_DEFINITIONS} | set(WATCHLIST_SYMBOLS)
        # User-added tickers (persisted in Postgres, layered on top of the
        # static curated watchlist above). Tracked separately so they're
        # both polled and surfaced by get_cached_watchlist_quotes.
        self._custom_watchlist: set[str] = set()
        self._poll_task: asyncio.Task | None = None
        self._trend_poll_task: asyncio.Task | None = None
        self._rate_limited_until: float = 0.0
        self._stream = FinnhubStreamClient(
            symbols=[d["proxy_symbol"] for d in INDEX_DEFINITIONS],
            on_trade=self._handle_trade,
        )

    async def start(self) -> None:
        self._poll_task = asyncio.create_task(self._poll_loop())
        self._trend_poll_task = asyncio.create_task(self._trend_poll_loop())
        self._stream.start()

    async def stop(self) -> None:
        if self._poll_task:
            self._poll_task.cancel()
        if self._trend_poll_task:
            self._trend_poll_task.cancel()
        await self._stream.stop()

    def track_symbol(self, symbol: str) -> None:
        self._watchlist.add(symbol.upper())

    def track_custom_watchlist_symbol(self, symbol: str) -> None:
        """Register a user-added ticker: polled like any other watchlist
        symbol and included in get_cached_watchlist_quotes."""
        symbol = symbol.upper()
        self._watchlist.add(symbol)
        self._custom_watchlist.add(symbol)

    async def get_quote(self, symbol: str) -> Quote:
        display_symbol = symbol.upper()
        if display_symbol in self._cache:
            return self._cache[display_symbol]
        return await self._fetch_quote(display_symbol)

    def get_cached_watchlist_quotes(self) -> list[Quote]:
        """Non-blocking: only what's already in cache. The background poll
        loop (and websocket pushes) fill the rest in progressively, so the
        dashboard never has to wait on a slow/rate-limited fetch chain."""
        symbols = (*WATCHLIST_SYMBOLS, *self._custom_watchlist)
        return [self._cache[symbol] for symbol in symbols if symbol in self._cache]

    async def get_history(self, symbol: str, period: str, interval: str) -> list[HistoricalBar]:
        resolved_symbol = resolve_symbol(symbol)
        cache_key = (resolved_symbol, f"{period}:{interval}")
        return await self._get_bars(resolved_symbol, cache_key, period, interval, None)

    async def get_candles(self, symbol: str, timeframe: Timeframe, lane: str = "interactive") -> list[HistoricalBar]:
        config = TIMEFRAME_CONFIG[timeframe]
        resolved_symbol = resolve_symbol(symbol)
        cache_key = (resolved_symbol, timeframe.value)
        return await self._get_bars(
            resolved_symbol, cache_key, config["period"], config["interval"], config.get("resample"), lane=lane
        )

    async def get_indices(self) -> list[IndexSummary]:
        summaries = []
        for definition in INDEX_DEFINITIONS:
            quote = await self.get_quote(definition["proxy_symbol"])
            summaries.append(IndexSummary(**definition, quote=quote))
        return summaries

    def get_cached_watchlist_trends(self) -> list[SymbolTrend]:
        """Non-blocking: whatever the background trend poll loop has
        computed so far - fills in progressively, same idea as
        get_cached_watchlist_quotes."""
        symbols = (*WATCHLIST_SYMBOLS, *self._custom_watchlist)
        return [
            SymbolTrend(symbol=symbol, **{tf.value: self._trend_cache.get(symbol, {}).get(tf.value) for tf in TREND_TIMEFRAMES})
            for symbol in symbols
        ]

    async def _get_bars(
        self,
        resolved_symbol: str,
        cache_key: tuple[str, str],
        period: str,
        interval: str,
        resample: str | None,
        lane: str = "interactive",
    ) -> list[HistoricalBar]:
        cached = self._history_cache.get(cache_key)
        if cached and time.monotonic() - cached[1] < settings.history_cache_ttl_seconds:
            return cached[0]

        if time.monotonic() < self._rate_limited_until:
            if cached:
                return cached[0]
            raise YFRateLimitError()

        try:
            bars = await self._provider.get_history(resolved_symbol, period, interval, resample, lane=lane)
        except Exception as exc:
            if isinstance(exc, YFRateLimitError):
                self._trip_breaker()
            if cached:
                logger.warning("serving stale cached history for %s after fetch failure: %s", resolved_symbol, exc)
                return cached[0]
            raise

        self._history_cache[cache_key] = (bars, time.monotonic())
        return bars

    async def _fetch_quote(self, display_symbol: str, lane: str = "interactive") -> Quote:
        resolved_symbol = resolve_symbol(display_symbol)
        stale = False
        if time.monotonic() < self._rate_limited_until:
            # Already know Yahoo is blocking us this cooldown window - go
            # straight to the fallback instead of re-triggering it.
            quote = await self._fallback_quote(resolved_symbol, YFRateLimitError())
            stale = True
        else:
            try:
                quote = await self._provider.get_quote(resolved_symbol, lane=lane)
            except Exception as exc:
                if isinstance(exc, YFRateLimitError):
                    self._trip_breaker()
                quote = await self._fallback_quote(resolved_symbol, exc)
                stale = True

        quote = quote.model_copy(
            update={"symbol": display_symbol, "sector": SYMBOL_SECTORS.get(display_symbol), "stale": stale}
        )
        self._cache[display_symbol] = quote
        return quote

    async def _fallback_quote(self, resolved_symbol: str, original_exc: Exception) -> Quote:
        if _is_plain_equity(resolved_symbol) and settings.finnhub_api_key:
            try:
                return await self._finnhub_fallback.get_quote(resolved_symbol)
            except Exception:
                pass
        raise original_exc

    async def _handle_trade(self, trade: dict) -> None:
        symbol = trade["s"]
        previous = self._cache.get(symbol)
        price = trade["p"]
        previous_close = previous.previous_close if previous else None
        change = price - previous_close if previous_close else None
        change_percent = (change / previous_close * 100) if change is not None and previous_close else None

        updated = Quote(
            symbol=symbol,
            price=price,
            change=change,
            change_percent=change_percent,
            previous_close=previous_close,
            day_high=max(price, previous.day_high) if previous and previous.day_high else price,
            day_low=min(price, previous.day_low) if previous and previous.day_low else price,
            volume=previous.volume if previous else None,
            timestamp=datetime.fromtimestamp(trade["t"] / 1000, tz=timezone.utc),
            source="finnhub",
            sector=SYMBOL_SECTORS.get(symbol, "Index"),
        )
        self._cache[symbol] = updated
        await ws_manager.broadcast({"type": "quote", "data": updated.model_dump(mode="json")})

    async def _refresh_symbol(self, display_symbol: str) -> None:
        try:
            quote = await self._fetch_quote(display_symbol, lane="poll")
            await ws_manager.broadcast({"type": "quote", "data": quote.model_dump(mode="json")})
        except YFRateLimitError:
            pass  # already logged and breaker tripped inside _fetch_quote
        except Exception:
            logger.exception("failed refreshing %s", display_symbol)

    async def _poll_loop(self) -> None:
        while True:
            if time.monotonic() < self._rate_limited_until:
                await asyncio.sleep(settings.poll_interval_seconds)
                continue
            await asyncio.gather(
                *(self._refresh_symbol(symbol) for symbol in list(self._watchlist)),
                return_exceptions=True,
            )
            await asyncio.sleep(settings.poll_interval_seconds)

    async def _refresh_trend(self, symbol: str, timeframe: Timeframe) -> None:
        try:
            bars = await self.get_candles(symbol, timeframe, lane="trend")
            if not bars:
                return
            points = compute_ichimoku(bars)
            assessment = compute_assessment(bars, points)
            self._trend_cache.setdefault(symbol, {})[timeframe.value] = assessment.outlook
        except YFRateLimitError:
            pass  # already logged and breaker tripped inside _get_bars
        except Exception:
            logger.exception("failed refreshing trend for %s/%s", symbol, timeframe.value)

    async def _trend_poll_loop(self) -> None:
        """Same progressive-fill idea as _poll_loop, but far slower: a full
        pass is 4 timeframes x every watchlist symbol, each pulling much
        more history than a quote, all serialized on their own throttle
        lane so this never delays quotes or an interactive chart load."""
        while True:
            if time.monotonic() < self._rate_limited_until:
                await asyncio.sleep(settings.trend_poll_interval_seconds)
                continue
            symbols = (*WATCHLIST_SYMBOLS, *self._custom_watchlist)
            await asyncio.gather(
                *(self._refresh_trend(symbol, tf) for symbol in symbols for tf in TREND_TIMEFRAMES),
                return_exceptions=True,
            )
            await asyncio.sleep(settings.trend_poll_interval_seconds)

    def _trip_breaker(self) -> None:
        self._rate_limited_until = time.monotonic() + settings.rate_limit_cooldown_seconds
        logger.warning(
            "Yahoo Finance rate limit hit; pausing all yfinance calls for %ss", settings.rate_limit_cooldown_seconds
        )


market_service = MarketService()
