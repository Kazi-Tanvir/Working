import React from "react";
import CategorySkeleton from "@/components/common/CategorySkeleton";
import { Terminal } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-8 font-mono select-none animate-page-in">
      {/* Sleek Terminal Loading Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-white/20 bg-black p-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-cyber-purple animate-pulse" />
          <span className="font-extrabold text-xs uppercase tracking-widest text-white">
            &gt; STREAMING TELEMETRY RECORDS...
          </span>
          <span className="inline-block w-2 h-4 bg-cyber-purple animate-pulse ml-0.5" />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="border border-white/10 bg-white/5 px-2 py-0.5">
            STATUS: SECURE_SYNC
          </span>
          <span className="border border-white/10 bg-white/5 px-2 py-0.5">
            IO_LATENCY: OPTIMAL
          </span>
        </div>
      </div>

      {/* Mock Stat Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#09090b] border-2 border-white/15 p-4 flex flex-col gap-2 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] animate-pulse"
          >
            <div className="h-3 w-20 bg-gray-800" />
            <div className="h-6 w-12 bg-gray-700 mt-1" />
          </div>
        ))}
      </div>

      {/* Grid Skeletons */}
      <CategorySkeleton cardAspect="portrait" accentColorClass="border-white/10" />
    </div>
  );
}
