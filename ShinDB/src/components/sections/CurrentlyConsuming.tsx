"use client";

import React from "react";
import { Play, Terminal } from "lucide-react";
import MediaCard, { MediaItem } from "@/components/common/MediaCard";
import Badge from "@/components/common/Badge";

interface CurrentlyConsumingProps {
  activeItems: MediaItem[];
}

export default function CurrentlyConsuming({ activeItems }: CurrentlyConsumingProps) {
  return (
    <section className="w-full font-mono mb-8 md:mb-12 animate-section-in" style={{ animationDelay: '0.1s' }}>
      {/* Section Tactile Header Bar */}
      <div className="flex items-center justify-between border-2 border-white bg-black p-4 mb-6 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-cyber-cyan animate-pulse fill-cyber-cyan" />
          <h2 className="font-sans font-black text-sm md:text-base uppercase tracking-wider text-white">
            Currently Consuming
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="cyan" className="!border-white/40 text-[10px] badge-pulse">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" />
              {activeItems.length} ACTIVE PROCESSES
            </span>
          </Badge>
        </div>
      </div>

      {/* Grid Layout of Active Cards — staggered entry */}
      {activeItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
          {activeItems.map((item, index) => (
            <div
              key={item.id}
              className="animate-card-in"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <MediaCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-cyber-card border-2 border-dashed border-gray-700 p-12 text-center select-none flex flex-col items-center justify-center gap-2">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            [SYS_WARNING: ZERO_ACTIVE_LOADS]
          </span>
          <span className="text-[10px] text-gray-600">
            USE SEARCH OR TAB GRID CONTROLS TO LOG CURRENTLY WATCHING, READING, OR PLAYING ITEMS.
          </span>
        </div>
      )}
    </section>
  );
}
