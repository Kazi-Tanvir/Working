// src/components/common/MediaCollectionView.tsx
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Filter,
  ArrowUpDown,
  Plus,
  ChevronsUpDown,
  X,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import MediaCard, { MediaItem } from "@/components/common/MediaCard";
import CreateMediaModal from "@/components/common/CreateMediaModal";
import { showToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";

export type MediaCategoryType = "anime" | "manga" | "game" | "movie" | "series";
export type SortOption = "status" | "updated" | "title" | "time" | "rating";

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

const STATUS_PRECEDENCE: Record<string, number> = {
  // 1. Watching / Reading / Playing (Active)
  watching: 1,
  reading: 1,
  playing: 1,
  // 2. Completed
  completed: 2,
  // 3. Dropped
  dropped: 3,
  // 4. On Hold
  "on-hold": 4,
  "on hold": 4,
  on_hold: 4,
  // 5. Plan to Watch / Read / Play
  "plan to watch": 5,
  "plan to read": 5,
  "plan to play": 5,
  plan_to_consume: 5,
};

const SORT_OPTIONS: { key: SortOption; label: string; desc: string }[] = [
  { key: "status", label: "Status (Default)", desc: "Watching → Completed → Dropped → On Hold → Plan" },
  { key: "updated", label: "Last Updated", desc: "Most recently updated in library" },
  { key: "title", label: "Alphabetical (A-Z)", desc: "Title A through Z" },
  { key: "time", label: "Time (Release Year)", desc: "Newest release year first" },
  { key: "rating", label: "Score (Highest)", desc: "Highest personal/canonical score" },
];

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
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMinRating, setSelectedMinRating] = useState("all");
  const [selectedEra, setSelectedEra] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("status");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [showSyncAllWarning, setShowSyncAllWarning] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [syncModeInProgress, setSyncModeInProgress] = useState<"airing" | "all" | null>(null);
  const initialOrderRef = useRef<Map<string, number>>(new Map());

  // Batch sync handler for airing and overall sync
  const handleBatchSync = async (mode: "airing" | "all") => {
    setShowSyncMenu(false);
    setShowSyncAllWarning(false);
    setSyncModeInProgress(mode);
    try {
      const res = await fetch("/api/track/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, mode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Batch sync failed.");
      }

      if (data.updatedCount > 0) {
        showToast(
          `✓ ${data.message || `Updated ${data.updatedCount} item(s) from external databases`}`,
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
        showToast(
          mode === "all"
            ? `ℹ All ${data.checkedCount || ""} entries verified: metadata is already up to date.`
            : "ℹ Airing logs checked: External databases have no newer counts yet.",
          "info"
        );
      }
    } catch (err: any) {
      showToast(err.message || "Failed to sync entries", "error");
    } finally {
      setSyncModeInProgress(null);
    }
  };

  // Synchronize client items state whenever server revalidates initialItems
  useEffect(() => {
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

  // Extract all distinct genres across the collection
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (Array.isArray(i.genres)) {
        i.genres.forEach((g) => {
          if (g && typeof g === "string") set.add(g.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [items]);

  // Compute filtered & sorted items list
  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      // 1. Text Search Query
      if (query && !item.title.toLowerCase().includes(query.toLowerCase().trim())) {
        return false;
      }
      // 2. Status Filter
      if (selectedStatus !== "all") {
        const itemStat = (item.status || "").toLowerCase().replace(/[-_]/g, " ").trim();
        const selStat = selectedStatus.toLowerCase().replace(/[-_]/g, " ").trim();
        const isMatch =
          itemStat === selStat ||
          (selStat.includes("plan") && itemStat.includes("plan")) ||
          (selStat.includes("hold") && itemStat.includes("hold"));
        if (!isMatch) return false;
      }
      // 3. Genre Filter
      if (selectedGenre !== "all") {
        if (!item.genres || !item.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) {
          return false;
        }
      }
      // 4. Rating Filter
      if (selectedMinRating !== "all") {
        const num = parseFloat(item.rating);
        if (selectedMinRating === "unrated") {
          if (!isNaN(num)) return false;
        } else {
          const min = parseFloat(selectedMinRating);
          if (isNaN(num) || num < min) return false;
        }
      }
      // 5. Release Era Filter
      if (selectedEra !== "all") {
        const year = item.releaseYear || 0;
        if (selectedEra === "2020s" && year < 2020) return false;
        if (selectedEra === "2010s" && (year < 2010 || year >= 2020)) return false;
        if (selectedEra === "2000s" && (year < 2000 || year >= 2010)) return false;
        if (selectedEra === "classic" && year >= 2000) return false;
      }
      // 6. Favorites Filter
      if (favoritesOnly && !item.isFavorite) {
        return false;
      }
      return true;
    });

    const copy = [...filtered];
    if (sortBy === "status") {
      copy.sort((a, b) => {
        const rankA = STATUS_PRECEDENCE[a.status.toLowerCase()] ?? 99;
        const rankB = STATUS_PRECEDENCE[b.status.toLowerCase()] ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        return a.title.localeCompare(b.title);
      });
    } else if (sortBy === "title") {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "time") {
      copy.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    } else if (sortBy === "rating") {
      copy.sort((a, b) => {
        const parseScore = (r: string) => {
          if (!r || r === "Unrated" || r === "N/A") return -1;
          const parsed = parseFloat(r);
          return isNaN(parsed) ? -1 : parsed;
        };
        return parseScore(b.rating) - parseScore(a.rating);
      });
    } else if (sortBy === "updated") {
      copy.sort((a, b) => {
        const idxA = initialOrderRef.current.get(a.id) ?? 999999;
        const idxB = initialOrderRef.current.get(b.id) ?? 999999;
        return idxA - idxB;
      });
    }
    return copy;
  }, [items, query, selectedStatus, selectedGenre, selectedMinRating, selectedEra, favoritesOnly, sortBy]);

  const hasActiveFilters =
    selectedStatus !== "all" ||
    selectedGenre !== "all" ||
    selectedMinRating !== "all" ||
    selectedEra !== "all" ||
    favoritesOnly ||
    !!query;

  const handleResetFilters = () => {
    setSelectedStatus("all");
    setSelectedGenre("all");
    setSelectedMinRating("all");
    setSelectedEra("all");
    setFavoritesOnly(false);
    setQuery("");
  };

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
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 ml-2 flex-wrap">
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
                {selectedGenre !== "all" && (
                  <button
                    onClick={() => setSelectedGenre("all")}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/40 text-[9px] uppercase hover:bg-cyber-orange/30 transition-colors cursor-pointer"
                    title="Clear genre filter"
                  >
                    <span>{selectedGenre}</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {selectedMinRating !== "all" && (
                  <button
                    onClick={() => setSelectedMinRating("all")}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40 text-[9px] uppercase hover:bg-cyber-yellow/30 transition-colors cursor-pointer"
                    title="Clear rating filter"
                  >
                    <span>★ {selectedMinRating}+</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {selectedEra !== "all" && (
                  <button
                    onClick={() => setSelectedEra("all")}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 text-[9px] uppercase hover:bg-cyber-cyan/30 transition-colors cursor-pointer"
                    title="Clear era filter"
                  >
                    <span>{selectedEra}</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {favoritesOnly && (
                  <button
                    onClick={() => setFavoritesOnly(false)}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-cyber-green/20 text-cyber-green border border-cyber-green/40 text-[9px] uppercase hover:bg-cyber-green/30 transition-colors cursor-pointer"
                    title="Clear favorites filter"
                  >
                    <span>Favorites</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 text-white border border-white/40 text-[9px] uppercase hover:bg-white/30 transition-colors cursor-pointer"
                    title="Clear search query"
                  >
                    <span>&quot;{query}&quot;</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3.5 relative">
            {/* 1. Sync Button with Hover Dropdown (Airing + All Entries) */}
            <div
              className="relative"
              onMouseEnter={() => setShowSyncMenu(true)}
              onMouseLeave={() => setShowSyncMenu(false)}
            >
              <button
                onClick={() => handleBatchSync("airing")}
                disabled={!!syncModeInProgress}
                className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 ${
                  syncModeInProgress ? "text-cyber-purple font-bold" : ""
                }`}
                title="Sync Airing / Overall Data (hover to see all sync options)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncModeInProgress ? "animate-spin" : ""}`} />
                <span>{syncModeInProgress ? `Syncing (${syncModeInProgress})...` : "Sync Airing"}</span>
                <ChevronDown className="w-3 h-3 text-gray-500 hover:text-white" />
              </button>

              {showSyncMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-black/95 border border-white/20 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] p-1.5 z-30 font-mono text-xs flex flex-col gap-1 backdrop-blur-md">
                  <div className="text-[10px] uppercase text-gray-500 font-bold px-2 py-1 border-b border-white/10 flex items-center justify-between">
                    <span>Sync APIs</span>
                    <span className="text-[9px] text-gray-400">External API</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBatchSync("airing")}
                    className="text-left p-2 hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex flex-col gap-0.5 cursor-pointer rounded-sm"
                  >
                    <span className="font-bold text-white flex items-center justify-between">
                      <span>1. Sync Airing</span>
                      <span className="text-[9px] text-cyber-green font-normal">[FAST]</span>
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Check newly aired/released chapters &amp; episodes.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSyncMenu(false);
                      setShowSyncAllWarning(true);
                    }}
                    className="text-left p-2 hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex flex-col gap-0.5 cursor-pointer rounded-sm border-t border-white/10"
                  >
                    <span className="font-bold text-cyber-orange flex items-center justify-between">
                      <span>2. Sync All Entries</span>
                      <span className="text-[9px] text-cyber-red font-normal">[HEAVY]</span>
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Overall data sync across all catalog records (may take time).
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Sort Button with Hover / Click Menu (Default by Status: Watching -> Completed -> Dropped -> On Hold -> Plan) */}
            <div
              className="relative"
              onMouseEnter={() => setShowSortMenu(true)}
              onMouseLeave={() => setShowSortMenu(false)}
            >
              <button
                onClick={() => {
                  const cycleKeys: SortOption[] = ["status", "updated", "title", "time", "rating"];
                  const currentIdx = cycleKeys.indexOf(sortBy);
                  const next = cycleKeys[(currentIdx + 1) % cycleKeys.length];
                  setSortBy(next);
                }}
                className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 ${
                  sortBy !== "status" ? `${config.accentText} font-bold` : ""
                }`}
                title="Sort collection (click to cycle, hover for menu)"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>
                  Sort ({SORT_OPTIONS.find((s) => s.key === sortBy)?.label.split(" ")[0] || "Status"})
                </span>
                <ChevronDown className="w-3 h-3 text-gray-500 hover:text-white" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-black/95 border border-white/20 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] p-1.5 z-30 font-mono text-xs flex flex-col gap-1 backdrop-blur-md">
                  <div className="text-[10px] uppercase text-gray-500 font-bold px-2 py-1 border-b border-white/10 flex items-center justify-between">
                    <span>Sort Mode</span>
                    <span className="text-[9px] text-gray-400">5 Options</span>
                  </div>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.key);
                        setShowSortMenu(false);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded transition-colors flex flex-col gap-0.5 cursor-pointer ${
                        sortBy === opt.key
                          ? "bg-white/15 text-white font-bold border-l-2 border-cyber-cyan"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center justify-between text-xs">
                        <span>{opt.label}</span>
                        {sortBy === opt.key && <span className="text-cyber-cyan text-[10px]">✓</span>}
                      </span>
                      <span className="text-[9px] text-gray-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Advanced Filter Button (Hide/Unhide Drawer) */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 ${
                showFilterDrawer || (selectedStatus !== "all" || selectedGenre !== "all" || selectedMinRating !== "all" || selectedEra !== "all" || favoritesOnly)
                  ? "text-cyber-cyan font-bold"
                  : ""
              }`}
              title="Toggle Advanced Filter Drawer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Advanced Filter</span>
            </button>

            {/* 4. Search Button */}
            <button
              onClick={() => setShowSearchDrawer(!showSearchDrawer)}
              className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 ${
                showSearchDrawer ? `${config.accentText} font-bold` : ""
              }`}
              title="Toggle Search Input"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            {/* 5. New Button */}
            <button
              id="btn-add-new-media"
              data-testid="btn-add-new-media"
              onClick={() => setIsCreateOpen(true)}
              className={`flex items-center gap-1 text-white hover:${config.accentText} transition-colors cursor-pointer py-1`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </section>

        {/* Search Drawer */}
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

        {/* Status Filter Buttons Row (Always Visible) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-white/10">
          {config.statuses.map((status) => {
            const label =
              status === "all"
                ? (type === "anime" ? "ALL ANIME" : `ALL ${type.toUpperCase()}`)
                : status;
            const isSelected = selectedStatus.toLowerCase() === status.toLowerCase();
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(isSelected && status !== "all" ? "all" : status)}
                className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-all cursor-pointer ${
                  isSelected
                    ? `${config.activePillClass} shadow-[2px_2px_0px_0px_#ffffff]`
                    : "bg-transparent text-gray-400 border-white/10 hover:border-white hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Advanced Filter Drawer (Properties: Genre, Score, Era, Favorites) */}
        {showFilterDrawer && (
          <div className="flex flex-col gap-2 border-t border-dashed border-white/15 pt-2.5">
            {/* Advanced Properties Filters (Genre, Score, Era, Favorites) */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Genre filter */}
              {allGenres.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    GENRE:
                  </span>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="bg-[#111] text-gray-300 border border-white/20 px-2 py-1 text-[10px] uppercase font-mono outline-none focus:border-white cursor-pointer"
                  >
                    <option value="all">ALL GENRES ({allGenres.length})</option>
                    {allGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Score / Rating filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  SCORE:
                </span>
                <select
                  value={selectedMinRating}
                  onChange={(e) => setSelectedMinRating(e.target.value)}
                  className="bg-[#111] text-gray-300 border border-white/20 px-2 py-1 text-[10px] uppercase font-mono outline-none focus:border-white cursor-pointer"
                >
                  <option value="all">ANY SCORE</option>
                  <option value="9">★ 9.0+ MASTERPIECE</option>
                  <option value="8">★ 8.0+ GREAT</option>
                  <option value="7">★ 7.0+ GOOD</option>
                  <option value="unrated">UNRATED</option>
                </select>
              </div>

              {/* Era / Release Year filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  ERA:
                </span>
                <select
                  value={selectedEra}
                  onChange={(e) => setSelectedEra(e.target.value)}
                  className="bg-[#111] text-gray-300 border border-white/20 px-2 py-1 text-[10px] uppercase font-mono outline-none focus:border-white cursor-pointer"
                >
                  <option value="all">ALL YEARS</option>
                  <option value="2020s">2020s (MODERN)</option>
                  <option value="2010s">2010s</option>
                  <option value="2000s">2000s</option>
                  <option value="classic">&lt; 2000 (CLASSIC)</option>
                </select>
              </div>

              {/* Favorites Toggle */}
              <button
                type="button"
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`px-2.5 py-1 border text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  favoritesOnly
                    ? "bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow shadow-[2px_2px_0px_0px_var(--cyber-yellow)]"
                    : "bg-transparent text-gray-400 border-white/10 hover:border-white hover:text-white"
                }`}
              >
                <span>★ Favorites</span>
              </button>

              {/* Reset All Filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2 py-1 border border-cyber-red/40 bg-cyber-red/10 text-cyber-red text-[10px] font-bold uppercase hover:bg-cyber-red hover:text-white transition-all cursor-pointer ml-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid View */}
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
              <span>SEARCH &amp; ADD TITLE</span>
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
          <button
            onClick={handleResetFilters}
            className="mt-2 text-[10px] text-cyber-cyan border border-cyber-cyan/40 px-3 py-1 hover:bg-cyber-cyan/10 transition-colors cursor-pointer"
          >
            Clear Active Filters
          </button>
        </div>
      )}

      {/* Sync All Warning Confirmation Dialog */}
      {showSyncAllWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-md bg-[#0d0d12] border-2 border-cyber-orange p-6 shadow-[4px_4px_0px_0px_var(--cyber-orange)] flex flex-col gap-4">
            <div className="flex items-center gap-2 text-cyber-orange">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="font-sans font-black text-sm uppercase tracking-wider text-white">
                Confirm Overall Data Sync
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              You are about to re-sync external metadata for <strong className="text-white">all {items.length} records</strong> in this category from external databases (AniList, TMDB, RAWG).
            </p>
            <div className="p-3 bg-cyber-orange/10 border border-cyber-orange/30 text-[11px] text-cyber-orange leading-relaxed">
              ⚠️ <strong>Warning:</strong> This queries external APIs sequentially and might take some time to finish.
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSyncAllWarning(false)}
                className="px-4 py-2 border border-white/20 text-xs font-bold text-gray-300 hover:text-white hover:border-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBatchSync("all")}
                className="px-4 py-2 bg-cyber-orange hover:bg-white text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer"
              >
                Proceed with Sync
              </button>
            </div>
          </div>
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
