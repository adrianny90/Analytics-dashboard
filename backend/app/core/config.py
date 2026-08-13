from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Market Analytics Dashboard API"
    cors_origins: list[str] = ["http://localhost:3000"]
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

    # How long a successfully fetched chart (history/candles) response is
    # considered fresh before a new one is attempted. Failed refreshes still
    # serve the last cached response indefinitely past this TTL.
    history_cache_ttl_seconds: int = 300

    # A full trend pass (week/day/h4/h1 Ichimoku assessment for every
    # watchlist symbol) is itself several minutes of throttled Yahoo calls,
    # so this is just the pause between passes, not a hard period.
    trend_poll_interval_seconds: int = 60


settings = Settings()
