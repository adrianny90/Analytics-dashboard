from abc import ABC, abstractmethod

from app.schemas.market import HistoricalBar, Quote


class MarketDataProvider(ABC):
    name: str

    @abstractmethod
    async def get_quote(self, symbol: str) -> Quote: ...

    @abstractmethod
    async def get_history(self, symbol: str, period: str, interval: str) -> list[HistoricalBar]: ...
