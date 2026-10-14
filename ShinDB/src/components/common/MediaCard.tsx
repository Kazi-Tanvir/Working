"use client";

import React, { useState } from "react";
import { 
  Tv, 
  BookOpen, 
  Gamepad2, 
  Film, 
  Star, 
  Plus, 
  Minus, 
  Check 
} from "lucide-react";
import Badge from "./Badge";
import MediaModal from "./MediaModal";
import { SeasonData, formatStructuredProgress, calculateTotalWatched, calculateTotalEpisodes } from "@/utils/seasonHelpers";

export interface MediaItem {
  id: string;
  title: string;
  rating: string;
  externalRating?: string | null;
  status: string;
  coverImage: string;
  progress: string;
  progressCurrent: number;
  progressTotal: number | null;
  progressUnit: string;
  currentSeason?: number;
  seasons?: SeasonData[];
  genres: string[];
  releaseYear: number;
  type: "anime" | "manga" | "game" | "movie" | "series";
  notes?: string;
  isFavorite?: boolean;
}

interface MediaCardProps {
  item: MediaItem;
  onStatusChange?: (id: string, newStatus: string) => void;
  onProgressChange?: (id: string, newProgress: string) => void;
  onItemUpdate?: (updatedItem: MediaItem) => void;
}

export default function MediaCard({ item, onStatusChange, onProgressChange, onItemUpdate }: MediaCardProps) {
  // Setup simulated interactive state for progressive tracking (plus/minus)
  const [currentProgress, setCurrentProgress] = useState(item.progress);
  const [currentStatus, setCurrentStatus] = useState(item.status);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSeasonNum, setActiveSeasonNum] = useState(item.currentSeason || 1);
  const [seasonsState, setSeasonsState] = useState<SeasonData[] | undefined>(item.seasons);

  // Synchronize state when item prop updates from collection
  React.useEffect(() => {
    setCurrentProgress(item.progress);
    setCurrentStatus(item.status);
    setActiveSeasonNum(item.currentSeason || 1);
    setSeasonsState(item.seasons);
  }, [item]);

  // Determine media icon & colors dynamically
  const getMediaMeta = () => {
    switch (item.type) {
      case "anime":
        return {
          icon: <Tv className="w-3.5 h-3.5 text-cyber-purple" />,
          borderColor: "border-cyber-purple",
          accentClass: "text-cyber-purple",
          label: "Anime"
        };
      case "manga":
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-cyber-orange" />,
          borderColor: "border-cyber-orange",
          accentClass: "text-cyber-orange",
          label: "Manga"
        };
      case "game":
        return {
          icon: <Gamepad2 className="w-3.5 h-3.5 text-cyber-green" />,
          borderColor: "border-cyber-green",
          accentClass: "text-cyber-green",
          label: "Game"
        };
      case "movie":
        return {
          icon: <Film className="w-3.5 h-3.5 text-cyber-yellow" />,
          borderColor: "border-cyber-yellow",
          accentClass: "text-cyber-yellow",
          label: "Movie"
        };
      case "series":
        return {
          icon: <Tv className="w-3.5 h-3.5 text-cyber-cyan" />,
          borderColor: "border-cyber-cyan",
          accentClass: "text-cyber-cyan",
          label: "Series"
        };
      default:
        return {
          icon: <Tv className="w-3.5 h-3.5 text-white" />,
          borderColor: "border-white",
          accentClass: "text-white",
          label: "Media"
        };
    }
  };

  const meta = getMediaMeta();

  // Handle structured progress increment
  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. Season-aware increment
    if (seasonsState && seasonsState.length > 0) {
      const updatedSeasons = seasonsState.map((s) => ({ ...s }));
      const activeS =
        updatedSeasons.find((s) => s.seasonNumber === activeSeasonNum) || updatedSeasons[0];

      if (activeS && activeS.episodesWatched < activeS.episodeCount) {
        activeS.episodesWatched += 1;
        if (activeS.episodesWatched >= activeS.episodeCount) {
          activeS.isCompleted = true;
        }

        const totalWatched = calculateTotalWatched(updatedSeasons);
        const totalEpisodes = calculateTotalEpisodes(updatedSeasons);
        const newProg = formatStructuredProgress(
          updatedSeasons,
          activeS.seasonNumber,
          totalWatched,
          totalEpisodes,
          item.progressUnit
        );

        setSeasonsState(updatedSeasons);
        setCurrentProgress(newProg);

        if (totalWatched >= totalEpisodes && totalEpisodes > 0) {
          setCurrentStatus("Completed");
          if (onStatusChange) onStatusChange(item.id, "Completed");
        }
        if (onProgressChange) onProgressChange(item.id, newProg);

        // Persist to database
        fetch("/api/track", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            type: item.type,
            seasons: updatedSeasons,
            currentSeason: activeS.seasonNumber,
            progressCurrent: totalWatched,
          }),
        }).catch((err) => console.warn("Failed to sync card increment:", err));
      }
      return;
    }

    // 2. Standard ratio increment (e.g. 12/24 EP)
    if (currentProgress.includes("/")) {
      const parts = currentProgress.split("/");
      const currentVal = parseInt(parts[0]) || 0;
      const totalPart = parts[1];
      const totalVal = parseInt(totalPart);
      const unit = totalPart.replace(String(totalVal), "").trim();

      if (isNaN(totalVal) || currentVal < totalVal) {
        const newVal = currentVal + 1;
        const newProg = `${newVal}/${isNaN(totalVal) ? "?" : totalVal} ${unit}`;
        setCurrentProgress(newProg);

        if (!isNaN(totalVal) && newVal >= totalVal) {
          setCurrentStatus("Completed");
          if (onStatusChange) onStatusChange(item.id, "Completed");
        }
        if (onProgressChange) onProgressChange(item.id, newProg);

        fetch("/api/track", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            type: item.type,
            progressCurrent: newVal,
          }),
        }).catch((err) => console.warn("Failed to sync increment:", err));
      }
    } else if (currentProgress.toLowerCase().includes("hrs")) {
      const val = parseInt(currentProgress) || 0;
      const newProg = `${val + 1} hrs`;
      setCurrentProgress(newProg);
      if (onProgressChange) onProgressChange(item.id, newProg);
      fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          progressCurrent: val + 1,
        }),
      }).catch((err) => console.warn("Failed to sync increment:", err));
    } else if (currentProgress.toLowerCase().includes("mins")) {
      const val = parseInt(currentProgress) || 0;
      const newProg = `${val + 10} mins`;
      setCurrentProgress(newProg);
      if (onProgressChange) onProgressChange(item.id, newProg);
    }
  };

  // Handle structured progress decrement
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. Season-aware decrement
    if (seasonsState && seasonsState.length > 0) {
      const updatedSeasons = seasonsState.map((s) => ({ ...s }));
      const activeS =
        updatedSeasons.find((s) => s.seasonNumber === activeSeasonNum) || updatedSeasons[0];

      if (activeS && activeS.episodesWatched > 0) {
        activeS.episodesWatched -= 1;
        activeS.isCompleted = false;

        const totalWatched = calculateTotalWatched(updatedSeasons);
        const totalEpisodes = calculateTotalEpisodes(updatedSeasons);
        const newProg = formatStructuredProgress(
          updatedSeasons,
          activeS.seasonNumber,
          totalWatched,
          totalEpisodes,
          item.progressUnit
        );

        setSeasonsState(updatedSeasons);
        setCurrentProgress(newProg);

        if (currentStatus === "Completed" && totalWatched < totalEpisodes) {
          const activeStatus = "Watching";
          setCurrentStatus(activeStatus);
          if (onStatusChange) onStatusChange(item.id, activeStatus);
        }
        if (onProgressChange) onProgressChange(item.id, newProg);

        fetch("/api/track", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            type: item.type,
            seasons: updatedSeasons,
            currentSeason: activeS.seasonNumber,
            progressCurrent: totalWatched,
          }),
        }).catch((err) => console.warn("Failed to sync card decrement:", err));
      }
      return;
    }

    // 2. Standard ratio decrement
    if (currentProgress.includes("/")) {
      const parts = currentProgress.split("/");
      const currentVal = parseInt(parts[0]) || 0;
      const totalPart = parts[1];
      const totalVal = parseInt(totalPart);
      const unit = totalPart.replace(String(totalVal), "").trim();

      if (currentVal > 0) {
        const newVal = currentVal - 1;
        const newProg = `${newVal}/${isNaN(totalVal) ? "?" : totalVal} ${unit}`;
        setCurrentProgress(newProg);

        if (currentStatus === "Completed" && !isNaN(totalVal) && newVal < totalVal) {
          const activeStatus =
            item.type === "manga"
              ? "Reading"
              : item.type === "game"
              ? "Playing"
              : "Watching";
          setCurrentStatus(activeStatus);
          if (onStatusChange) onStatusChange(item.id, activeStatus);
        }
        if (onProgressChange) onProgressChange(item.id, newProg);

        fetch("/api/track", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            type: item.type,
            progressCurrent: newVal,
          }),
        }).catch((err) => console.warn("Failed to sync decrement:", err));
      }
    } else if (currentProgress.toLowerCase().includes("hrs")) {
      const val = parseInt(currentProgress) || 0;
      if (val > 0) {
        const newProg = `${val - 1} hrs`;
        setCurrentProgress(newProg);
        if (onProgressChange) onProgressChange(item.id, newProg);
      }
    }
  };

  // Direct complete
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentStatus("Completed");
    if (onStatusChange) onStatusChange(item.id, "Completed");

    if (seasonsState && seasonsState.length > 0) {
      const updatedSeasons = seasonsState.map((s) => ({
        ...s,
        episodesWatched: s.episodeCount,
        isCompleted: true,
      }));
      const totalWatched = calculateTotalWatched(updatedSeasons);
      const totalEpisodes = calculateTotalEpisodes(updatedSeasons);
      const newProg = `Completed (${totalEpisodes}/${totalEpisodes} ${item.progressUnit.toUpperCase()})`;
      setSeasonsState(updatedSeasons);
      setCurrentProgress(newProg);
      if (onProgressChange) onProgressChange(item.id, newProg);

      fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          status: "Completed",
          seasons: updatedSeasons,
          progressCurrent: totalWatched,
        }),
      }).catch((err) => console.warn("Failed to sync complete:", err));
    }
  };

  // Determine Aspect Ratio based on category images
  const isGame = item.type === "game";
  const aspectClass = isGame ? "aspect-video" : "aspect-[2/3]";

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group w-full select-none flex flex-col cursor-pointer"
      >
        
        {/* Cover Image Container */}
        <div className={`relative w-full ${aspectClass} overflow-hidden rounded-lg bg-[#0e0e11]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          />
          
          {/* Obsidian Sleek Interactive Hover Console Overlay */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 sm:p-2.5 flex flex-col justify-between select-none">
            {isGame ? (
              /* --- LANDSCAPE (GAME) CONSOLE OVERLAY: Compact horizontal layout to guarantee buttons are fully visible --- */
              <>
                {/* Top Panel: Badges & Score in a single compact row */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Badge status={currentStatus} className="!text-[9px] !px-1.5 !py-0.5 leading-none">
                      {currentStatus}
                    </Badge>
                    <Badge color="green" className="!border-cyber-green/40 !text-[9px] !py-0.5 !px-1.5 leading-none hidden xs:inline-flex">
                      <span className="flex items-center gap-1 font-mono text-cyber-green">
                        <Gamepad2 className="w-3 h-3" />
                        GAME
                      </span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-cyber-yellow font-mono text-[10px] font-bold shrink-0">
                    <Star className="w-3 h-3 fill-cyber-yellow" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                {/* Middle Panel: Genres / Platforms */}
                {item.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 my-auto overflow-hidden">
                    {item.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="font-mono text-[8px] uppercase tracking-wider bg-white/10 text-gray-300 px-1.5 py-0.5"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Panel: Progress counter on left, Action buttons on right */}
                <div className="border-t border-white/20 pt-1.5 flex items-center justify-between gap-2 w-full mt-auto">
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest leading-none">
                      LOGGED
                    </span>
                    <span className="font-mono font-black text-[11px] tracking-wide text-white truncate">
                      {currentProgress}
                    </span>
                  </div>

                  {/* Micro-interaction increment buttons - clearly visible and clickable */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleDecrement}
                      className="bg-white/10 hover:bg-white hover:text-black border border-white/20 text-white p-1.5 transition-all active:scale-95 cursor-pointer flex justify-center items-center"
                      title="Decrement Progress"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleIncrement}
                      className="bg-white/10 hover:bg-white hover:text-black border border-white/20 text-white p-1.5 transition-all active:scale-95 cursor-pointer flex justify-center items-center"
                      title="Increment Progress"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {currentStatus !== "Completed" && (
                      <button
                        onClick={handleComplete}
                        className="bg-white/10 hover:bg-cyber-green hover:text-black border border-white/20 text-white p-1.5 transition-all active:scale-95 cursor-pointer flex justify-center items-center"
                        title="Mark Completed"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* --- PORTRAIT (POSTER) CONSOLE OVERLAY --- */
              <>
                {/* Top Panel: Badges */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 w-full">
                  <Badge status={currentStatus} className="!text-[9px] !px-1.5 !py-0.5">{currentStatus}</Badge>
                  <Badge color="white" className="!border-white/40 !text-[9px] !py-0.5 !px-1.5">
                    <span className="flex items-center gap-1 font-mono">
                      {meta.icon}
                      {meta.label}
                    </span>
                  </Badge>
                </div>

                {/* Middle Panel: Genres & Score */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-1 font-mono text-xs">
                    <div className="flex items-center gap-1 text-cyber-yellow font-bold">
                      <Star className="w-3.5 h-3.5 fill-cyber-yellow" />
                      <span>{item.rating}</span>
                    </div>
                    {item.externalRating && (
                      <span className="text-[9px] uppercase tracking-wider bg-white/5 border border-cyber-cyan/30 text-cyber-cyan px-1.5 py-0.5" title="Official External Rating">
                        {item.externalRating}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {item.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="font-mono text-[9px] uppercase tracking-wider bg-white/10 text-gray-300 px-1.5 py-0.5"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Panel: Interactive Controls stacked vertically to prevent horizontal overflow */}
                <div className="border-t border-white/20 pt-1.5 flex flex-col gap-1.5 w-full">
                  {/* Small Square Season Buttons for multi-season titles */}
                  {seasonsState && seasonsState.length > 1 && (
                    <div 
                      className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {seasonsState.map((s) => (
                        <button
                          key={s.seasonNumber}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSeasonNum(s.seasonNumber);
                          }}
                          className={`px-1.5 py-0.5 text-[9px] font-mono border transition-all cursor-pointer shrink-0 ${
                            s.isCompleted
                              ? "border-cyber-green text-cyber-green bg-cyber-green/10"
                              : s.seasonNumber === activeSeasonNum
                              ? "border-cyber-cyan text-cyber-cyan bg-cyber-cyan/20 font-bold scale-105"
                              : "border-white/10 text-gray-500 hover:text-white hover:border-white/30"
                          }`}
                          title={`${s.title || `Season ${s.seasonNumber}`}: ${s.episodesWatched}/${s.episodeCount} eps`}
                        >
                          S{s.seasonNumber}{s.isCompleted ? "✓" : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center w-full">
                    <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest leading-none">
                      Progress
                    </span>
                    <span className="font-mono font-black text-[11px] tracking-wide text-white">
                      {currentProgress}
                    </span>
                  </div>

                  {/* Micro-interaction increment buttons stretching evenly */}
                  <div className="flex items-center gap-1 w-full">
                    <button
                      onClick={handleDecrement}
                      className="bg-white/10 hover:bg-white hover:text-black border border-white/20 text-white p-1 transition-all active:scale-95 cursor-pointer flex-1 flex justify-center items-center"
                      title="Decrement Progress"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleIncrement}
                      className="bg-white/10 hover:bg-white hover:text-black border border-white/20 text-white p-1 transition-all active:scale-95 cursor-pointer flex-1 flex justify-center items-center"
                      title="Increment Progress"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {currentStatus !== "Completed" && (
                      <button
                        onClick={handleComplete}
                        className="bg-white/10 hover:bg-cyber-green hover:text-black border border-white/20 text-white p-1 transition-all active:scale-95 cursor-pointer flex-1 flex justify-center items-center"
                        title="Mark Completed"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Floating Gallery Text below image */}
        <div className="mt-2.5 px-0.5 text-left font-mono text-xs font-semibold tracking-wide text-[#cbd5e1] group-hover:text-white transition-colors truncate">
          {item.title} ({item.releaseYear})
        </div>

      </div>

      <MediaModal
        item={{
          ...item,
          status: currentStatus,
          progress: currentProgress,
          currentSeason: activeSeasonNum,
          seasons: seasonsState,
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateItem={(updatedItem) => {
          setCurrentStatus(updatedItem.status);
          setCurrentProgress(updatedItem.progress);
          if (updatedItem.currentSeason) setActiveSeasonNum(updatedItem.currentSeason);
          if (updatedItem.seasons) setSeasonsState(updatedItem.seasons);
          if (onItemUpdate) onItemUpdate(updatedItem);
        }}
        onUpdateState={(newStatus, newProgress) => {
          setCurrentStatus(newStatus);
          setCurrentProgress(newProgress);
        }}
      />
    </>
  );
}
