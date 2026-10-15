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
  mediaId?: string;
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
  isUserTracked?: boolean;
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

  // Helper to determine status styling, status stripe color and hover glow
  const getStatusTheme = (status: string) => {
    const norm = (status || "").toLowerCase();
    if (norm === "watching" || norm === "reading" || norm === "playing") {
      return {
        dotBg: "bg-cyber-green",
        textColor: "text-cyber-green",
        borderColor: "border-cyber-green",
        stripeBg: "bg-cyber-green",
        glowClass: "group-hover:shadow-[0_0_15px_rgba(46,204,113,0.35)]",
        label: status,
      };
    }
    if (norm === "completed") {
      return {
        dotBg: "bg-cyber-cyan",
        textColor: "text-cyber-cyan",
        borderColor: "border-cyber-cyan",
        stripeBg: "bg-cyber-cyan",
        glowClass: "group-hover:shadow-[0_0_15px_rgba(0,240,255,0.35)]",
        label: "Completed",
      };
    }
    if (norm.includes("hold")) {
      return {
        dotBg: "bg-cyber-yellow",
        textColor: "text-cyber-yellow",
        borderColor: "border-cyber-yellow",
        stripeBg: "bg-cyber-yellow",
        glowClass: "group-hover:shadow-[0_0_15px_rgba(255,230,0,0.35)]",
        label: "On-Hold",
      };
    }
    if (norm.includes("drop")) {
      return {
        dotBg: "bg-cyber-red",
        textColor: "text-cyber-red",
        borderColor: "border-cyber-red",
        stripeBg: "bg-cyber-red",
        glowClass: "group-hover:shadow-[0_0_15px_rgba(255,0,60,0.35)]",
        label: "Dropped",
      };
    }
    return {
      dotBg: "bg-cyber-purple",
      textColor: "text-cyber-purple",
      borderColor: "border-cyber-purple",
      stripeBg: "bg-cyber-purple",
      glowClass: "group-hover:shadow-[0_0_15px_rgba(157,0,255,0.35)]",
      label: "Plan",
    };
  };

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
      const newProg = `${val + 1} mins`;
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
        fetch("/api/track", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            type: item.type,
            progressCurrent: val - 1,
          }),
        }).catch((err) => console.warn("Failed to sync decrement:", err));
      }
    } else if (currentProgress.toLowerCase().includes("mins")) {
      const val = parseInt(currentProgress) || 0;
      if (val > 0) {
        const newProg = `${val - 1} mins`;
        setCurrentProgress(newProg);
        if (onProgressChange) onProgressChange(item.id, newProg);
        fetch("/api/track", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            type: item.type,
            progressCurrent: val - 1,
          }),
        }).catch((err) => console.warn("Failed to sync decrement:", err));
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
    } else {
      let newWatched = item.progressCurrent;
      let newProg = currentProgress;
      if (currentProgress.includes("/")) {
        const parts = currentProgress.split("/");
        const totalPart = parts[1];
        const totalVal = parseInt(totalPart);
        const unit = totalPart.replace(String(totalVal), "").trim();
        if (!isNaN(totalVal)) {
          newWatched = totalVal;
          newProg = `${totalVal}/${totalVal} ${unit}`;
        }
      } else if (item.progressTotal) {
        newWatched = item.progressTotal;
        newProg = `${item.progressTotal}/${item.progressTotal} ${item.progressUnit.toUpperCase()}`;
      }
      setCurrentProgress(newProg);
      if (onProgressChange) onProgressChange(item.id, newProg);

      fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          status: "Completed",
          progressCurrent: newWatched,
        }),
      }).catch((err) => console.warn("Failed to sync complete:", err));
    }
  };

  const handleTrackItem = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const defaultStatus =
        item.type === "manga" ? "reading" : item.type === "game" ? "playing" : "watching";
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: item.mediaId || item.id,
          title: item.title,
          type: item.type,
          status: defaultStatus,
          progressCurrent: 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const displayStatus =
          item.type === "manga" ? "Reading" : item.type === "game" ? "Playing" : "Watching";
        setCurrentStatus(displayStatus);
        if (onItemUpdate && data.entry) {
          onItemUpdate(data.entry);
        }
      }
    } catch (err) {
      console.error("Failed to track item", err);
    }
  };

  // Determine Aspect Ratio based on category images
  const isGame = item.type === "game";
  const aspectClass = isGame ? "aspect-video" : "aspect-[2/3]";
  const statusTheme = getStatusTheme(currentStatus);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group w-full select-none flex flex-col cursor-pointer"
      >

        {/* Cover Image Container with Status Stripe & Hover Glow */}
        <div className={`relative w-full ${aspectClass} overflow-hidden rounded-lg bg-[#0e0e11] border border-white/10 ${statusTheme.glowClass} transition-all duration-300`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          />

          {/* Unobtrusive colored status stripe on poster edge */}
          <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${statusTheme.stripeBg} z-10`} />

          {/* Obsidian Sleek Interactive Hover Console Overlay */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 sm:p-2.5 flex flex-col justify-between select-none">
            {isGame ? (
              /* --- LANDSCAPE (GAME) CONSOLE OVERLAY: Clean, uncluttered layout --- */
              <div className="flex flex-col justify-between h-full w-full">
                {/* Top Panel: Status Badge on left, Score on right */}
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <Badge status={currentStatus} className="!text-[9px] !px-1.5 !py-0.5 leading-none shrink-0">
                    {currentStatus}
                  </Badge>

                  <div className="flex items-center gap-1 font-mono text-[10px] text-cyber-yellow font-bold bg-black/80 px-1.5 py-0.5 border border-white/10 shrink-0">
                    <Star className="w-3 h-3 fill-cyber-yellow" />
                    <span>{item.rating.split("/")[0]}</span>
                    {item.externalRating && (
                      <span className="text-[8px] text-cyber-cyan border-l border-white/20 pl-1" title="External Rating">
                        {item.externalRating.split("/")[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Panel: Platforms / Genres (capped to 2) */}
                {item.genres.length > 0 && (
                  <div className="flex items-center gap-1 overflow-hidden my-auto py-0.5">
                    {item.genres.slice(0, 2).map((genre) => (
                      <span
                        key={genre}
                        className="font-mono text-[8px] uppercase tracking-wider bg-white/10 text-gray-300 px-1.5 py-0.5 truncate rounded-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Panel: Progress counter on left, Action buttons on right */}
                <div className="border-t border-white/20 pt-1.5 flex items-center justify-between gap-2 w-full mt-auto">
                  {currentStatus === "Not Tracked" ? (
                    <button
                      onClick={handleTrackItem}
                      className="w-full bg-cyber-purple hover:bg-white text-white hover:text-black font-extrabold text-[9px] py-1 px-2 border border-white tracking-widest uppercase transition-all shadow-[2px_2px_0px_0px_#ffffff] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>TRACK GAME</span>
                    </button>
                  ) : (
                    <>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-[7px] text-gray-400 uppercase tracking-widest leading-none">
                          LOGGED
                        </span>
                        <span className="font-mono font-black text-[11px] tracking-wide text-white truncate">
                          {currentProgress}
                        </span>
                      </div>

                      {/* Micro-interaction increment buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={handleDecrement}
                          className="bg-white/10 hover:bg-white hover:text-black border border-white/20 text-white p-1 transition-all active:scale-95 cursor-pointer flex justify-center items-center rounded-sm"
                          title="Decrement Progress"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleIncrement}
                          className="bg-white/10 hover:bg-white hover:text-black border border-white/20 text-white p-1 transition-all active:scale-95 cursor-pointer flex justify-center items-center rounded-sm"
                          title="Increment Progress"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        {currentStatus !== "Completed" && (
                          <button
                            onClick={handleComplete}
                            className="bg-white/10 hover:bg-cyber-green hover:text-black border border-white/20 text-white p-1 transition-all active:scale-95 cursor-pointer flex justify-center items-center rounded-sm"
                            title="Mark Completed"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* --- PORTRAIT (POSTER) CONSOLE OVERLAY: Clean, decluttered, no seasons in hover --- */
              <div className="flex flex-col justify-between h-full w-full">
                {/* Top Panel: Status Badge on left, Score on right */}
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <Badge status={currentStatus} className="!text-[9px] !px-1.5 !py-0.5 leading-none shrink-0">
                    {currentStatus}
                  </Badge>

                  <div className="flex items-center gap-1 font-mono text-[10px] text-cyber-yellow font-bold bg-black/80 px-1.5 py-0.5 border border-white/10 shrink-0">
                    <Star className="w-3 h-3 fill-cyber-yellow" />
                    <span>{item.rating.split("/")[0]}</span>
                    {item.externalRating && (
                      <span className="text-[8px] text-cyber-cyan border-l border-white/20 pl-1" title="Official External Rating">
                        {item.externalRating.split("/")[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Panel: Media Meta & Genres */}
                <div className="flex flex-col gap-2 my-auto">
                  <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[10px]">
                    {meta.icon}
                    <span className="uppercase tracking-wider font-semibold">{meta.label}</span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-500">{item.releaseYear}</span>
                  </div>

                  {item.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.genres.slice(0, 2).map((genre) => (
                        <span
                          key={genre}
                          className="font-mono text-[8px] uppercase tracking-wider bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                    <span>Click card for details</span>
                    <span>↗</span>
                  </div>
                </div>

                {/* Bottom Panel: Progress on left, Controls on right */}
                <div className="border-t border-white/20 pt-2 flex items-center justify-between gap-2 w-full mt-auto">
                  {currentStatus === "Not Tracked" ? (
                    <button
                      onClick={handleTrackItem}
                      className="w-full bg-cyber-purple hover:bg-white text-white hover:text-black font-extrabold text-[10px] py-1.5 px-2 border border-white tracking-widest uppercase transition-all shadow-[2px_2px_0px_0px_#ffffff] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ADD TO MY LOGS</span>
                    </button>
                  ) : (
                    <>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest leading-none">
                          PROGRESS
                        </span>
                        <span className="font-mono font-bold text-xs tracking-wide text-white truncate" title={currentProgress}>
                          {currentProgress}
                        </span>
                      </div>

                      {/* Micro-interaction increment buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={handleDecrement}
                          className="bg-white/10 hover:bg-white hover:text-black border border-white/20 text-white p-1.5 transition-all active:scale-95 cursor-pointer flex justify-center items-center rounded-sm"
                          title="Decrement Progress"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleIncrement}
                          className="bg-white/10 hover:bg-white hover:text-black border border-white/20 text-white p-1.5 transition-all active:scale-95 cursor-pointer flex justify-center items-center rounded-sm"
                          title="Increment Progress"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {currentStatus !== "Completed" && (
                          <button
                            onClick={handleComplete}
                            className="bg-white/10 hover:bg-cyber-green hover:text-black border border-white/20 text-white p-1.5 transition-all active:scale-95 cursor-pointer flex justify-center items-center rounded-sm"
                            title="Mark Completed"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Gallery Info Below Image */}
        <div className="mt-2.5 px-0.5 text-left flex flex-col gap-1.5">
          <h3 
            className="font-sans font-bold text-xs sm:text-sm text-gray-200 group-hover:text-white transition-colors leading-tight line-clamp-2 min-h-[2.3rem]"
            title={`${item.title} (${item.releaseYear})`}
          >
            {item.title}
          </h3>

          <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusTheme.dotBg}`} />
              <span className={`truncate uppercase tracking-wider font-semibold text-[9px] ${statusTheme.textColor}`}>
                {currentProgress.includes("/") ? currentProgress.split(" ")[0] : statusTheme.label}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-cyber-yellow font-bold flex items-center gap-0.5 text-[10px]">
                ★ {item.rating.split("/")[0]}
              </span>
              {item.externalRating && (
                <span className="text-[8px] text-cyber-cyan border border-cyber-cyan/30 px-1 py-0.2 rounded leading-none hidden xs:inline" title="External Canonical Rating">
                  {item.externalRating.split("/")[0]}
                </span>
              )}
            </div>
          </div>
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
