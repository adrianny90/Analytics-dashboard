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
│       │   └── config.py      Pydantic settings (env-driven)
│       ├── schemas/
│       │   └── market.py      Quote / HistoricalBar / IndexSummary models
│       ├── services/
│       │   ├── market_service.py   Orchestrates providers, in-memory quote cache,
│       │   │                       poll loop, websocket broadcast
│       │   └── providers/
│       │       ├── base.py             MarketDataProvider interface
│       │       ├── yfinance_provider.py Free quotes/history, no API key
│       │       └── finnhub_provider.py  Optional real-time trade stream
│       ├── api/v1/
│       │   ├── router.py      REST router aggregation
│       │   ├── ws.py          /ws/prices websocket endpoint
│       │   └── endpoints/     indices.py, quotes.py, history.py
│       └── websocket/
│           └── manager.py     WebSocket connection registry + broadcast
│
└── frontend/                  Next.js 14 App Router app
    └── src/
        ├── app/
        │   ├── page.tsx                Dashboard (index cards)
        │   └── symbol/[symbol]/page.tsx Symbol detail + chart
        ├── components/        IndexCard, PriceChart
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

| Index             | Ticker  | Live proxy ETF |
|--------------------|---------|----------------|
| S&P 500            | ^GSPC   | SPY            |
| Nasdaq Composite    | ^IXIC   | QQQ            |
| Russell 2000        | ^RUT    | IWM            |

Two providers back this:

- **[yfinance](https://github.com/ranaroussi/yfinance)** — open-source,
  no API key required. Used for quotes and historical OHLC bars everywhere.
  The backend polls it every `POLL_INTERVAL_SECONDS` (default 5s) and pushes
  updates to connected clients over the websocket.
- **[Finnhub](https://finnhub.io/)** — free tier includes a real-time trade
  websocket for US equities/ETFs (not raw indices). If you set
  `FINNHUB_API_KEY` in `backend/.env`, SPY/QQQ/IWM trades stream in live and
  overwrite the cache instantly; without a key, the app still works fine on
  the yfinance polling loop alone.

Swapping in another provider (Alpha Vantage, Twelve Data, IEX, Polygon, etc.)
just means implementing `MarketDataProvider` in `backend/app/services/providers/`.

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
- `GET /api/v1/quotes/{symbol}` — latest quote for any ticker
- `GET /api/v1/history/{symbol}?period=6mo&interval=1d` — historical OHLC bars
- `WS /ws/prices` — send `{"action": "subscribe", "symbols": ["SPY"]}`, receive `{"type": "quote", "data": {...}}` pushes

## Possible next steps

- Persist historical quotes to a time-series store (TimescaleDB/InfluxDB) instead of relying on yfinance for every history request
- Add a watchlist/search page for arbitrary tickers beyond the three indices
- Dockerize both services with a `docker-compose.yml` for one-command startup
- Add authentication if this moves beyond a personal/portfolio project
