import ctypes
import gc
import logging
import os

logger = logging.getLogger(__name__)

_libc = None
try:  # glibc only (Linux, incl. Render); absent on Windows/macOS
    _libc = ctypes.CDLL("libc.so.6")
except OSError:
    _libc = None


def current_rss_mb() -> float | None:
    """Resident memory of this process in MB, read from /proc (Linux only)."""
    try:
        with open("/proc/self/statm") as f:
            resident_pages = int(f.read().split()[1])
        return resident_pages * os.sysconf("SC_PAGE_SIZE") / 1e6
    except (OSError, ValueError, IndexError):
        return None


def release_memory() -> None:
    """Collects garbage and asks glibc to hand freed heap pages back to the OS.

    pandas/pydantic churn leaves the allocator holding lots of freed but
    unreturned memory, which counts against a hosted memory limit (Render's
    free tier kills the service above 512MB) even though Python no longer
    uses it."""
    gc.collect()
    if _libc is not None:
        try:
            _libc.malloc_trim(0)
        except (AttributeError, OSError):
            pass


def rss_label() -> str:
    rss = current_rss_mb()
    return f"{rss:.0f}MB" if rss is not None else "n/a"
