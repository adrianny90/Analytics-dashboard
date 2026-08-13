from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WatchlistTicker(Base):
    """A user-added symbol, layered on top of the hand-curated
    EQUITY_SECTORS/WORLD_INDEX_SECTORS defaults in app.core.symbols."""

    __tablename__ = "watchlist_tickers"

    id: Mapped[int] = mapped_column(primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    sector: Mapped[str] = mapped_column(String(50), server_default="Custom")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
