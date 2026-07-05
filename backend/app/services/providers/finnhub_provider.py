import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Awaitable, Callable

import httpx
import websockets

from app.core.config import settings
from app.schemas.market import Quote

logger = logging.getLogger(__name__)

TradeHandler = Callable[[dict], Awaitable[None]]


class FinnhubStreamClient:
    """Streams real-time trade ticks from Finnhub's free websocket API.

    Requires a free API key (https://finnhub.io/register, no card needed).
    If no key is configured, `start()` is a no-op and the app relies solely
    on the yfinance polling loop instead.
    """

    def __init__(self, symbols: list[str], on_trade: TradeHandler):
        self._symbols = symbols
        self._on_trade = on_trade
        self._task: asyncio.Task | None = None
        self._stop = False

    def start(self) -> None:
        if not settings.finnhub_api_key:
            logger.warning("FINNHUB_API_KEY not set - real-time proxy stream disabled, using polling only")
            return
        self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        self._stop = True
        if self._task:
            self._task.cancel()

    async def _run(self) -> None:
        url = f"wss://ws.finnhub.io?token={settings.finnhub_api_key}"
        while not self._stop:
            try:
                async with websockets.connect(url) as ws:
                    for symbol in self._symbols:
                        await ws.send(json.dumps({"type": "subscribe", "symbol": symbol}))
                    async for raw in ws:
                        message = json.loads(raw)
                        if message.get("type") == "trade":
                            for trade in message.get("data", []):
                                await self._on_trade(trade)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # connection drop, DNS blip, etc.
                logger.warning("Finnhub stream disconnected (%s); retrying in 5s", exc)
                await asyncio.sleep(5)


class FinnhubQuoteFallback:
    """Legitimate, key-based REST fallback for a single quote when yfinance
    is unavailable (rate-limited, blocked, etc).

    Separate from FinnhubStreamClient: this hits the plain `/quote` REST
    endpoint on demand rather than maintaining a websocket subscription.
    Free tier allows 60 requests/minute - fine for occasional fallback use,
    but not meant to replace yfinance as the primary source for the whole
    watchlist.
    """

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(base_url="https://finnhub.io/api/v1", timeout=10)

    async def get_quote(self, symbol: str) -> Quote:
        if not settings.finnhub_api_key:
            raise RuntimeError("FINNHUB_API_KEY not configured")

        response = await self._client.get("/quote", params={"symbol": symbol, "token": settings.finnhub_api_key})
        response.raise_for_status()
        data = response.json()

        price = data.get("c")
        previous_close = data.get("pc")
        if not price:
            raise ValueError(f"no Finnhub quote data for {symbol}")

        change = price - previous_close if previous_close else None
        change_percent = (change / previous_close * 100) if change is not None and previous_close else None
        timestamp = datetime.fromtimestamp(data["t"], tz=timezone.utc) if data.get("t") else datetime.now(timezone.utc)

        return Quote(
            symbol=symbol,
            price=price,
            change=change,
            change_percent=change_percent,
            previous_close=previous_close,
            day_high=data.get("h"),
            day_low=data.get("l"),
            volume=None,
            timestamp=timestamp,
            source="finnhub",
        )
