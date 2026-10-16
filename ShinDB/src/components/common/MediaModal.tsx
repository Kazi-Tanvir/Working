"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Edit2, 
  Trash2, 
  Save, 
  Undo, 
  Star, 
  Image as ImageIcon, 
  AlertTriangle,
  RefreshCw,
  Lock,
  Check,
  Layers,
  FileText,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MediaItem } from "./MediaCard";
import Badge from "./Badge";
import { showToast } from "@/components/common/Toast";
import { 
  SeasonData, 
  formatStructuredProgress, 
  calculateTotalWatched, 
  calculateTotalEpisodes
} from "@/utils/seasonHelpers";
import {
  getChaptersPerVolume,
  chapterToVolume,
  volumeToChapter
} from "@/utils/mangaHelpers";

interface MediaModalProps {
  item: MediaItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateItem?: (updatedItem: MediaItem) => void;
  onUpdateState?: (status: string, progress: string) => void;
}

export const getStatusOptionsForType = (type: string): string[] => {
  switch (type) {
    case "manga":
      return ["Plan to Read", "Reading", "Completed", "On Hold", "Dropped"];
    case "game":
      return ["Plan to Play", "Playing", "Completed", "On Hold", "Dropped"];
    case "movie":
      return ["Plan to Watch", "Completed", "Dropped"];
    case "anime":
    case "series":
    default:
      return ["Plan to Watch", "Watching", "Completed", "On Hold", "Dropped"];
  }
};

const DEFAULT_COVER_IMAGES = {
  anime: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  manga: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  game: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
  movie: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
  series: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80"
};

export default function MediaModal({ item, isOpen, onClose, onUpdateItem, onUpdateState }: MediaModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Personal User Tracking Fields (Editable)
  const [status, setStatus] = useState(item.status);
  const [rating, setRating] = useState(item.rating === "Unrated" || item.rating === "N/A" ? "" : item.rating.replace("/10", ""));
  const [progress, setProgress] = useState(item.progress);
  const [notes, setNotes] = useState(item.notes || "");
  const [coverImage, setCoverImage] = useState(item.coverImage);

  // Structured Seasons State (Strictly for TV Series)
  const [seasonsState, setSeasonsState] = useState<SeasonData[] | undefined>(
    item.type === "series" ? item.seasons : undefined
  );
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number>(item.currentSeason || 1);

  // Direct progress for anime and non-season media
  const [directProgressCurrent, setDirectProgressCurrent] = useState<number>(item.progressCurrent || 0);

  // Manga volume & chapter sync
  const chaptersPerVol = getChaptersPerVolume(item.progressTotal, null);
  const [mangaChapter, setMangaChapter] = useState<number>(item.type === "manga" ? item.progressCurrent || 0 : 0);
  const [mangaVolume, setMangaVolume] = useState<number>(
    item.type === "manga" ? chapterToVolume(item.progressCurrent || 0, chaptersPerVol) : 0
  );

  // Sync edits if item changes
  useEffect(() => {
    setStatus(item.status);
    setRating(item.rating === "Unrated" || item.rating === "N/A" ? "" : item.rating.replace("/10", ""));
    setProgress(item.progress);
    setNotes(item.notes || "");
    setCoverImage(item.coverImage);
    setSeasonsState(item.type === "series" ? item.seasons : undefined);
    setSelectedSeasonNum(item.currentSeason || 1);
    setDirectProgressCurrent(item.progressCurrent || 0);
    if (item.type === "manga") {
      const ch = item.progressCurrent || 0;
      setMangaChapter(ch);
      setMangaVolume(chapterToVolume(ch, chaptersPerVol));
    }
    setIsEditing(false);
    setShowConfirmDelete(false);
    setErrorMsg("");
  }, [item, isOpen, chaptersPerVol]);

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

  // Accents & Metas based on Media Type
  const getTypeMeta = () => {
    switch (item.type) {
      case "anime": {
        const isMovie = item.progressUnit === "mins" || (item.progress && item.progress.toLowerCase().includes("min"));
        return {
          color: "var(--cyber-purple)",
          shadowClass: "neo-shadow-purple",
          borderClass: "border-cyber-purple",
          accentText: "text-cyber-purple",
          accentBg: "bg-cyber-purple/10",
          accentBtn: "hover:bg-cyber-purple/20 hover:text-cyber-purple",
          unitLabel: isMovie ? "MINS" : "EP",
          progressPlaceholder: isMovie ? "e.g. 106 mins" : "e.g. 12/24 EP",
        };
      }
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

  // Active season in state
  const activeSeason = seasonsState?.find(s => s.seasonNumber === selectedSeasonNum) || seasonsState?.[0];

  // Set episode watched in season (supports toggling down or setting directly)
  const handleSetEpisodeWatched = async (seasonNum: number, episodeNum: number) => {
    if (!seasonsState) return;
    const updated = seasonsState.map((s) => {
      if (s.seasonNumber === seasonNum) {
        // If clicking the current episode frontier, toggle down by 1 (e.g. 8 -> 7, or 1 -> 0)
        const newWatched = s.episodesWatched === episodeNum ? Math.max(0, episodeNum - 1) : Math.min(s.episodeCount, episodeNum);
        return {
          ...s,
          episodesWatched: newWatched,
          isCompleted: newWatched >= s.episodeCount && s.episodeCount > 0,
        };
      }
      return { ...s };
    });

    setSeasonsState(updated);
    const totalWatched = calculateTotalWatched(updated);
    const totalEpisodes = calculateTotalEpisodes(updated);
    const newProg = formatStructuredProgress(updated, seasonNum, totalWatched, totalEpisodes, meta.unitLabel);
    setProgress(newProg);

    let newStatus = status;
    if (totalWatched >= totalEpisodes && totalEpisodes > 0 && status !== "Completed") {
      newStatus = "Completed";
      setStatus("Completed");
    } else if (status === "Completed" && totalWatched < totalEpisodes) {
      newStatus = item.type === "game" ? "Playing" : item.type === "manga" ? "Reading" : "Watching";
      setStatus(newStatus);
    }

    const updatedItem: MediaItem = {
      ...item,
      status: newStatus,
      progress: newProg,
      progressCurrent: totalWatched,
      progressTotal: totalEpisodes,
      seasons: updated,
      currentSeason: seasonNum,
    };

    if (onUpdateItem) onUpdateItem(updatedItem);
    if (onUpdateState) onUpdateState(newStatus, newProg);

    try {
      await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          seasons: updated,
          currentSeason: seasonNum,
          status: newStatus,
          progressCurrent: totalWatched,
        }),
      });
      router.refresh();
      showToast(`Logged S${seasonNum} Ep ${episodeNum}`, "success");
    } catch {
      showToast("Failed to save episode progress", "error");
    }
  };

  // Toggle season completed status (allows marking complete or resetting back to incomplete)
  const handleToggleSeasonCompleted = async (seasonNum: number) => {
    if (!seasonsState) return;
    const targetSeason = seasonsState.find((s) => s.seasonNumber === seasonNum);
    if (!targetSeason) return;
    const willBeCompleted = !targetSeason.isCompleted;

    const updated = seasonsState.map((s) => {
      if (s.seasonNumber === seasonNum) {
        return {
          ...s,
          episodesWatched: willBeCompleted ? s.episodeCount : 0,
          isCompleted: willBeCompleted,
        };
      }
      return { ...s };
    });

    setSeasonsState(updated);
    const totalWatched = calculateTotalWatched(updated);
    const totalEpisodes = calculateTotalEpisodes(updated);
    const newProg = formatStructuredProgress(updated, seasonNum, totalWatched, totalEpisodes, meta.unitLabel);
    setProgress(newProg);

    let newStatus = status;
    // Check if all seasons completed
    const allSeasonsCompleted = updated.every((s) => s.isCompleted);
    if (allSeasonsCompleted && totalEpisodes > 0 && status !== "Completed") {
      newStatus = "Completed";
      setStatus("Completed");
    } else if (status === "Completed" && !allSeasonsCompleted) {
      newStatus = "Watching";
      setStatus(newStatus);
    }

    const updatedItem: MediaItem = {
      ...item,
      status: newStatus,
      progress: newProg,
      progressCurrent: totalWatched,
      progressTotal: totalEpisodes,
      seasons: updated,
      currentSeason: seasonNum,
    };

    if (onUpdateItem) onUpdateItem(updatedItem);
    if (onUpdateState) onUpdateState(newStatus, newProg);
    showToast(
      willBeCompleted ? `✓ Season ${seasonNum} marked as complete!` : `Season ${seasonNum} marked incomplete`,
      "success"
    );

    const nextIncomplete = updated.find((s) => s.seasonNumber > seasonNum && !s.isCompleted);
    const nextSeasonNum = nextIncomplete ? nextIncomplete.seasonNumber : seasonNum;
    setSelectedSeasonNum(nextSeasonNum);

    try {
      await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          seasons: updated,
          currentSeason: nextSeasonNum,
          status: newStatus,
          progressCurrent: totalWatched,
        }),
      });
      router.refresh();
    } catch {
      showToast("Failed to save season update", "error");
    }
  };

  // Status selection change with automatic completion propagation
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === "Completed") {
      if (item.type === "series" && seasonsState && seasonsState.length > 0) {
        const completedSeasons = seasonsState.map((s) => ({
          ...s,
          episodesWatched: s.episodeCount,
          isCompleted: true,
        }));
        setSeasonsState(completedSeasons);
        const totalWatched = calculateTotalWatched(completedSeasons);
        const totalEpisodes = calculateTotalEpisodes(completedSeasons);
        setDirectProgressCurrent(totalWatched);
        setProgress(formatStructuredProgress(completedSeasons, selectedSeasonNum, totalWatched, totalEpisodes, meta.unitLabel));
      } else if (item.progressTotal && item.progressTotal > 0) {
        setDirectProgressCurrent(item.progressTotal);
        if (item.type === "manga") {
          setMangaChapter(item.progressTotal);
          setMangaVolume(chapterToVolume(item.progressTotal, chaptersPerVol));
        }
        setProgress(`${item.progressTotal}/${item.progressTotal} ${meta.unitLabel.toUpperCase()}`);
      }
    }
  };

  // Direct progress change for anime and items without seasons
  const handleDirectProgressChange = (newWatched: number) => {
    const val = Math.max(0, newWatched);
    setDirectProgressCurrent(val);
    const total = item.progressTotal;
    const newProg = `${val}/${total ?? "?"} ${meta.unitLabel.toUpperCase()}`;
    setProgress(newProg);
    if (total && total > 0 && val >= total) {
      setStatus("Completed");
    } else if (status === "Completed" && total && total > 0 && val < total) {
      setStatus(item.type === "game" ? "Playing" : item.type === "manga" ? "Reading" : "Watching");
    }
  };

  // Manga chapter change (auto-syncs volume)
  const handleMangaChapterChange = (newChapter: number) => {
    const ch = Math.max(0, newChapter);
    setMangaChapter(ch);
    const vol = chapterToVolume(ch, chaptersPerVol);
    setMangaVolume(vol);
    setDirectProgressCurrent(ch);
    const total = item.progressTotal;
    const newProg = `${ch}/${total ?? "?"} CH`;
    setProgress(newProg);
    if (total && total > 0 && ch >= total) {
      setStatus("Completed");
    } else if (status === "Completed" && total && total > 0 && ch < total) {
      setStatus("Reading");
    }
  };

  // Manga volume change (auto-syncs chapter)
  const handleMangaVolumeChange = (newVolume: number) => {
    const vol = Math.max(0, newVolume);
    setMangaVolume(vol);
    const ch = volumeToChapter(vol, chaptersPerVol, item.progressTotal);
    setMangaChapter(ch);
    setDirectProgressCurrent(ch);
    const total = item.progressTotal;
    const newProg = `${ch}/${total ?? "?"} CH`;
    setProgress(newProg);
    if (total && total > 0 && ch >= total) {
      setStatus("Completed");
    } else if (status === "Completed" && total && total > 0 && ch < total) {
      setStatus("Reading");
    }
  };

  // Quick interactive episode / runtime increment/decrement
  const handleQuickEpisodeChange = async (delta: number) => {
    const total = item.progressTotal;
    const nextVal = Math.max(0, Math.min(total || 99999, directProgressCurrent + delta));
    setDirectProgressCurrent(nextVal);
    const newProg = `${nextVal}/${total ?? "?"} ${meta.unitLabel.toUpperCase()}`;
    setProgress(newProg);

    let nextStatus = status;
    if (total && total > 0 && nextVal >= total) {
      nextStatus = "Completed";
      setStatus("Completed");
    } else if (status === "Completed" && total && total > 0 && nextVal < total) {
      nextStatus = "Watching";
      setStatus("Watching");
    }

    const updatedItem: MediaItem = {
      ...item,
      status: nextStatus,
      progress: newProg,
      progressCurrent: nextVal,
    };
    if (onUpdateItem) onUpdateItem(updatedItem);
    if (onUpdateState) onUpdateState(nextStatus, newProg);

    try {
      await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          progressCurrent: nextVal,
          status: nextStatus,
        }),
      });
      router.refresh();
      showToast(meta.unitLabel.toUpperCase() === "MINS" ? `Logged ${nextVal} mins` : `Logged Ep ${nextVal}`, "success");
    } catch {
      showToast("Failed to update progress", "error");
    }
  };

  // Quick complete anime
  const handleCompleteDirect = async () => {
    if (!item.progressTotal || item.progressTotal <= 0) return;
    const total = item.progressTotal;
    setDirectProgressCurrent(total);
    const newProg = `${total}/${total} ${meta.unitLabel.toUpperCase()}`;
    setProgress(newProg);
    setStatus("Completed");

    const updatedItem: MediaItem = {
      ...item,
      status: "Completed",
      progress: newProg,
      progressCurrent: total,
    };
    if (onUpdateItem) onUpdateItem(updatedItem);
    if (onUpdateState) onUpdateState("Completed", newProg);

    try {
      await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          progressCurrent: total,
          status: "Completed",
        }),
      });
      router.refresh();
      showToast(`Marked "${item.title}" as Completed!`, "success");
    } catch {
      showToast("Failed to mark as completed", "error");
    }
  };

  // Quick manga chapter increment/decrement
  const handleQuickMangaChapterChange = async (delta: number) => {
    const nextCh = Math.max(0, mangaChapter + delta);
    const total = item.progressTotal;
    if (total && total > 0 && nextCh > total) return;
    const nextVol = chapterToVolume(nextCh, chaptersPerVol);
    setMangaChapter(nextCh);
    setMangaVolume(nextVol);
    setDirectProgressCurrent(nextCh);
    const newProg = `${nextCh}/${total ?? "?"} CH`;
    setProgress(newProg);

    let nextStatus = status;
    if (total && total > 0 && nextCh >= total) {
      nextStatus = "Completed";
      setStatus("Completed");
    } else if (status === "Completed" && total && total > 0 && nextCh < total) {
      nextStatus = "Reading";
      setStatus("Reading");
    }

    const updatedItem: MediaItem = {
      ...item,
      status: nextStatus,
      progress: newProg,
      progressCurrent: nextCh,
    };
    if (onUpdateItem) onUpdateItem(updatedItem);
    if (onUpdateState) onUpdateState(nextStatus, newProg);

    try {
      await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          progressCurrent: nextCh,
          status: nextStatus,
        }),
      });
      router.refresh();
      showToast(`Logged Ch ${nextCh} (Vol ${nextVol})`, "success");
    } catch {
      showToast("Failed to update manga chapter", "error");
    }
  };

  // Quick manga volume increment/decrement
  const handleQuickMangaVolumeChange = async (delta: number) => {
    const nextVol = Math.max(0, mangaVolume + delta);
    const nextCh = volumeToChapter(nextVol, chaptersPerVol, item.progressTotal);
    const total = item.progressTotal;
    setMangaVolume(nextVol);
    setMangaChapter(nextCh);
    setDirectProgressCurrent(nextCh);
    const newProg = `${nextCh}/${total ?? "?"} CH`;
    setProgress(newProg);

    let nextStatus = status;
    if (total && total > 0 && nextCh >= total) {
      nextStatus = "Completed";
      setStatus("Completed");
    } else if (status === "Completed" && total && total > 0 && nextCh < total) {
      nextStatus = "Reading";
      setStatus("Reading");
    }

    const updatedItem: MediaItem = {
      ...item,
      status: nextStatus,
      progress: newProg,
      progressCurrent: nextCh,
    };
    if (onUpdateItem) onUpdateItem(updatedItem);
    if (onUpdateState) onUpdateState(nextStatus, newProg);

    try {
      await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          progressCurrent: nextCh,
          status: nextStatus,
        }),
      });
      router.refresh();
      showToast(`Logged Vol ${nextVol} (Ch ${nextCh})`, "success");
    } catch {
      showToast("Failed to update manga volume", "error");
    }
  };

  // Handle User Update submission
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    // Standardize rating
    let cleanRating: string | number | null = null;
    const rateVal = parseFloat(rating);
    if (!isNaN(rateVal)) {
      cleanRating = Math.min(10, Math.max(0, rateVal));
    }

    let progressVal = directProgressCurrent;
    let seasonsToSave = seasonsState;

    if (status === "Completed") {
      if (item.type === "series" && seasonsToSave && seasonsToSave.length > 0) {
        seasonsToSave = seasonsToSave.map((s) => ({
          ...s,
          episodesWatched: s.episodeCount,
          isCompleted: true,
        }));
        progressVal = calculateTotalWatched(seasonsToSave);
      } else if (item.progressTotal && item.progressTotal > 0) {
        progressVal = item.progressTotal;
      }
    } else if (item.type === "manga") {
      progressVal = mangaChapter;
    } else if (item.type === "series" && seasonsToSave && seasonsToSave.length > 0) {
      progressVal = calculateTotalWatched(seasonsToSave);
    }

    try {
      const res = await fetch("/api/track", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          rating: cleanRating,
          status,
          progressCurrent: progressVal,
          coverImage: coverImage.trim(),
          notes: notes.trim(),
          ...(item.type === "series" && seasonsToSave && {
            seasons: seasonsToSave,
            currentSeason: selectedSeasonNum,
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update item.");
      }

      if (onUpdateItem && data.entry) {
        onUpdateItem(data.entry);
      }
      if (onUpdateState) {
        onUpdateState(status, progress);
      }
      router.refresh();
      setIsEditing(false);
      showToast(`Updated personal tracking for "${item.title}"`, "success");
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

      router.refresh();
      onClose();
      showToast(`Successfully destroyed record: "${item.title}"`, "warning");
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to delete item.");
      setIsSubmitting(false);
      showToast(e.message || "Failed to delete item.", "error");
    }
  };

  // Handle Sync Metadata from External API
  const handleSyncMetadata = async () => {
    setIsSyncing(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/track/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to sync metadata.");
      }

      if (data.updated) {
        const newTotal = data.newTotal;
        showToast(
          data.message || `✓ Synced with external API: Updated total to ${newTotal}!`,
          "success"
        );
        router.refresh();
      } else {
        showToast(data.message || "✓ Status is current with external databases.", "info");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to sync with external API.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Aspect portrait or landscape based on category
  const aspectClass = item.type === "game" ? "aspect-video md:aspect-[16/10]" : "aspect-[2/3]";

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none transition-all duration-300"
    >
      
      {/* Premium Neobrutalist Modal Outer Box */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#09090b] border-2 text-white ${meta.borderClass} ${meta.shadowClass} p-4 sm:p-6 md:p-8 flex flex-col gap-6 font-sans`}
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
                {(item.type === "anime" || item.type === "manga" || item.type === "series") && (
                  <button
                    onClick={handleSyncMetadata}
                    disabled={isSyncing}
                    className={`p-1.5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer ${meta.accentBtn} ${isSyncing ? "text-cyber-purple" : ""}`}
                    title="Sync latest episode/chapter counts from external API"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className={`p-1.5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer ${meta.accentBtn}`}
                  title="Edit Personal Tracking"
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
                Are you absolutely sure you want to delete <span className="text-white font-bold">"{item.title}"</span>? This will permanently wipe it from the local database.
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
             EDIT MODE FORM (User Editable Fields with Locked Canonical Metadata)
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
                  <ImageIcon className="w-3.5 h-3.5" /> CUSTOM COVER URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="Custom Cover URL"
                  className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono text-[11px] focus:border-white outline-none"
                />
              </div>
            </div>

            {/* Right Fields Column */}
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              
              {/* CANONICAL METADATA (LOCKED / PROTECTED) */}
              <div className="p-3 bg-[#0d0d12] border border-white/10 flex flex-col gap-2 rounded">
                <div className="flex items-center justify-between text-[10px] font-mono border-b border-white/5 pb-1">
                  <span className="flex items-center gap-1.5 text-gray-400 font-bold uppercase tracking-wider">
                    <Lock className="w-3 h-3 text-cyber-cyan" /> Canonical System Data (Locked)
                  </span>
                  <span className="text-cyber-cyan font-bold uppercase">{item.type}</span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-white text-base truncate">{item.title}</span>
                  <span className="font-mono text-xs text-gray-400 shrink-0">({item.releaseYear})</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-gray-400">
                  {item.externalRating && (
                    <span className="px-1.5 py-0.5 border border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan font-bold">
                      {item.externalRating}
                    </span>
                  )}
                  <span>•</span>
                  <span>Total: {item.progressTotal ?? "?"} {meta.unitLabel.toUpperCase()}</span>
                  {seasonsState && seasonsState.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{seasonsState.length} Seasons</span>
                    </>
                  )}
                </div>
              </div>

              {/* USER EDITABLE FIELDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Status */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="text-gray-400 font-mono">TRACKING STATUS</label>
                  <select
                    value={status}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono focus:border-white outline-none uppercase"
                  >
                    {getStatusOptionsForType(item.type).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Personal Rating */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="text-gray-400 font-mono flex items-center justify-between">
                    <span>YOUR PERSONAL SCORE (0-10)</span>
                    <span className="text-cyber-yellow font-bold">{rating ? `${rating}/10` : "Unrated"}</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={rating}
                    onChange={e => setRating(e.target.value)}
                    placeholder="e.g. 9.0"
                    className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono focus:border-white outline-none text-cyber-yellow font-bold"
                  />
                </div>

                {/* PROGRESSION MANAGEMENT IN EDIT MODE */}
                {item.type === "series" && seasonsState && seasonsState.length > 0 ? (
                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-3 p-3 bg-[#0a0a0c] border border-white/10 font-mono">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                        <Layers className="w-3.5 h-3.5 text-cyber-cyan" /> SEASONS PROGRESSION
                      </span>
                    </div>

                    {/* Season Selector Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {seasonsState.map((s) => (
                        <button
                          key={s.seasonNumber}
                          type="button"
                          onClick={() => setSelectedSeasonNum(s.seasonNumber)}
                          className={`w-11 h-11 border-2 font-mono text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer shrink-0 ${
                            selectedSeasonNum === s.seasonNumber
                              ? "border-cyber-cyan bg-cyber-cyan/20 text-white shadow-[2px_2px_0px_0px_var(--cyber-cyan)]"
                              : s.isCompleted
                              ? "border-cyber-green/50 bg-cyber-green/10 text-cyber-green hover:border-cyber-green"
                              : "border-white/15 bg-black text-gray-400 hover:border-white/40 hover:text-white"
                          }`}
                        >
                          <span>S{s.seasonNumber}</span>
                          {s.isCompleted && (
                            <span className="text-[9px] leading-none text-cyber-green font-black">✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Active Season Edit Controls (Read-only total episode count per source API) */}
                    {activeSeason && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400 flex items-center justify-between">
                            <span>EPISODES WATCHED IN S{activeSeason.seasonNumber}</span>
                            <span className="text-gray-500 font-bold">Total: {activeSeason.episodeCount} eps</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={activeSeason.episodeCount}
                            value={activeSeason.episodesWatched}
                            onChange={(e) => handleSetEpisodeWatched(activeSeason.seasonNumber, parseInt(e.target.value) || 0)}
                            className="bg-[#111] text-white border border-white/20 p-2 font-mono text-xs focus:border-cyber-cyan outline-none"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <button
                            type="button"
                            onClick={() => handleToggleSeasonCompleted(activeSeason.seasonNumber)}
                            className={`w-full py-2 border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              activeSeason.isCompleted
                                ? "bg-cyber-green/20 text-cyber-green border-cyber-green hover:bg-cyber-red/20 hover:text-cyber-red hover:border-cyber-red"
                                : "bg-white/10 text-gray-300 border-white/20 hover:border-cyber-green hover:text-cyber-green"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {activeSeason.isCompleted ? "✓ Completed (Reset)" : `Mark S${activeSeason.seasonNumber} Complete`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : item.type === "manga" ? (
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#0a0a0c] border border-white/10 font-mono">
                    <div className="flex flex-col gap-1.5 text-xs">
                      <label className="text-gray-400 flex items-center justify-between">
                        <span>CHAPTERS READ (CH)</span>
                        <span className="text-cyber-orange font-bold">Total: {item.progressTotal ?? "?"} CH</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.progressTotal || 99999}
                        value={mangaChapter}
                        onChange={(e) => handleMangaChapterChange(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono text-xs focus:border-cyber-orange outline-none"
                        placeholder="e.g. 108"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-xs">
                      <label className="text-gray-400 flex items-center justify-between">
                        <span>VOLUMES READ (VOL)</span>
                        <span className="text-cyber-orange font-bold">[SYNCED]</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={9999}
                        value={mangaVolume}
                        onChange={(e) => handleMangaVolumeChange(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono text-xs focus:border-cyber-orange outline-none"
                        placeholder="e.g. 12"
                      />
                    </div>
                    <span className="col-span-1 sm:col-span-2 text-[10px] text-gray-500">
                      [SYNC_INFO: ~{chaptersPerVol} chapters per volume • Vol = floor(Ch / {chaptersPerVol})]
                    </span>
                  </div>
                ) : (
                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5 text-xs font-mono">
                    <label className="text-gray-400 flex items-center justify-between">
                      <span>{meta.unitLabel.toUpperCase() === "MINS" || item.type === "movie" ? "MOVIE RUNTIME WATCHED (MINS)" : `EPISODES WATCHED (${meta.unitLabel.toUpperCase()})`}</span>
                      <span className={`${item.type === "movie" ? "text-cyber-yellow" : "text-cyber-purple"} font-bold`}>
                        Total: {item.progressTotal ?? "?"} {meta.unitLabel.toUpperCase()}
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.progressTotal || 99999}
                      value={directProgressCurrent}
                      onChange={(e) => handleDirectProgressChange(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono text-xs focus:border-white outline-none"
                      placeholder={`e.g. ${item.progressTotal ? Math.min(12, item.progressTotal) : 12}`}
                    />
                  </div>
                )}

                {/* Personal Notes */}
                <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5 text-xs">
                  <label className="text-gray-400 font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> PERSONAL NOTES & REVIEW
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Your personal review, log notes, thoughts, or viewing notes..."
                    className="w-full bg-[#111] text-white border border-white/20 p-2 text-xs focus:border-white outline-none font-mono"
                  />
                </div>

              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="h-10 px-6 border border-white/20 text-gray-300 font-mono text-xs uppercase tracking-wider font-bold hover:text-white hover:border-white transition-all inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Undo className="w-3.5 h-3.5" /> Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 bg-white text-black border-2 border-white font-mono text-xs uppercase tracking-wider font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(139,92,246,1)] transition-all inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </div>
          </form>

        ) : (
          /* =========================================================
             VIEW MODE SCREEN (Tactile Command Console with Season & Episode Square Buttons)
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
            <div className="w-full md:w-2/3 flex flex-col justify-between gap-5">
              
              <div className="flex flex-col gap-4">
                {/* Header Title & Badges */}
                <div>
                  <h2 className="font-sans font-black text-2xl md:text-3xl text-white uppercase tracking-wider leading-tight">
                    {item.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono text-gray-400">
                    <span className={`px-2 py-0.5 ${meta.accentBg} ${meta.accentText} border border-white/10 font-bold uppercase`}>
                      {item.type}
                    </span>
                    <span>•</span>
                    <span>Released {item.releaseYear}</span>
                    {item.externalRating && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-white/5 border border-cyber-cyan/30 text-cyber-cyan font-bold" title="Official Database Score">
                          {item.externalRating}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score and Overall Progress stats panel */}
                <div className="grid grid-cols-2 gap-4 border border-white/10 p-3.5 bg-[#0a0a0c] font-mono">
                  
                  {/* Rating Block */}
                  <div className="flex flex-col gap-1 select-none">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                      Your Personal Score
                    </span>
                    <div className="flex items-center gap-1.5 text-cyber-yellow font-bold">
                      <Star className="w-4 h-4 fill-cyber-yellow" />
                      <span className="text-sm font-black">{item.rating}</span>
                    </div>
                  </div>

                  {/* Overall Progress Block */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                        Total Progress
                      </span>
                      {progress.includes("?") && (
                        <button
                          onClick={handleSyncMetadata}
                          disabled={isSyncing}
                          className="text-[10px] font-mono text-cyber-yellow hover:underline cursor-pointer flex items-center gap-1"
                          title="Total unknown. Click to sync from external API."
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? "animate-spin" : ""}`} />
                          Sync Airing
                        </button>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${meta.accentText}`}>
                      {progress}
                    </span>
                  </div>

                </div>

                {/* =========================================================
                    SEASON & EPISODE COMMAND CENTER (SMALL SQUARE BUTTONS)
                    ========================================================= */}
                {/* =========================================================
                    PROGRESSION & EPISODE COMMAND CENTER
                    ========================================================= */}
                {item.type === "series" && seasonsState && seasonsState.length > 0 ? (
                  <div className="flex flex-col gap-3 p-3.5 bg-[#0a0a0c] border border-white/10 font-mono">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                        <Layers className="w-3.5 h-3.5 text-cyber-cyan" /> SEASONS BREAKDOWN
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase">
                        CLICK SQUARES TO LOG PROGRESS
                      </span>
                    </div>

                    {/* Row of Small Square Season Buttons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {seasonsState.map((s) => (
                        <button
                          key={s.seasonNumber}
                          type="button"
                          onClick={() => setSelectedSeasonNum(s.seasonNumber)}
                          className={`w-11 h-11 border-2 font-mono text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer shrink-0 ${
                            selectedSeasonNum === s.seasonNumber
                              ? "border-cyber-cyan bg-cyber-cyan/20 text-white shadow-[2px_2px_0px_0px_var(--cyber-cyan)]"
                              : s.isCompleted
                              ? "border-cyber-green/50 bg-cyber-green/10 text-cyber-green hover:border-cyber-green"
                              : "border-white/15 bg-black text-gray-400 hover:border-white/40 hover:text-white"
                          }`}
                        >
                          <span>S{s.seasonNumber}</span>
                          {s.isCompleted && (
                            <span className="text-[9px] leading-none text-cyber-green font-black">✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Active Season Information & Complete Season Action */}
                    {activeSeason && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {activeSeason.title || `Season ${activeSeason.seasonNumber}`}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              ({activeSeason.episodesWatched} / {activeSeason.episodeCount} eps)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleSeasonCompleted(activeSeason.seasonNumber)}
                            className={`px-2.5 py-1 text-[10px] border font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              activeSeason.isCompleted
                                ? "bg-cyber-green/20 text-cyber-green border-cyber-green hover:bg-cyber-red/20 hover:text-cyber-red hover:border-cyber-red"
                                : "bg-cyber-green/15 text-cyber-green border-cyber-green/40 hover:bg-cyber-green hover:text-black"
                            }`}
                            title={
                              activeSeason.isCompleted
                                ? `Season ${activeSeason.seasonNumber} completed. Click to mark incomplete/reset.`
                                : `Mark all ${activeSeason.episodeCount} episodes of Season ${activeSeason.seasonNumber} as completed.`
                            }
                          >
                            <Check className="w-3 h-3" />
                            {activeSeason.isCompleted ? "✓ Completed (Click to Reset)" : `Mark S${activeSeason.seasonNumber} Completed`}
                          </button>
                        </div>

                        {/* Episode Grid with Small Square Buttons */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Array.from({ length: activeSeason.episodeCount }, (_, i) => i + 1).map((epNum) => {
                            const isWatched = epNum <= activeSeason.episodesWatched;
                            return (
                              <button
                                key={epNum}
                                type="button"
                                onClick={() => handleSetEpisodeWatched(activeSeason.seasonNumber, epNum)}
                                className={`w-8 h-8 border font-mono text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                  isWatched
                                    ? "bg-cyber-cyan text-black border-cyber-cyan font-black shadow-[1px_1px_0px_0px_rgba(255,255,255,0.4)]"
                                    : "bg-[#111] text-gray-400 border-white/20 hover:border-white hover:text-white"
                                }`}
                                title={`Episode ${epNum}${isWatched ? " (Watched - click to toggle off)" : " (Click to mark watched)"}`}
                              >
                                {epNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : item.type === "manga" ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 bg-[#0a0a0c] border border-white/10 font-mono gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">MANGA SYNCHRONIZATION</span>
                      <span className="text-xs text-white">
                        Vol <span className="font-bold text-cyber-orange">{mangaVolume}</span> · Ch <span className="font-bold text-cyber-orange">{mangaChapter}</span>/{item.progressTotal ?? "?"} CH
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleQuickMangaChapterChange(-1)}
                        className="w-16 h-8 border border-white/20 text-xs hover:border-cyber-orange hover:text-cyber-orange transition-all font-bold cursor-pointer inline-flex items-center justify-center rounded-sm"
                        title="Decrement 1 Chapter"
                      >
                        -1 Ch
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMangaChapterChange(1)}
                        className="w-16 h-8 border border-cyber-orange/40 bg-cyber-orange/15 text-cyber-orange hover:bg-cyber-orange hover:text-black transition-all font-bold cursor-pointer inline-flex items-center justify-center rounded-sm"
                        title="Increment 1 Chapter"
                      >
                        +1 Ch
                      </button>
                      <span className="text-gray-700 mx-0.5">|</span>
                      <button
                        type="button"
                        onClick={() => handleQuickMangaVolumeChange(-1)}
                        className="w-16 h-8 border border-white/20 text-xs text-gray-300 hover:border-white transition-all font-bold cursor-pointer inline-flex items-center justify-center rounded-sm"
                        title={`Decrement 1 Volume (~${chaptersPerVol} chapters)`}
                      >
                        -1 Vol
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMangaVolumeChange(1)}
                        className="w-16 h-8 border border-white/30 bg-white/10 text-white hover:bg-white hover:text-black transition-all font-bold cursor-pointer inline-flex items-center justify-center rounded-sm"
                        title={`Increment 1 Volume (~${chaptersPerVol} chapters)`}
                      >
                        +1 Vol
                      </button>
                    </div>
                  </div>
                ) : (item.type === "anime" && (item.progressUnit === "mins" || (item.progress && item.progress.toLowerCase().includes("min")))) || item.type === "movie" ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 bg-[#0a0a0c] border border-white/10 font-mono gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">MOVIE RUNTIME / PROGRESS</span>
                      <span className="text-xs text-white">
                        <span className={`font-bold ${item.type === "movie" ? "text-cyber-yellow" : "text-cyber-purple"}`}>
                          {directProgressCurrent}
                        </span> / {item.progressTotal ?? "?"} MINS
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleQuickEpisodeChange(-10)}
                        className="w-16 h-8 border border-white/20 text-xs text-gray-300 hover:border-white transition-all font-bold cursor-pointer inline-flex items-center justify-center rounded-sm"
                        title="Rewind 10 Minutes"
                      >
                        -10m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickEpisodeChange(10)}
                        className={`w-16 h-8 border text-xs transition-all font-bold cursor-pointer inline-flex items-center justify-center rounded-sm ${
                          item.type === "movie"
                            ? "border-cyber-yellow/40 bg-cyber-yellow/15 text-cyber-yellow hover:bg-cyber-yellow hover:text-black"
                            : "border-cyber-purple/50 bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple hover:text-white"
                        }`}
                        title="Forward 10 Minutes"
                      >
                        +10m
                      </button>
                      {item.progressTotal && item.progressTotal > 0 && directProgressCurrent < item.progressTotal && (
                        <button
                          type="button"
                          onClick={() => handleCompleteDirect()}
                          className="h-8 px-3 border border-cyber-green/50 bg-cyber-green/15 text-cyber-green hover:bg-cyber-green hover:text-black transition-all font-bold text-xs cursor-pointer inline-flex items-center justify-center rounded-sm"
                          title="Mark Movie Completed"
                        >
                          ✓ Complete
                        </button>
                      )}
                    </div>
                  </div>
                ) : item.type === "anime" ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 bg-[#0a0a0c] border border-white/10 font-mono gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">EPISODE PROGRESS</span>
                      <span className="text-xs text-white">
                        <span className="font-bold text-cyber-purple">{directProgressCurrent}</span> / {item.progressTotal ?? "?"} EP
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleQuickEpisodeChange(-1)}
                        className="w-16 h-8 border border-white/20 text-xs text-gray-300 hover:border-cyber-purple hover:text-cyber-purple transition-all font-bold cursor-pointer inline-flex items-center justify-center rounded-sm"
                        title="Previous Episode"
                      >
                        -1 EP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickEpisodeChange(1)}
                        className="w-16 h-8 border border-cyber-purple/50 bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all font-bold cursor-pointer inline-flex items-center justify-center rounded-sm"
                        title="Next Episode"
                      >
                        +1 EP
                      </button>
                      {item.progressTotal && item.progressTotal > 0 && directProgressCurrent < item.progressTotal && (
                        <button
                          type="button"
                          onClick={() => handleCompleteDirect()}
                          className="h-8 px-3 border border-cyber-green/50 bg-cyber-green/15 text-cyber-green hover:bg-cyber-green hover:text-black transition-all font-bold text-xs cursor-pointer inline-flex items-center justify-center rounded-sm"
                          title="Mark All Episodes Completed"
                        >
                          ✓ Complete All
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

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
                          className="font-mono text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 text-gray-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal Notes (if present) */}
                {item.notes && (
                  <div className="flex flex-col gap-1 border border-white/10 bg-[#0a0a0c] p-3 font-mono">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <FileText className="w-3 h-3 text-cyber-cyan" /> Personal Notes
                    </span>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                )}

              </div>

              {/* View Mode Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-2">
                <button
                  onClick={onClose}
                  className="h-10 px-6 border border-white/20 text-gray-300 font-mono text-xs uppercase tracking-wider font-bold hover:text-white hover:border-white transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="h-10 px-6 bg-white text-black border-2 border-white font-mono text-xs uppercase tracking-wider font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
