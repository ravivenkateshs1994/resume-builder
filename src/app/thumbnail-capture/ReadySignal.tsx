"use client";

import { useEffect } from "react";

/**
 * Sets data-ready on <html> once the client has hydrated and painted.
 * Puppeteer waits for this before taking the screenshot.
 */
export function ReadySignal() {
  useEffect(() => {
    // rAF ensures a paint has occurred before we signal
    requestAnimationFrame(() => {
      document.documentElement.setAttribute("data-ready", "true");
    });
  }, []);

  return null;
}
