from fastapi import APIRouter

from app.core.symbols import SYMBOL_SECTORS, WATCHLIST_SYMBOLS
from app.schemas.market import Quote, WatchlistSymbol
from app.services.market_service import market_service

router = APIRouter()


@router.get("/symbols", response_model=list[WatchlistSymbol])
async def list_watchlist_symbols():
    """Static config (symbol + sector), no live data - instant, never fails.

    The frontend uses this to render the full sector-grouped layout right
    away, then fills in prices as they arrive via /api/v1/watchlist/ and
    the websocket.
    """
    return [WatchlistSymbol(symbol=symbol, sector=SYMBOL_SECTORS[symbol]) for symbol in WATCHLIST_SYMBOLS]


@router.get("/", response_model=list[Quote])
async def list_watchlist():
    """Whatever's already cached - never blocks on a live fetch."""
    return market_service.get_cached_watchlist_quotes()
