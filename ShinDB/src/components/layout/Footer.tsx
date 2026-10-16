"use client";

import React, { useState, useEffect } from "react";
import { HardDrive, Server, GitBranch, Cpu } from "lucide-react";

export default function Footer() {
  const [uptime, setUptime] = useState("00:00:00");
  const [isExpanded, setIsExpanded] = useState(false);

  // Live uptime ticker — gives the UI a "heartbeat"
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
      const s = String(elapsed % 60).padStart(2, "0");
      setUptime(`${h}:${m}:${s}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full bg-black border-t border-white/20 select-none font-mono mt-auto">
      {/* Expanded Telemetry Drawer */}
      {isExpanded && (
        <div className="border-b border-white/10 bg-[#070709] py-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-gray-500 uppercase">
            {/* Core connection indicator */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span className="flex items-center gap-1.5 text-cyber-green">
                <Server className="w-3.5 h-3.5" />
                <span className="relative flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse" />
                  [SYS_STATUS: ONLINE]
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                [DB_STATUS: JSON_COLLECTIONS_CONNECTED]
              </span>
            </div>

            {/* Console Memory usage & git branch + live uptime */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span className="flex items-center gap-1.5 tabular-nums">
                <Cpu className="w-3.5 h-3.5 text-gray-500" />
                [UPTIME: <span className="text-cyber-cyan font-bold">{uptime}</span>]
              </span>
              <span className="flex items-center gap-1.5 text-cyber-cyan font-bold">
                <GitBranch className="w-3.5 h-3.5" />
                [GIT: origin/main]
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Minimal Status Bar (always clean & unobtrusive) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 bg-cyber-green rounded-full" />
          <span className="text-gray-400 font-sans tracking-wide">ShinDB</span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-gray-500 hover:text-white uppercase transition-colors px-1.5 py-0.5 border border-white/10 hover:border-white/30 cursor-pointer text-[9px]"
          title="Toggle system telemetry drawer"
        >
          <span>{isExpanded ? "[-] HIDE TELEMETRY" : "[+] TELEMETRY"}</span>
        </button>
      </div>
    </footer>
  );
}
