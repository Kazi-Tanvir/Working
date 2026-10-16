"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ShinDB Fatal Root Error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark bg-black text-white">
      <body className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-[#09090b] border-2 border-[#ff003c] shadow-[6px_6px_0px_0px_#ff003c] p-8 flex flex-col gap-6">
          <div className="border-b border-[#ff003c]/30 pb-3 text-xs text-[#ff003c] font-bold uppercase tracking-widest flex items-center justify-between">
            <span>[CRITICAL_SYSTEM_FAULT // ROOT_LAYOUT_CRASH]</span>
            {error.digest && <span>DIGEST: {error.digest}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-sans font-black text-2xl uppercase tracking-wider text-white">
              Root Kernel Failure
            </h1>
            <p className="text-sm text-gray-400">
              The application root structure encountered an unrecoverable failure.
            </p>
          </div>

          <div className="bg-black border border-red-900 p-3 text-xs text-red-300">
            {error.message || "Root-level rendering failure."}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-[#ff003c] hover:bg-white text-white hover:text-black font-extrabold text-xs py-3 px-5 border-2 border-white tracking-widest uppercase transition-all cursor-pointer"
            >
              Restart ShinDB
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
              className="bg-black hover:bg-white/10 text-white font-bold text-xs py-3 px-5 border border-white/40 tracking-widest uppercase transition-all cursor-pointer"
            >
              Force Home Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
