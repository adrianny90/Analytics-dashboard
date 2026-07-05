# Analytics Dashboard — US Stock Market

A dashboard tracking S&P 500, Nasdaq, and Russell 2000, built with a Next.js
(TypeScript/React) frontend and a Python FastAPI backend.

## Architecture

```
analytics_dashboard/
├── backend/                   FastAPI app
│   └── app/
│       ├── main.py            App entrypoint, CORS, lifespan (starts/stops market_service)
│       ├── core/
│       │   ├── config.py      Pydantic settings (env-driven)
│       │   └── symbols.py     Watchlist tickers + TradingView-style alias mapping
│       ├── schemas/
│       │   └── market.py      Quote / HistoricalBar / IndexSummary / WatchlistSymbol / Timeframe
│       ├── services/
│       │   ├── market_service.py   Orchestrates providers, alias resolution, history +
│       │   │                       quote caching, circuit breaker, fallback chain,
│       │   │                       poll loop, websocket broadcast, timeframe->candles
│       │   └── providers/
│       │       ├── base.py             MarketDataProvider interface
│       │       ├── yfinance_provider.py Free quotes/history (+ H4 resampling), no API key
│       │       └── finnhub_provider.py  Real-time trade stream (SPY/QQQ/IWM) +
│       │                               REST quote fallback for other equities
│       ├── api/v1/
│       │   ├── router.py      REST router aggregation
│       │   ├── ws.py          /ws/prices websocket endpoint
│       │   └── endpoints/     indices.py, quotes.py, history.py, watchlist.py
│       └── websocket/
│           └── manager.py     WebSocket connection registry + broadcast
│
└── frontend/                  Next.js 14 App Router app
    └── src/
        ├── app/
        │   ├── page.tsx                Dashboard (index cards + watchlist table)
        │   └── symbol/[symbol]/page.tsx Symbol detail, candlestick chart, timeframe switcher
        ├── components/        IndexCard, Watchlist, PriceChart, CandlestickChart
        ├── hooks/
        │   └── useLiveQuotes.ts  Subscribes to /ws/prices, merges live ticks
        ├── lib/api.ts          REST client
        └── types/market.ts     Shared TS types mirroring backend schemas
```

## Data sources (free, real-time-capable)

Real US index values (S&P 500, Nasdaq Composite, Russell 2000) aren't
available real-time from any free source — even Yahoo Finance delays index
tickers (`^GSPC`, `^IXIC`, `^RUT`) by ~15-20 minutes. To get genuinely live
prices for free, each index is tracked through the ETF that shadows it almost
tick-for-tick:

| Index            | Ticker | Live proxy ETF |
| ---------------- | ------ | -------------- |
| S&P 500          | ^GSPC  | SPY            |
| Nasdaq Composite | ^IXIC  | QQQ            |
| Russell 2000     | ^RUT   | IWM            |

Two providers back this:

- **[yfinance](https://github.com/ranaroussi/yfinance)** — open-source,
  no API key required. Used for quotes and historical OHLC bars everywhere.
  The backend polls it every `POLL_INTERVAL_SECONDS` (default 30s) and pushes
  updates to connected clients over the websocket.
- **[Finnhub](https://finnhub.io/)** — free tier includes a real-time trade
  websocket for US equities/ETFs (not raw indices). If you set
  `FINNHUB_API_KEY` in `backend/.env`, SPY/QQQ/IWM trades stream in live and
  overwrite the cache instantly; without a key, the app still works fine on
  the yfinance polling loop alone.

Swapping in another provider (Alpha Vantage, Twelve Data, IEX, Polygon, etc.)
just means implementing `MarketDataProvider` in `backend/app/services/providers/`.

### Resilience: Yahoo rate limits and blocks

Yahoo's unofficial API rate-limits aggressively, and once triggered the block
can be a genuine server-side ban lasting well past any client-side pacing fix
— this app now tracks **99 symbols**, which makes that a when, not an if.
`yfinance` already impersonates a real Chrome TLS fingerprint under the hood
(via `curl_cffi`, installed automatically as a yfinance dependency), so a
persistent `429`/crumb failure past that point is Yahoo itself blocking the
IP, not something a client-side header trick fixes. The app is built to stay
usable through that:

1. **Global request throttle** — every yfinance call is serialized through a
   single spacer (`YFINANCE_REQUEST_SPACING_SECONDS`, default 1.2s), so fetches
   for many symbols become a steady trickle instead of a burst.
2. **Lightweight quotes** — quotes come from a tiny 5-day daily-bar request
   rather than `fast_info` (which on current Yahoo restrictions can silently
   pull a full year of history just to compute one price).
3. **Circuit breaker** — once Yahoo returns `429`, all yfinance calls (polling
   and on-demand REST) pause for `RATE_LIMIT_COOLDOWN_SECONDS` (default 180s)
   instead of retrying every cycle and getting blocked again immediately.
4. **Finnhub REST fallback** — if `FINNHUB_API_KEY` is set, a failed yfinance
   quote for a plain equity (not a world index) falls back to Finnhub's
   `/quote` endpoint (legitimate, key-based, 60 req/min free tier) instead of
   failing outright. The returned quote is marked `"stale": true` so the UI
   can show a "delayed" badge.
5. **Serve last-known-good, always** — both quotes and chart history are
   cached; on any failure (rate limit or otherwise) the last successfully
   fetched value keeps being served — i.e. the last closed daily/hourly bar —
   rather than erroring out. A brand-new symbol with no cache yet and no
   working fallback is the only case that surfaces an error.

If you still see repeated `YFRateLimitError` in the logs, raise
`POLL_INTERVAL_SECONDS`/`YFINANCE_REQUEST_SPACING_SECONDS` further, add a
Finnhub key, or trim `EQUITY_SECTORS` in `symbols.py`. With 99 symbols even at
default pacing, one full poll pass takes ~2 minutes — that's the honest
tradeoff of a free, unofficial, no-signup data source at this scale.

### Watchlist symbols and sectors

`backend/app/core/symbols.py` is the single source of truth: `EQUITY_SECTORS`
maps every one of the 84 tracked stocks to a sector (Technology, Healthcare,
Financials, Energy, Industrials, Consumer Discretionary, Materials,
Communication Services, Utilities, Crypto Mining, Aerospace & Defense), and
`WORLD_INDEX_SECTORS` covers 15 indices, all grouped as "Index". Both feed
directly into `WATCHLIST_SYMBOLS` (deduplicated automatically) and the
`GET /api/v1/watchlist/symbols` endpoint the frontend uses to render
sector-grouped sections. Sectors are hand-assigned rather than fetched live,
since pulling `.info` per ticker would add a whole extra Yahoo request per
symbol on an already rate-limit-sensitive API.

A number of symbols are TradingView/CFD-style or shorthand names with no
direct Yahoo Finance ticker, remapped transparently via `SYMBOL_ALIASES` (the
API still returns the original symbol name):

| Watchlist symbol | Resolved to  | What it is                    |
|-------------------|--------------|--------------------------------|
| VIX                | ^VIX         | CBOE Volatility Index          |
| US100              | ^NDX         | Nasdaq 100                      |
| US30                | ^DJI         | Dow Jones Industrial Average    |
| DJ30                | ^DJI         | Dow Jones Industrial Average (alt name) |
| UK100               | ^FTSE        | FTSE 100                        |
| NIKKEI              | ^N225        | Nikkei 225 (Japan)               |
| DAX / DAX30         | ^GDAXI       | DAX (Germany)                    |
| CAC40               | ^FCHI        | CAC 40 (France)                  |
| ESTX50              | ^STOXX50E    | Euro Stoxx 50                    |
| HSI                 | ^HSI         | Hang Seng (Hong Kong)             |
| SSEC                | 000001.SS    | Shanghai Composite (China)        |
| ASX200              | ^AXJO        | ASX 200 (Australia)               |
| TSX                 | ^GSPTSE      | S&P/TSX Composite (Canada)        |
| WIG20               | WIG20.WA     | WIG20 (Poland) — best-effort; Yahoo's coverage of the Warsaw exchange is patchy, so this one may simply return no data |

To add/remove tickers, edit `EQUITY_SECTORS`/`WORLD_INDEX_SECTORS`/`SYMBOL_ALIASES`
in `backend/app/core/symbols.py` — everything downstream picks it up automatically.

### Chart timeframes

The symbol detail page renders Japanese candlesticks with a Month / Week /
Day / H4 / H1 switcher, backed by `GET /api/v1/history/{symbol}?timeframe=...`.
Yahoo has no native 4-hour interval, so H4 candles are synthesized
server-side by resampling hourly bars (open=first, high=max, low=min,
close=last, volume=sum) — an approximation of session-aligned H4 charts, not
pixel-identical to TradingView.

## Running locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # optionally add FINNHUB_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Visit `http://localhost:3000`. The backend serves REST at
`http://localhost:8000/api/v1/...` and live prices over
`ws://localhost:8000/ws/prices`.

## Endpoints

- `GET /api/v1/indices/` — S&P 500, Nasdaq, Russell 2000 summaries (proxy quote attached)
- `GET /api/v1/quotes/{symbol}` — latest quote for any ticker (alias-resolved, fallback-aware)
- `GET /api/v1/watchlist/symbols` — static `{symbol, sector}` list, instant, never fails
- `GET /api/v1/watchlist/` — cached quotes only, never blocks on a live fetch
- `GET /api/v1/history/{symbol}?timeframe=day` — candles for month/week/day/h4/h1
- `GET /api/v1/history/{symbol}?period=6mo&interval=1d` — raw yfinance period/interval passthrough
- `WS /ws/prices` — send `{"action": "subscribe", "symbols": ["SPY"]}`, receive `{"type": "quote", "data": {...}}` pushes

The dashboard loads `watchlist/symbols` first (instant, renders the full
sector layout with placeholder rows), then merges in `watchlist/` (whatever's
cached so far) and live websocket pushes as the background poll loop works
through the list — so the page is usable immediately rather than blocking on
a ~2-minute full refresh.

## Possible next steps

- Persist historical quotes to a time-series store (TimescaleDB/InfluxDB) instead of relying on yfinance for every history request
- Add a search box to look up arbitrary tickers beyond the fixed watchlist
- Dockerize both services with a `docker-compose.yml` for one-command startup
- Add authentication if this moves beyond a personal/portfolio project
