"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

/** Shared zoom/pan mechanics for a wide table (or a stack of tables): pinch,
 *  Shift/Ctrl+wheel, and a "Fit" button that scales content to the viewport
 *  width, plus a scrollbar pinned above the content and synced with the real
 *  one below it. Extracted from RankingTable so the watchlist's ranking
 *  table zooms the same way as the S&P 500/Nasdaq/Russell 2000/NYSE tables. */
/** `active`: whether the zoomable content is currently mounted (e.g. a
 *  caller that swaps in an empty-state message instead of the table should
 *  pass false then) - included in the effects' dependency arrays so the
 *  ResizeObserver and wheel/touch listeners (re)attach once the real content
 *  (and thus the refs below) actually exists in the DOM.
 *  `autoFit`: start fitted to the viewport width (as if "Fit" was clicked) and
 *  keep refitting as the content or viewport resizes, until the user zooms by
 *  hand; clicking "Fit" turns it back on. */
export function useTableZoom<ContentEl extends HTMLElement = HTMLDivElement>(active: boolean, autoFit = false) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<ContentEl>(null);
  // Natural (unzoomed) content size; the zoom is a CSS transform so the
  // scroll area is sized explicitly from these.
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const autoFitRef = useRef(autoFit);
  // Point (in unzoomed content coordinates) that should stay under the cursor / fingers.
  const anchorRef = useRef<{ cx: number; cy: number; clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    const content = contentRef.current;
    const view = scrollRef.current;
    if (!content || !view) return;
    const measure = () => {
      setSize((prev) =>
        prev.w === content.offsetWidth && prev.h === content.offsetHeight
          ? prev
          : { w: content.offsetWidth, h: content.offsetHeight },
      );
      // Width without borders, but *with* any vertical scrollbar: clientWidth
      // shrinks when a (sub-pixel) vertical scrollbar shows up after zooming,
      // which would refit smaller, drop the scrollbar, refit bigger... - a loop
      // that made the tables jitter.
      const viewWidth = view.offsetWidth - view.clientLeft * 2;
      if (autoFitRef.current && content.offsetWidth && viewWidth > 0) {
        // Floor so rounding never leaves the fitted table a pixel too wide.
        const fitted = clampZoom(Math.floor((viewWidth / content.offsetWidth) * 100) / 100);
        zoomRef.current = fitted;
        setZoom(fitted);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    observer.observe(view);
    return () => observer.disconnect();
  }, [active]);

  const applyZoom = useCallback((next: number, clientX?: number, clientY?: number) => {
    autoFitRef.current = false;
    const view = scrollRef.current;
    const current = zoomRef.current;
    const target = clampZoom(next);
    if (target === current) return;
    if (view) {
      const rect = view.getBoundingClientRect();
      const cx0 = clientX ?? rect.left + view.clientWidth / 2;
      const cy0 = clientY ?? Math.min(Math.max(window.innerHeight / 2, rect.top), rect.bottom);
      anchorRef.current = {
        cx: (cx0 - rect.left + view.scrollLeft) / current,
        cy: Math.max(0, cy0 - rect.top) / current,
        clientX: cx0,
        clientY: cy0,
      };
    }
    zoomRef.current = target;
    setZoom(target);
  }, []);

  // After the zoom is applied to the layout, put the anchored point back under
  // the cursor by adjusting horizontal scroll and the page scroll.
  useIsoLayoutEffect(() => {
    const anchor = anchorRef.current;
    const view = scrollRef.current;
    if (!anchor || !view) return;
    anchorRef.current = null;
    const rect = view.getBoundingClientRect();
    view.scrollLeft = anchor.cx * zoom - (anchor.clientX - rect.left);
    window.scrollBy(0, anchor.cy * zoom - (anchor.clientY - rect.top));
  }, [zoom]);

  // Shift/Ctrl + wheel (Ctrl+wheel is also what a trackpad pinch sends) and a
  // two-finger pinch. Native listeners because they must be non-passive to
  // preventDefault the browser's own scroll/page-zoom.
  useEffect(() => {
    const view = scrollRef.current;
    if (!view) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey && !e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY || e.deltaX; // some browsers move Shift+wheel to deltaX
      applyZoom(zoomRef.current * Math.exp(-delta * 0.0015), e.clientX, e.clientY);
    };
    let pinch: { dist: number; zoom: number } | null = null;
    const distance = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      pinch = e.touches.length === 2 ? { dist: distance(e.touches), zoom: zoomRef.current } : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      applyZoom(pinch.zoom * (distance(e.touches) / pinch.dist), midX, midY);
    };
    const onTouchEnd = () => {
      pinch = null;
    };
    view.addEventListener("wheel", onWheel, { passive: false });
    view.addEventListener("touchstart", onTouchStart, { passive: true });
    view.addEventListener("touchmove", onTouchMove, { passive: false });
    view.addEventListener("touchend", onTouchEnd);
    view.addEventListener("touchcancel", onTouchEnd);
    return () => {
      view.removeEventListener("wheel", onWheel);
      view.removeEventListener("touchstart", onTouchStart);
      view.removeEventListener("touchmove", onTouchMove);
      view.removeEventListener("touchend", onTouchEnd);
      view.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [applyZoom, active]);

  function fitToWidth() {
    const view = scrollRef.current;
    if (!view || !size.w) return;
    const rect = view.getBoundingClientRect();
    applyZoom(view.clientWidth / size.w, rect.left, window.innerHeight / 2);
    view.scrollLeft = 0;
    autoFitRef.current = autoFit;
  }

  function syncScroll(from: HTMLDivElement | null, to: HTMLDivElement | null) {
    if (from && to && to.scrollLeft !== from.scrollLeft) to.scrollLeft = from.scrollLeft;
  }

  return { topScrollRef, scrollRef, contentRef, size, zoom, applyZoom, fitToWidth, syncScroll };
}
