import math
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


def round_significant(value: float | None, digits: int = 6) -> float | None:
    """Rounds to `digits` significant digits (16.18250036239624 -> 16.1825).
    Raw float noise is most of a ranking's size (~9 MB for Nasdaq) and nothing
    needs more precision than this to compare a price with a level."""
    if value is None or value == 0 or not math.isfinite(value):
        return value
    return round(value, digits - 1 - math.floor(math.log10(abs(value))))


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


class PeriodChange(BaseModel):
    """Price change over a lookback window (1d/1w/1m/6m/1y), in price units
    and in percent."""

    change: float
    change_percent: float

    @field_validator("*")
    @classmethod
    def _round(cls, value: float | None) -> float | None:
        return round_significant(value)


class AnalystTargets(BaseModel):
    """Analysts' 12-month price target range for one symbol (Yahoo Finance).
    Any field is None when no analyst coverage exists. fetched_at drives the
    7-day refresh, including for symbols with no coverage."""

    low: float | None = None
    median: float | None = None
    high: float | None = None
    fetched_at: datetime


class VolForecast(BaseModel):
    """Method C: 3-month price band from volatility alone (no ML), plus the
    chance the price stays within +-15% of today's. Computed on the server
    from daily bars - see app/services/indicators/vol_band.py."""

    price: float
    low: float
    median: float
    high: float
    sigma: float
    p15: float
    as_of: str


class HypotheticalForecast(BaseModel):
    """Model-estimated price range for the next ~3 months (see app/ml). Trained
    and published offline; verdict says whether the model beat simple
    baselines in its out-of-sample test ("edge") or not ("no_edge")."""

    low: float
    median: float
    high: float
    as_of: str
    horizon_days: int
    model_version: str
    verdict: str
    # Out-of-sample backtest of this model's range (share of outcomes inside it, average width).
    backtest_coverage: float | None = None
    backtest_width: float | None = None


class TimeframeLevels(BaseModel):
    """Latest close plus Kijun-sen(52), simple moving averages and the
    current standard Ichimoku lines of one timeframe's bars (None when the
    history is too short, or in rankings saved before a field existed)."""

    close: float
    kijun52: float | None = None
    ma50: float | None = None
    ma100: float | None = None
    ma150: float | None = None
    ma200: float | None = None
    # Ichimoku (9/26/52) as of the last candle, for the "5-line" Setup signal.
    tenkan: float | None = None
    kijun: float | None = None
    senkou_a: float | None = None  # cloud under the last candle
    senkou_b: float | None = None
    chikou_ref: float | None = None  # close DISPLACEMENT bars back, which Chikou is compared with
    chikou_senkou_a: float | None = None  # cloud at the spot where Chikou is drawn
    chikou_senkou_b: float | None = None

    @field_validator("*")
    @classmethod
    def _round(cls, value: float | None) -> float | None:
        return round_significant(value)


class RankingEntry(BaseModel):
    """One row of a full index-universe bullish/bearish trend ranking:
    every symbol in the universe, scored by a weighted trend vote
    (day*4 + h4*3 + week*2 + h1*1, each +1/0/-1 for bullish/neutral/
    bearish), sorted highest score first - plus its trend breakdown and
    latest quote."""

    rank: int
    symbol: str
    sector: str
    score: int
    week: str | None = None
    day: str | None = None
    h4: str | None = None
    h1: str | None = None
    quote: Quote | None = None
    changes: dict[str, PeriodChange] = {}
    targets: AnalystTargets | None = None
    # Latest RSI(14) per timeframe ("h1"/"h4"/"day"/"week"/"month"), whichever
    # have been computed - filled in by Start and by the RSI filter scan.
    rsi: dict[str, float] = {}
    forecast: HypotheticalForecast | None = None
    vol_forecast: VolForecast | None = None
    # Latest price levels per timeframe ("week"/"day"/"h4"/"h1") for the ranking's Setup rule.
    levels: dict[str, TimeframeLevels] = {}


class RankingSummary(BaseModel):
    """What the last completed Start run downloaded and saved, shown in the
    "Finished" label. Counts are out of symbols_total."""

    symbols_total: int
    with_prices: int
    with_changes: int
    with_trend_d1: int
    with_trend_w1: int
    with_trend_h4: int | None = None
    with_trend_h1: int | None = None
    with_targets: int
    # Only set by runs from before analyst targets got their own download
    # ("Download forecasts" - see TargetsStatus); Start downloads prices only.
    targets_fetched: int | None = None
    targets_reused: int | None = None
    finished_at: datetime
    # Symbol downloads served by each history source (yfinance, alpaca, ...) during the run.
    sources: dict[str, int] = {}


class TargetsStatus(BaseModel):
    """Progress/result of the separate analyst price target download for one
    universe (POST /ranking/{universe}/targets/start). Targets are stored once
    per symbol for all universes, so ones fetched within the cache window (e.g.
    by another universe's run) are reused instead of downloaded again."""

    status: str = "idle"  # "idle" | "running" | "finished" | "failed"
    processed: int = 0
    total: int = 0  # symbols that needed downloading in this run
    fetched: int = 0
    reused: int = 0
    symbols_total: int = 0
    with_targets: int = 0  # symbols of the universe with analyst coverage
    finished_at: datetime | None = None
    error: str | None = None


class RankingStatus(BaseModel):
    """Progress of a background index ranking scan started by POST
    /ranking/{universe}/start. "processed"/"total" count the main-run steps
    (D1 + W1 symbol fetches and analyst-target lookups); H1/H4 are part
    of that run too, and are then re-downloaded automatically every hour; that
    hourly refresh is tracked separately in background_*."""

    status: str  # "idle" | "running" | "finished" | "failed"
    processed: int
    total: int
    updated_at: datetime | None = None
    phase: str | None = None  # "prices" while running
    error: str | None = None
    summary: RankingSummary | None = None
    intraday_updated_at: datetime | None = None  # when H1/H4 were last (re)downloaded
    background_status: str = "idle"  # "idle" | "running" | "finished" | "failed"
    background_processed: int = 0
    background_total: int = 0
    # Live per-source counts for the running (or last) Start run.
    sources: dict[str, int] = {}
    intraday_refresh_enabled: bool = False
    targets: TargetsStatus | None = None


class DownloadAllItem(BaseModel):
    universe: str
    # "pending" | "running" | "cached" (recent full run reused) | "finished" | "failed"
    state: str
    processed: int = 0
    total: int = 0
    error: str | None = None


class DownloadAllStatus(BaseModel):
    """Progress of "Download all": S&P 500, then Nasdaq, then Russell 2000, then NYSE."""

    status: str  # "idle" | "running" | "finished"
    percent: int
    current: str | None = None
    items: list[DownloadAllItem]
    finished_at: datetime | None = None


class RsiScanStatus(BaseModel):
    """Progress of the RSI filter scan: (re)computes RSI for every symbol in
    the universe on one timeframe, reusing recent values when still fresh."""

    status: str  # "idle" | "running" | "finished" | "failed"
    timeframe: str | None = None
    processed: int = 0
    total: int = 0
    source: str | None = None  # "cached" | "downloaded"
    updated_at: datetime | None = None  # when this timeframe's RSI was computed
    error: str | None = None


class ForecastScanStatus(RsiScanStatus):
    """Progress of the volatility-forecast scan started from the button above
    the table (same shape as the RSI scan; `timeframe` is always "day")."""


class KitchinInstrument(BaseModel):
    """One macro instrument tracked on the Kitchin tab (a bond yield, an
    equity index, or a commodity), with its 1d/1w/1m price change."""

    name: str
    symbol: str
    category: str  # "bonds" | "stocks" | "commodities"
    region: str  # "US" | "Japan" | "Europe" | "Global"
    price: float
    change_1d: PeriodChange | None = None
    change_1w: PeriodChange | None = None
    change_1m: PeriodChange | None = None


class KitchinPhaseScore(BaseModel):
    """One of the 6 canonical bonds/stocks/commodities direction states from
    the reference Kitchin-cycle chart, with the model's confidence (0-100,
    all 6 sum to 100) that this is the phase we're currently in."""

    phase: int  # 1..6
    label: str  # short Polish label, e.g. "Wczesny wzrost"
    header: str  # which of the 4 chart headers this sub-phase belongs to
    bonds_up: bool
    stocks_up: bool
    commodities_up: bool
    percent: float


class KitchinSnapshot(BaseModel):
    """Full state of the Kitchin tab: every tracked instrument plus the
    resulting 6-way phase read, refreshed at most every few hours (macro
    series move far slower than the ranking universes)."""

    instruments: list[KitchinInstrument]
    phases: list[KitchinPhaseScore]
    dominant_phase: int
    updated_at: datetime | None = None
    error: str | None = None
