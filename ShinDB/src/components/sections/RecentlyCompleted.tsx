"use client";

import React from "react";
import { CheckSquare, Terminal } from "lucide-react";
import MediaCard, { MediaItem } from "@/components/common/MediaCard";
import Badge from "@/components/common/Badge";

interface RecentlyCompletedProps {
  completedItems: MediaItem[];
}

export default function RecentlyCompleted({ completedItems }: RecentlyCompletedProps) {
  return (
    <section className="w-full font-mono mb-8 animate-section-in" style={{ animationDelay: '0.2s' }}>
      {/* Section Tactile Header Bar */}
      <div className="flex items-center justify-between border-2 border-white bg-black p-4 mb-6 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-cyber-green animate-pulse fill-cyber-green" />
          <h2 className="font-sans font-black text-sm md:text-base uppercase tracking-wider text-white">
            Recently Completed
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="green" className="!border-white/40 text-[10px]">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" />
              {completedItems.length} TOTAL ENTRIES
            </span>
          </Badge>
        </div>
      </div>

      {/* Grid Layout of Completed Cards — staggered entry */}
      {completedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
          {completedItems.slice(0, 8).map((item, index) => (
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
            NO COMPLETED ENTRIES YET
          </span>
          <span className="text-[10px] text-gray-500">
            Mark items as completed to see them here.
          </span>
        </div>
      )}
    </section>
  );
}
