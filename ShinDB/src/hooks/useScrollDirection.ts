"use client";

import { useState, useEffect, useRef } from "react";

interface ScrollDirectionOptions {
  threshold?: number;
  topOffset?: number;
}

export function useScrollDirection({
  threshold = 10,
  topOffset = 15,
}: ScrollDirectionOptions = {}) {
  const [scrollDir, setScrollDir] = useState<"up" | "down">("up");
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // Initial setup on mount
    lastScrollY.current = typeof window !== "undefined" ? window.scrollY : 0;
    setIsAtTop(lastScrollY.current <= topOffset);

    const updateScrollDir = () => {
      const currentScrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScrollY = documentHeight - windowHeight;

      // Always show when close to top
      if (currentScrollY <= topOffset) {
        setIsAtTop(true);
        setScrollDir("up");
        lastScrollY.current = Math.max(0, currentScrollY);
        ticking.current = false;
        return;
      }

      setIsAtTop(false);

      // Prevent rubber-banding / bounce at bottom of page
      if (maxScrollY > 0 && currentScrollY >= maxScrollY - 20) {
        ticking.current = false;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) >= threshold) {
        setScrollDir(diff > 0 ? "down" : "up");
        lastScrollY.current = Math.max(0, currentScrollY);
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topOffset]);

  const isVisible = isAtTop || scrollDir === "up";

  return { scrollDir, isAtTop, isVisible };
}

