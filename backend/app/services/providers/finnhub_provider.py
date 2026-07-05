import asyncio
import json
import logging
from typing import Awaitable, Callable

import websockets

from app.core.config import settings

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
