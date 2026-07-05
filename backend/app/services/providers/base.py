from abc import ABC, abstractmethod

from app.schemas.market import HistoricalBar, Quote


class MarketDataProvider(ABC):
    name: str

    @abstractmethod
    async def get_quote(self, symbol: str, lane: str = "interactive") -> Quote: ...

    @abstractmethod
    async def get_history(
        self, symbol: str, period: str, interval: str, resample: str | None = None, lane: str = "interactive"
    ) -> list[HistoricalBar]: ...
