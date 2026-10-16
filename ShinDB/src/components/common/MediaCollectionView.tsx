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
  RefreshCw,
} from "lucide-react";
import MediaCard, { MediaItem } from "@/components/common/MediaCard";
import CreateMediaModal from "@/components/common/CreateMediaModal";
import { showToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";

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
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
    statuses: ["all", "watching", "completed", "plan to watch", "on hold", "dropped"],
    icon: <Tv className="w-4 h-4 text-cyber-purple" />,
  },
  manga: {
    label: "All Manga",
    searchPlaceholder: "FILTER MANGA LOGS...",
    accentText: "text-cyber-orange",
    activePillClass: "bg-cyber-orange text-white border-cyber-orange",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-orange)]",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
    statuses: ["all", "reading", "completed", "plan to read", "on hold", "dropped"],
    icon: <BookOpen className="w-4 h-4 text-cyber-orange" />,
  },
  game: {
    label: "All Video Games",
    searchPlaceholder: "FILTER GAMES LOGS...",
    accentText: "text-cyber-green",
    activePillClass: "bg-cyber-green text-black border-cyber-green",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-green)]",
    gridCols: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6",
    statuses: ["all", "playing", "completed", "plan to play", "on hold", "dropped"],
    icon: <Gamepad2 className="w-4 h-4 text-cyber-green" />,
  },
  movie: {
    label: "All Movies",
    searchPlaceholder: "FILTER MOVIE LOGS...",
    accentText: "text-cyber-yellow",
    activePillClass: "bg-cyber-yellow text-black border-cyber-yellow",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-yellow)]",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
    statuses: ["all", "completed", "plan to watch", "dropped"],
    icon: <Film className="w-4 h-4 text-cyber-yellow" />,
  },
  series: {
    label: "All TV Series",
    searchPlaceholder: "FILTER TV SERIES LOGS...",
    accentText: "text-cyber-cyan",
    activePillClass: "bg-cyber-cyan text-black border-cyber-cyan",
    drawerShadow: "shadow-[2px_2px_0px_0px_var(--cyber-cyan)]",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
    statuses: ["all", "watching", "completed", "plan to watch", "on hold", "dropped"],
    icon: <Tv className="w-4 h-4 text-cyber-cyan" />,
  },
};

interface MediaCollectionViewProps {
  type: MediaCategoryType;
  initialItems: MediaItem[];
}

export default function MediaCollectionView({ type, initialItems }: MediaCollectionViewProps) {
  const router = useRouter();
  const config = CATEGORY_CONFIG[type];
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "title" | "rating">("default");
  const [showFilterDrawer, setShowFilterDrawer] = useState(true);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const initialOrderRef = React.useRef<Map<string, number>>(new Map());

  const handleBatchSync = async () => {
    setIsBatchSyncing(true);
    try {
      const res = await fetch("/api/track/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Batch sync failed.");
      }

      if (data.updatedCount > 0) {
        showToast(
          `✓ ${data.message || `Updated ${data.updatedCount} airing item(s) from external API`}`,
          "success"
        );
        try {
          const refRes = await fetch(`/api/track?type=${type}`);
          const refreshed = await refRes.json();
          if (refreshed.success && Array.isArray(refreshed.items)) {
            setItems(refreshed.items);
          }
        } catch (fetchErr) {
          console.warn("Failed to refresh items after batch sync:", fetchErr);
        }
      } else {
        showToast("ℹ Airing logs checked: External databases have no newer counts yet.", "info");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to sync airing entries", "error");
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Synchronize client items state whenever server revalidates initialItems
  React.useEffect(() => {
    const orderMap = new Map<string, number>();
    initialItems.forEach((item, idx) => orderMap.set(item.id, idx));
    initialOrderRef.current = orderMap;
    setItems(initialItems);
  }, [initialItems]);

  const handleItemUpdate = (updatedItem: MediaItem) => {
    setItems((prev) => {
      const exists = prev.some(
        (i) => i.id === updatedItem.id || (updatedItem.mediaId && i.mediaId === updatedItem.mediaId)
      );
      if (exists) {
        return prev.map((i) =>
          i.id === updatedItem.id || (updatedItem.mediaId && i.mediaId === updatedItem.mediaId)
            ? updatedItem
            : i
        );
      }
      return [updatedItem, ...prev];
    });

    showToast(`✓ Updated "${updatedItem.title}" in library!`, "success");
  };

  const handleItemAdded = (newItem: MediaItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === newItem.id)) return prev;
      return [newItem, ...prev];
    });
    initialOrderRef.current.set(newItem.id, -1);
    router.refresh();
  };

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

  const handleProgressChange = (id: string, newProgress: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, progress: newProgress } : item))
    );
  };

  const cycleSort = () => {
    const nextSort =
      sortBy === "default" ? "title" : sortBy === "title" ? "rating" : "default";
    setSortBy(nextSort);

    const sortFn = (list: MediaItem[]) => {
      const copy = [...list];
      if (nextSort === "title") {
        copy.sort((a, b) => a.title.localeCompare(b.title));
      } else if (nextSort === "rating") {
        copy.sort((a, b) => {
          const parseRating = (r: string) => {
            if (!r || r === "Unrated" || r === "N/A") return -1;
            const parsed = parseFloat(r);
            return isNaN(parsed) ? -1 : parsed;
          };
          return parseRating(b.rating) - parseRating(a.rating);
        });
      } else {
        copy.sort((a, b) => {
          const idxA = initialOrderRef.current.get(a.id) ?? 999999;
          const idxB = initialOrderRef.current.get(b.id) ?? 999999;
          return idxA - idxB;
        });
      }
      return copy;
    };

    setItems(sortFn(items));
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
      {/* Sticky Filter & Search Control Console */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md pt-2 pb-3 border-b border-white/20 flex flex-col gap-3">
        <section className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {config.icon}
              <span className="font-sans font-bold text-white tracking-wide uppercase text-sm">
                {config.label}
              </span>
              <span className="px-2 py-0.5 border border-white/20 bg-white/5 text-[10px] text-gray-300 font-mono">
                {items.length} {items.length === 1 ? "RECORD" : "RECORDS"}
              </span>
            </div>

            <ChevronsUpDown className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] text-gray-500 font-medium">
              {filteredItems.length} / {items.length} shown
            </span>

            {/* Active Filter Badges with 1-click Clear */}
            {(selectedStatus !== "all" || query) && (
              <div className="flex items-center gap-1.5 ml-2">
                {selectedStatus !== "all" && (
                  <button
                    onClick={() => setSelectedStatus("all")}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40 text-[9px] uppercase hover:bg-cyber-purple/30 transition-colors cursor-pointer"
                    title="Clear status filter"
                  >
                    <span>{selectedStatus}</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 text-[9px] uppercase hover:bg-cyber-cyan/30 transition-colors cursor-pointer"
                    title="Clear search query"
                  >
                    <span>&quot;{query}&quot;</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3.5">
            {(type === "anime" || type === "manga" || type === "series") && (
              <button
                onClick={handleBatchSync}
                disabled={isBatchSyncing}
                className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${
                  isBatchSyncing ? "text-cyber-purple font-bold" : ""
                }`}
                title="Scan and auto-sync total episodes/chapters for airing or unannounced entries from external databases"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBatchSyncing ? "animate-spin" : ""}`} />
                <span>{isBatchSyncing ? "Syncing..." : "Sync Airing"}</span>
              </button>
            )}

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
              className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer hidden md:inline-flex ${
                showPropertiesDrawer ? "text-cyber-green font-bold" : ""
              }`}
              onClick={() => setShowPropertiesDrawer(!showPropertiesDrawer)}
              title="Toggle collection properties & metadata panel"
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
              id="btn-add-new-media"
              data-testid="btn-add-new-media"
              onClick={() => setIsCreateOpen(true)}
              className={`flex items-center gap-1 text-white hover:${config.accentText} transition-colors cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </section>

        {showPropertiesDrawer && (
          <div className="bg-[#0c0c0c] border border-white/20 p-3 text-[11px] font-mono grid grid-cols-2 sm:grid-cols-4 gap-3 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] animate-in fade-in duration-150">
            <div>
              <span className="text-gray-500 block uppercase text-[10px]">COLLECTION</span>
              <span className="text-white font-bold">{config.label}</span>
            </div>
            <div>
              <span className="text-gray-500 block uppercase text-[10px]">TOTAL ENTRIES</span>
              <span className={`${config.accentText} font-bold`}>{items.length} records</span>
            </div>
            <div>
              <span className="text-gray-500 block uppercase text-[10px]">COMPLETED RATE</span>
              <span className="text-cyber-green font-bold">
                {items.filter((i) => i.status.toLowerCase() === "completed").length} ({items.length > 0 ? Math.round((items.filter((i) => i.status.toLowerCase() === "completed").length / items.length) * 100) : 0}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500 block uppercase text-[10px]">DATABASE ENGINE</span>
              <span className="text-gray-300 font-bold">MySQL (Prisma)</span>
            </div>
          </div>
        )}

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
          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-white/10 pt-2.5">
            {config.statuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-all cursor-pointer ${
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
      </div>

      {filteredItems.length > 0 ? (
        <div className={`grid ${config.gridCols} gap-x-4 gap-y-6`}>
          {filteredItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onProgressChange={handleProgressChange}
              onItemUpdate={handleItemUpdate}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border-2 border-dashed border-cyber-purple/40 bg-black/60 p-12 text-center select-none flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto shadow-[4px_4px_0px_0px_rgba(157,0,255,0.2)]">
          <div className="bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            [SYS_STATUS: COLLECTION_EMPTY]
          </div>
          <h3 className="font-sans font-black text-base text-white uppercase tracking-wider">
            No {config.label} tracked yet
          </h3>
          <p className="font-mono text-xs text-gray-400 max-w-md leading-relaxed">
            Your personal {type} list is currently empty. Search external databases to add titles to your personal archive or create a custom entry.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              id="btn-empty-add-search"
              onClick={() => setIsCreateOpen(true)}
              className="bg-cyber-purple hover:bg-white text-white hover:text-black font-extrabold text-[11px] py-2 px-4 border-2 border-white tracking-widest uppercase transition-all shadow-[3px_3px_0px_0px_#ffffff] cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEARCH & ADD TITLE</span>
            </button>
            <button
              id="btn-empty-create-new"
              onClick={() => setIsCreateOpen(true)}
              className="bg-black hover:bg-white/10 text-white font-bold text-[11px] py-2 px-4 border border-white/40 tracking-widest uppercase transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW CUSTOM ENTRY</span>
            </button>
          </div>
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
        onItemAdded={handleItemAdded}
      />
    </div>
  );
}
