from datetime import datetime

from pydantic import BaseModel

from app.schemas.market import HistoricalBar


class IchimokuPoint(BaseModel):
    timestamp: datetime
    tenkan: float | None = None
    kijun: float | None = None
    senkou_a: float | None = None
    senkou_b: float | None = None
    chikou: float | None = None
    close: float | None = None


class WavePivot(BaseModel):
    timestamp: datetime
    price: float


class WaveTargetSet(BaseModel):
    pivot_a: WavePivot
    pivot_b: WavePivot
    pivot_c: WavePivot
    v_target: float
    n_target: float
    e_target: float


class SignalBreakdownItem(BaseModel):
    name: str
    bullish: bool | None  # True=bullish, False=bearish, None=neutral/unavailable
    detail: str


class IchimokuAssessment(BaseModel):
    outlook: str  # "bullish" | "bearish" | "neutral"
    score: int
    max_score: int
    lookback_candles: int
    forecast_candles: int
    signals: list[SignalBreakdownItem]
    summary: str


class IchimokuResponse(BaseModel):
    symbol: str
    bars: list[HistoricalBar]
    points: list[IchimokuPoint]
    wave_targets: list[WaveTargetSet]
    assessment: IchimokuAssessment
