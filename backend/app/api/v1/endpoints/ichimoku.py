from fastapi import APIRouter, HTTPException, Query
from yfinance.exceptions import YFRateLimitError

from app.schemas.ichimoku import IchimokuResponse
from app.schemas.market import Timeframe
from app.services.indicators.assessment import compute_assessment
from app.services.indicators.ichimoku import compute_ichimoku
from app.services.indicators.wave_targets import compute_wave_targets
from app.services.market_service import market_service

router = APIRouter()


@router.get("/{symbol}", response_model=IchimokuResponse)
async def get_ichimoku(
    symbol: str,
    timeframe: Timeframe = Query(Timeframe.DAY, description="month, week, day, h4, h1"),
    threshold_pct: float = Query(
        3.0, ge=0.5, le=20.0, description="Zigzag reversal threshold (%) for wave pivot detection"
    ),
    lookback_candles: int = Query(
        76, ge=10, le=300, description="Candles evaluated for the bullish/bearish assessment"
    ),
    forecast_candles: int = Query(
        17, ge=1, le=26, description="Forecast horizon (candles) for the assessment"
    ),
):
    try:
        bars = await market_service.get_candles(symbol, timeframe)
    except YFRateLimitError:
        raise HTTPException(status_code=429, detail="Rate limited by the upstream data provider, try again shortly")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch data for {symbol}: {exc}")

    if not bars:
        raise HTTPException(status_code=404, detail=f"No data available for {symbol}")

    points = compute_ichimoku(bars)
    wave_targets = compute_wave_targets(bars, threshold_pct=threshold_pct)
    assessment = compute_assessment(bars, points, lookback=lookback_candles, forecast=forecast_candles)
    return IchimokuResponse(
        symbol=symbol.upper(), bars=bars, points=points, wave_targets=wave_targets, assessment=assessment
    )
