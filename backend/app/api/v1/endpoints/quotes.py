from fastapi import APIRouter, HTTPException

from app.schemas.market import Quote
from app.services.market_service import market_service

router = APIRouter()


@router.get("/{symbol}", response_model=Quote)
async def get_quote(symbol: str):
    try:
        return await market_service.get_quote(symbol)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch quote for {symbol}: {exc}")
