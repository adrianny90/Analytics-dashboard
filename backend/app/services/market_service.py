import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Iterable

from yfinance.exceptions import YFRateLimitError

from app.core.config import settings
from app.core.symbols import SYMBOL_SECTORS, WATCHLIST_SYMBOLS, resolve_symbol
from app.schemas.market import HistoricalBar, IndexSummary, Quote, SymbolTrend, Timeframe
from app.services.indicators.assessment import compute_assessment
from app.services.indicators.ichimoku import compute_ichimoku
from app.services.providers.finnhub_provider import FinnhubQuoteFallback, FinnhubStreamClient
from app.services.providers.yfinance_provider import YFinanceProvider
from app.services import snapshot_repo
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

# Symbols per yfinance batch download in the poll loop. Large enough to get
# most of the win from batching (a handful of requests instead of ~100),
# small enough that one bad/slow batch doesn't hold up everything behind it.
POLL_BATCH_SIZE = 25

# How long to stop asking Yahoo about a symbol once a batch call comes back
# without it (delisted, renamed, or otherwise unavailable) - long enough to
# stop hammering a permanently-dead ticker every cycle, short enough to
# recover on its own if the failure turns out to have been transient.
UNAVAILABLE_BACKOFF_SECONDS = 1800


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
        # resolved_symbol -> monotonic timestamp until which we stop asking
        # Yahoo about it. Set when a batch call comes back without that
        # symbol (e.g. delisted) - without this, a permanently-dead ticker
        # gets silently re-requested (and re-fails) every single poll/trend
        # cycle forever. Kept short enough to self-heal if the failure was
        # actually transient rather than a real delisting.
        self._unavailable_until: dict[str, float] = {}
        self._poll_task: asyncio.Task | None = None
        self._trend_poll_task: asyncio.Task | None = None
        self._snapshot_task: asyncio.Task | None = None
        self._rate_limited_until: float = 0.0
        self._stream = FinnhubStreamClient(
            symbols=[d["proxy_symbol"] for d in INDEX_DEFINITIONS],
            on_trade=self._handle_trade,
        )

    async def start(self) -> None:
        await self._restore_snapshot()
        self._poll_task = asyncio.create_task(self._poll_loop())
        self._trend_poll_task = asyncio.create_task(self._trend_poll_loop())
        self._snapshot_task = asyncio.create_task(self._snapshot_save_loop())
        self._stream.start()

    async def stop(self) -> None:
        if self._poll_task:
            self._poll_task.cancel()
        if self._trend_poll_task:
            self._trend_poll_task.cancel()
        if self._snapshot_task:
            self._snapshot_task.cancel()
        await self._save_snapshot()
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

    def _is_history_fresh(self, cache_key: tuple[str, str]) -> bool:
        cached = self._history_cache.get(cache_key)
        return bool(cached and time.monotonic() - cached[1] < settings.history_cache_ttl_seconds)

    async def _get_bars(
        self,
        resolved_symbol: str,
        cache_key: tuple[str, str],
        period: str,
        interval: str,
        resample: str | None,
        lane: str = "interactive",
    ) -> list[HistoricalBar]:
        if self._is_history_fresh(cache_key):
            return self._history_cache[cache_key][0]
        cached = self._history_cache.get(cache_key)

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

    def _prioritize(self, symbols: Iterable[str]) -> list[str]:
        """Index and Custom are the first two sections of the dashboard
        watchlist (see Watchlist.tsx's sector ordering) - refreshing them
        first means what's visible above the fold fills in before the long
        alphabetical tail of equity sectors. Used by both the quote and
        trend poll loops."""

        def rank(symbol: str) -> int:
            if SYMBOL_SECTORS.get(symbol) == "Index":
                return 0
            if symbol in self._custom_watchlist:
                return 1
            return 2

        return sorted(symbols, key=rank)

    def _available(self, resolved_symbols: list[str]) -> list[str]:
        """Filters out symbols currently in unavailable-backoff (see
        UNAVAILABLE_BACKOFF_SECONDS)."""
        now = time.monotonic()
        return [s for s in resolved_symbols if self._unavailable_until.get(s, 0.0) <= now]

    def _mark_unavailable(self, resolved_symbols: set[str]) -> None:
        if not resolved_symbols:
            return
        until = time.monotonic() + UNAVAILABLE_BACKOFF_SECONDS
        for symbol in resolved_symbols:
            self._unavailable_until[symbol] = until

    async def _refresh_batch(self, display_symbols: list[str]) -> None:
        resolved_by_display = {symbol: resolve_symbol(symbol) for symbol in display_symbols}
        resolved_symbols = self._available(list(resolved_by_display.values()))
        if not resolved_symbols:
            return
        try:
            quotes_by_resolved = await self._provider.get_quotes_batch(resolved_symbols, lane="poll")
        except YFRateLimitError:
            self._trip_breaker()
            return
        except Exception:
            logger.exception("failed refreshing quote batch of %d symbols", len(display_symbols))
            return

        if not quotes_by_resolved:
            # A batched download can swallow a Yahoo rate-limit as silently
            # empty data instead of raising (unlike the single-quote path),
            # so treat "asked for some, got none back" the same as an
            # explicit rate limit - otherwise the breaker never engages and
            # this just hammers Yahoo again next cycle.
            self._trip_breaker()
            return

        requested = set(resolved_symbols)
        self._mark_unavailable(requested - set(quotes_by_resolved))

        for display_symbol, resolved_symbol in resolved_by_display.items():
            if resolved_symbol not in requested:
                continue  # skipped this round (unavailable-backoff)
            quote = quotes_by_resolved.get(resolved_symbol)
            if quote is None:
                continue
            quote = quote.model_copy(
                update={"symbol": display_symbol, "sector": SYMBOL_SECTORS.get(display_symbol), "stale": False}
            )
            self._cache[display_symbol] = quote
            await ws_manager.broadcast({"type": "quote", "data": quote.model_dump(mode="json")})

    async def _wait_out_rate_limit(self) -> None:
        """Block until any active rate-limit cooldown has cleared, checking
        every few seconds rather than sleeping for a whole poll interval.

        Previously, a breaker trip mid-pass (e.g. partway through the H4
        chunks of a trend pass) meant the loop abandoned the rest of that
        pass - the trend poll loop's inner chunk loop would break out of
        H4, then immediately break out of H1 too since the breaker was
        still active, leaving H4/H1 unfilled until an entire new pass
        started over from W1. Waiting out the cooldown inline instead lets
        a pass resume exactly where it stopped, the moment Yahoo is
        available again, instead of abandoning it.
        """
        while True:
            remaining = self._rate_limited_until - time.monotonic()
            if remaining <= 0:
                return
            await asyncio.sleep(min(remaining, 5))

    async def _poll_loop(self) -> None:
        while True:
            await self._wait_out_rate_limit()
            symbols = self._prioritize(self._watchlist)
            for i in range(0, len(symbols), POLL_BATCH_SIZE):
                await self._wait_out_rate_limit()
                await self._refresh_batch(symbols[i : i + POLL_BATCH_SIZE])
            await asyncio.sleep(settings.poll_interval_seconds)

    async def _refresh_trend_batch(self, display_symbols: list[str], timeframe: Timeframe) -> None:
        config = TIMEFRAME_CONFIG[timeframe]
        period, interval, resample = config["period"], config["interval"], config.get("resample")

        resolved_by_display = {symbol: resolve_symbol(symbol) for symbol in display_symbols}
        cache_key_by_display = {
            symbol: (resolved, timeframe.value) for symbol, resolved in resolved_by_display.items()
        }
        needs_refresh = [
            resolved
            for symbol, resolved in resolved_by_display.items()
            if not self._is_history_fresh(cache_key_by_display[symbol])
        ]
        to_fetch = self._available(needs_refresh)

        if to_fetch:
            try:
                bars_by_resolved = await self._provider.get_history_batch(
                    to_fetch, period, interval, resample, lane="trend"
                )
            except YFRateLimitError:
                self._trip_breaker()
                bars_by_resolved = {}
            except Exception:
                logger.exception(
                    "failed refreshing trend history batch of %d symbols (%s)", len(to_fetch), timeframe.value
                )
                bars_by_resolved = {}

            if not bars_by_resolved:
                # Same silent-rate-limit guard as the quote batch path - a
                # batched download can swallow a Yahoo block as empty data
                # instead of raising.
                self._trip_breaker()
            else:
                self._mark_unavailable(set(to_fetch) - set(bars_by_resolved))
                now = time.monotonic()
                for resolved_symbol, bars in bars_by_resolved.items():
                    self._history_cache[(resolved_symbol, timeframe.value)] = (bars, now)

        for display_symbol in display_symbols:
            cached = self._history_cache.get(cache_key_by_display[display_symbol])
            if not cached or not cached[0]:
                continue
            try:
                points = compute_ichimoku(cached[0])
                assessment = compute_assessment(cached[0], points)
                self._trend_cache.setdefault(display_symbol, {})[timeframe.value] = assessment.outlook
            except Exception:
                logger.exception("failed computing trend for %s/%s", display_symbol, timeframe.value)

    async def _trend_poll_loop(self) -> None:
        """Same progressive-fill idea as _poll_loop: a full pass is still 4
        timeframes x every watchlist symbol, each pulling much more history
        than a quote, but batched (like quotes) instead of one throttled
        request per symbol/timeframe, and prioritized the same way (Index,
        then Custom, then the rest) so the sections shown first in the
        dashboard fill in first. Runs on its own throttle lane so this
        never delays quotes or an interactive chart load."""
        while True:
            await self._wait_out_rate_limit()
            symbols = self._prioritize((*WATCHLIST_SYMBOLS, *self._custom_watchlist))
            for tf in TREND_TIMEFRAMES:
                for i in range(0, len(symbols), POLL_BATCH_SIZE):
                    await self._wait_out_rate_limit()
                    await self._refresh_trend_batch(symbols[i : i + POLL_BATCH_SIZE], tf)
            await asyncio.sleep(settings.trend_poll_interval_seconds)

    async def _restore_snapshot(self) -> None:
        """Repopulates the quote/trend caches from the last snapshot saved
        to Postgres (if any), so a restart shows last-known prices right
        away instead of a blank dashboard while the poll loops catch back
        up. Restored quotes are marked stale - the same flag/UI badge
        already used for fallback-sourced quotes - since they predate this
        process and haven't been refreshed yet. Never raises: a missing/
        unreachable snapshot just means starting from empty, same as
        before this existed."""
        try:
            snapshot = await snapshot_repo.load_snapshot()
        except Exception:
            logger.exception("failed loading market snapshot; starting from empty cache")
            return
        if snapshot is None:
            return

        restored_quotes = 0
        for symbol, payload in snapshot.quotes.items():
            try:
                self._cache[symbol] = Quote.model_validate({**payload, "stale": True})
                restored_quotes += 1
            except Exception:
                logger.exception("failed restoring cached quote for %s from snapshot", symbol)

        restored_trends = 0
        for symbol, outlooks in snapshot.trends.items():
            if isinstance(outlooks, dict):
                self._trend_cache[symbol] = outlooks
                restored_trends += 1

        logger.info(
            "restored %d quotes and %d trend entries from snapshot saved %s",
            restored_quotes,
            restored_trends,
            snapshot.updated_at,
        )

    async def _save_snapshot(self) -> None:
        quotes = {symbol: quote.model_dump(mode="json") for symbol, quote in self._cache.items()}
        try:
            await snapshot_repo.save_snapshot(quotes, self._trend_cache)
        except Exception:
            logger.exception("failed saving market snapshot")

    async def _snapshot_save_loop(self) -> None:
        while True:
            await asyncio.sleep(settings.snapshot_save_interval_seconds)
            await self._save_snapshot()

    def _trip_breaker(self) -> None:
        self._rate_limited_until = time.monotonic() + settings.rate_limit_cooldown_seconds
        logger.warning(
            "Yahoo Finance rate limit hit; pausing all yfinance calls for %ss", settings.rate_limit_cooldown_seconds
        )


market_service = MarketService()
