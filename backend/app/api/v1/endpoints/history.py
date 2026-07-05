from fastapi import APIRouter, HTTPException, Query
from yfinance.exceptions import YFRateLimitError

from app.schemas.market import HistoricalBar, Timeframe
from app.services.market_service import market_service

router = APIRouter()


@router.get("/{symbol}", response_model=list[HistoricalBar])
async def get_history(
    symbol: str,
    timeframe: Timeframe | None = Query(
        None, description="Convenience timeframe: month, week, day, h4, h1. Overrides period/interval."
    ),
    period: str = Query("1mo", description="yfinance period, e.g. 1d, 5d, 1mo, 6mo, 1y (ignored if timeframe is set)"),
    interval: str = Query("1d", description="yfinance interval, e.g. 1m, 5m, 15m, 1d (ignored if timeframe is set)"),
):
    try:
        if timeframe is not None:
            return await market_service.get_candles(symbol, timeframe)
        return await market_service.get_history(symbol, period, interval)
    except YFRateLimitError:
        raise HTTPException(status_code=429, detail="Rate limited by the upstream data provider, try again shortly")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch history for {symbol}: {exc}")
