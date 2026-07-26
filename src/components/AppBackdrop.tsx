"use client";

import { useEffect } from "react";

export function AppBackdrop() {
  useEffect(() => {
    const root = document.documentElement;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    function setCursorVars(x: number, y: number) {
      root.style.setProperty("--crp-cursor-x", `${x}px`);
      root.style.setProperty("--crp-cursor-y", `${y}px`);
    }

    setCursorVars(window.innerWidth * 0.5, window.innerHeight * 0.22);

    if (!finePointer) return;

    let raf = 0;
    let lastX = window.innerWidth * 0.5;
    let lastY = window.innerHeight * 0.22;

    function onMove(event: PointerEvent) {
      lastX = event.clientX;
      lastY = event.clientY;
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        setCursorVars(lastX, lastY);
        raf = 0;
      });
    }

    function onLeave() {
      setCursorVars(window.innerWidth * 0.5, window.innerHeight * 0.22);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="app-backdrop pointer-events-none fixed inset-0 z-0">
      <div className="app-backdrop-base" />
      <div className="app-backdrop-grid" />
      <div className="app-backdrop-orb app-backdrop-orb-a" />
      <div className="app-backdrop-orb app-backdrop-orb-b" />
      <div className="app-backdrop-orb app-backdrop-orb-c" />
      <div className="app-backdrop-cursor" />
      <div className="app-backdrop-scan" />
    </div>
  );
}
