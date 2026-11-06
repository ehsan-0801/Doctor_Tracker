"use client";

import { useEffect } from "react";

/**
 * Records the visible app area on <html data-area>. Theme rules (portal dark
 * mode) key off this, so hidden-but-mounted routes kept by the router never
 * restyle the page that is actually on screen. Effects of hidden routes are
 * paused, so the visible area always wins.
 */
export function AreaMarker({ area }: { area: "site" | "admin" }) {
  useEffect(() => {
    document.documentElement.dataset.area = area;
  }, [area]);
  return null;
}
