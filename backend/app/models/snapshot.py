from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MarketSnapshot(Base):
    """A single-row snapshot of MarketService's in-memory quote/trend
    caches, saved periodically so a backend restart can repopulate the
    dashboard immediately instead of starting from empty while the poll
    loops slowly catch back up. Not a time series - every save overwrites
    the one row (id=1)."""

    __tablename__ = "market_snapshot"

    id: Mapped[int] = mapped_column(primary_key=True)
    # symbol -> Quote.model_dump(mode="json")
    quotes: Mapped[dict] = mapped_column(JSONB)
    # symbol -> {"week"|"day"|"h4"|"h1": "bullish"|"bearish"|"neutral"}
    trends: Mapped[dict] = mapped_column(JSONB)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
