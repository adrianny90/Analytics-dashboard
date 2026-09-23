from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Market Analytics Dashboard API"
    cors_origins: list[str] = ["http://localhost:3000","https://analytics-dashboard-ui.onrender.com"]
    finnhub_api_key: str | None = None

    # Neon Postgres connection string (libpq-style, e.g.
    # "postgresql://user:pass@host/db?sslmode=require&channel_binding=require").
    # Optional: user-added watchlist tickers just won't persist without it.
    database_url: str | None = Field(default=None, validation_alias="DATABASE_NEON")

    # Yahoo's unofficial API rate-limits aggressively, especially with a
    # watchlist this size. These control how gently the poll loop and any
    # on-demand fetch treat it.
    poll_interval_seconds: int = 45
    yfinance_request_spacing_seconds: float = 1.2
    rate_limit_cooldown_seconds: int = 180
    # Ranking scans are bulk downloads (thousands of symbols); they get a wider
    # gap between batches than interactive/polling requests.
    ranking_request_spacing_seconds: float = 3.0
    # Parallel connections inside one multi-ticker download (yfinance default
    # is one per ticker, i.e. a burst of ~15 requests at once).
    yfinance_download_threads: int = 3

    # How long ranking data that is expensive to fetch (analyst price targets,
    # on-demand period changes) is reused, from memory or the database,
    # before Yahoo is asked again.
    ranking_cache_hours: int = 24

    # How long a successfully fetched chart (history/candles) response is
    # considered fresh before a new one is attempted. Failed refreshes still
    # serve the last cached response indefinitely past this TTL.
    history_cache_ttl_seconds: int = 300

    # A full trend pass (week/day/h4/h1 Ichimoku assessment for every
    # watchlist symbol) is itself several minutes of throttled Yahoo calls,
    # so this is just the pause between passes, not a hard period.
    trend_poll_interval_seconds: int = 60

    # How often the in-memory quote/trend caches are snapshotted to
    # Postgres, so a restart can repopulate the dashboard immediately
    # instead of starting from empty. Best-effort: a crash can still lose
    # up to this much, and it's a no-op entirely when no database is
    # configured.
    snapshot_save_interval_seconds: int = 60

    # Automatic hourly re-download of H1/H4 for every universe that has a
    # ranking. Off: with the data sources' rate limits a full pass takes far
    # longer than an hour, so it only competed with Start. Start still
    # downloads H1/H4 together with D1/W1.
    intraday_refresh_enabled: bool = False

    # Sources of historical bars for Start / "Download all" (see
    # app/services/providers/history_sources.py). All configured ones download
    # side by side and take over each other's symbols when one hits its limits.
    # A source without its API key is skipped.
    # Yahoo only by default: a full S&P 500 comparison with Nasdaq found ~2-4% of
    # symbols where the sources disagree (unadjusted spin-offs on either side,
    # bad high/low prints), so mixing them per symbol would store inconsistent
    # data. Add others here only once they have been checked with
    # python -m app.scripts.compare_sources.
    history_sources: str = "yfinance"
    alpaca_api_key: str | None = None
    alpaca_api_secret: str | None = None
    # "sip" = all US exchanges (the free plan allows it for data older than 15
    # minutes), "iex" = the IEX exchange only.
    alpaca_feed: str = "sip"
    alpaca_requests_per_minute: float = 180
    polygon_api_key: str | None = None
    polygon_base_url: str = "https://api.polygon.io"
    polygon_requests_per_minute: float = 5
    twelvedata_api_key: str | None = None
    twelvedata_credits_per_minute: float = 8
    twelvedata_credits_per_day: int = 800
    nasdaq_history_enabled: bool = True
    nasdaq_requests_per_minute: float = 60


settings = Settings()
