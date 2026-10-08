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

export interface MediaItem {
  id: string;
  title: string;
  rating: string;
  status: string;
  coverImage: string;
  progress: string;
  genres: string[];
  releaseYear: number;
  type: "anime" | "manga" | "game" | "movie" | "series";
}

interface MediaCardProps {
  item: MediaItem;
  onStatusChange?: (id: string, newStatus: string) => void;
  onProgressChange?: (id: string, newProgress: string) => void;
}

export default function MediaCard({ item, onStatusChange, onProgressChange }: MediaCardProps) {
  // Setup simulated interactive state for progressive tracking (plus/minus)
  const [currentProgress, setCurrentProgress] = useState(item.progress);
  const [currentStatus, setCurrentStatus] = useState(item.status);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Handle a simulated progress increment
  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProgress.includes("/")) {
      const parts = currentProgress.split("/");
      const currentVal = parseInt(parts[0]);
      const totalPart = parts[1]; // e.g. "28 EP" or "380 CH"
      const totalVal = parseInt(totalPart);
      const unit = totalPart.replace(String(totalVal), "").trim();

      if (currentVal < totalVal) {
        const newVal = currentVal + 1;
        const newProg = `${newVal}/${totalVal} ${unit}`;
        setCurrentProgress(newProg);
        
        // If progress completed, change status to completed!
        if (newVal === totalVal) {
          setCurrentStatus("Completed");
          if (onStatusChange) onStatusChange(item.id, "Completed");
        }
        if (onProgressChange) onProgressChange(item.id, newProg);
      }
    } else if (currentProgress.toLowerCase().includes("hrs")) {
      const val = parseInt(currentProgress);
      const newProg = `${val + 1} hrs`;
      setCurrentProgress(newProg);
      if (onProgressChange) onProgressChange(item.id, newProg);
    } else if (currentProgress.toLowerCase().includes("mins")) {
      const val = parseInt(currentProgress);
      const newProg = `${val + 10} mins`; // Add 10 mins
      setCurrentProgress(newProg);
      if (onProgressChange) onProgressChange(item.id, newProg);
    } else if (currentProgress.startsWith("S") && currentProgress.includes("E")) {
      // e.g. "S1E08"
      const match = currentProgress.match(/S(\d+)E(\d+)/);
      if (match) {
        const season = parseInt(match[1]);
        const episode = parseInt(match[2]);
        const newProg = `S${season}E${String(episode + 1).padStart(2, '0')}`;
        setCurrentProgress(newProg);
        if (onProgressChange) onProgressChange(item.id, newProg);
      }
    }
  };

  // Handle simulated progress decrement
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProgress.includes("/")) {
      const parts = currentProgress.split("/");
      const currentVal = parseInt(parts[0]);
      const totalPart = parts[1];
      const totalVal = parseInt(totalPart);
      const unit = totalPart.replace(String(totalVal), "").trim();

      if (currentVal > 0) {
        const newVal = currentVal - 1;
        const newProg = `${newVal}/${totalVal} ${unit}`;
        setCurrentProgress(newProg);
        // If status was Completed and we decrement, return it to active
        if (currentStatus === "Completed" && newVal < totalVal) {
          const activeStatus = item.type === "manga" ? "Reading" : (item.type === "game" ? "Playing" : "Watching");
          setCurrentStatus(activeStatus);
          if (onStatusChange) onStatusChange(item.id, activeStatus);
        }
        if (onProgressChange) onProgressChange(item.id, newProg);
      }
    } else if (currentProgress.toLowerCase().includes("hrs")) {
      const val = parseInt(currentProgress);
      if (val > 0) {
        const newProg = `${val - 1} hrs`;
        setCurrentProgress(newProg);
        if (onProgressChange) onProgressChange(item.id, newProg);
      }
    } else if (currentProgress.toLowerCase().includes("mins")) {
      const val = parseInt(currentProgress);
      if (val > 10) {
        const newProg = `${val - 10} mins`;
        setCurrentProgress(newProg);
        if (onProgressChange) onProgressChange(item.id, newProg);
      }
    } else if (currentProgress.startsWith("S") && currentProgress.includes("E")) {
      const match = currentProgress.match(/S(\d+)E(\d+)/);
      if (match) {
        const season = parseInt(match[1]);
        const episode = parseInt(match[2]);
        if (episode > 1) {
          const newProg = `S${season}E${String(episode - 1).padStart(2, '0')}`;
          setCurrentProgress(newProg);
          if (onProgressChange) onProgressChange(item.id, newProg);
        }
      }
    }
  };

  // Handle Mark Completed
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentStatus("Completed");
    // Maximize progress if in "18/28 EP" format
    if (currentProgress.includes("/")) {
      const parts = currentProgress.split("/");
      const totalPart = parts[1];
      const totalVal = parseInt(totalPart);
      const unit = totalPart.replace(String(totalVal), "").trim();
      const newProg = `${totalVal}/${totalVal} ${unit}`;
      setCurrentProgress(newProg);
      if (onProgressChange) onProgressChange(item.id, newProg);
    }
    if (onStatusChange) onStatusChange(item.id, "Completed");
  };

  // Determine Aspect Ratio based on category images
  const aspectClass = item.type === "game" ? "aspect-video" : "aspect-[2/3]";

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
          <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 flex flex-col justify-between select-none">
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1 text-cyber-yellow font-mono text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-cyber-yellow" />
                <span>SCORE: {item.rating}</span>
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
            <div className="border-t border-white/20 pt-2 flex flex-col gap-2 w-full">
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
          </div>
        </div>

        {/* Floating Gallery Text below image */}
        <div className="mt-2.5 px-0.5 text-left font-mono text-xs font-semibold tracking-wide text-[#cbd5e1] group-hover:text-white transition-colors truncate">
          {item.title} ({item.releaseYear})
        </div>

      </div>

      <MediaModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateState={(newStatus, newProgress) => {
          setCurrentStatus(newStatus);
          setCurrentProgress(newProgress);
        }}
      />
    </>
  );
}
