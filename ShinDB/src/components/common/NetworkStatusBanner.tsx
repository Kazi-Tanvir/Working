"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      id="sys-network-banner"
      aria-label="Network Status Alert"
      className="w-full bg-cyber-red text-white border-b-2 border-white px-4 py-2 text-xs font-mono flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 select-none shadow-[0px_4px_12px_rgba(255,0,60,0.4)] animate-in fade-in"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-pulse text-white shrink-0" />
        <span className="font-extrabold tracking-wider uppercase">
          [CONNECTION_LOST // LOCAL_CACHE_ACTIVE]
        </span>
        <span className="hidden sm:inline text-red-200 text-[11px]">
          — Stale data visible. Remote sync will pause until connection resumes.
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            if (navigator.onLine) {
              setIsOffline(false);
            } else {
              window.location.reload();
            }
          }
        }}
        className="px-2.5 py-1 bg-black text-white hover:bg-white hover:text-black border border-white font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_0px_#ffffff]"
      >
        <RefreshCw className="w-3 h-3" />
        <span>RETRY LINK</span>
      </button>
    </aside>
  );
}
