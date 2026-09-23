"""Interchangeable sources of historical OHLCV bars for the ranking scans.

Every source returns the exact frame shape YFinanceProvider.get_history_frames
produces, so the rest of the pipeline (series_from_frame -> Ichimoku/RSI/levels)
can't tell them apart:

- columns Open/High/Low/Close/Volume, prices split-adjusted (not dividend-adjusted,
  i.e. Yahoo's "Close" with auto_adjust=False);
- "1h": tz-aware America/New_York index, regular session only, bars starting at
  9:30, 10:30, ... 15:30 (the last one half an hour long) - what Yahoo returns.
  Sources whose hourly bars start on the full hour (and include pre/post market)
  are downloaded as 30-minute bars and regrouped onto Yahoo's grid instead;
- "1d": naive midnight dates; "1wk": naive Monday dates; "1mo": naive first of month.

HistoryRouter (app/services/history_router.py) runs them side by side and falls
back from one to another when a source hits its limits.
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone

import httpx
import pandas as pd
from yfinance.exceptions import YFRateLimitError

from app.core.config import settings
from app.core.rate_limit import rate_gate
from app.services.providers.yfinance_provider import YFinanceProvider

logger = logging.getLogger(__name__)

NY_TZ = "America/New_York"
COLUMNS = ["Open", "High", "Low", "Close", "Volume"]
_AGG = {"Open": "first", "High": "max", "Low": "min", "Close": "last", "Volume": "sum"}
_HTTP_TIMEOUT = httpx.Timeout(30.0)


class SourceRateLimited(Exception):
    """The source asked us to slow down. `count_attempt` is False for an explicit
    rate-limit answer (the request itself was fine - just retry later) and True
    when the limit is only suspected (e.g. Yahoo's silently empty batches)."""

    def __init__(self, retry_after: float, count_attempt: bool = False) -> None:
        super().__init__(f"rate limited, retry in {retry_after:.0f}s")
        self.retry_after = retry_after
        self.count_attempt = count_attempt


class SourceUnavailable(Exception):
    """The source can't be used for the rest of this run (bad key, plan limit,
    daily quota spent)."""


_PERIOD_UNITS = {"d": "days", "wk": "weeks", "mo": "months", "y": "years"}


def period_start(period: str, now: datetime | None = None) -> datetime:
    """Start of a yfinance-style period ("5d", "12mo", "5y", "max") as a UTC datetime."""
    now = now or datetime.now(timezone.utc)
    if period == "max":
        return now - pd.DateOffset(years=20)
    for suffix, unit in sorted(_PERIOD_UNITS.items(), key=lambda item: -len(item[0])):
        if period.endswith(suffix):
            return now - pd.DateOffset(**{unit: int(period[: -len(suffix)])})
    raise ValueError(f"unsupported period {period!r}")


def to_dotted(symbol: str) -> str:
    """Yahoo writes share classes with a hyphen (BRK-B); every other source uses a dot."""
    return symbol.replace("-", ".")


def _frame(rows: list[tuple], index_utc: bool = True) -> pd.DataFrame:
    """rows: (timestamp, open, high, low, close, volume)."""
    df = pd.DataFrame(rows, columns=["ts", *COLUMNS])
    df["ts"] = pd.to_datetime(df["ts"], utc=index_utc)
    df = df.set_index("ts").sort_index()
    df = df[~df.index.duplicated(keep="last")]
    df[COLUMNS] = df[COLUMNS].astype(float)
    # Days without trades can come back without a volume; Yahoo reports 0 there.
    df["Volume"] = df["Volume"].fillna(0)
    return df


def intraday_to_hourly(df: pd.DataFrame) -> pd.DataFrame:
    """30-minute (or finer) bars -> Yahoo's hourly grid: regular session only,
    buckets starting at 9:30, 10:30, ... 15:30 New York time."""
    if df.empty:
        return df
    if df.index.tz is None:
        df = df.tz_localize(NY_TZ)
    else:
        df = df.tz_convert(NY_TZ)
    df = df.between_time("09:30", "15:59")
    hourly = df.resample("1h", offset="30min").agg(_AGG).dropna(subset=["Open"])
    hourly.index.name = "Datetime"
    return hourly


def to_daily_index(df: pd.DataFrame) -> pd.DataFrame:
    """Any bar timestamps within a trading day -> naive midnight date of that day in New York."""
    if df.empty:
        return df
    index = df.index
    if index.tz is not None:
        index = index.tz_convert(NY_TZ).tz_localize(None)
    df = df.copy()
    df.index = index.normalize()
    df.index.name = "Date"
    return df[~df.index.duplicated(keep="last")]


def daily_to(interval: str, daily: pd.DataFrame) -> pd.DataFrame:
    """Daily bars -> "1d" (unchanged), "1wk" (Monday-labelled) or "1mo" (first of month)."""
    if interval == "1d" or daily.empty:
        return daily
    if interval == "1wk":
        out = daily.resample("W-MON", label="left", closed="left").agg(_AGG)
    elif interval == "1mo":
        out = daily.resample("MS").agg(_AGG)
    else:
        raise ValueError(f"unsupported interval {interval!r}")
    out = out.dropna(subset=["Open"])
    out.index.name = "Date"
    return out


class _Limiter:
    """Spacing between requests (credits per minute), an optional daily quota and
    a cooldown after the source answers "too many requests"."""

    def __init__(self, per_minute: float, per_day: int | None = None) -> None:
        self._spacing = 60.0 / per_minute if per_minute > 0 else 0.0
        self._per_day = per_day
        self._lock = asyncio.Lock()
        self._next_at = 0.0
        self._day: str | None = None
        self._used_today = 0
        self.cooldown_until = 0.0

    def available_in(self) -> float:
        return max(0.0, self.cooldown_until - time.monotonic())

    def cool_down(self, seconds: float) -> None:
        self.cooldown_until = max(self.cooldown_until, time.monotonic() + seconds)

    async def acquire(self, credits: int = 1) -> None:
        async with self._lock:
            if self._per_day is not None:
                today = datetime.now(timezone.utc).date().isoformat()
                if today != self._day:
                    self._day, self._used_today = today, 0
                if self._used_today + credits > self._per_day:
                    raise SourceUnavailable("daily request quota used up")
                self._used_today += credits
            wait = self._next_at - time.monotonic()
            if wait > 0:
                await asyncio.sleep(wait)
            self._next_at = time.monotonic() + self._spacing * credits


class HistorySource:
    name: str
    # Symbols handed to one fetch() call, and how many fetches may run at once.
    batch_size: int = 1
    workers: int = 1
    intervals: frozenset[str] = frozenset({"1h", "1d", "1wk", "1mo"})

    def configured(self) -> bool:
        return True

    def supports(self, interval: str) -> bool:
        return interval in self.intervals

    def available_in(self) -> float:
        """Seconds until the source may be asked again (0 = now)."""
        return 0.0

    async def fetch(self, symbols: list[str], period: str, interval: str) -> dict[str, pd.DataFrame]:
        """Frames for the symbols the source has data for; symbols it doesn't know
        are simply missing from the result. Raises SourceRateLimited /
        SourceUnavailable."""
        raise NotImplementedError

    async def aclose(self) -> None:
        return None


class _HttpSource(HistorySource):
    def __init__(self, limiter: _Limiter) -> None:
        self._limiter = limiter
        self._client: httpx.AsyncClient | None = None

    def available_in(self) -> float:
        return self._limiter.available_in()

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=_HTTP_TIMEOUT, headers=self._headers())
        return self._client

    def _headers(self) -> dict[str, str]:
        return {}

    async def _get(self, url: str, params: dict, credits: int = 1) -> httpx.Response:
        await self._limiter.acquire(credits)
        try:
            response = await self.client.get(url, params=params)
        except httpx.TransportError as exc:
            # Nasdaq in particular starts stalling a long-lived connection after a
            # few hundred requests while a fresh one is answered at once - so drop
            # the connection pool and let the next request open a new one.
            await self.aclose()
            raise RuntimeError(f"{self.name}: {type(exc).__name__}") from exc
        if response.status_code == 429:
            retry_after = float(response.headers.get("Retry-After") or 60)
            self._limiter.cool_down(retry_after)
            raise SourceRateLimited(retry_after)
        if response.status_code in (401, 403):
            raise SourceUnavailable(f"{self.name}: HTTP {response.status_code} {response.text[:200]}")
        return response

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None


class YFinanceSource(HistorySource):
    """The original source (Yahoo, no key). Shares the process-wide Yahoo
    rate-limit pause with the rest of the backend (see rate_gate)."""

    name = "yfinance"
    batch_size = 15  # = POLL_BATCH_SIZE, sized for Render's 512MB (see market_service)

    def __init__(self) -> None:
        self._provider = YFinanceProvider()

    def available_in(self) -> float:
        return rate_gate.remaining()

    async def fetch(self, symbols: list[str], period: str, interval: str) -> dict[str, pd.DataFrame]:
        try:
            frames = await self._provider.get_history_frames(symbols, period, interval, lane="ranking")
        except YFRateLimitError:
            raise SourceRateLimited(rate_gate.trip("history download"))
        if not frames and len(symbols) > 1:
            # An entirely empty multi-ticker answer is usually a silently
            # swallowed rate limit rather than 15 delisted symbols.
            raise SourceRateLimited(rate_gate.trip("history download (empty batch)"), count_attempt=True)
        return {symbol: frame[COLUMNS] for symbol, frame in frames.items()}


class AlpacaSource(_HttpSource):
    """Alpaca Market Data v2 (free account: 200 requests/min, many symbols per
    request). https://docs.alpaca.markets/us/reference/stockbars"""

    name = "alpaca"
    batch_size = 20
    workers = 2
    _URL = "https://data.alpaca.markets/v2/stocks/bars"

    def __init__(self) -> None:
        super().__init__(_Limiter(settings.alpaca_requests_per_minute))

    def configured(self) -> bool:
        return bool(settings.alpaca_api_key and settings.alpaca_api_secret)

    def _headers(self) -> dict[str, str]:
        return {
            "APCA-API-KEY-ID": settings.alpaca_api_key or "",
            "APCA-API-SECRET-KEY": settings.alpaca_api_secret or "",
        }

    async def fetch(self, symbols: list[str], period: str, interval: str) -> dict[str, pd.DataFrame]:
        by_alpaca = {to_dotted(s): s for s in symbols}
        now = datetime.now(timezone.utc)
        params: dict = {
            "symbols": ",".join(by_alpaca),
            "timeframe": "30Min" if interval == "1h" else "1Day",
            "start": period_start(period, now).strftime("%Y-%m-%dT%H:%M:%SZ"),
            # The free plan may read the full (SIP) feed only up to 15 minutes ago.
            "end": (now - timedelta(minutes=16)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "adjustment": "split",
            "feed": settings.alpaca_feed,
            "limit": 10000,
            "sort": "asc",
        }
        rows: dict[str, list[tuple]] = {}
        while True:
            response = await self._get(self._URL, params)
            if response.status_code != 200:
                raise RuntimeError(f"alpaca HTTP {response.status_code}: {response.text[:200]}")
            payload = response.json()
            for alpaca_symbol, bars in (payload.get("bars") or {}).items():
                rows.setdefault(alpaca_symbol, []).extend(
                    (b["t"], b["o"], b["h"], b["l"], b["c"], b["v"]) for b in bars
                )
            token = payload.get("next_page_token")
            if not token:
                break
            params["page_token"] = token
        result: dict[str, pd.DataFrame] = {}
        for alpaca_symbol, symbol_rows in rows.items():
            symbol = by_alpaca.get(alpaca_symbol)
            if symbol is None or not symbol_rows:
                continue
            df = _frame(symbol_rows)
            df = intraday_to_hourly(df) if interval == "1h" else daily_to(interval, to_daily_index(df))
            if len(df):
                result[symbol] = df
        return result


class PolygonSource(_HttpSource):
    """Polygon.io / Massive aggregates (free plan: 5 requests/min, 2 years of
    history, one symbol per request)."""

    name = "polygon"
    intervals = frozenset({"1h", "1d", "1wk", "1mo"})

    def __init__(self) -> None:
        super().__init__(_Limiter(settings.polygon_requests_per_minute))

    def configured(self) -> bool:
        return bool(settings.polygon_api_key)

    async def fetch(self, symbols: list[str], period: str, interval: str) -> dict[str, pd.DataFrame]:
        symbol = symbols[0]
        now = datetime.now(timezone.utc)
        multiplier, timespan = (30, "minute") if interval == "1h" else (1, "day")
        url = (
            f"{settings.polygon_base_url}/v2/aggs/ticker/{to_dotted(symbol)}/range/{multiplier}/{timespan}"
            f"/{period_start(period, now).date().isoformat()}/{now.date().isoformat()}"
        )
        params = {"adjusted": "true", "sort": "asc", "limit": 50000, "apiKey": settings.polygon_api_key}
        rows: list[tuple] = []
        while url:
            response = await self._get(url, params)
            if response.status_code == 404:
                return {}
            if response.status_code != 200:
                raise RuntimeError(f"polygon HTTP {response.status_code}: {response.text[:200]}")
            payload = response.json()
            rows.extend(
                (pd.Timestamp(r["t"], unit="ms", tz="UTC"), r["o"], r["h"], r["l"], r["c"], r.get("v", 0))
                for r in payload.get("results") or []
            )
            url = payload.get("next_url")
            params = {"apiKey": settings.polygon_api_key}
        if not rows:
            return {}
        df = _frame(rows)
        df = intraday_to_hourly(df) if interval == "1h" else daily_to(interval, to_daily_index(df))
        return {symbol: df} if len(df) else {}


class TwelveDataSource(_HttpSource):
    """Twelve Data time_series (free plan: 8 credits/min, 800/day, one credit per
    symbol, up to 5000 bars per symbol)."""

    name = "twelvedata"
    batch_size = 8
    _URL = "https://api.twelvedata.com/time_series"

    def __init__(self) -> None:
        super().__init__(_Limiter(settings.twelvedata_credits_per_minute, settings.twelvedata_credits_per_day))

    def configured(self) -> bool:
        return bool(settings.twelvedata_api_key)

    async def fetch(self, symbols: list[str], period: str, interval: str) -> dict[str, pd.DataFrame]:
        by_td = {to_dotted(s): s for s in symbols}
        now = datetime.now(timezone.utc)
        start = pd.Timestamp(period_start(period, now)).tz_convert(NY_TZ)
        params = {
            "symbol": ",".join(by_td),
            "interval": "30min" if interval == "1h" else "1day",
            "start_date": start.strftime("%Y-%m-%d %H:%M:%S"),
            "outputsize": 5000,
            "order": "ASC",
            "adjust": "splits",
            "timezone": NY_TZ,
            "apikey": settings.twelvedata_api_key,
        }
        response = await self._get(self._URL, params, credits=len(by_td))
        if response.status_code != 200:
            raise RuntimeError(f"twelvedata HTTP {response.status_code}: {response.text[:200]}")
        payload = response.json()
        if payload.get("status") == "error" or "values" in payload:
            # A single-symbol request answers with the series itself, not keyed by symbol.
            payload = {next(iter(by_td)): payload}
        result: dict[str, pd.DataFrame] = {}
        for td_symbol, series in payload.items():
            symbol = by_td.get(td_symbol)
            if symbol is None or not isinstance(series, dict):
                continue
            if series.get("status") == "error":
                if series.get("code") == 429:
                    self._limiter.cool_down(60)
                    raise SourceRateLimited(60)
                continue
            values = series.get("values") or []
            if not values:
                continue
            rows = [
                (v["datetime"], v["open"], v["high"], v["low"], v["close"], v.get("volume") or 0) for v in values
            ]
            df = _frame(rows, index_utc=False)
            df = intraday_to_hourly(df) if interval == "1h" else daily_to(interval, to_daily_index(df))
            if len(df):
                result[symbol] = df
        return result


class NasdaqSource(_HttpSource):
    """Nasdaq.com's public quote API (no key; daily bars only, split-adjusted,
    up to 10 years; one symbol per request). W1/M1 are built from the daily bars."""

    name = "nasdaq"
    workers = 3
    intervals = frozenset({"1d", "1wk", "1mo"})
    _URL = "https://api.nasdaq.com/api/quote/{symbol}/historical"

    def __init__(self) -> None:
        super().__init__(_Limiter(settings.nasdaq_requests_per_minute))
        # Stocks and ETFs live under different asset classes; remember which one worked.
        self._asset_class: dict[str, str] = {}

    def configured(self) -> bool:
        return settings.nasdaq_history_enabled

    def _headers(self) -> dict[str, str]:
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/126.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://www.nasdaq.com",
            "Referer": "https://www.nasdaq.com/",
        }

    async def fetch(self, symbols: list[str], period: str, interval: str) -> dict[str, pd.DataFrame]:
        symbol = symbols[0]
        now = datetime.now(timezone.utc)
        start = max(period_start(period, now), now - pd.DateOffset(years=10) + timedelta(days=1))
        params = {"fromdate": start.date().isoformat(), "todate": now.date().isoformat(), "limit": 9999}
        url = self._URL.format(symbol=to_dotted(symbol))
        known = self._asset_class.get(symbol)
        for asset_class in [known] if known else ["stocks", "etf"]:
            response = await self._get(url, {**params, "assetclass": asset_class})
            if response.status_code != 200:
                raise RuntimeError(f"nasdaq HTTP {response.status_code}")
            table = ((response.json().get("data") or {}).get("tradesTable") or {}).get("rows")
            if table:
                self._asset_class[symbol] = asset_class
                break
        else:
            return {}
        rows = [
            (
                datetime.strptime(r["date"], "%m/%d/%Y"),
                _nasdaq_number(r["open"]),
                _nasdaq_number(r["high"]),
                _nasdaq_number(r["low"]),
                _nasdaq_number(r["close"]),
                _nasdaq_number(r["volume"]),
            )
            for r in table
        ]
        df = _frame(rows, index_utc=False).dropna(subset=["Close"])
        # Days without trades come back with open/high/low as "N/A".
        for column in ("Open", "High", "Low"):
            df[column] = df[column].fillna(df["Close"])
        df = daily_to(interval, to_daily_index(df))
        return {symbol: df} if len(df) else {}


def _nasdaq_number(value: str | None) -> float | None:
    if value in (None, "", "N/A"):
        return None
    try:
        return float(value.replace("$", "").replace(",", ""))
    except ValueError:
        return None


SOURCE_CLASSES: dict[str, type[HistorySource]] = {
    "yfinance": YFinanceSource,
    "alpaca": AlpacaSource,
    "polygon": PolygonSource,
    "twelvedata": TwelveDataSource,
    "nasdaq": NasdaqSource,
}


def build_sources(names: list[str] | None = None) -> list[HistorySource]:
    """The configured sources, in settings.history_sources order (or `names`)."""
    wanted = names or [n.strip() for n in settings.history_sources.split(",") if n.strip()]
    sources = []
    for name in wanted:
        cls = SOURCE_CLASSES.get(name)
        if cls is None:
            logger.warning("unknown history source %r in HISTORY_SOURCES - ignored", name)
            continue
        source = cls()
        if source.configured():
            sources.append(source)
    return sources
