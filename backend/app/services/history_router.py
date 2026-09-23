"""Downloads historical bars for a whole symbol list from several sources at once.

Every configured source (see providers/history_sources.py) gets its own workers
pulling batches off one shared queue of pending symbols, so the fastest source
naturally takes most of the work and a source that hits its rate limit simply
stops taking batches until its cooldown ends - the others keep draining the
queue in the meantime. A symbol a source has no data for (or keeps failing on)
goes back to the queue for the remaining sources; only when none is left is it
reported as missing.
"""

import asyncio
import logging
from collections import Counter
from collections.abc import AsyncIterator

import pandas as pd

from app.services.providers.history_sources import (
    HistorySource,
    SourceRateLimited,
    SourceUnavailable,
    build_sources,
)

logger = logging.getLogger(__name__)

# Failed attempts (errors, suspected rate limits) one source gets per symbol
# before the symbol is left to the other sources.
_MAX_ATTEMPTS = 3
# Unexpected errors in a row after which a source sits out the rest of the run.
_MAX_CONSECUTIVE_ERRORS = 5
# Downloaded frames waiting for the consumer - bounds memory while it is busy
# (e.g. saving a checkpoint to the database).
_OUT_QUEUE_SIZE = 200

Result = tuple[str, pd.DataFrame | None, str | None]


class _Run:
    def __init__(self, symbols: list[str], sources: list[HistorySource], period: str, interval: str) -> None:
        self.period = period
        self.interval = interval
        self.sources = sources
        self.pending: dict[str, None] = dict.fromkeys(symbols)
        self.remaining = len(self.pending)
        self.attempts: dict[str, Counter] = {s: Counter() for s in self.pending}
        self.no_data: dict[str, set[str]] = {s: set() for s in self.pending}
        self.active: set[str] = {s.name for s in sources}
        self.errors: Counter = Counter()
        self.finished = self.remaining == 0
        self.cond = asyncio.Condition()
        self.out: asyncio.Queue[Result] = asyncio.Queue(maxsize=_OUT_QUEUE_SIZE)

    def _eligible(self, symbol: str, name: str) -> bool:
        return name in self.active and name not in self.no_data[symbol] and self.attempts[symbol][name] < _MAX_ATTEMPTS

    def _take(self, source: HistorySource) -> list[str]:
        batch = []
        for symbol in self.pending:
            if self._eligible(symbol, source.name):
                batch.append(symbol)
                if len(batch) >= source.batch_size:
                    break
        for symbol in batch:
            del self.pending[symbol]
        return batch

    def _has_work(self, source: HistorySource) -> bool:
        return any(self._eligible(symbol, source.name) for symbol in self.pending)

    def _orphans(self) -> list[Result]:
        """Pending symbols no active source can still try - reported as missing."""
        orphans = [s for s in self.pending if not any(self._eligible(s, name) for name in self.active)]
        for symbol in orphans:
            del self.pending[symbol]
        self.remaining -= len(orphans)
        return [(symbol, None, None) for symbol in orphans]

    async def worker(self, source: HistorySource) -> None:
        name = source.name
        while True:
            if self.finished or name not in self.active:
                return
            wait = source.available_in()
            if wait > 0:
                await asyncio.sleep(min(wait, 5))
                continue
            async with self.cond:
                await self.cond.wait_for(lambda: self.finished or name not in self.active or self._has_work(source))
                if self.finished or name not in self.active:
                    return
                if source.available_in() > 0:
                    continue
                batch = self._take(source)

            frames: dict[str, pd.DataFrame] = {}
            outcome = "ok"
            try:
                frames = await source.fetch(batch, self.period, self.interval)
                self.errors[name] = 0
            except SourceRateLimited as exc:
                outcome = "limited_counted" if exc.count_attempt else "limited"
                logger.info("history source %s rate limited; others continue (retry in %.0fs)", name, exc.retry_after)
            except SourceUnavailable as exc:
                outcome = "unavailable"
                logger.warning("history source %s unavailable for this run: %s", name, exc)
            except asyncio.CancelledError:
                raise
            except Exception:
                outcome = "error"
                self.errors[name] += 1
                logger.exception("history source %s failed on %d symbols", name, len(batch))

            emit: list[Result] = []
            async with self.cond:
                for symbol in batch:
                    frame = frames.pop(symbol, None)
                    if frame is not None:
                        emit.append((symbol, frame, name))
                        self.remaining -= 1
                        continue
                    if outcome == "ok":
                        self.no_data[symbol].add(name)
                    elif outcome in ("limited_counted", "error"):
                        self.attempts[symbol][name] += 1
                    self.pending[symbol] = None
                if outcome == "unavailable" or self.errors[name] >= _MAX_CONSECUTIVE_ERRORS:
                    self.active.discard(name)
                emit.extend(self._orphans())
                if self.remaining <= 0:
                    self.finished = True
                self.cond.notify_all()
            for item in emit:
                await self.out.put(item)

    async def guarded_worker(self, source: HistorySource) -> None:
        try:
            await self.worker(source)
        except asyncio.CancelledError:
            raise
        except Exception:
            # A bug in one source must never hang the whole scan.
            logger.exception("history worker %s crashed; the other sources take over", source.name)
            async with self.cond:
                self.active.discard(source.name)
                orphans = self._orphans()
                if self.remaining <= 0:
                    self.finished = True
                self.cond.notify_all()
            for item in orphans:
                await self.out.put(item)


class HistoryRouter:
    def __init__(self) -> None:
        self._sources: list[HistorySource] | None = None

    @property
    def sources(self) -> list[HistorySource]:
        # Built lazily so the settings (API keys from .env) are read on first use.
        if self._sources is None:
            self._sources = build_sources()
            logger.info("history sources: %s", ", ".join(s.name for s in self._sources) or "none")
        return self._sources

    def source_names(self, interval: str | None = None) -> list[str]:
        return [s.name for s in self.sources if interval is None or s.supports(interval)]

    async def stream(self, symbols: list[str], period: str, interval: str) -> AsyncIterator[Result]:
        """Yields (symbol, frame, source) for every symbol, in whatever order the
        downloads finish; frame and source are None when no source had data."""
        sources = [s for s in self.sources if s.supports(interval)]
        if not sources:
            raise RuntimeError(f"no history source supports interval {interval}")
        run = _Run(symbols, sources, period, interval)
        workers = [
            asyncio.create_task(run.guarded_worker(source)) for source in sources for _ in range(source.workers)
        ]
        try:
            for _ in range(run.remaining):
                yield await run.out.get()
        finally:
            for task in workers:
                task.cancel()
            await asyncio.gather(*workers, return_exceptions=True)


history_router = HistoryRouter()
