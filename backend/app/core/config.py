from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Market Analytics Dashboard API"
    cors_origins: list[str] = ["http://localhost:3000"]
    finnhub_api_key: str | None = None

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


settings = Settings()
