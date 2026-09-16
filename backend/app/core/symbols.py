"""Watchlist tickers, sector classification, and symbol aliasing.

To add/remove tickers, edit EQUITY_SECTORS or WORLD_INDEX_SECTORS below —
everything else (dedup, API responses, frontend grouping) derives from
these two dicts.
"""

# Sector for every tracked equity, verified per-ticker against yfinance's
# own `.info["sector"]` (snapshot taken 2026-09-16; run once offline, not at
# runtime - see the module docstring below for why not to do this live) and
# remapped from Yahoo's own sector taxonomy to this file's existing naming
# convention (e.g. Yahoo's "Consumer Cyclical" -> "Consumer Discretionary",
# "Financial Services" -> "Financials"). "Crypto Mining" and
# "Aerospace & Defense" are deliberately-curated buckets kept as-is rather
# than mapped from Yahoo's own sector field, which scatters these same
# companies inconsistently across "Technology"/"Financial Services"/
# "Industrials" depending on the ticker - a single dashboard-specific bucket
# is more useful here than reproducing that inconsistency.
#
# Four tickers turned out to be broken/stale symbols rather than just wrong
# sector labels, resolved as follows:
#   - CYBR (CyberArk): delisted from Nasdaq after being acquired by Palo
#     Alto Networks (merger completed 2026-02-11); no longer a live US
#     quote, so it's been dropped from the watchlist entirely.
#   - LAZR: Luminar Technologies went through Chapter 11 and its equity was
#     cancelled; the LAZR ticker has since been reassigned to an unrelated
#     fund ("Tema Photonics & Optical ETF"). Left in place on purpose -
#     it'll track that ETF under the Technology sector rather than Luminar.
#   - COMM (CommScope) -> VISN: renamed its own ticker to VISN effective
#     2026-01-14 after divesting its Connectivity and Cable Solutions
#     segment and rebranding as Vistance Networks; same company, same
#     Technology sector (broadband/Wi-Fi networking hardware), new symbol.
#   - CDTX -> IPSC: was meant to track Century Therapeutics, but CDTX is
#     actually Cidara Therapeutics - repointed to Century's real ticker.
EQUITY_SECTORS: dict[str, str] = {
    # --- Technology ---
    "INTC": "Technology",
    "OUST": "Technology",
    "CLS": "Technology",
    "PLTR": "Technology",
    "ALAB": "Technology",
    "TSM": "Technology",
    "MDB": "Technology",
    "NET": "Technology",
    "SNOW": "Technology",
    "NVDA": "Technology",
    "ZETA": "Technology",
    "BRZE": "Technology",
    "QBTS": "Technology",
    "AEVA": "Technology",
    "LASR": "Technology",
    "LRCX": "Technology",
    "AMD": "Technology",
    "MU": "Technology",
    "LAZR": "Technology",  # now tracks "Tema Photonics & Optical ETF" - see docstring above
    "VISN": "Technology",  # formerly COMM (CommScope) - see docstring above
    "TSSI": "Technology",
    "SOUN": "Technology",
    "BBAI": "Technology",
    "APLD": "Technology",
    "ASTS": "Technology",
    "VSAT": "Technology",
    "PGY": "Technology",
    # --- Communication Services ---
    "NBIS": "Communication Services",
    "GSAT": "Communication Services",
    "LUMN": "Communication Services",
    # --- Healthcare ---
    "REGN": "Healthcare",
    "SRPT": "Healthcare",
    "TEM": "Healthcare",
    "DOCS": "Healthcare",
    "TMDX": "Healthcare",
    "UNH": "Healthcare",
    "CELC": "Healthcare",
    "IPSC": "Healthcare",  # Century Therapeutics - was mistakenly listed as CDTX (Cidara Therapeutics) - see docstring above
    "MLYS": "Healthcare",
    "NKTR": "Healthcare",
    "NVO": "Healthcare",
    "PSNL": "Healthcare",
    "ABCL": "Healthcare",
    # --- Financials ---
    "ROOT": "Financials",
    "PRCH": "Financials",
    "SOFI": "Financials",
    "LMND": "Financials",
    "SBET": "Financials",
    # --- Energy ---
    "LEU": "Energy",
    # --- Utilities ---
    "VST": "Utilities",
    "OKLO": "Utilities",
    "FLNC": "Utilities",
    # --- Industrials ---
    "WLDN": "Industrials",
    "TPC": "Industrials",
    "GEV": "Industrials",
    "ACHR": "Industrials",
    "UUU": "Industrials",
    "ENVX": "Industrials",
    "EOSE": "Industrials",
    "NNE": "Industrials",
    # --- Consumer Discretionary ---
    "TDUP": "Consumer Discretionary",
    "TSLA": "Consumer Discretionary",
    "FNKO": "Consumer Discretionary",
    "NEGG": "Consumer Discretionary",
    "AEO": "Consumer Discretionary",
    "RSI": "Consumer Discretionary",
    "CVNA": "Consumer Discretionary",
    "QS": "Consumer Discretionary",
    "MVST": "Consumer Discretionary",
    # --- Consumer Staples ---
    "AGRO": "Consumer Staples",
    # --- Materials ---
    "METC": "Materials",
    "MP": "Materials",
    "SSRM": "Materials",
    "ASPN": "Materials",
    # --- Crypto Mining ---
    "CIFR": "Crypto Mining",
    "IREN": "Crypto Mining",
    "CLSK": "Crypto Mining",
    "CORZ": "Crypto Mining",
    "RIOT": "Crypto Mining",
    "BTDR": "Crypto Mining",
    # --- Aerospace & Defense ---
    "BKSY": "Aerospace & Defense",
    "RKLB": "Aerospace & Defense",
    "LUNR": "Aerospace & Defense",
}

# World indices, tracked the same way as equities (alias-resolved quotes,
# polled/cached identically) but grouped under their own "Index" sector.
# US100/US30/DJ30/UK100/VIX predate this list; the rest were added on
# request for broader world-market coverage.
WORLD_INDEX_SECTORS: dict[str, str] = {
    "VIX": "Index",
    "US100": "Index",
    "US30": "Index",
    "DJ30": "Index",
    "UK100": "Index",
    "NIKKEI": "Index",
    "DAX": "Index",
    "DAX30": "Index",
    "CAC40": "Index",
    "ESTX50": "Index",
    "HSI": "Index",
    "SSEC": "Index",
    "ASX200": "Index",
    "TSX": "Index",
    "WIG20": "Index",
}

# TradingView/CFD-style or shorthand symbols that don't exist as-is on
# Yahoo Finance, mapped to their real equivalents. Anything not listed here
# is assumed to already be a valid Yahoo Finance ticker (plain US equities
# pass through unchanged). The display symbol (e.g. "US30") is preserved in
# Quote.symbol so the frontend keeps showing the familiar name.
SYMBOL_ALIASES: dict[str, str] = {
    "VIX": "^VIX",  # CBOE Volatility Index
    "US100": "^NDX",  # Nasdaq 100
    "US30": "^DJI",  # Dow Jones Industrial Average
    "DJ30": "^DJI",  # Dow Jones Industrial Average (alternate broker name)
    "UK100": "^FTSE",  # FTSE 100
    "NIKKEI": "^N225",  # Nikkei 225 (Japan)
    "DAX": "^GDAXI",  # DAX (Germany)
    "DAX30": "^GDAXI",  # DAX, older 30-constituent name
    "CAC40": "^FCHI",  # CAC 40 (France)
    "ESTX50": "^STOXX50E",  # Euro Stoxx 50
    "HSI": "^HSI",  # Hang Seng (Hong Kong)
    "SSEC": "000001.SS",  # Shanghai Composite (China)
    "ASX200": "^AXJO",  # ASX 200 (Australia)
    "TSX": "^GSPTSE",  # S&P/TSX Composite (Canada)
    # Best-effort: Yahoo/Stooq coverage of the Warsaw exchange is patchy, so
    # this may simply return no data rather than a wrong value.
    "WIG20": "WIG20.WA",  # WIG20 (Poland)
}

# Order-preserving de-dup, in case a symbol were ever accidentally listed
# in both maps above.
SYMBOL_SECTORS: dict[str, str] = {**EQUITY_SECTORS, **WORLD_INDEX_SECTORS}
WATCHLIST_SYMBOLS: list[str] = list(dict.fromkeys(SYMBOL_SECTORS.keys()))


def resolve_symbol(symbol: str) -> str:
    return SYMBOL_ALIASES.get(symbol.upper(), symbol.upper())
