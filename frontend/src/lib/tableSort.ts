import { SETUP_TIER_SORT_ORDER, type SetupTier } from "@/lib/rankingSetup";

// Header clicks cycle through three states, then back to the original order
// (the ranking, or the watchlist's own order). Only one column sorts at a time.
export type SortDir = "asc" | "desc";
export type SortState<K extends string> = { key: K; dir: SortDir } | null;

export function nextSort<K extends string>(current: SortState<K>, key: K, firstDir: SortDir): SortState<K> {
  if (current?.key !== key) return { key, dir: firstDir };
  if (current.dir === firstDir) return { key, dir: firstDir === "asc" ? "desc" : "asc" };
  return null;
}

// The Setup column sorts by badge color instead of a value: each header
// click brings the next color (SETUP_TIER_SORT_ORDER: blue -> yellow ->
// purple -> green -> red -> pink) to the top, and the click after the last one
// goes back to the original order. Kept separate from SortState, but only one
// of the two is ever active at a time.
export function nextSetupSort(current: SetupTier | null): SetupTier | null {
  if (current === null) return SETUP_TIER_SORT_ORDER[0];
  const i = SETUP_TIER_SORT_ORDER.indexOf(current);
  return i < SETUP_TIER_SORT_ORDER.length - 1 ? SETUP_TIER_SORT_ORDER[i + 1] : null;
}

/** Stable sort by a numeric value; rows without data always sink to the bottom. */
export function sortByValue<T>(rows: T[], valueOf: (row: T) => number | null | undefined, dir: SortDir): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = valueOf(a);
    const bv = valueOf(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (av - bv) * sign;
  });
}
