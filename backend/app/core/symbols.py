"""Watchlist tickers, sector classification, and symbol aliasing.

To add/remove tickers, edit EQUITY_SECTORS or WORLD_INDEX_SECTORS below —
everything else (dedup, API responses, frontend grouping) derives from
these two dicts.
"""

# Hand-curated sector for every tracked equity. Kept static (rather than
# fetched live from yfinance) because pulling `.info` per ticker would add
# a full extra request per symbol on an already rate-limit-sensitive API.
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
    "CYBR": "Technology",
    "BRZE": "Technology",
    "QBTS": "Technology",
    "AEVA": "Technology",
    "LASR": "Technology",
    "LRCX": "Technology",
    "AMD": "Technology",
    "MU": "Technology",
    "LAZR": "Technology",
    "COMM": "Technology",
    "TSSI": "Technology",
    "SOUN": "Technology",
    "BBAI": "Technology",
    "NBIS": "Technology",
    "APLD": "Technology",
    # --- Healthcare ---
    "REGN": "Healthcare",
    "SRPT": "Healthcare",
    "TEM": "Healthcare",
    "DOCS": "Healthcare",
    "TMDX": "Healthcare",
    "UNH": "Healthcare",
    "CELC": "Healthcare",
    "CDTX": "Healthcare",
    "MLYS": "Healthcare",
    "NKTR": "Healthcare",
    "NVO": "Healthcare",
    "PSNL": "Healthcare",
    "ABCL": "Healthcare",
    # --- Financials ---
    "ROOT": "Financials",
    "PRCH": "Financials",
    "PGY": "Financials",
    "SOFI": "Financials",
    "LMND": "Financials",
    "SBET": "Financials",
    # --- Energy ---
    "OKLO": "Energy",
    "ENVX": "Energy",
    "FLNC": "Energy",
    "EOSE": "Energy",
    "QS": "Energy",
    "LEU": "Energy",
    "MVST": "Energy",
    "NNE": "Energy",
    # --- Industrials ---
    "ASPN": "Industrials",
    "WLDN": "Industrials",
    "TPC": "Industrials",
    "GEV": "Industrials",
    "ACHR": "Industrials",
    "UUU": "Industrials",
    # --- Consumer Discretionary ---
    "TDUP": "Consumer Discretionary",
    "TSLA": "Consumer Discretionary",
    "FNKO": "Consumer Discretionary",
    "NEGG": "Consumer Discretionary",
    "AEO": "Consumer Discretionary",
    "RSI": "Consumer Discretionary",
    "CVNA": "Consumer Discretionary",
    # --- Materials ---
    "METC": "Materials",
    "MP": "Materials",
    "SSRM": "Materials",
    "AGRO": "Materials",
    # --- Communication Services ---
    "VSAT": "Communication Services",
    "ASTS": "Communication Services",
    "GSAT": "Communication Services",
    "LUMN": "Communication Services",
    # --- Utilities ---
    "VST": "Utilities",
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
