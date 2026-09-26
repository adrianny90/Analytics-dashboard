"use client";

import { useEffect, useSyncExternalStore } from "react";

import { getFavorites, setFavorite } from "@/lib/api";

// Starred ("watched by me") symbols live in the database (see
// backend/app/api/v1/endpoints/favorites.py), so they follow the user across
// browsers and devices. This module-level store is the one copy every star
// and every "Watched" section on the page reads, so toggling a star in one
// table updates all of them at once.
const EMPTY: ReadonlySet<string> = new Set();
let favorites: ReadonlySet<string> = EMPTY;
let loaded = false;
let loading: Promise<void> | null = null;
let lastError: string | null = null;
// Stars being saved right now - a reload that lands meanwhile would still
// hold the old state, so it's skipped rather than undoing the click.
let pendingSaves = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Stars saved by the earlier localStorage-only version of this feature -
// pushed to the database once, then dropped from the browser.
const LEGACY_STORAGE_KEY = "favoriteSymbols";

async function migrateLegacyStars(): Promise<string[]> {
  let legacy: string[] = [];
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) legacy = parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
  if (legacy.length === 0) return [];
  await Promise.all(legacy.map((symbol) => setFavorite(symbol, true)));
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is blocked.
  }
  return legacy;
}

/** (Re)loads the starred symbols from the backend. */
function refresh() {
  if (loading) return loading;
  loading = migrateLegacyStars()
    .catch(() => [])
    .then(() => getFavorites())
    .then((symbols) => {
      if (pendingSaves > 0) return;
      favorites = new Set(symbols);
      loaded = true;
      lastError = null;
    })
    .catch((err: Error) => {
      lastError = err.message;
    })
    .finally(() => {
      loading = null;
      emit();
    });
  return loading;
}

/** Stars/un-stars `symbol`: updated on screen immediately, then saved to the
 * database - rolled back (with the error shown) if the save fails. */
function toggleFavorite(symbol: string) {
  const starred = !favorites.has(symbol);
  const apply = (on: boolean) => {
    const next = new Set(favorites);
    if (on) next.add(symbol);
    else next.delete(symbol);
    favorites = next;
  };
  apply(starred);
  lastError = null;
  emit();
  pendingSaves++;
  setFavorite(symbol, starred)
    .catch((err: Error) => {
      apply(!starred);
      lastError = err.message;
      emit();
    })
    .finally(() => {
      pendingSaves--;
      // A first load skipped while this was saving still needs to happen.
      if (pendingSaves === 0 && !loaded) refresh();
    });
}

export function useFavorites() {
  const current = useSyncExternalStore(subscribe, () => favorites, () => EMPTY);
  const error = useSyncExternalStore(subscribe, () => lastError, () => null);

  useEffect(() => {
    if (!loaded) refresh();
    // Stars toggled on another device show up when coming back to this tab.
    const handleFocus = () => refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return { favorites: current, toggleFavorite, error };
}
