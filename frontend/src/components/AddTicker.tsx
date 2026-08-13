"use client";

import { useEffect, useRef, useState } from "react";

import { addWatchlistSymbol, searchTickers } from "@/lib/api";
import type { TickerSearchResult, WatchlistSymbol } from "@/types/market";

const SEARCH_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function AddTicker({ onAdded }: { onAdded: (entry: WatchlistSymbol) => void }) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<TickerSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchTickers(query, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setHighlighted(0);
        })
        .catch(() => undefined);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function submitSymbol(symbol: string) {
    if (!symbol || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const entry = await addWatchlistSymbol(symbol);
      onAdded(entry);
      setValue("");
      setSuggestions([]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add ticker");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && highlighted < suggestions.length) {
      e.preventDefault();
      submitSymbol(suggestions[highlighted].symbol);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-start gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSymbol(value.trim());
        }}
        className="flex items-center gap-2"
      >
        <div className="relative">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toUpperCase());
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add ticker, e.g. AAPL"
            maxLength={50}
            autoComplete="off"
            className="w-56 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute left-0 top-full z-10 mt-1 w-80 overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-lg">
              {suggestions.map((s, i) => (
                <li key={`${s.symbol}-${i}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => submitSymbol(s.symbol)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                      i === highlighted ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-white">{s.symbol}</span>
                      {s.name && <span className="ml-2 truncate text-white/50">{s.name}</span>}
                    </span>
                    {s.exchange && <span className="shrink-0 text-xs uppercase text-white/30">{s.exchange}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting || !value.trim()}
          className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>
      {error && <span className="self-center text-sm text-fall">{error}</span>}
    </div>
  );
}
