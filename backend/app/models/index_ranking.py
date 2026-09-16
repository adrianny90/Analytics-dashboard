from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IndexRanking(Base):
    """A single-row-per-universe snapshot of the latest completed bullish-
    trend ranking run for one index universe ("sp500" | "nasdaq" |
    "russell2000"), so a Ranking tab can be reopened hours later (or after a
    backend restart) without re-scanning. Not a time series - saving a
    universe overwrites its one row."""

    __tablename__ = "index_ranking"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    # Ranked list of every symbol in the universe - see RankingEntry for shape.
    entries: Mapped[list] = mapped_column(JSONB)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
