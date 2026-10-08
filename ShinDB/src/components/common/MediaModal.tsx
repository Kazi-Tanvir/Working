"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Edit2, 
  Trash2, 
  Save, 
  Undo, 
  Star, 
  Calendar, 
  Hash, 
  Image as ImageIcon, 
  Sliders,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MediaItem } from "./MediaCard";
import Badge from "./Badge";
import { showToast } from "@/components/common/Toast";

interface MediaModalProps {
  item: MediaItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateState: (status: string, progress: string) => void;
}

const DEFAULT_COVER_IMAGES = {
  anime: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  manga: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  game: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
  movie: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
  series: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80"
};

export default function MediaModal({ item, isOpen, onClose, onUpdateState }: MediaModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Form Fields
  const [title, setTitle] = useState(item.title);
  const [releaseYear, setReleaseYear] = useState(String(item.releaseYear));
  const [rating, setRating] = useState(item.rating.replace("/10", ""));
  const [status, setStatus] = useState(item.status);
  const [progress, setProgress] = useState(item.progress);
  const [genres, setGenres] = useState(item.genres.join(", "));
  const [coverImage, setCoverImage] = useState(item.coverImage);

  // Sync edits if item changes
  useEffect(() => {
    setTitle(item.title);
    setReleaseYear(String(item.releaseYear));
    setRating(item.rating.replace("/10", ""));
    setStatus(item.status);
    setProgress(item.progress);
    setGenres(item.genres.join(", "));
    setCoverImage(item.coverImage);
    setIsEditing(false);
    setShowConfirmDelete(false);
    setErrorMsg("");
  }, [item, isOpen]);

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

  if (!isOpen) return null;

  // Accents & Metas based on Media Type
  const getTypeMeta = () => {
    switch (item.type) {
      case "anime":
        return {
          color: "var(--cyber-purple)",
          shadowClass: "neo-shadow-purple",
          borderClass: "border-cyber-purple",
          accentText: "text-cyber-purple",
          accentBg: "bg-cyber-purple/10",
          accentBtn: "hover:bg-cyber-purple/20 hover:text-cyber-purple",
          unitLabel: "EP",
          progressPlaceholder: "e.g. 12/24 EP"
        };
      case "manga":
        return {
          color: "var(--cyber-orange)",
          shadowClass: "neo-shadow-orange",
          borderClass: "border-cyber-orange",
          accentText: "text-cyber-orange",
          accentBg: "bg-cyber-orange/10",
          accentBtn: "hover:bg-cyber-orange/20 hover:text-cyber-orange",
          unitLabel: "CH",
          progressPlaceholder: "e.g. 72/147 CH"
        };
      case "game":
        return {
          color: "var(--cyber-green)",
          shadowClass: "neo-shadow-green",
          borderClass: "border-cyber-green",
          accentText: "text-cyber-green",
          accentBg: "bg-cyber-green/10",
          accentBtn: "hover:bg-cyber-green/20 hover:text-cyber-green",
          unitLabel: "hrs",
          progressPlaceholder: "e.g. 120 hrs"
        };
      case "movie":
        return {
          color: "var(--cyber-yellow)",
          shadowClass: "neo-shadow-yellow",
          borderClass: "border-cyber-yellow",
          accentText: "text-cyber-yellow",
          accentBg: "bg-cyber-yellow/10",
          accentBtn: "hover:bg-cyber-yellow/20 hover:text-cyber-yellow",
          unitLabel: "mins",
          progressPlaceholder: "e.g. 147 mins"
        };
      case "series":
        return {
          color: "var(--cyber-cyan)",
          shadowClass: "neo-shadow-cyan",
          borderClass: "border-cyber-cyan",
          accentText: "text-cyber-cyan",
          accentBg: "bg-cyber-cyan/10",
          accentBtn: "hover:bg-cyber-cyan/20 hover:text-cyber-cyan",
          unitLabel: "episodes",
          progressPlaceholder: "e.g. S1E08"
        };
      default:
        return {
          color: "#ffffff",
          shadowClass: "neo-shadow",
          borderClass: "border-white",
          accentText: "text-white",
          accentBg: "bg-white/10",
          accentBtn: "hover:bg-white/20 hover:text-white",
          unitLabel: "units",
          progressPlaceholder: "e.g. 1/1"
        };
    }
  };

  const meta = getTypeMeta();

  // Handle Update submission
  const handleUpdateSubmit = async (e: React.FormEvent) => {
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          title: title.trim(),
          releaseYear: parseInt(releaseYear) || new Date().getFullYear(),
          rating: cleanRating,
          status,
          progress: progress.trim(),
          genres: genreArray,
          coverImage: coverImage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update item.");
      }

      // Propagate status & progress update to parent MediaCard
      onUpdateState(status, progress.trim());

      // Refresh data & switch views
      router.refresh();
      setIsEditing(false);
      showToast(`Successfully updated record: "${title.trim()}"`, "success");
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to save updates.");
      showToast(e.message || "Failed to save updates.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete operation
  const handleDelete = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/track?id=${item.id}&type=${item.type}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete item.");
      }

      // Refresh data and close
      router.refresh();
      onClose();
      showToast(`Successfully destroyed record: "${item.title}"`, "warning");
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to delete item.");
      setIsSubmitting(false);
      showToast(e.message || "Failed to delete item.", "error");
    }
  };

  // Aspect portrait or landscape based on category
  const aspectClass = item.type === "game" ? "aspect-video md:aspect-[16/10]" : "aspect-[2/3]";

  return (
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
          <div className="flex items-center gap-2.5">
            <Badge status={status}>{status}</Badge>
            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
              ID: {item.id}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing && !showConfirmDelete && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`p-1.5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer ${meta.accentBtn}`}
                  title="Edit Record"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1.5 border border-white/10 text-gray-400 hover:text-cyber-red hover:bg-cyber-red/15 transition-all cursor-pointer"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE ALERT */}
        {errorMsg && (
          <div className="border border-cyber-red bg-cyber-red/10 text-cyber-red text-xs px-4 py-2 flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MAIN MODAL BODY */}
        {showConfirmDelete ? (
          /* =========================================================
             CONFIRM DELETE SCREEN
             ========================================================= */
          <div className="flex flex-col items-center justify-center py-10 text-center gap-6 font-mono">
            <div className="border-2 border-cyber-red text-cyber-red p-4 rounded-full bg-cyber-red/10 animate-pulse">
              <AlertTriangle className="w-10 h-10" />
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-sans font-black text-xl text-white uppercase tracking-wider">
                Confirm Destruction Log?
              </h3>
              <p className="text-gray-400 text-xs max-w-md">
                Are you absolutely sure you want to delete <span className="text-white font-bold">"{item.title}"</span>? This will permanently wipe it from the local local database.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isSubmitting}
                className="px-6 py-2 border border-white/20 text-gray-300 font-bold hover:text-white hover:border-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-6 py-2 bg-cyber-red text-black border-2 border-white hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-bold transition-all cursor-pointer"
              >
                {isSubmitting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>

        ) : isEditing ? (
          /* =========================================================
             EDIT MODE FORM
             ========================================================= */
          <form onSubmit={handleUpdateSubmit} className="flex flex-col md:flex-row gap-6">
            {/* Left Cover column */}
            <div className="w-full md:w-1/3 flex flex-col gap-3">
              <div className={`relative w-full ${aspectClass} overflow-hidden border border-white/20 bg-[#000]`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage || DEFAULT_COVER_IMAGES[item.type]}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                  onError={() => setCoverImage(DEFAULT_COVER_IMAGES[item.type])}
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
                  placeholder="Cover Art URL"
                  className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono text-[11px] focus:border-white outline-none"
                />
              </div>
            </div>

            {/* Right Fields Column */}
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5 text-xs">
                  <label className="text-gray-400 font-mono">MEDIA TITLE</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[#111] text-white border border-white/20 p-2 font-bold focus:border-white outline-none"
                  />
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
                    placeholder="e.g. 8.5"
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
                    <option value="Completed">Completed</option>
                    {item.type === "manga" ? (
                      <>
                        <option value="Reading">Reading</option>
                        <option value="Plan to Read">Plan to Read</option>
                      </>
                    ) : item.type === "game" ? (
                      <>
                        <option value="Playing">Playing</option>
                        <option value="Plan to Play">Plan to Play</option>
                      </>
                    ) : (
                      <>
                        <option value="Watching">Watching</option>
                        <option value="Plan to Watch">Plan to Watch</option>
                      </>
                    )}
                    <option value="On Hold">On Hold</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>

                {/* Progress */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="text-gray-400 font-mono flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" /> PROGRESS
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
                  <label className="text-gray-400 font-mono">GENRES (COMMA-SEPARATED)</label>
                  <input
                    type="text"
                    value={genres}
                    onChange={e => setGenres(e.target.value)}
                    placeholder="Action, Drama, Fantasy"
                    className="w-full bg-[#111] text-white border border-white/20 p-2 focus:border-white outline-none"
                  />
                </div>

              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-white/20 text-gray-300 font-bold hover:text-white hover:border-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Undo className="w-4 h-4" /> Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-white text-black border-2 border-white hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(139,92,246,1)] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </div>
          </form>

        ) : (
          /* =========================================================
             VIEW MODE SCREEN
             ========================================================= */
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Left Cover Column */}
            <div className="w-full md:w-1/3">
              <div className={`relative w-full ${aspectClass} overflow-hidden border border-white/10 rounded-md bg-[#000]`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Meta details column */}
            <div className="w-full md:w-2/3 flex flex-col justify-between gap-6">
              
              <div className="flex flex-col gap-4">
                {/* Header Title & Year */}
                <div>
                  <h2 className="font-sans font-black text-2xl md:text-3xl text-white uppercase tracking-wider leading-tight">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-gray-400">
                    <span className={`px-2 py-0.5 ${meta.accentBg} ${meta.accentText} border border-white/10 font-bold uppercase`}>
                      {item.type}
                    </span>
                    <span>•</span>
                    <span>Released {item.releaseYear}</span>
                  </div>
                </div>

                {/* Score and Progress stats panel */}
                <div className="grid grid-cols-2 gap-4 border border-white/10 p-4 bg-[#0a0a0c] font-mono">
                  
                  {/* Rating Block */}
                  <div className="flex flex-col gap-1 select-none">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Personal Score
                    </span>
                    <div className="flex items-center gap-1 text-cyber-yellow font-bold">
                      <Star className="w-4 h-4 fill-cyber-yellow" />
                      <span className="text-sm">{item.rating}</span>
                    </div>
                  </div>

                  {/* Progress Block */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Tracking Progress
                    </span>
                    <span className={`text-sm font-bold ${meta.accentText}`}>
                      {progress}
                    </span>
                  </div>

                </div>

                {/* Genres/Tags list */}
                {item.genres.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                      Genres & Categorization
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.genres.map(genre => (
                        <span
                          key={genre}
                          className="font-mono text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 text-gray-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* View Mode Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-white/20 text-gray-300 font-bold hover:text-white hover:border-white transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-white text-black border-2 border-white hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" /> Edit Record
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
