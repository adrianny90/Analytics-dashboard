import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone

from yfinance.exceptions import YFRateLimitError

from app.core.config import settings
from app.core.memory import release_memory, rss_label
from app.core.nasdaq_symbols import NASDAQ_SECTORS, NASDAQ_SYMBOLS
from app.core.russell2000_symbols import RUSSELL2000_SECTORS, RUSSELL2000_SYMBOLS
from app.core.sp500_symbols import SP500_SECTORS, SP500_SYMBOLS
from app.schemas.market import (
    AnalystTargets,
    DownloadAllItem,
    DownloadAllStatus,
    ForecastScanStatus,
    HistoricalBar,
    HypotheticalForecast,
    PeriodChange,
    Quote,
    RankingEntry,
    RankingStatus,
    RankingSummary,
    RsiScanStatus,
    Timeframe,
    VolForecast,
)
from app.services import index_ranking_repo
from app.services.indicators.assessment import compute_assessment
from app.services.indicators.ichimoku import compute_ichimoku
from app.services.indicators.rsi import compute_rsi_last
from app.services.indicators.vol_band import band as vol_band, probability_within_15pct, three_month_sigma
from app.services.market_service import POLL_BATCH_SIZE, TIMEFRAME_CONFIG
from app.services.providers.yfinance_provider import YFinanceProvider

logger = logging.getLogger(__name__)

# Priority/weight order requested for the ranking: D1 matters most, then
# H4, then W1, and H1 least. Also the order batches are fetched in, so the
# highest-weight timeframe's data (which doubles as the quote source below)
# lands first.
RANKED_TIMEFRAMES: list[Timeframe] = [Timeframe.DAY, Timeframe.H4, Timeframe.WEEK, Timeframe.H1]
TIMEFRAME_WEIGHTS: dict[Timeframe, int] = {
    Timeframe.DAY: 4,
    Timeframe.H4: 3,
    Timeframe.WEEK: 2,
    Timeframe.H1: 1,
}
# Start downloads every timeframe in one run. Each step is one history
# download; H1 and H4 share theirs (H4 is H1 resampled to 4h), so the intraday
# step yields both. The intraday step is also re-run on its own every hour to
# keep the short-term trends current.
SCAN_STEPS: list[list[Timeframe]] = [[Timeframe.DAY], [Timeframe.WEEK], [Timeframe.H1, Timeframe.H4]]
INTRADAY_STEP: list[Timeframe] = SCAN_STEPS[-1]
_INTRADAY_REFRESH_INTERVAL = timedelta(hours=1)
# Only one download step runs at a time across ALL universes. Start, the
# hourly H1/H4 refreshes, the RSI scans and "Download all" can otherwise
# overlap, and several concurrent scans multiply both memory use (Render's
# free tier kills the service above 512MB) and the request rate to Yahoo.
_SCAN_LOCK = asyncio.Lock()
# How long already-computed RSI values count as fresh for the RSI filter scan:
# H1/H4 are refreshed hourly, everything else follows the general cache window.
_RSI_FRESH_INTRADAY = timedelta(hours=1)
# The price-forecast agent publishes to the database offline; re-read at most this often.
_FORECAST_RELOAD_SECONDS = 300
# Key (beside the timeframe keys) under which the last volatility-forecast time is stored.
_VOL_KEY = "vol_forecast"
_SCHEDULER_TICK_SECONDS = 60
OUTLOOK_SIGN: dict[str, int] = {"bullish": 1, "neutral": 0, "bearish": -1}

# Empty batch results can be a silently-swallowed rate limit (see
# MarketService._refresh_batch) rather than genuinely-missing data - retried
# a bounded number of times before giving up on that one batch, so a
# consistently bad/delisted batch can't stall the whole scan forever.
_MAX_EMPTY_RETRIES = 3


def _quote_from_daily_bars(symbol: str, sector: str, bars: list[HistoricalBar]) -> Quote | None:
    """Builds a quote straight from the D1 bars already pulled for the
    trend scan, instead of a second, separate quotes-batch pass over every
    symbol in the universe - the same last-close-based shape
    YFinanceProvider._get_quote_sync produces from its own dedicated 5-day
    daily pull, just reusing data this scan already has in hand."""
    if not bars:
        return None
    last = bars[-1]
    previous_close = bars[-2].close if len(bars) > 1 else None
    change = last.close - previous_close if previous_close else None
    change_percent = (change / previous_close * 100) if change is not None and previous_close else None
    return Quote(
        symbol=symbol,
        price=last.close,
        change=change,
        change_percent=change_percent,
        previous_close=previous_close,
        day_high=last.high,
        day_low=last.low,
        volume=last.volume,
        timestamp=last.timestamp if last.timestamp.tzinfo else last.timestamp.replace(tzinfo=timezone.utc),
        source="yfinance",
        sector=sector,
    )


CHANGE_PERIODS: dict[str, timedelta] = {
    "1d": timedelta(days=1),
    "1w": timedelta(weeks=1),
    "1m": timedelta(days=30),
    "6m": timedelta(days=182),
    "1y": timedelta(days=365),
}
# Smallest Yahoo daily-history period that still reaches back far enough for
# each change window - used by the on-demand fetch (the scan already has 5y).
CHANGE_HISTORY_PERIODS: dict[str, str] = {"1d": "5d", "1w": "1mo", "1m": "3mo", "6m": "1y", "1y": "2y"}
_CHANGES_CACHE_SECONDS = settings.ranking_cache_hours * 3600

# Analyst targets are reused from the database until they are this old;
# older (or missing) ones are re-downloaded on the next Start.
_TARGETS_MAX_AGE = timedelta(hours=settings.ranking_cache_hours)
# The store is one row shared by every universe, so saves are kept infrequent.
_TARGETS_SAVE_EVERY = 100


class _TargetsStore:
    """Analyst targets for every symbol in every universe, kept in one
    database row (key "analyst_targets") so a symbol that is in several
    universes (e.g. AAPL in both S&P 500 and Nasdaq) is only ever downloaded
    once per cache period."""

    KEY = "analyst_targets"
    # Rows written by the earlier per-universe version; merged in on load.
    LEGACY_KEYS = ("sp500_targets", "nasdaq_targets", "russell2000_targets")

    def __init__(self) -> None:
        self.data: dict[str, AnalystTargets] = {}
        self._loaded = False
        self._save_lock = asyncio.Lock()

    async def load(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        for key in (*self.LEGACY_KEYS, self.KEY):
            try:
                saved = await index_ranking_repo.load_ranking(key)
            except Exception:
                logger.exception("failed loading saved analyst targets (%s)", key)
                continue
            if saved is None:
                continue
            for entry in saved.entries:
                try:
                    targets = AnalystTargets.model_validate(entry["targets"])
                except Exception:
                    continue
                current = self.data.get(entry["symbol"])
                if current is None or targets.fetched_at >= current.fetched_at:
                    self.data[entry["symbol"]] = targets

    async def save(self) -> None:
        async with self._save_lock:
            try:
                await index_ranking_repo.save_ranking(
                    self.KEY,
                    [{"symbol": symbol, "targets": t.model_dump(mode="json")} for symbol, t in self.data.items()],
                )
            except Exception:
                logger.exception("failed saving analyst targets")


targets_store = _TargetsStore()


def _changes_from_daily_bars(
    bars: list[HistoricalBar], periods: dict[str, timedelta] = CHANGE_PERIODS
) -> dict[str, PeriodChange]:
    """Change vs. the last daily close at or before (latest bar - window);
    the "1d" window is simply the previous bar, so it skips weekends. Windows
    reaching past the available history are omitted. Reuses the D1 bars the
    trend scan already pulled, so it costs no extra requests."""
    if len(bars) < 2:
        return {}
    last = bars[-1]
    result: dict[str, PeriodChange] = {}
    for key, delta in periods.items():
        if key == "1d":
            reference = bars[-2]
        else:
            cutoff = last.timestamp - delta
            reference = next((b for b in reversed(bars[:-1]) if b.timestamp <= cutoff), None)
        if reference is None or not reference.close:
            continue
        change = last.close - reference.close
        result[key] = PeriodChange(change=change, change_percent=change / reference.close * 100)
    return result


class IndexRankingService:
    """One-shot (re-runnable) background scan across every ticker in one
    index universe (S&P 500, Nasdaq Composite, or Russell 2000): pulls
    D1/H4/W1/H1 history in the same batch size as the dashboard's trend
    poll loop, scores each symbol via a D1>H4>W1>H1-weighted sum of its
    per-timeframe Ichimoku outlook, and ranks every symbol in the universe
    (no bullish-only filter, no top-N cutoff). Runs on the shared "ranking"
    throttle lane so it never slows down the main dashboard's quote/trend
    polling or an interactive chart load.
    """

    def __init__(self, universe: str, symbols: list[str], sectors: dict[str, str]) -> None:
        self._universe = universe
        self._symbols = symbols
        self._sectors = sectors
        self._provider = YFinanceProvider()
        self._status: str = "idle"
        self._processed = 0
        self._total = 0
        self._updated_at: datetime | None = None
        self._ranking: list[RankingEntry] = []
        self._task: asyncio.Task | None = None
        self._rate_limited_until: float = 0.0
        self._changes_cache: dict[str, tuple[float, dict[str, PeriodChange]]] = {}
        self._changes_locks: dict[str, asyncio.Lock] = {}
        self._phase: str | None = None
        self._error: str | None = None
        self._summary: RankingSummary | None = None
        self._bg_task: asyncio.Task | None = None
        self._scheduler_task: asyncio.Task | None = None
        self._forecasts: dict[str, HypotheticalForecast] = {}
        self._forecasts_loaded_at: float | None = None
        self._rsi_by_symbol: dict[str, dict[str, float]] = {}
        self._rsi_at: dict[str, datetime] = {}
        self._rsi_seen: set[str] = set()
        self._vol_by_symbol: dict[str, VolForecast] = {}
        self._fc_seen: set[str] = set()
        self._fc_task: asyncio.Task | None = None
        self._fc_status: str = "idle"
        self._fc_processed = 0
        self._fc_total = 0
        self._fc_source: str | None = None
        self._fc_error: str | None = None
        self._rsi_task: asyncio.Task | None = None
        self._rsi_status: str = "idle"
        self._rsi_timeframe: str | None = None
        self._rsi_processed = 0
        self._rsi_total = 0
        self._rsi_source: str | None = None
        self._rsi_error: str | None = None
        self._intraday_updated_at: datetime | None = None
        self._bg_status: str = "idle"
        self._bg_processed = 0
        self._bg_total = 0
        # Working state of the last main run, kept so the background H4/H1
        # pass can re-rank with everything the main run already computed.
        self._trend_by_symbol: dict[str, dict[str, str]] = {}
        self._quote_by_symbol: dict[str, Quote] = {}
        self._changes_by_symbol: dict[str, dict[str, PeriodChange]] = {}

    async def restore(self) -> None:
        await targets_store.load()
        await self._restore_ranking()
        await self._restore_summary()
        await self._restore_rsi_meta()

    async def _restore_ranking(self) -> None:
        """Repopulates the ranking from the last saved run (if any), so the
        tab shows results immediately after a backend restart instead of
        requiring the user to click Start again."""
        try:
            saved = await index_ranking_repo.load_ranking(self._universe)
        except Exception:
            logger.exception("failed loading saved %s ranking; starting empty", self._universe)
            return
        if saved is None:
            return
        try:
            self._ranking = [RankingEntry.model_validate(entry) for entry in saved.entries]
            self._status = "finished"
            self._updated_at = saved.updated_at
            self._intraday_updated_at = saved.updated_at
            self._load_state_from_ranking()
        except Exception:
            logger.exception("failed parsing saved %s ranking", self._universe)

    def _stale_target_symbols(self) -> list[str]:
        cutoff = datetime.now(timezone.utc) - _TARGETS_MAX_AGE
        return [
            s for s in self._symbols if s not in targets_store.data or targets_store.data[s].fetched_at < cutoff
        ]

    def _load_state_from_ranking(self) -> None:
        """Rebuilds the per-symbol working state (trends, quotes, changes)
        from the published ranking, so the hourly intraday refresh can
        re-rank on top of it after a restart or a failed run."""
        self._trend_by_symbol = {}
        self._quote_by_symbol = {}
        self._changes_by_symbol = {}
        self._rsi_by_symbol = {}
        self._vol_by_symbol = {}
        for entry in self._ranking:
            if entry.vol_forecast:
                self._vol_by_symbol[entry.symbol] = entry.vol_forecast
            if entry.rsi:
                self._rsi_by_symbol[entry.symbol] = dict(entry.rsi)
            for key in ("day", "week", "h4", "h1"):
                outlook = getattr(entry, key)
                if outlook:
                    self._trend_by_symbol.setdefault(entry.symbol, {})[key] = outlook
            if entry.quote:
                self._quote_by_symbol[entry.symbol] = entry.quote
            if entry.changes:
                self._changes_by_symbol[entry.symbol] = entry.changes

    @property
    def _rsi_meta_key(self) -> str:
        return f"{self._universe}_rsi"

    async def _restore_rsi_meta(self) -> None:
        try:
            saved = await index_ranking_repo.load_ranking(self._rsi_meta_key)
            if saved is not None:
                self._rsi_at = {e["timeframe"]: datetime.fromisoformat(e["at"]) for e in saved.entries}
        except Exception:
            logger.exception("failed loading saved %s RSI timestamps", self._universe)

    async def _save_rsi_meta(self) -> None:
        try:
            await index_ranking_repo.save_ranking(
                self._rsi_meta_key, [{"timeframe": tf, "at": at.isoformat()} for tf, at in self._rsi_at.items()]
            )
        except Exception:
            logger.exception("failed saving %s RSI timestamps", self._universe)

    @property
    def _summary_key(self) -> str:
        return f"{self._universe}_summary"

    async def _restore_summary(self) -> None:
        try:
            saved = await index_ranking_repo.load_ranking(self._summary_key)
            if saved is not None and saved.entries:
                self._summary = RankingSummary.model_validate(saved.entries[0])
        except Exception:
            logger.exception("failed loading saved %s run summary", self._universe)

    async def _fetch_targets(self, symbols: list[str]) -> None:
        """Looks up analyst targets one symbol at a time (Yahoo has no batch
        endpoint for them) on the same throttled lane and rate-limit
        handling as the history batches. Symbols without coverage are stored
        too, so they aren't re-queried for a week."""
        try:
            for symbol in symbols:
                while True:
                    await self._wait_out_rate_limit()
                    try:
                        data = await self._provider.get_analyst_targets(symbol, lane="ranking")
                    except YFRateLimitError:
                        self._trip_breaker()
                        continue
                    except Exception:
                        data = None
                    break
                targets_store.data[symbol] = AnalystTargets(fetched_at=datetime.now(timezone.utc), **(data or {}))
                self._processed += 1
                if self._processed % _TARGETS_SAVE_EVERY == 0:
                    await targets_store.save()
                    # Unlike _scan_step's batches, this loop makes one small
                    # yfinance/requests allocation per symbol with nothing
                    # freeing the allocator's freed-but-unreturned pages in
                    # between - over a full universe (thousands of symbols on
                    # a fresh/migrated store) that fragmentation alone was
                    # enough to breach Render's 512MB limit.
                    release_memory()
        finally:
            await targets_store.save()

    def get_status(self) -> RankingStatus:
        return RankingStatus(
            status=self._status,
            processed=self._processed,
            total=self._total,
            updated_at=self._updated_at,
            phase=self._phase,
            error=self._error,
            summary=self._summary,
            intraday_updated_at=self._intraday_updated_at,
            background_status=self._bg_status,
            background_processed=self._bg_processed,
            background_total=self._bg_total,
        )

    async def refresh_forecasts(self) -> None:
        """Loads the offline agent's 3-month forecasts (row "<universe>_forecast")
        so get_ranking can attach them. Cheap and rate-limited; failures leave
        whatever was loaded before."""
        now = time.monotonic()
        if self._forecasts_loaded_at is not None and now - self._forecasts_loaded_at < _FORECAST_RELOAD_SECONDS:
            return
        self._forecasts_loaded_at = now
        try:
            saved = await index_ranking_repo.load_ranking(f"{self._universe}_forecast")
            if saved is not None:
                self._forecasts = {e["symbol"]: HypotheticalForecast.model_validate(e) for e in saved.entries}
        except Exception:
            logger.exception("failed loading %s forecasts", self._universe)

    def get_ranking(self) -> list[RankingEntry]:
        if not self._forecasts:
            return self._ranking
        return [
            entry.model_copy(update={"forecast": self._forecasts[entry.symbol]})
            if entry.symbol in self._forecasts
            else entry
            for entry in self._ranking
        ]

    async def get_changes(self, period: str) -> dict[str, PeriodChange]:
        """Price change over `period` for every symbol, fetched on demand
        through the same batch size, "ranking" throttle lane and rate-limit
        handling as the scan (only daily bars, only as far back as the period
        needs). Cached briefly so flipping between periods is cheap."""
        cached = self._changes_cache.get(period)
        if cached and time.monotonic() - cached[0] < _CHANGES_CACHE_SECONDS:
            return cached[1]
        async with self._changes_locks.setdefault(period, asyncio.Lock()):
            cached = self._changes_cache.get(period)
            if cached and time.monotonic() - cached[0] < _CHANGES_CACHE_SECONDS:
                return cached[1]
            delta = CHANGE_PERIODS[period]
            result: dict[str, PeriodChange] = {}
            for i in range(0, len(self._symbols), POLL_BATCH_SIZE):
                batch = self._symbols[i : i + POLL_BATCH_SIZE]
                bars_by_symbol = await self._fetch_history_batch(batch, CHANGE_HISTORY_PERIODS[period], "1d", None)
                for symbol, bars in bars_by_symbol.items():
                    change = _changes_from_daily_bars(bars, {period: delta}).get(period)
                    if change:
                        result[symbol] = change
            if result:
                self._changes_cache[period] = (time.monotonic(), result)
            return result

    def start(self) -> RankingStatus:
        """Kicks off the scan if one isn't already running. Setting status
        here (not at the top of _run) closes the race where two rapid
        clicks could both see a non-"running" status and start two scans."""
        if self._status != "running":
            if self._bg_task is not None and not self._bg_task.done():
                self._bg_task.cancel()
            if self._rsi_task is not None and not self._rsi_task.done():
                self._rsi_task.cancel()
            self._rsi_status = "idle"
            if self._fc_task is not None and not self._fc_task.done():
                self._fc_task.cancel()
            self._fc_status = "idle"
            self._bg_status = "idle"
            self._bg_processed = 0
            self._bg_total = 0
            stale = self._stale_target_symbols()
            self._status = "running"
            self._phase = "prices"
            self._error = None
            self._processed = 0
            self._total = len(self._symbols) * len(SCAN_STEPS) + len(stale)
            self._task = asyncio.create_task(self._run(stale))
        return self.get_status()

    async def _wait_out_rate_limit(self) -> None:
        while True:
            remaining = self._rate_limited_until - time.monotonic()
            if remaining <= 0:
                return
            await asyncio.sleep(min(remaining, 5))

    def _trip_breaker(self) -> None:
        self._rate_limited_until = time.monotonic() + settings.rate_limit_cooldown_seconds
        logger.warning(
            "Yahoo Finance rate limit hit during %s ranking scan; pausing for %ss",
            self._universe,
            settings.rate_limit_cooldown_seconds,
        )

    async def _fetch_history_batch(
        self, symbols: list[str], period: str, interval: str, resample: str | None
    ) -> dict[str, list[HistoricalBar]]:
        return await self._fetch_with_retry(
            symbols, lambda: self._provider.get_history_batch(symbols, period, interval, resample, lane="ranking")
        )

    async def _fetch_with_retry(self, symbols: list[str], fetch):
        attempts = 0
        while True:
            await self._wait_out_rate_limit()
            try:
                result = await fetch()
            except YFRateLimitError:
                self._trip_breaker()
                continue
            except Exception:
                logger.exception(
                    "failed fetching %s history batch of %d symbols", self._universe, len(symbols)
                )
                return {}
            if result:
                return result
            attempts += 1
            if attempts >= _MAX_EMPTY_RETRIES:
                logger.warning(
                    "giving up on %s history batch after %d empty attempts", self._universe, attempts
                )
                return {}
            self._trip_breaker()

    def _rank(
        self,
        trend_by_symbol: dict[str, dict[str, str]],
        quote_by_symbol: dict[str, Quote],
        changes_by_symbol: dict[str, dict[str, PeriodChange]],
    ) -> list[RankingEntry]:
        scored: list[tuple[int, str, str, dict[str, str]]] = []
        for symbol, sector in self._sectors.items():
            trends = trend_by_symbol.get(symbol, {})
            score = sum(
                TIMEFRAME_WEIGHTS[tf] * OUTLOOK_SIGN.get(trends.get(tf.value, ""), 0) for tf in RANKED_TIMEFRAMES
            )
            scored.append((score, symbol, sector, trends))

        # Highest score first; alphabetical is just a stable, readable
        # tiebreak for equal scores. Every symbol in the universe is kept -
        # no bullish-only filter, no top-N cutoff.
        scored.sort(key=lambda item: (-item[0], item[1]))

        return [
            RankingEntry(
                rank=i + 1,
                symbol=symbol,
                sector=sector,
                score=score,
                week=trends.get("week"),
                day=trends.get("day"),
                h4=trends.get("h4"),
                h1=trends.get("h1"),
                quote=quote_by_symbol.get(symbol),
                changes=changes_by_symbol.get(symbol, {}),
                targets=targets_store.data.get(symbol),
                rsi=self._rsi_by_symbol.get(symbol, {}),
                vol_forecast=self._vol_by_symbol.get(symbol),
            )
            for i, (score, symbol, sector, trends) in enumerate(scored)
        ]

    def _set_rsi(self, symbol: str, tf: Timeframe, bars: list[HistoricalBar]) -> None:
        value = compute_rsi_last([b.close for b in bars])
        if value is not None:
            self._rsi_by_symbol.setdefault(symbol, {})[tf.value] = round(value, 2)
            self._rsi_seen.add(symbol)

    def _set_vol_forecast(self, symbol: str, bars: list[HistoricalBar]) -> None:
        closes = [b.close for b in bars]
        sigma = three_month_sigma(closes)
        if sigma is None:
            return
        price = closes[-1]
        low, median, high = vol_band(price, sigma)
        self._vol_by_symbol[symbol] = VolForecast(
            price=round(price, 4),
            low=round(low, 2),
            median=round(median, 2),
            high=round(high, 2),
            sigma=round(sigma, 4),
            p15=round(probability_within_15pct(sigma), 4),
            as_of=bars[-1].timestamp.date().isoformat(),
        )
        self._fc_seen.add(symbol)

    def _apply_bars(self, symbol: str, tf: Timeframe, bars: list[HistoricalBar]) -> None:
        self._set_rsi(symbol, tf, bars)
        if tf == Timeframe.MONTH:
            # Monthly bars are only downloaded for the RSI filter scan.
            return
        if tf == Timeframe.DAY:
            quote = _quote_from_daily_bars(symbol, self._sectors[symbol], bars)
            if quote:
                self._quote_by_symbol[symbol] = quote
            self._changes_by_symbol[symbol] = _changes_from_daily_bars(bars)
            self._set_vol_forecast(symbol, bars)
        try:
            points = compute_ichimoku(bars)
            assessment = compute_assessment(bars, points)
            self._trend_by_symbol.setdefault(symbol, {})[tf.value] = assessment.outlook
        except Exception:
            logger.exception("failed computing %s trend for %s/%s", self._universe, symbol, tf.value)

    async def _scan_step(self, timeframes: list[Timeframe], on_symbol) -> None:
        """One history download pass over the whole universe in POLL_BATCH_SIZE
        batches. Timeframes listed together must share a download (same
        interval/period, differing only in resampling), e.g. H1 + H4.

        Holds the global scan lock for the whole pass, and keeps memory flat:
        a batch is downloaded as raw DataFrames and converted to bar objects
        one symbol at a time, freeing each before the next."""
        config = TIMEFRAME_CONFIG[timeframes[0]]
        period, interval = config["period"], config["interval"]
        resamples = [TIMEFRAME_CONFIG[tf].get("resample") for tf in timeframes]
        label = "+".join(tf.value for tf in timeframes)
        async with _SCAN_LOCK:
            for batch_no, i in enumerate(range(0, len(self._symbols), POLL_BATCH_SIZE)):
                batch = self._symbols[i : i + POLL_BATCH_SIZE]
                frames = await self._fetch_with_retry(
                    batch,
                    lambda batch=batch: self._provider.get_history_frames(batch, period, interval, lane="ranking"),
                )
                for symbol in batch:
                    frame = frames.pop(symbol, None)
                    if frame is not None:
                        try:
                            series = self._provider.series_from_frame(frame, resamples)
                            for tf, bars in zip(timeframes, series):
                                if bars:
                                    self._apply_bars(symbol, tf, bars)
                        except Exception:
                            logger.exception("failed processing %s %s for %s", self._universe, label, symbol)
                        del frame
                    on_symbol()
                del frames
                release_memory()
                if batch_no % 10 == 0:
                    logger.info(
                        "%s %s: %d/%d symbols, memory %s",
                        self._universe,
                        label,
                        min(i + POLL_BATCH_SIZE, len(self._symbols)),
                        len(self._symbols),
                        rss_label(),
                    )

    async def _publish_ranking(self) -> None:
        ranked = self._rank(self._trend_by_symbol, self._quote_by_symbol, self._changes_by_symbol)
        self._ranking = ranked
        self._updated_at = datetime.now(timezone.utc)
        await index_ranking_repo.save_ranking(self._universe, [entry.model_dump(mode="json") for entry in ranked])
        await self._save_rsi_meta()
        # model_dump()-ing the whole universe into JSON is the single
        # biggest one-shot allocation of a run; hand the freed pages back
        # right after instead of waiting for the next batch's release_memory().
        release_memory()

    def _build_summary(self, targets_fetched: int) -> RankingSummary:
        trends = self._trend_by_symbol.values()
        return RankingSummary(
            symbols_total=len(self._symbols),
            with_prices=len(self._quote_by_symbol),
            with_changes=sum(1 for c in self._changes_by_symbol.values() if c),
            with_trend_d1=sum(1 for t in trends if "day" in t),
            with_trend_w1=sum(1 for t in trends if "week" in t),
            with_trend_h4=sum(1 for t in trends if "h4" in t),
            with_trend_h1=sum(1 for t in trends if "h1" in t),
            with_targets=sum(
                1
                for s in self._symbols
                if (t := targets_store.data.get(s)) and any(v is not None for v in (t.low, t.median, t.high))
            ),
            targets_fetched=targets_fetched,
            targets_reused=len(self._symbols) - targets_fetched,
            finished_at=datetime.now(timezone.utc),
        )

    def _bump_processed(self) -> None:
        self._processed += 1

    def _bump_background(self) -> None:
        self._bg_processed += 1

    async def _run(self, stale_targets: list[str]) -> None:
        self._trend_by_symbol = {}
        self._quote_by_symbol = {}
        self._changes_by_symbol = {}
        try:
            for step in SCAN_STEPS:
                await self._scan_step(step, self._bump_processed)
                for tf in step:
                    self._rsi_at[tf.value] = datetime.now(timezone.utc)
                    if tf == Timeframe.DAY:
                        self._rsi_at[_VOL_KEY] = datetime.now(timezone.utc)
            if not self._quote_by_symbol:
                # Nothing came back (e.g. Yahoo blocking us) - don't overwrite
                # the last good saved ranking with an empty one.
                raise RuntimeError("no price data was returned by Yahoo Finance")
            self._phase = "targets"
            await self._fetch_targets(stale_targets)
            await self._publish_ranking()
            self._summary = self._build_summary(len(stale_targets))
            try:
                await index_ranking_repo.save_ranking(self._summary_key, [self._summary.model_dump(mode="json")])
            except Exception:
                logger.exception("failed saving %s run summary", self._universe)
            self._intraday_updated_at = datetime.now(timezone.utc)
            self._status = "finished"
        except Exception as exc:
            logger.exception("%s ranking scan failed", self._universe)
            self._error = str(exc) or type(exc).__name__
            self._status = "failed"
            # Drop the partial working state so the hourly refresh doesn't
            # publish a half-finished ranking over the last good one.
            self._load_state_from_ranking()
        finally:
            self._phase = None

    def get_rsi_status(self) -> RsiScanStatus:
        return RsiScanStatus(
            status=self._rsi_status,
            timeframe=self._rsi_timeframe,
            processed=self._rsi_processed,
            total=self._rsi_total,
            source=self._rsi_source,
            updated_at=self._rsi_at.get(self._rsi_timeframe) if self._rsi_timeframe else None,
            error=self._rsi_error,
        )

    def _bump_rsi(self) -> None:
        self._rsi_processed += 1

    def start_rsi_scan(self, tf: Timeframe) -> RsiScanStatus:
        """Makes sure every symbol has a current RSI for `tf`. Values still
        fresh (from Start or the hourly refresh, or an earlier scan) are
        reused; otherwise that timeframe's history is downloaded for the
        whole universe in the usual throttled batches. Raises RuntimeError
        when it can't run right now."""
        if self._rsi_status == "running":
            return self.get_rsi_status()
        if self._status == "running":
            raise RuntimeError("A full run is in progress - wait for it to finish.")
        if not self._ranking:
            raise RuntimeError("There is no ranking yet - run Start first.")
        self._rsi_timeframe = tf.value
        self._rsi_error = None
        self._rsi_processed = 0
        self._rsi_total = len(self._symbols)
        ttl = _RSI_FRESH_INTRADAY if tf in (Timeframe.H1, Timeframe.H4) else timedelta(hours=settings.ranking_cache_hours)
        computed_at = self._rsi_at.get(tf.value)
        if computed_at is not None and datetime.now(timezone.utc) - computed_at < ttl:
            self._rsi_status = "finished"
            self._rsi_source = "cached"
            self._rsi_processed = self._rsi_total
        else:
            self._rsi_status = "running"
            self._rsi_source = "downloaded"
            self._rsi_task = asyncio.create_task(self._run_rsi_scan(tf))
        return self.get_rsi_status()

    async def _run_rsi_scan(self, tf: Timeframe) -> None:
        self._rsi_seen = set()
        try:
            await self._scan_step([tf], self._bump_rsi)
            if not self._rsi_seen:
                raise RuntimeError("no price data was returned by Yahoo Finance")
            self._rsi_at[tf.value] = datetime.now(timezone.utc)
            await self._publish_ranking()
            self._rsi_status = "finished"
        except asyncio.CancelledError:
            self._rsi_status = "idle"
            raise
        except Exception as exc:
            logger.exception("%s %s RSI scan failed", self._universe, tf.value)
            self._rsi_error = str(exc) or type(exc).__name__
            self._rsi_status = "failed"

    def get_forecast_status(self) -> ForecastScanStatus:
        return ForecastScanStatus(
            status=self._fc_status,
            timeframe="day",
            processed=self._fc_processed,
            total=self._fc_total,
            source=self._fc_source,
            updated_at=self._rsi_at.get(_VOL_KEY),
            error=self._fc_error,
        )

    def _bump_forecast(self) -> None:
        self._fc_processed += 1

    def start_forecast_scan(self) -> ForecastScanStatus:
        """Computes the volatility-band forecast (method C) and the +-15%
        chance for every symbol, then saves the ranking to the database. Values
        from a run within the cache window are reused; otherwise the daily
        history is downloaded in the usual throttled batches. Raises
        RuntimeError when it can't run right now."""
        if self._fc_status == "running":
            return self.get_forecast_status()
        if self._status == "running":
            raise RuntimeError("A full run is in progress - wait for it to finish.")
        if not self._ranking:
            raise RuntimeError("There is no ranking yet - run Start first.")
        self._fc_error = None
        self._fc_processed = 0
        self._fc_total = len(self._symbols)
        computed_at = self._rsi_at.get(_VOL_KEY)
        window = timedelta(hours=settings.ranking_cache_hours)
        fresh = computed_at is not None and datetime.now(timezone.utc) - computed_at < window
        if fresh and self._vol_by_symbol:
            self._fc_status = "finished"
            self._fc_source = "cached"
            self._fc_processed = self._fc_total
        else:
            self._fc_status = "running"
            self._fc_source = "downloaded"
            self._fc_task = asyncio.create_task(self._run_forecast_scan())
        return self.get_forecast_status()

    async def _run_forecast_scan(self) -> None:
        self._fc_seen = set()
        try:
            await self._scan_step([Timeframe.DAY], self._bump_forecast)
            if not self._fc_seen:
                raise RuntimeError("no price data was returned by Yahoo Finance")
            now = datetime.now(timezone.utc)
            self._rsi_at[_VOL_KEY] = now
            self._rsi_at[Timeframe.DAY.value] = now  # the D1 pass refreshed D1 RSI too
            await self._publish_ranking()
            self._fc_status = "finished"
        except asyncio.CancelledError:
            self._fc_status = "idle"
            raise
        except Exception as exc:
            logger.exception("%s volatility forecast scan failed", self._universe)
            self._fc_error = str(exc) or type(exc).__name__
            self._fc_status = "failed"

    def has_fresh_full_run(self) -> bool:
        """True when a complete Start run finished within the cache window
        (the hourly H1/H4 refresh doesn't count - it only touches part)."""
        if not self._ranking or self._summary is None:
            return False
        age = datetime.now(timezone.utc) - self._summary.finished_at
        return age < timedelta(hours=settings.ranking_cache_hours)

    @property
    def symbol_count(self) -> int:
        return len(self._symbols)

    def _launch_intraday_refresh(self) -> None:
        # Flag it running synchronously so a status poll landing right after
        # this call never sees a stale "idle".
        self._bg_status = "running"
        self._bg_processed = 0
        self._bg_total = len(self._symbols)
        self._bg_task = asyncio.create_task(self._run_intraday_refresh())

    async def _run_intraday_refresh(self) -> None:
        """Re-downloads H1 (and H4, from the same data) and re-ranks/saves.
        Runs every hour for a universe that already has a ranking, so the
        short-term trends stay current between manual Start runs."""
        try:
            await self._scan_step(INTRADAY_STEP, self._bump_background)
            for tf in INTRADAY_STEP:
                self._rsi_at[tf.value] = datetime.now(timezone.utc)
            await self._publish_ranking()
            self._bg_status = "finished"
        except asyncio.CancelledError:
            self._bg_status = "idle"
            raise
        except Exception:
            logger.exception("%s hourly H1/H4 refresh failed", self._universe)
            self._bg_status = "failed"
        # Success or failure, wait a full interval before the next attempt so
        # a persistent failure (e.g. rate limiting) can't retry every tick.
        self._intraday_updated_at = datetime.now(timezone.utc)

    def start_scheduler(self) -> None:
        if self._scheduler_task is None:
            self._scheduler_task = asyncio.create_task(self._scheduler_loop())

    async def stop_scheduler(self) -> None:
        for task in (self._scheduler_task, self._bg_task, self._task, self._rsi_task, self._fc_task):
            if task is not None and not task.done():
                task.cancel()
        self._scheduler_task = None

    async def _scheduler_loop(self) -> None:
        while True:
            await asyncio.sleep(_SCHEDULER_TICK_SECONDS)
            try:
                if self._status == "running" or not self._ranking:
                    continue
                if self._bg_task is not None and not self._bg_task.done():
                    continue
                last = self._intraday_updated_at
                if last is None or datetime.now(timezone.utc) - last >= _INTRADAY_REFRESH_INTERVAL:
                    self._launch_intraday_refresh()
            except Exception:
                logger.exception("%s intraday scheduler tick failed", self._universe)


sp500_ranking_service = IndexRankingService("sp500", SP500_SYMBOLS, SP500_SECTORS)
nasdaq_ranking_service = IndexRankingService("nasdaq", NASDAQ_SYMBOLS, NASDAQ_SECTORS)
russell2000_ranking_service = IndexRankingService("russell2000", RUSSELL2000_SYMBOLS, RUSSELL2000_SECTORS)

RANKING_SERVICES: dict[str, IndexRankingService] = {
    "sp500": sp500_ranking_service,
    "nasdaq": nasdaq_ranking_service,
    "russell2000": russell2000_ranking_service,
}


class DownloadAllService:
    """Runs the full Start download for every universe one after another
    (S&P 500 -> Nasdaq -> Russell 2000), each saving its results to the
    database like a manual Start. A universe whose last full run is still
    inside the cache window is skipped ("cached") instead of re-downloaded;
    the per-universe Start buttons always force a fresh run."""

    ORDER = ["sp500", "nasdaq", "russell2000"]

    def __init__(self, services: dict[str, IndexRankingService]) -> None:
        self._services = services
        self._status = "idle"
        self._current: str | None = None
        self._states: dict[str, str] = {u: "pending" for u in self.ORDER}
        self._errors: dict[str, str | None] = {}
        self._finished_at: datetime | None = None
        self._task: asyncio.Task | None = None

    def start(self) -> DownloadAllStatus:
        if self._status != "running":
            self._status = "running"
            self._current = None
            self._states = {u: "pending" for u in self.ORDER}
            self._errors = {}
            self._finished_at = None
            self._task = asyncio.create_task(self._run())
        return self.get_status()

    async def _run(self) -> None:
        try:
            for universe in self.ORDER:
                service = self._services[universe]
                self._current = universe
                if service.has_fresh_full_run():
                    self._states[universe] = "cached"
                    continue
                self._states[universe] = "running"
                # No-op if a run for this universe is already going - then we
                # simply wait for that one.
                service.start()
                if service._task is not None:
                    await service._task
                status = service.get_status()
                if status.status == "finished":
                    self._states[universe] = "finished"
                else:
                    self._states[universe] = "failed"
                    self._errors[universe] = status.error
        except Exception:
            logger.exception("download all failed")
        finally:
            self._current = None
            self._status = "finished"
            self._finished_at = datetime.now(timezone.utc)

    def get_status(self) -> DownloadAllStatus:
        items: list[DownloadAllItem] = []
        weighted = 0.0
        weight_total = 0
        for universe in self.ORDER:
            service = self._services[universe]
            state = self._states[universe]
            svc_status = service.get_status()
            running = state == "running"
            processed = svc_status.processed if running else 0
            total = svc_status.total if running else 0
            if state in ("cached", "finished", "failed"):
                fraction = 1.0
            elif running:
                fraction = processed / total if total else 0.0
            else:
                fraction = 0.0
            weighted += fraction * service.symbol_count
            weight_total += service.symbol_count
            items.append(
                DownloadAllItem(
                    universe=universe,
                    state=state,
                    processed=processed,
                    total=total,
                    error=self._errors.get(universe),
                )
            )
        percent = 100 if self._status == "finished" else int(weighted / weight_total * 100) if weight_total else 0
        return DownloadAllStatus(
            status=self._status,
            percent=min(percent, 100),
            current=self._current,
            items=items,
            finished_at=self._finished_at,
        )


download_all_service = DownloadAllService(RANKING_SERVICES)
