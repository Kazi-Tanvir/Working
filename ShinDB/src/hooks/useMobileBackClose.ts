"use client";

import { useEffect, useRef } from "react";

// Pending back-cleanup timer across StrictMode remounts
let pendingCleanupTimer: NodeJS.Timeout | null = null;

/**
 * Handles closing modals on mobile devices when the user triggers the hardware
 * back button or Android/iOS swipe-back gesture.
 *
 * On phones (< 768px):
 * - Opening the modal pushes a lightweight history state ({ modalOpen: true }).
 * - First back button/gesture triggers popstate -> closes the modal (stays on current page).
 * - Second back button/gesture navigates back normally to the previous page.
 * - If closed via UI (X button, backdrop, Escape, action): cleans up the pushed
 *   history entry so the history stack is not polluted.
 *
 * On desktop (>= 768px):
 * - No-op to guarantee zero desktop regressions.
 */
export function useMobileBackClose(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const closedByPopstateRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only activate on phone viewports (< 768px)
    const isPhone = window.innerWidth < 768;
    if (!isPhone) return;

    // If a cleanup pop was pending from an immediate remount (e.g. StrictMode), cancel it
    if (pendingCleanupTimer) {
      clearTimeout(pendingCleanupTimer);
      pendingCleanupTimer = null;
    }

    if (isOpen) {
      closedByPopstateRef.current = false;

      // Push history state if not already pushed for this modal
      if (!window.history.state?.modalOpen) {
        window.history.pushState({ modalOpen: true }, "");
      }

      const handlePopState = () => {
        closedByPopstateRef.current = true;
        onCloseRef.current();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);

        // If the modal was closed via UI rather than browser back button,
        // pop the pushed history entry after a short delay (cancels out during StrictMode remount)
        if (!closedByPopstateRef.current) {
          pendingCleanupTimer = setTimeout(() => {
            if (window.history.state?.modalOpen) {
              window.history.back();
            }
            pendingCleanupTimer = null;
          }, 50);
        }
      };
    }
  }, [isOpen]);
}
