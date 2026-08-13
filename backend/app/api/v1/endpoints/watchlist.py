import asyncio

import yfinance as yf
from fastapi import APIRouter, HTTPException, Query

from app.core.symbols import SYMBOL_SECTORS, WATCHLIST_SYMBOLS
from app.schemas.market import Quote, SymbolTrend, TickerSearchResult, WatchlistSymbol, WatchlistSymbolCreate
from app.services.market_service import market_service
from app.services.watchlist_repo import add_custom_ticker, list_custom_tickers

router = APIRouter()

_SEARCH_TIMEOUT_SECONDS = 10
_SEARCH_QUOTE_TYPES = {"EQUITY", "ETF", "INDEX"}
_SEARCH_LOOKUP_COUNT = 300
_SEARCH_MAX_RESULTS = 15
_SEARCH_RESULT_LIMIT = 8


def _match_rank(query: str, symbol: str, name: str) -> int | None:
    """Lower is better; None means "not relevant, drop it".

    Yahoo's raw results mix real ticker matches (e.g. CDR.WA for a "cdr"
    query) with results that only share the query as a substring of an
    unrelated product name (e.g. "JPMORGAN CDR (CAD HEDGED)"). Ranking
    symbol matches first is what makes typing "cdr" actually surface
    CDR.WA instead of burying it under those.
    """
    base_symbol = symbol.split(".")[0]
    if base_symbol == query:
        return 0
    if base_symbol.startswith(query):
        return 1
    if symbol.startswith(query):
        return 2
    if query in symbol:
        return 3
    if query in name:
        return 4
    return None


def _lookup_candidates(query: str) -> list[tuple[str, str | None, str | None]]:
    """Yahoo's ticker-prefix lookup - good at surfacing exact/near symbol
    matches, but its internal ranking fluctuates with live market data, so
    a borderline match (like a thinly-traded foreign listing) can drop in
    or out of a fixed-size page from one request to the next."""
    raw = yf.Lookup(query).get_all(count=_SEARCH_LOOKUP_COUNT)
    out = []
    for symbol, row in raw.iterrows():
        if str(row.get("quoteType", "")).upper() not in _SEARCH_QUOTE_TYPES:
            continue
        raw_name = row.get("shortName")
        raw_exchange = row.get("exchange")
        out.append((
            str(symbol).upper(),
            raw_name if isinstance(raw_name, str) else None,
            raw_exchange if isinstance(raw_exchange, str) else None,
        ))
    return out


def _search_candidates(query: str) -> list[tuple[str, str | None, str | None]]:
    """Yahoo's relevance/text search - a different backend index than
    Lookup, queried as a second source so a ticker missed by one (due to
    that live-ranking volatility) is still likely caught by the other."""
    results = yf.Search(query, max_results=_SEARCH_MAX_RESULTS).quotes
    return [
        (r["symbol"].upper(), r.get("shortname") or r.get("longname"), r.get("exchange"))
        for r in results
        if r.get("quoteType") in _SEARCH_QUOTE_TYPES and r.get("symbol")
    ]


def _search_symbols_sync(query: str) -> list[dict]:
    normalized = query.strip().upper()

    seen: dict[str, tuple[str | None, str | None]] = {}
    for symbol, name, exchange in [*_lookup_candidates(query), *_search_candidates(query)]:
        seen.setdefault(symbol, (name, exchange))

    ranked = []
    for symbol, (name, exchange) in seen.items():
        rank = _match_rank(normalized, symbol, (name or "").upper())
        if rank is None:
            continue
        ranked.append((rank, symbol, name, exchange))

    ranked.sort(key=lambda c: c[0])
    return [
        {"symbol": symbol, "name": name, "exchange": exchange}
        for _, symbol, name, exchange in ranked[:_SEARCH_RESULT_LIMIT]
    ]


@router.get("/symbols", response_model=list[WatchlistSymbol])
async def list_watchlist_symbols():
    """Static config (symbol + sector), no live data - instant, never fails.

    The frontend uses this to render the full sector-grouped layout right
    away, then fills in prices as they arrive via /api/v1/watchlist/ and
    the websocket. User-added tickers (from Postgres) are layered on top of
    the curated defaults.
    """
    entries = [WatchlistSymbol(symbol=symbol, sector=SYMBOL_SECTORS[symbol]) for symbol in WATCHLIST_SYMBOLS]
    for ticker in await list_custom_tickers():
        if ticker.symbol not in SYMBOL_SECTORS:
            entries.append(WatchlistSymbol(symbol=ticker.symbol, sector=ticker.sector))
    return entries


@router.get("/search", response_model=list[TickerSearchResult])
async def search_tickers(q: str = Query(min_length=1, max_length=50)):
    """Typeahead suggestions for the add-ticker input, backed by Yahoo
    Finance's own symbol search - surfaces the exact symbol (incl. exchange
    suffix, e.g. CDR.WA for CD Projekt on the Warsaw exchange) so users
    don't have to guess it."""
    try:
        return await asyncio.wait_for(asyncio.to_thread(_search_symbols_sync, q), timeout=_SEARCH_TIMEOUT_SECONDS)
    except Exception:
        return []


@router.post("/symbols", response_model=WatchlistSymbol, status_code=201)
async def add_watchlist_symbol(payload: WatchlistSymbolCreate):
    """Add a ticker to the watchlist: validates it against the live data
    provider first (rejects junk symbols), then persists it so it survives
    restarts."""
    symbol = payload.symbol.strip().upper()
    if not symbol:
        raise HTTPException(status_code=400, detail="symbol is required")

    if symbol in SYMBOL_SECTORS:
        return WatchlistSymbol(symbol=symbol, sector=SYMBOL_SECTORS[symbol])

    try:
        await market_service.get_quote(symbol)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"'{symbol}' doesn't look like a valid ticker") from exc

    try:
        ticker = await add_custom_ticker(symbol)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    market_service.track_custom_watchlist_symbol(symbol)
    return WatchlistSymbol(symbol=ticker.symbol, sector=ticker.sector)


@router.get("/", response_model=list[Quote])
async def list_watchlist():
    """Whatever's already cached - never blocks on a live fetch."""
    return market_service.get_cached_watchlist_quotes()


@router.get("/trends", response_model=list[SymbolTrend])
async def list_watchlist_trends():
    """Per-symbol Ichimoku trend outlook (week/day/h4/h1) for the watchlist
    table's trend columns. Whatever's already cached - never blocks on a
    live fetch; the background trend poll loop fills fields in
    progressively (it's a much larger pull than quotes, so expect several
    minutes for the first full pass)."""
    return market_service.get_cached_watchlist_trends()
