"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth wheel scrolling. Lenis already disables itself for prefers-reduced-motion.
 * - Touch keeps native scrolling (syncTouch: false).
 * - Any element marked `data-lenis-prevent` (dialogs, drawers, scrollable panels)
 *   scrolls natively; modals also carry it on their overlay so the page behind
 *   never scrolls while a dialog is open.
 * - autoRaf lets Lenis manage its own frame loop.
 */
export default function LenisScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
      anchors: { offset: -72 },
    });
    return () => lenis.destroy();
  }, []);

  return null;
}
