"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const CANDIDATE_ROUTES = [
  "/",
  "/anime",
  "/manga",
  "/games",
  "/movies",
  "/series",
  "/friends",
  "/profile",
  "/settings",
];

export default function IdlePrefetcher() {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Respect user bandwidth and data saver preferences
    if (typeof navigator !== "undefined") {
      const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (conn?.saveData || conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
        return;
      }
    }

    let isCancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let idleCallbackId: number | null = null;

    // Wait until the user has settled on the current page before starting background prefetching
    timerId = setTimeout(() => {
      if (isCancelled || document.visibilityState === "hidden") return;

      const remainingRoutes = CANDIDATE_ROUTES.filter(
        (r) => r !== pathname && !prefetchedRef.current.has(r)
      );

      if (remainingRoutes.length === 0) return;

      let currentIndex = 0;

      const prefetchNext = () => {
        if (isCancelled || currentIndex >= remainingRoutes.length || document.visibilityState === "hidden") {
          return;
        }

        const targetRoute = remainingRoutes[currentIndex];
        try {
          router.prefetch(targetRoute);
          prefetchedRef.current.add(targetRoute);
        } catch (err) {
          console.warn("[PREFETCHER] Failed prefetch:", targetRoute, err);
        }

        currentIndex++;

        if (currentIndex < remainingRoutes.length) {
          // Schedule next route prefetch when browser is next idle or in 300ms
          if ("requestIdleCallback" in window) {
            idleCallbackId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
              prefetchNext,
              { timeout: 800 }
            );
          } else {
            timerId = setTimeout(prefetchNext, 300);
          }
        }
      };

      if ("requestIdleCallback" in window) {
        idleCallbackId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
          prefetchNext,
          { timeout: 1000 }
        );
      } else {
        prefetchNext();
      }
    }, 1500);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
      if (idleCallbackId && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleCallbackId);
      }
    };
  }, [pathname, router]);

  return null;
}
