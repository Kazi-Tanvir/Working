"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft, Terminal } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception safely to client console
    console.error("ShinDB Uncaught Runtime Exception:", error);
  }, [error]);

  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center py-12 px-4 select-none font-mono">
      <div className="w-full max-w-2xl bg-[#09090b] border-2 border-cyber-red shadow-[6px_6px_0px_0px_var(--cyber-red)] p-6 sm:p-10 flex flex-col gap-6 text-white animate-page-in">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-cyber-red/30 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-cyber-red animate-pulse" />
            <span className="text-cyber-red font-black uppercase tracking-widest">
              [CRITICAL_FAULT // UNHANDLED_RUNTIME_EXCEPTION]
            </span>
          </div>
          {error.digest && (
            <span className="text-gray-500 text-[10px] hidden sm:inline">
              DIGEST: {error.digest}
            </span>
          )}
        </div>

        {/* Glitch Output Terminal */}
        <div className="bg-black border border-cyber-red/40 p-4 font-mono text-xs flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-cyber-red font-bold text-[11px] uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            <span>CORE DUMP &gt;&gt; STACK_INTERRUPT</span>
          </div>
          <p className="text-red-300 break-words font-mono text-xs bg-red-950/20 p-2 border border-red-900/40">
            {error.message || "An unexpected client-side runtime exception occurred."}
          </p>
        </div>

        {/* Main Explanation */}
        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans font-black text-xl uppercase tracking-wider text-white">
            System Subsystem Crash
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            A fatal exception was caught by ShinDB&apos;s global error boundary. State corruption was prevented. You can attempt to reboot the subsystem or return to safety.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 bg-cyber-red hover:bg-white text-white hover:text-black font-extrabold text-xs py-3 px-4 border-2 border-white tracking-widest uppercase transition-all shadow-[3px_3px_0px_0px_#ffffff] text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>REBOOT INTERFACE (RETRY)</span>
          </button>

          <Link
            href="/"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
            className="bg-black hover:bg-white/10 text-white font-bold text-xs py-3 px-4 border border-white/40 tracking-widest uppercase transition-all text-center flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>COMMAND CONSOLE</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
