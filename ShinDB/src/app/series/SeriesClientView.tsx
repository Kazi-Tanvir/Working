"use client";

import React, { useState } from "react";
import { 
  Search, 
  Tv, 
  Filter, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Plus, 
  ChevronsUpDown, 
  X 
} from "lucide-react";
import MediaCard, { MediaItem } from "@/components/common/MediaCard";
import CreateMediaModal from "@/components/common/CreateMediaModal";
import { showToast } from "@/components/common/Toast";

interface SeriesClientViewProps {
  initialItems: MediaItem[];
}

export default function SeriesClientView({ initialItems }: SeriesClientViewProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  // Ribbon interactive panel controls
  const [showFilterDrawer, setShowFilterDrawer] = useState(true);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleStatusChange = (id: string, newStatus: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
    );
    fetch("/api/track", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "series", status: newStatus })
    }).catch(err => console.error("Failed to persist status change:", err));
  };

  const handleProgressChange = (id: string, newProgress: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, progress: newProgress } : item))
    );
    fetch("/api/track", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "series", progress: newProgress })
    }).catch(err => console.error("Failed to persist progress change:", err));
  };

  // Sort logic toggler
  const [isSorted, setIsSorted] = useState(false);
  const handleSort = () => {
    setIsSorted(!isSorted);
    setItems(prev => {
      const sorted = [...prev];
      if (!isSorted) {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        sorted.sort((a, b) => a.id.localeCompare(b.id));
      }
      return sorted;
    });
  };

  // Filter computations
  const filteredItems = items.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase().trim());
    const matchesStatus =
      selectedStatus === "all" || item.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="w-full flex flex-col gap-6 font-mono select-none">
      
      {/* Sleek Obsidian Control Ribbon */}
      <section className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-white/10 text-xs text-gray-400">
        
        {/* Left Side: Brand View Selector */}
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-cyber-cyan" />
          <span className="font-sans font-bold text-white tracking-wide uppercase text-sm">
            All TV Series
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-pointer" />
          
          <span className="text-[10px] text-gray-600 font-medium ml-2">
            {filteredItems.length} results
          </span>
        </div>

        {/* Right Side: Command Buttons */}
        <div className="flex items-center gap-3.5">
          <button 
            onClick={handleSort}
            className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${isSorted ? "text-cyber-cyan font-bold" : ""}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort</span>
          </button>
          
          <button 
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${showFilterDrawer ? "text-cyber-cyan font-bold" : ""}`}
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
            className={`flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ${showSearchDrawer ? "text-cyber-cyan font-bold" : ""}`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1 text-white hover:text-cyber-cyan transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

      </section>

      {/* Togglable Search panel */}
      {showSearchDrawer && (
        <div className="relative flex items-center bg-black border border-white/20 px-3 py-1.5 transition-all shadow-[2px_2px_0px_0px_var(--cyber-cyan)]">
          <Search className="w-3.5 h-3.5 text-gray-500 mr-2" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="FILTER TV SERIES LOGS..."
            className="w-full bg-transparent text-white text-xs outline-none uppercase tracking-widest placeholder:text-gray-600"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X className="w-3 h-3 text-gray-500 hover:text-white" />
            </button>
          )}
        </div>
      )}

      {/* Togglable Status Filter panel */}
      {showFilterDrawer && (
        <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-white/10 pb-4">
          {["all", "watching", "completed", "plan to watch", "dropped"].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-all ${
                selectedStatus === status
                  ? "bg-cyber-cyan text-black border-cyber-cyan shadow-[2px_2px_0px_0px_#ffffff]"
                  : "bg-transparent text-gray-400 border-white/10 hover:border-white hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {/* Grid Layout conforming to portrait cards (2:3 aspect) */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-6">
          {filteredItems.map(item => (
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
        defaultType="series"
      />
    </div>
  );
}
