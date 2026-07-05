from fastapi import APIRouter, HTTPException, Query

from app.schemas.market import HistoricalBar
from app.services.market_service import market_service

router = APIRouter()


@router.get("/{symbol}", response_model=list[HistoricalBar])
async def get_history(
    symbol: str,
    period: str = Query("1mo", description="yfinance period, e.g. 1d, 5d, 1mo, 6mo, 1y"),
    interval: str = Query("1d", description="yfinance interval, e.g. 1m, 5m, 15m, 1d"),
):
    try:
        return await market_service.get_history(symbol, period, interval)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch history for {symbol}: {exc}")
