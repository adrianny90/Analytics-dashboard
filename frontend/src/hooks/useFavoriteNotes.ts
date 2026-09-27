"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { getFavoriteNotes, setFavoriteNotes } from "@/lib/api";

// Notes of the starred symbols (backend/app/api/v1/endpoints/favorites.py),
// one shared store for every "Watched" section on the page.
const EMPTY: Readonly<Record<string, string>> = {};
let notes: Readonly<Record<string, string>> = EMPTY;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function refresh() {
  if (loading) return loading;
  loading = getFavoriteNotes()
    .then((data) => {
      notes = data;
      loaded = true;
    })
    .catch(() => undefined)
    .finally(() => {
      loading = null;
      emit();
    });
  return loading;
}

export function useFavoriteNotes() {
  const current = useSyncExternalStore(subscribe, () => notes, () => EMPTY);

  useEffect(() => {
    if (!loaded) refresh();
    const handleFocus = () => refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  /** Saves the notes; the shown text changes only after the save succeeds. */
  const saveNote = useCallback(async (symbol: string, text: string) => {
    await setFavoriteNotes(symbol, text);
    const next = { ...notes };
    if (text.trim()) next[symbol] = text.trim();
    else delete next[symbol];
    notes = next;
    emit();
  }, []);

  return { notes: current, saveNote };
}
