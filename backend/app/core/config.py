from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Market Analytics Dashboard API"
    cors_origins: list[str] = ["http://localhost:3000"]
    finnhub_api_key: str | None = None
    poll_interval_seconds: int = 5


settings = Settings()
