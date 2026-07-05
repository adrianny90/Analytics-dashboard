import asyncio
import logging
from datetime import datetime, timezone

from app.core.config import settings
from app.schemas.market import HistoricalBar, IndexSummary, Quote
from app.services.providers.finnhub_provider import FinnhubStreamClient
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


class MarketService:
    def __init__(self) -> None:
        self._provider = YFinanceProvider()
        self._cache: dict[str, Quote] = {}
        self._watchlist: set[str] = {d["proxy_symbol"] for d in INDEX_DEFINITIONS}
        self._poll_task: asyncio.Task | None = None
        self._stream = FinnhubStreamClient(
            symbols=[d["proxy_symbol"] for d in INDEX_DEFINITIONS],
            on_trade=self._handle_trade,
        )

    async def start(self) -> None:
        self._poll_task = asyncio.create_task(self._poll_loop())
        self._stream.start()

    async def stop(self) -> None:
        if self._poll_task:
            self._poll_task.cancel()
        await self._stream.stop()

    def track_symbol(self, symbol: str) -> None:
        self._watchlist.add(symbol.upper())

    async def get_quote(self, symbol: str) -> Quote:
        symbol = symbol.upper()
        if symbol in self._cache:
            return self._cache[symbol]
        quote = await self._provider.get_quote(symbol)
        self._cache[symbol] = quote
        return quote

    async def get_history(self, symbol: str, period: str, interval: str) -> list[HistoricalBar]:
        return await self._provider.get_history(symbol.upper(), period, interval)

    async def get_indices(self) -> list[IndexSummary]:
        summaries = []
        for definition in INDEX_DEFINITIONS:
            quote = await self.get_quote(definition["proxy_symbol"])
            summaries.append(IndexSummary(**definition, quote=quote))
        return summaries

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
        )
        self._cache[symbol] = updated
        await ws_manager.broadcast({"type": "quote", "data": updated.model_dump(mode="json")})

    async def _poll_loop(self) -> None:
        while True:
            try:
                for symbol in list(self._watchlist):
                    quote = await self._provider.get_quote(symbol)
                    self._cache[symbol] = quote
                    await ws_manager.broadcast({"type": "quote", "data": quote.model_dump(mode="json")})
            except Exception:
                logger.exception("poll loop error")
            await asyncio.sleep(settings.poll_interval_seconds)


market_service = MarketService()
