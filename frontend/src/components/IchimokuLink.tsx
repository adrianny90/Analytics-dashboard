"use client";

import Link from "next/link";
import { useRef } from "react";

import { prefetchIchimoku } from "@/lib/api";

// Hovering this long counts as "about to click" - short enough to beat the
// click, long enough that sweeping the mouse down a table doesn't prefetch
// every row it crosses.
const HOVER_PREFETCH_MS = 150;

/** A symbol linking to its Ichimoku chart (in a new tab). Hovering it asks
 *  the backend to download the chart's daily bars ahead, so the chart
 *  opens from the cache instead of waiting ~1-2 s for Yahoo. */
export function IchimokuLink({ symbol, className }: { symbol: string; className?: string }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  return (
    <Link
      href={`/ichimoku?symbol=${symbol}`}
      target="_blank"
      rel="noopener noreferrer"
      prefetch={false}
      className={className}
      onMouseEnter={() => {
        cancel();
        timerRef.current = setTimeout(() => prefetchIchimoku(symbol), HOVER_PREFETCH_MS);
      }}
      onMouseLeave={cancel}
      onFocus={() => prefetchIchimoku(symbol)}
      onTouchStart={() => prefetchIchimoku(symbol)}
    >
      {symbol}
    </Link>
  );
}
