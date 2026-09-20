import logging
import time

logger = logging.getLogger(__name__)


class YahooRateLimitGate:
    """One process-wide pause shared by every part of the backend that talks to
    Yahoo (watchlist polling, trend polling, ranking scans, Kitchin). Yahoo
    blocks per IP, not per feature - if only the component that got the 429
    paused, the others would keep sending requests and extend the block.
    Repeated hits within a short time lengthen the pause (x2 each time)."""

    def __init__(self, base_seconds: int, max_seconds: int = 900, forget_after_seconds: int = 1800) -> None:
        self._base = base_seconds
        self._max = max_seconds
        self._forget_after = forget_after_seconds
        self.until: float = 0.0
        self._streak = 0
        self._last_trip: float = 0.0

    def remaining(self) -> float:
        return max(0.0, self.until - time.monotonic())

    def trip(self, source: str) -> float:
        now = time.monotonic()
        if now - self._last_trip > self._forget_after:
            self._streak = 0
        # Several callers can report the same 429 within seconds of each other;
        # that is one block, not a longer streak.
        if now < self.until:
            return self.remaining()
        pause = min(self._base * (2**self._streak), self._max)
        self._streak += 1
        self._last_trip = now
        self.until = now + pause
        logger.warning("Yahoo Finance rate limit hit (%s); pausing all Yahoo requests for %.0fs", source, pause)
        return pause


from app.core.config import settings  # noqa: E402

rate_gate = YahooRateLimitGate(settings.rate_limit_cooldown_seconds)
