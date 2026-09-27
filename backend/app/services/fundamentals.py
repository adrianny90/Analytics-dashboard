"""Company fundamentals from SEC EDGAR (free, no API key): Piotroski F-score,
revenue/EPS growth, margins and profitability for every US filer.

Uses the XBRL "frames" API: one request returns one concept (e.g. Assets) for
every company for one calendar period, so a handful of requests cover the
whole market instead of one request per company. Values are matched on each
company's own fiscal-period end date, so non-December fiscal years work too.

A fiscal year is only treated as known REPORT_LAG_DAYS after its end (10-K
deadlines are 60-90 days), which keeps the historical backtest free of
look-ahead. The frames API returns the latest filed value, so a later
restatement can leak in - small next to that lag, but not zero.

Shared by the live ranking (latest fiscal year per company) and the offline
backtests (the full history)."""

import logging
import time
from datetime import date

import httpx
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

FRAMES_URL = "https://data.sec.gov/api/xbrl/frames/us-gaap/{concept}/{unit}/{period}.json"
TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
# SEC asks for no more than 10 requests per second.
_REQUEST_SPACING_SECONDS = 0.15
REPORT_LAG_DAYS = 90

# Field -> XBRL concepts in priority order (companies tag the same line item
# differently; the first concept with a value for a company's period wins).
DURATION_CONCEPTS: dict[str, tuple[str, list[str]]] = {
    "revenue": (
        "USD",
        [
            "Revenues",
            "RevenueFromContractWithCustomerExcludingAssessedTax",
            "SalesRevenueNet",
            "RevenueFromContractWithCustomerIncludingAssessedTax",
        ],
    ),
    "gross_profit": ("USD", ["GrossProfit"]),
    "cost_of_revenue": ("USD", ["CostOfRevenue", "CostOfGoodsAndServicesSold"]),
    "net_income": ("USD", ["NetIncomeLoss", "ProfitLoss"]),
    "cfo": (
        "USD",
        ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"],
    ),
    "shares": ("shares", ["WeightedAverageNumberOfDilutedSharesOutstanding", "WeightedAverageNumberOfSharesOutstandingBasic"]),
    "eps": ("USD-per-shares", ["EarningsPerShareDiluted", "EarningsPerShareBasic"]),
}
INSTANT_CONCEPTS: dict[str, tuple[str, list[str]]] = {
    "assets": ("USD", ["Assets"]),
    "current_assets": ("USD", ["AssetsCurrent"]),
    "current_liabilities": ("USD", ["LiabilitiesCurrent"]),
    "long_term_debt": ("USD", ["LongTermDebtNoncurrent", "LongTermDebt"]),
}
FUNDAMENTAL_COLUMNS = [
    "fscore",
    "fscore_n",
    "roa",
    "revenue_growth",
    "eps_growth",
    "gross_margin",
    "cfo_to_assets",
]


class EdgarClient:
    """Minimal, throttled client for the SEC endpoints used here."""

    def __init__(self, user_agent: str, timeout: float = 30.0) -> None:
        self._client = httpx.Client(headers={"User-Agent": user_agent}, timeout=timeout)
        self._last = 0.0

    def close(self) -> None:
        self._client.close()

    def get_json(self, url: str) -> dict | None:
        for attempt in range(4):
            wait = self._last + _REQUEST_SPACING_SECONDS - time.monotonic()
            if wait > 0:
                time.sleep(wait)
            self._last = time.monotonic()
            try:
                response = self._client.get(url)
            except httpx.HTTPError:
                time.sleep(2 * (attempt + 1))
                continue
            if response.status_code == 404:
                return None  # no company reported this concept for this period
            if response.status_code in (429, 503):
                time.sleep(10 * (attempt + 1))
                continue
            response.raise_for_status()
            return response.json()
        return None

    def ticker_map(self) -> dict[str, int]:
        """Ticker (Yahoo style, "BRK-B") -> CIK."""
        data = self.get_json(TICKERS_URL) or {}
        return {row["ticker"].upper().replace(".", "-"): int(row["cik_str"]) for row in data.values()}

    def frame(self, concept: str, unit: str, period: str) -> pd.DataFrame:
        data = self.get_json(FRAMES_URL.format(concept=concept, unit=unit, period=period))
        if not data or not data.get("data"):
            return pd.DataFrame(columns=["cik", "end", "val"])
        df = pd.DataFrame(data["data"], columns=["cik", "start", "end", "val"])
        if "start" in df and df["start"].notna().any():
            # Annual frames: keep only ~1-year durations.
            days = (pd.to_datetime(df["end"]) - pd.to_datetime(df["start"])).dt.days
            df = df[(days >= 330) & (days <= 400)]
        return pd.DataFrame(
            {
                "cik": df["cik"].astype("int64"),
                "end": pd.to_datetime(df["end"]),
                "val": pd.to_numeric(df["val"], errors="coerce").astype("float64"),
            }
        )


def _field_frames(client: EdgarClient, concepts: tuple[str, list[str]], periods: list[str]) -> pd.DataFrame:
    """One field (e.g. revenue) over `periods`, first concept wins per (cik, end)."""
    unit, names = concepts
    parts = []
    for priority, concept in enumerate(names):
        for period in periods:
            df = client.frame(concept, unit, period)
            if len(df):
                df["priority"] = priority
                parts.append(df)
    if not parts:
        return pd.DataFrame(columns=["cik", "end", "val"])
    df = pd.concat(parts, ignore_index=True).dropna(subset=["val"])
    df = df.sort_values(["cik", "end", "priority"]).drop_duplicates(["cik", "end"], keep="first")
    return df[["cik", "end", "val"]]


def download_annual(client: EdgarClient, first_year: int, last_year: int) -> pd.DataFrame:
    """One row per (cik, fiscal-year end) with the raw annual line items.
    Instants (balance sheet) are matched on the same end date (+-7 days)."""
    annual_periods = [f"CY{y}" for y in range(first_year, last_year + 1)]
    instant_periods = [f"CY{y}Q{q}I" for y in range(first_year, last_year + 1) for q in range(1, 5)]
    table: pd.DataFrame | None = None
    for field, concepts in DURATION_CONCEPTS.items():
        df = _field_frames(client, concepts, annual_periods).rename(columns={"val": field})
        table = df if table is None else table.merge(df, on=["cik", "end"], how="outer")
        logger.info("edgar: %s done (%d rows)", field, len(df))
    assert table is not None
    table = table.sort_values(["end", "cik"]).reset_index(drop=True)
    for field, concepts in INSTANT_CONCEPTS.items():
        df = _field_frames(client, concepts, instant_periods).rename(columns={"val": field})
        # Keep only balance-sheet dates that are some company's fiscal-year end.
        df = df.sort_values(["end", "cik"])
        table = pd.merge_asof(
            table, df, on="end", by="cik", direction="nearest", tolerance=pd.Timedelta(days=7)
        )
        logger.info("edgar: %s done (%d rows)", field, len(df))
    return table.sort_values(["cik", "end"]).reset_index(drop=True)


def compute_scores(annual: pd.DataFrame) -> pd.DataFrame:
    """Piotroski F-score (9 binary tests) and growth/quality ratios per
    (cik, fiscal-year end), each year compared with the company's previous
    fiscal year. fscore is scaled to 0-9 from the tests that could be computed
    (fscore_n of them; None when fewer than 6 - e.g. banks lack current
    assets/gross profit). `available` = the day the numbers count as public."""
    a = annual.sort_values(["cik", "end"]).reset_index(drop=True).copy()
    prev = a.groupby("cik").shift(1)
    gap = (a["end"] - prev["end"]).dt.days
    valid_prev = gap.between(330, 400)
    prev = prev.where(valid_prev, np.nan)
    prev2_assets = a.groupby("cik")["assets"].shift(2).where(valid_prev)

    avg_assets = (a["assets"] + prev["assets"]) / 2
    avg_assets_prev = (prev["assets"] + prev2_assets) / 2
    avg_assets = avg_assets.fillna(a["assets"])
    avg_assets_prev = avg_assets_prev.fillna(prev["assets"])

    roa = a["net_income"] / avg_assets
    roa_prev = prev["net_income"] / avg_assets_prev
    cfo_ta = a["cfo"] / avg_assets
    lev = a["long_term_debt"].fillna(0) / avg_assets
    lev_prev = prev["long_term_debt"].fillna(0) / avg_assets_prev
    has_debt = a["long_term_debt"].notna() | prev["long_term_debt"].notna()
    cr = a["current_assets"] / a["current_liabilities"]
    cr_prev = prev["current_assets"] / prev["current_liabilities"]
    gp = a["gross_profit"].fillna(a["revenue"] - a["cost_of_revenue"])
    gp_prev = prev["gross_profit"].fillna(prev["revenue"] - prev["cost_of_revenue"])
    gm = gp / a["revenue"]
    gm_prev = gp_prev / prev["revenue"]
    turn = a["revenue"] / avg_assets
    turn_prev = prev["revenue"] / avg_assets_prev

    tests = {
        "roa_pos": roa > 0,
        "cfo_pos": a["cfo"] > 0,
        "roa_up": roa > roa_prev,
        "accrual": cfo_ta > roa,
        "lev_down": (lev <= lev_prev).where(has_debt, True),
        "cr_up": cr > cr_prev,
        "no_dilution": a["shares"] <= prev["shares"] * 1.005,
        "gm_up": gm > gm_prev,
        "turn_up": turn > turn_prev,
    }
    inputs = {
        "roa_pos": roa,
        "cfo_pos": a["cfo"],
        "roa_up": roa - roa_prev,
        "accrual": cfo_ta - roa,
        "lev_down": lev - lev_prev,
        "cr_up": cr - cr_prev,
        "no_dilution": a["shares"] - prev["shares"],
        "gm_up": gm - gm_prev,
        "turn_up": turn - turn_prev,
    }
    # A company without long-term debt in either year passes the leverage test.
    known = pd.DataFrame({k: inputs[k].notna() | (~has_debt if k == "lev_down" else False) for k in tests})
    n = known.sum(axis=1)
    raw = (pd.DataFrame(tests).fillna(False).astype(bool) & known).sum(axis=1)
    fscore = (raw * 9 / n.where(n > 0)).round().where(n >= 6)

    def growth(cur: pd.Series, before: pd.Series) -> pd.Series:
        return ((cur - before) / before.abs()).where(before.abs() > 0).clip(-5, 5)

    return pd.DataFrame(
        {
            "cik": a["cik"],
            "end": a["end"],
            "available": a["end"] + pd.Timedelta(days=REPORT_LAG_DAYS),
            "fscore": fscore,
            "fscore_n": n,
            "roa": roa,
            "revenue_growth": growth(a["revenue"], prev["revenue"]),
            "eps_growth": growth(a["eps"], prev["eps"]),
            "gross_margin": gm,
            "cfo_to_assets": cfo_ta,
        }
    ).replace([np.inf, -np.inf], np.nan)  # x / 0 (e.g. zero revenue or assets) is not a usable ratio


def latest_by_ticker(scores: pd.DataFrame, tickers: dict[str, int], as_of: date | None = None) -> dict[str, dict]:
    """Most recent public fiscal year per ticker (as of `as_of`, default today)."""
    as_of_ts = pd.Timestamp(as_of or date.today())
    known = scores[scores["available"] <= as_of_ts].sort_values("end").drop_duplicates("cik", keep="last")
    by_cik = known.set_index("cik")
    result: dict[str, dict] = {}
    for ticker, cik in tickers.items():
        if cik not in by_cik.index:
            continue
        row = by_cik.loc[cik]
        values = {c: (None if pd.isna(row[c]) else float(row[c])) for c in FUNDAMENTAL_COLUMNS}
        values["fiscal_year_end"] = row["end"].date().isoformat()
        result[ticker] = values
    return result


def fetch_latest(user_agent: str, symbols: list[str], years: int = 4) -> dict[str, dict]:
    """Latest fundamentals for `symbols` (blocking; run in a thread). About
    `years` * 30 small requests to SEC, independent of the number of symbols."""
    client = EdgarClient(user_agent)
    try:
        tickers = client.ticker_map()
        wanted = {s: tickers[s] for s in symbols if s in tickers}
        this_year = date.today().year
        annual = download_annual(client, this_year - years, this_year)
        annual = annual[annual["cik"].isin(set(wanted.values()))]
        scores = compute_scores(annual)
        return latest_by_ticker(scores, wanted)
    finally:
        client.close()
