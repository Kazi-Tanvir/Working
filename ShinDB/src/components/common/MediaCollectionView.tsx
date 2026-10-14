// src/components/common/MediaCollectionView.tsx
"use client";

import React, { useState } from "react";
import {
  Search,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
  ChevronsUpDown,
  X,
} from "lucide-react";
import MediaCard, { MediaItem } from "@/components/common/MediaCard";
import CreateMediaModal from "@/components/common/CreateMediaModal";
import { showToast } from "@/components/common/Toast";

export type MediaCategoryType = "anime" | "manga" | "game" | "movie" | "series";

interface CategoryConfig {
  label: string;
  searchPlaceholder: string;
  accentText: string;
  activePillClass: string;
  drawerShadow: string;
  gridCols: string;
  statuses: string[];
  icon: React.ReactNode;
}

const CATEGORY_CONFIG: Record<MediaCategoryType, CategoryConfig> = {
  anime: {
    label: "All Anime Series",
    searchPlaceholder: "FILTER ANIME LOGS...",
    accentText: "text-cyber-purple",
    activePillClass: "bg-cyber-purple text-white border-cyber-purple",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-purple)]",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8",
    statuses: ["all", "watching", "completed", "plan to watch", "on hold", "dropped"],
    icon: <Tv className="w-4 h-4 text-cyber-purple" />,
  },
  manga: {
    label: "All Manga",
    searchPlaceholder: "FILTER MANGA LOGS...",
    accentText: "text-cyber-orange",
    activePillClass: "bg-cyber-orange text-white border-cyber-orange",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-orange)]",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8",
    statuses: ["all", "reading", "completed", "plan to read", "on hold", "dropped"],
    icon: <BookOpen className="w-4 h-4 text-cyber-orange" />,
  },
  game: {
    label: "All Video Games",
    searchPlaceholder: "FILTER GAMES LOGS...",
    accentText: "text-cyber-green",
    activePillClass: "bg-cyber-green text-black border-cyber-green",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-green)]",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7",
    statuses: ["all", "playing", "completed", "plan to play", "on hold", "dropped"],
    icon: <Gamepad2 className="w-4 h-4 text-cyber-green" />,
  },
  movie: {
    label: "All Movies",
    searchPlaceholder: "FILTER MOVIE LOGS...",
    accentText: "text-cyber-yellow",
    activePillClass: "bg-cyber-yellow text-black border-cyber-yellow",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-yellow)]",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8",
    statuses: ["all", "watching", "completed", "plan to watch", "dropped"],
    icon: <Film className="w-4 h-4 text-cyber-yellow" />,
  },
  series: {
    label: "All TV Series",
    searchPlaceholder: "FILTER TV SERIES LOGS...",
    accentText: "text-cyber-cyan",
    activePillClass: "bg-cyber-cyan text-black border-cyber-cyan",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-cyan)]",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8",
    statuses: ["all", "watching", "completed", "plan to watch", "on hold", "dropped"],
    icon: <Tv className="w-4 h-4 text-cyber-cyan" />,
  },
};

interface MediaCollectionViewProps {
  type: MediaCategoryType;
  initialItems: MediaItem[];
}

export default function MediaCollectionView({ type, initialItems }: MediaCollectionViewProps) {
  const config = CATEGORY_CONFIG[type];
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "title" | "rating">("default");
  const [showFilterDrawer, setShowFilterDrawer] = useState(true);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const prevItems = [...items];
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );

    try {
      const res = await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      setItems(prevItems);
      showToast("Failed to sync status update", "error");
    }
  };

  const handleProgressChange = async (id: string, newProgress: string) => {
    const prevItems = [...items];
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, progress: newProgress } : item))
    );

    try {
      const res = await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, progress: newProgress }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
    } catch {
      setItems(prevItems);
      showToast("Failed to sync progress update", "error");
    }
  };

  const cycleSort = () => {
    const nextSort =
      sortBy === "default" ? "title" : sortBy === "title" ? "rating" : "default";
    setSortBy(nextSort);

    setItems((prev) => {
      const copy = [...prev];
      if (nextSort === "title") {
        copy.sort((a, b) => a.title.localeCompare(b.title));
      } else if (nextSort === "rating") {
        copy.sort(
          (a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0)
        );
      } else {
        copy.sort((a, b) => a.id.localeCompare(b.id));
      }
      return copy;
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase().trim());
    const matchesStatus =
      selectedStatus === "all" ||
      item.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="w-full flex flex-col gap-6 font-mono select-none">
      <section className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-white/10 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-sans font-bold text-white tracking-wide uppercase text-sm">
            {config.label}
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[10px] text-gray-600 font-medium ml-2">
            {filteredItems.length} results
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={cycleSort}
            className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
              sortBy !== "default" ? `${config.accentText} font-bold` : ""
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort {sortBy !== "default" ? `(${sortBy})` : ""}</span>
          </button>

          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
              showFilterDrawer ? "text-cyber-cyan font-bold" : ""
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          <button
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer hidden md:inline-flex"
            onClick={() => showToast("SYS_LOG: COLUMN PROPERTIES ARE STABLE.", "system")}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Properties</span>
          </button>

          <button
            onClick={() => setShowSearchDrawer(!showSearchDrawer)}
            className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
              showSearchDrawer ? `${config.accentText} font-bold` : ""
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className={`flex items-center gap-1 text-white hover:${config.accentText} transition-colors cursor-pointer`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </section>

      {showSearchDrawer && (
        <div
          className={`relative flex items-center bg-black border border-white/20 px-3 py-1.5 transition-all ${config.drawerShadow}`}
        >
          <Search className="w-3.5 h-3.5 text-gray-500 mr-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={config.searchPlaceholder}
            className="w-full bg-transparent text-white text-xs outline-none uppercase tracking-widest placeholder:text-gray-600"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X className="w-3 h-3 text-gray-500 hover:text-white" />
            </button>
          )}
        </div>
      )}

      {showFilterDrawer && (
        <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-white/10 pb-4">
          {config.statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-all ${
                selectedStatus === status
                  ? `${config.activePillClass} shadow-[2px_2px_0px_0px_#ffffff]`
                  : "bg-transparent text-gray-400 border-white/10 hover:border-white hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length > 0 ? (
        <div className={`grid ${config.gridCols} gap-x-4 gap-y-6`}>
          {filteredItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onProgressChange={handleProgressChange}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-gray-800 p-16 text-center select-none flex flex-col items-center justify-center gap-2">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            [SYS_WARNING: ZERO_FILTERED_MATCHES]
          </span>
          <span className="text-[9px] text-gray-600">
            NO RECORDS MATCH YOUR SELECTION METRICS.
          </span>
        </div>
      )}

      <CreateMediaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultType={type}
      />
    </div>
  );
}
