from fastapi import APIRouter, HTTPException

from app.schemas.market import KitchinSnapshot
from app.services.kitchin_service import kitchin_service

router = APIRouter()


@router.get("/", response_model=KitchinSnapshot)
async def get_kitchin():
    """Bonds/stocks/commodities snapshot and the resulting intermarket-cycle
    read, refreshed from Yahoo at most every few hours."""
    try:
        return await kitchin_service.get_or_refresh()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc) or type(exc).__name__) from exc


@router.post("/refresh", response_model=KitchinSnapshot)
async def refresh_kitchin():
    """Forces an immediate re-fetch (12 tickers, one batch call - a couple
    of seconds), bypassing the freshness cache."""
    try:
        return await kitchin_service.refresh()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc) or type(exc).__name__) from exc
