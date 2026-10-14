"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Plus, 
  Star, 
  Calendar, 
  Hash, 
  Image as ImageIcon, 
  Sliders,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import Badge from "./Badge";
import { showToast } from "@/components/common/Toast";

interface CreateMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: "anime" | "manga" | "game" | "movie" | "series";
}

const DEFAULT_COVER_IMAGES = {
  anime: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  manga: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  game: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
  movie: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
  series: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80"
};

export default function CreateMediaModal({ isOpen, onClose, defaultType }: CreateMediaModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fields
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"anime" | "manga" | "game" | "movie" | "series">(defaultType);
  const [releaseYear, setReleaseYear] = useState(String(new Date().getFullYear()));
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState("");
  const [genres, setGenres] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // Sync types and clear form on open
  useEffect(() => {
    setTitle("");
    setType(defaultType);
    setReleaseYear(String(new Date().getFullYear()));
    setRating("");
    setStatus("");
    setProgress("");
    setGenres("");
    setCoverImage("");
    setErrorMsg("");
  }, [isOpen, defaultType]);

  // Lock scroll on body and handle Escape key down to close modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Set type-specific defaults when type changes
  useEffect(() => {
    // Set default status
    if (type === "manga") {
      setStatus("Plan to Read");
      setProgress("0/? CH");
    } else if (type === "game") {
      setStatus("Plan to Play");
      setProgress("0 hrs");
    } else if (type === "movie") {
      setStatus("Plan to Watch");
      setProgress("0 mins");
    } else if (type === "series") {
      setStatus("Plan to Watch");
      setProgress("S1E01");
    } else {
      setStatus("Plan to Watch");
      setProgress("0/? EP");
    }
  }, [type]);

  if (!isOpen) return null;

  const getTypeMeta = (mediaType: string) => {
    switch (mediaType) {
      case "anime":
        return {
          color: "var(--cyber-purple)",
          borderClass: "border-cyber-purple",
          shadowClass: "neo-shadow-purple",
          accentText: "text-cyber-purple",
          progressPlaceholder: "e.g. 0/12 EP"
        };
      case "manga":
        return {
          color: "var(--cyber-orange)",
          borderClass: "border-cyber-orange",
          shadowClass: "neo-shadow-orange",
          accentText: "text-cyber-orange",
          progressPlaceholder: "e.g. 0/147 CH"
        };
      case "game":
        return {
          color: "var(--cyber-green)",
          borderClass: "border-cyber-green",
          shadowClass: "neo-shadow-green",
          accentText: "text-cyber-green",
          progressPlaceholder: "e.g. 0 hrs"
        };
      case "movie":
        return {
          color: "var(--cyber-yellow)",
          borderClass: "border-cyber-yellow",
          shadowClass: "neo-shadow-yellow",
          accentText: "text-cyber-yellow",
          progressPlaceholder: "e.g. 120 mins"
        };
      case "series":
        return {
          color: "var(--cyber-cyan)",
          borderClass: "border-cyber-cyan",
          shadowClass: "neo-shadow-cyan",
          accentText: "text-cyber-cyan",
          progressPlaceholder: "e.g. S1E01"
        };
      default:
        return {
          color: "#ffffff",
          borderClass: "border-white",
          shadowClass: "neo-shadow",
          accentText: "text-white",
          progressPlaceholder: "e.g. 0"
        };
    }
  };

  const meta = getTypeMeta(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    // Standardize rating
    let cleanRating = "N/A";
    const rateVal = parseFloat(rating);
    if (!isNaN(rateVal)) {
      cleanRating = `${rateVal.toFixed(1)}/10`;
    }

    // Standardize genres
    const genreArray = genres
      .split(",")
      .map(g => g.trim())
      .filter(g => g !== "");

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          releaseYear: parseInt(releaseYear) || new Date().getFullYear(),
          rating: cleanRating,
          status,
          progress: progress.trim(),
          genres: genreArray,
          coverImage: coverImage.trim() || DEFAULT_COVER_IMAGES[type]
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create item.");
      }

      // Revalidate page & close
      router.refresh();
      onClose();
      showToast(`Successfully created record: "${title.trim()}"`, "success");
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to create item.");
      showToast(e.message || "Failed to create item.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const aspectClass = type === "game" ? "aspect-video md:aspect-[16/10]" : "aspect-[2/3]";

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none transition-all duration-300"
    >
      
      {/* Premium Neobrutalist Modal Outer Box */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#09090b] border-2 text-white ${meta.borderClass} ${meta.shadowClass} p-6 md:p-8 flex flex-col gap-6 font-sans`}
      >
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 select-none">
          <div className="flex items-center gap-2">
            <Badge status="Watching">NEW RECORD</Badge>
            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
              LOCAL_DB_WRITE
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Close Form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ERROR MESSAGE ALERT */}
        {errorMsg && (
          <div className="border border-cyber-red bg-cyber-red/10 text-cyber-red text-xs px-4 py-2 flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CREATE FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
          {/* Left Cover preview column */}
          <div className="w-full md:w-1/3 flex flex-col gap-3">
            <div className={`relative w-full ${aspectClass} overflow-hidden border border-white/20 bg-[#000]`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage || DEFAULT_COVER_IMAGES[type]}
                alt="Cover Preview"
                className="w-full h-full object-cover"
                onError={() => setCoverImage("")}
              />
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-gray-400 font-mono flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> COVER IMAGE URL
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="Optional image URL"
                className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono text-[11px] focus:border-white outline-none"
              />
            </div>
          </div>

          {/* Right fields column */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Title */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400 font-mono">MEDIA TITLE *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. My Favorite Show"
                  className="w-full bg-[#111] text-white border border-white/20 p-2 font-bold focus:border-white outline-none"
                />
              </div>

              {/* Media Type */}
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400 font-mono">MEDIA CLASSIFICATION</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full bg-[#111] text-white border border-white/20 p-2 focus:border-white outline-none font-bold"
                >
                  <option value="anime">Anime</option>
                  <option value="manga">Manga</option>
                  <option value="game">Game</option>
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                </select>
              </div>

              {/* Release Year */}
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> RELEASE YEAR
                </label>
                <input
                  type="number"
                  value={releaseYear}
                  onChange={e => setReleaseYear(e.target.value)}
                  className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono focus:border-white outline-none"
                />
              </div>

              {/* Rating */}
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400 font-mono flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" /> SCORE (0.0 - 10.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={rating}
                  onChange={e => setRating(e.target.value)}
                  placeholder="e.g. 9.0"
                  className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono focus:border-white outline-none"
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400 font-mono flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> TRACKING STATUS
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-[#111] text-white border border-white/20 p-2 focus:border-white outline-none font-bold"
                >
                  {type === "manga" ? (
                    <>
                      <option value="Plan to Read">Plan to Read</option>
                      <option value="Reading">Reading</option>
                    </>
                  ) : type === "game" ? (
                    <>
                      <option value="Plan to Play">Plan to Play</option>
                      <option value="Playing">Playing</option>
                    </>
                  ) : (
                    <>
                      <option value="Plan to Watch">Plan to Watch</option>
                      <option value="Watching">Watching</option>
                    </>
                  )}
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Dropped">Dropped</option>
                </select>
              </div>

              {/* Progress */}
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400 font-mono flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> INITIAL PROGRESS
                </label>
                <input
                  type="text"
                  value={progress}
                  onChange={e => setProgress(e.target.value)}
                  placeholder={meta.progressPlaceholder}
                  className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono focus:border-white outline-none"
                />
              </div>

              {/* Genres */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5 text-xs">
                <label className="text-gray-400 font-mono">GENRES / CATEGORIZATION (COMMA-SEPARATED)</label>
                <input
                  type="text"
                  value={genres}
                  onChange={e => setGenres(e.target.value)}
                  placeholder="Action, Adventure, Fantasy"
                  className="w-full bg-[#111] text-white border border-white/20 p-2 focus:border-white outline-none"
                />
              </div>

            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-white/20 text-gray-300 font-bold hover:text-white hover:border-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-white text-black border-2 border-white hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,255,102,1)] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {isSubmitting ? "Creating..." : "Create Record"}
              </button>
            </div>

          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
