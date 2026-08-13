from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Timeframe(str, Enum):
    MONTH = "month"
    WEEK = "week"
    DAY = "day"
    H4 = "h4"
    H1 = "h1"


class Quote(BaseModel):
    symbol: str
    price: float
    change: float | None = None
    change_percent: float | None = None
    previous_close: float | None = None
    day_high: float | None = None
    day_low: float | None = None
    volume: int | None = None
    timestamp: datetime
    source: str
    sector: str | None = None
    stale: bool = False


class HistoricalBar(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


class IndexSummary(BaseModel):
    name: str
    index_symbol: str
    proxy_symbol: str
    quote: Quote


class WatchlistSymbol(BaseModel):
    symbol: str
    sector: str


class WatchlistSymbolCreate(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)


class TickerSearchResult(BaseModel):
    symbol: str
    name: str | None = None
    exchange: str | None = None


class SymbolTrend(BaseModel):
    """Per-timeframe Ichimoku trend outlook for the watchlist table. Each
    field is "bullish" | "bearish" | "neutral" | None - None means the
    background trend poll loop hasn't reached this symbol/timeframe yet."""

    symbol: str
    week: str | None = None
    day: str | None = None
    h4: str | None = None
    h1: str | None = None
