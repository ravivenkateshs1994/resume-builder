"use client";

import { useEffect, useState } from "react";

interface ScrollDepthState {
  y: number;
  scrolled: boolean;
}

export function useScrollDepth(threshold = 24): ScrollDepthState {
  const [state, setState] = useState<ScrollDepthState>({ y: 0, scrolled: false });

  useEffect(() => {
    let frameId = 0;

    const update = () => {
      frameId = 0;
      const nextY = window.scrollY;
      setState({ y: nextY, scrolled: nextY > threshold });
    };

    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return state;
}