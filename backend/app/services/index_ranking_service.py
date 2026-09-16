import asyncio
import logging
import time
from datetime import datetime, timezone

from yfinance.exceptions import YFRateLimitError

from app.core.config import settings
from app.core.nasdaq_symbols import NASDAQ_SECTORS, NASDAQ_SYMBOLS
from app.core.russell2000_symbols import RUSSELL2000_SECTORS, RUSSELL2000_SYMBOLS
from app.core.sp500_symbols import SP500_SECTORS, SP500_SYMBOLS
from app.schemas.market import HistoricalBar, Quote, RankingEntry, RankingStatus, Timeframe
from app.services import index_ranking_repo
from app.services.indicators.assessment import compute_assessment
from app.services.indicators.ichimoku import compute_ichimoku
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

    async def restore(self) -> None:
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
        except Exception:
            logger.exception("failed parsing saved %s ranking", self._universe)

    def get_status(self) -> RankingStatus:
        return RankingStatus(
            status=self._status, processed=self._processed, total=self._total, updated_at=self._updated_at
        )

    def get_ranking(self) -> list[RankingEntry]:
        return self._ranking

    def start(self) -> RankingStatus:
        """Kicks off the scan if one isn't already running. Setting status
        here (not at the top of _run) closes the race where two rapid
        clicks could both see a non-"running" status and start two scans."""
        if self._status != "running":
            self._status = "running"
            self._processed = 0
            self._total = len(self._symbols) * len(RANKED_TIMEFRAMES)
            self._task = asyncio.create_task(self._run())
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
        attempts = 0
        while True:
            await self._wait_out_rate_limit()
            try:
                result = await self._provider.get_history_batch(symbols, period, interval, resample, lane="ranking")
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
        self, trend_by_symbol: dict[str, dict[str, str]], quote_by_symbol: dict[str, Quote]
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
            )
            for i, (score, symbol, sector, trends) in enumerate(scored)
        ]

    async def _run(self) -> None:
        trend_by_symbol: dict[str, dict[str, str]] = {}
        quote_by_symbol: dict[str, Quote] = {}
        try:
            for tf in RANKED_TIMEFRAMES:
                config = TIMEFRAME_CONFIG[tf]
                period, interval, resample = config["period"], config["interval"], config.get("resample")
                for i in range(0, len(self._symbols), POLL_BATCH_SIZE):
                    batch = self._symbols[i : i + POLL_BATCH_SIZE]
                    bars_by_symbol = await self._fetch_history_batch(batch, period, interval, resample)
                    for symbol in batch:
                        bars = bars_by_symbol.get(symbol)
                        if bars:
                            if tf == Timeframe.DAY:
                                quote = _quote_from_daily_bars(symbol, self._sectors[symbol], bars)
                                if quote:
                                    quote_by_symbol[symbol] = quote
                            try:
                                points = compute_ichimoku(bars)
                                assessment = compute_assessment(bars, points)
                                trend_by_symbol.setdefault(symbol, {})[tf.value] = assessment.outlook
                            except Exception:
                                logger.exception(
                                    "failed computing %s trend for %s/%s", self._universe, symbol, tf.value
                                )
                        self._processed += 1

            ranked = self._rank(trend_by_symbol, quote_by_symbol)
            self._ranking = ranked
            self._updated_at = datetime.now(timezone.utc)
            try:
                await index_ranking_repo.save_ranking(
                    self._universe, [entry.model_dump(mode="json") for entry in ranked]
                )
            except Exception:
                logger.exception("failed saving %s ranking", self._universe)
        except Exception:
            logger.exception("%s ranking scan failed", self._universe)
        finally:
            self._status = "finished"


sp500_ranking_service = IndexRankingService("sp500", SP500_SYMBOLS, SP500_SECTORS)
nasdaq_ranking_service = IndexRankingService("nasdaq", NASDAQ_SYMBOLS, NASDAQ_SECTORS)
russell2000_ranking_service = IndexRankingService("russell2000", RUSSELL2000_SYMBOLS, RUSSELL2000_SECTORS)

RANKING_SERVICES: dict[str, IndexRankingService] = {
    "sp500": sp500_ranking_service,
    "nasdaq": nasdaq_ranking_service,
    "russell2000": russell2000_ranking_service,
}
