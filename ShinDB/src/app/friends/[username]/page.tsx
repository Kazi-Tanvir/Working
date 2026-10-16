"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  Shield,
  ShieldAlert,
  Lock,
  ArrowLeft,
  UserX,
  UserPlus,
  Star,
  Activity,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Sparkles,
  Loader2,
} from "lucide-react";
import MediaCard, { MediaItem } from "@/components/common/MediaCard";

interface FriendProfileResponse {
  success: boolean;
  isFriend: boolean;
  isSelf: boolean;
  friendStatus: string | null;
  friendshipId?: string | null;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    customBadge: string | null;
    bio: string | null;
    createdAt?: string;
  };
  stats?: {
    totalEntries: number;
    animeCount?: number;
    mangaCount?: number;
    gameCount?: number;
    movieCount?: number;
    seriesCount?: number;
    completedCount: number;
    inProgressCount?: number;
    planCount?: number;
    favoritesCount?: number;
    averageRating?: number | null;
  };
  library?: MediaItem[];
  error?: string;
  message?: string;
}

export default function FriendProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { isSignedIn } = useUser();

  const [data, setData] = useState<FriendProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/profile/${encodeURIComponent(username)}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch friend dossier:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const [myTrackedIds, setMyTrackedIds] = useState<Set<string>>(new Set());
  const [myTrackedTitles, setMyTrackedTitles] = useState<Set<string>>(new Set());

  const fetchMyLibrary = async () => {
    try {
      const res = await fetch("/api/track");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.items)) {
          const ids = new Set<string>();
          const titles = new Set<string>();
          json.items.forEach((item: MediaItem) => {
            if (item.mediaId) ids.add(item.mediaId);
            if (item.id) ids.add(item.id);
            if (item.title) titles.add(item.title.toLowerCase().trim());
          });
          setMyTrackedIds(ids);
          setMyTrackedTitles(titles);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch my library:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMyLibrary();
  }, [username]);

  const handleAddPlan = async (targetItem: MediaItem) => {
    const verb =
      targetItem.type === "manga"
        ? "Plan to Read"
        : targetItem.type === "game"
        ? "Plan to Play"
        : "Plan to Watch";

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: targetItem.mediaId || targetItem.id,
          title: targetItem.title,
          type: targetItem.type,
          status: "plan_to_consume",
          progressCurrent: 0,
          coverImage: targetItem.coverImage,
          releaseYear: targetItem.releaseYear,
          genres: targetItem.genres,
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setMyTrackedIds((prev) => new Set([...prev, targetItem.mediaId || targetItem.id, targetItem.id]));
        setMyTrackedTitles((prev) => new Set([...prev, targetItem.title.toLowerCase().trim()]));
        showToast(`✓ Added "${targetItem.title}" to ${verb}`);
      } else if (res.status === 409) {
        setMyTrackedIds((prev) => new Set([...prev, targetItem.mediaId || targetItem.id, targetItem.id]));
        setMyTrackedTitles((prev) => new Set([...prev, targetItem.title.toLowerCase().trim()]));
        showToast(`"${targetItem.title}" is already in your library`);
      } else {
        showToast(`ERROR: ${resJson.error || "Failed to add to library"}`);
      }
    } catch {
      showToast("ERROR: Failed to add to library");
    }
  };

  // Send request action
  const handleSendFriendRequest = async () => {
    setIsSendingRequest(true);
    try {
      const res = await fetch("/api/users/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const resJson = await res.json();
      if (res.ok) {
        showToast("TRANSMISSION DISPATCHED // Connection request transmitted");
        fetchProfile();
      } else {
        showToast(`ERROR: ${resJson.error || "Failed to dispatch request"}`);
      }
    } catch {
      showToast("ERROR: Network transmission failed");
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Remove friend action
  const handleSeverLink = async () => {
    if (!data?.friendshipId) return;
    if (!confirm(`Confirm removing friend @${username}?`)) return;

    try {
      const res = await fetch(`/api/users/friends/${data.friendshipId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Friend removed from your network");
        router.push("/friends");
      } else {
        showToast("ERROR: Failed to remove connection");
      }
    } catch {
      showToast("ERROR: Network error during disconnection");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono select-none">
        <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-400 uppercase tracking-widest">
          LOADING PROFILE FOR @{username}...
        </p>
      </div>
    );
  }

  // Gated: Not Friends
  if (!data?.isFriend) {
    const targetUser = data?.user;
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 font-mono select-none">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-black text-white border-2 border-cyber-cyan px-4 py-2.5 shadow-[4px_4px_0px_0px_var(--cyber-cyan)] flex items-center gap-2 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="cyber-card p-8 border-2 border-cyber-red shadow-[8px_8px_0px_0px_var(--cyber-red)] bg-black text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-cyber-red/10 border-2 border-cyber-red flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(255,0,60,0.4)]">
            <Lock className="w-8 h-8 text-cyber-red animate-pulse" />
          </div>

          <div className="text-[10px] tracking-widest text-cyber-red uppercase font-black mb-1">
            PRIVATE PROFILE // RESTRICTED ACCESS
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
            PRIVATE PROFILE
          </h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            Detailed media libraries, progress history, and personal logs are private. You must be friends to view this user's profile and collection.
          </p>

          {/* User Preview Snippet */}
          <div className="border border-white/20 bg-white/5 p-4 max-w-sm mx-auto mb-6 flex items-center gap-4 text-left">
            <div className="w-12 h-12 border-2 border-white bg-cyber-purple/20 flex items-center justify-center font-black text-lg text-white shrink-0 overflow-hidden shadow-[2px_2px_0px_0px_#ffffff]">
              {targetUser?.avatarUrl && targetUser.avatarUrl.trim() !== "" ? (
                <img src={targetUser.avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                username.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-sm font-black text-white">{targetUser?.displayName || username}</div>
              <div className="text-xs text-gray-400">@{username}</div>
              <div className="text-[10px] text-cyber-cyan font-bold mt-0.5">
                {targetUser?.customBadge || "[SYS_OPERATOR::RECRUIT]"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/friends"
              className="w-full sm:w-auto px-5 py-2.5 border border-white/30 text-gray-300 hover:text-white text-xs uppercase flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>[← BACK TO FRIENDS]</span>
            </Link>

            {data?.friendStatus === "pending" ? (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-2.5 bg-white/10 text-cyber-yellow text-xs font-bold uppercase border border-cyber-yellow/40 cursor-not-allowed"
              >
                [FRIEND REQUEST PENDING]
              </button>
            ) : (
              <button
                onClick={handleSendFriendRequest}
                disabled={isSendingRequest}
                className="w-full sm:w-auto px-6 py-2.5 bg-cyber-purple text-white text-xs font-black uppercase border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>[+ ADD FRIEND]</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authorized: Friends Profile & Library View
  const targetUser = data.user;
  const stats = data.stats;
  const library = data.library || [];

  const filteredLibrary = library.filter((item) => {
    if (activeTypeFilter === "all") return true;
    return item.type === activeTypeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 font-mono select-none">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white border-2 border-cyber-cyan px-4 py-2.5 shadow-[4px_4px_0px_0px_var(--cyber-cyan)] flex items-center gap-2 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/friends"
          className="text-xs text-gray-400 hover:text-cyber-cyan uppercase flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO FRIENDS</span>
        </Link>
      </div>

      {/* Operator Header Card */}
      <div className="cyber-card p-6 md:p-8 border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] bg-black mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-purple/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Box */}
            <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-white bg-cyber-purple/20 flex items-center justify-center font-black text-3xl text-white overflow-hidden shadow-[4px_4px_0px_0px_#ffffff] shrink-0">
              {targetUser.avatarUrl && targetUser.avatarUrl.trim() !== "" ? (
                <img src={targetUser.avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                username.slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
                <span className="text-[10px] tracking-widest text-cyber-green uppercase font-bold">
                  FRIENDS // PROFILE UNLOCKED
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white/10 text-cyber-cyan border border-cyber-cyan/40 font-bold ml-2">
                  {targetUser.customBadge || "[SYS_OPERATOR::ELITE]"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase">
                {targetUser.displayName}
              </h1>
              <div className="text-xs text-gray-400 mt-0.5">
                @{targetUser.username}
              </div>

              {targetUser.bio && (
                <p className="text-xs text-gray-300 italic mt-3 bg-white/5 p-2.5 border-l-2 border-cyber-cyan max-w-xl">
                  "{targetUser.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSeverLink}
              className="px-4 py-2 border border-red-500/40 hover:border-red-500 text-red-400 hover:bg-red-500/10 text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>[REMOVE FRIEND]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">TOTAL ENTRIES</span>
          <span className="text-2xl font-black text-white">{stats?.totalEntries ?? 0}</span>
        </div>

        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">COMPLETED</span>
          <span className="text-2xl font-black text-cyber-green">{stats?.completedCount ?? 0}</span>
        </div>

        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">IN PROGRESS</span>
          <span className="text-2xl font-black text-cyber-yellow">{stats?.inProgressCount ?? 0}</span>
        </div>

        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">FAVORITES</span>
          <span className="text-2xl font-black text-cyber-red">{stats?.favoritesCount ?? 0}</span>
        </div>

        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center col-span-2 sm:col-span-1">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">AVG RATING</span>
          <span className="text-2xl font-black text-cyber-purple">
            {stats?.averageRating ? `★ ${stats.averageRating}` : "N/A"}
          </span>
        </div>
      </div>

      {/* Tabbed Media Collection Grid (Read-Only) */}
      <div className="cyber-card p-6 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyber-cyan" />
            USER MEDIA LIBRARY ({filteredLibrary.length})
          </h3>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {["all", "anime", "manga", "game", "movie", "series"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTypeFilter(t)}
                className={`px-3 py-1 font-extrabold uppercase border transition-all cursor-pointer ${
                  activeTypeFilter === t
                    ? "bg-white text-black border-white shadow-[2px_2px_0px_0px_#ffffff]"
                    : "bg-transparent text-gray-400 border-white/20 hover:border-white hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {filteredLibrary.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 font-mono">
            NO ENTRIES FOUND MATCHING CATEGORY FILTER "{activeTypeFilter.toUpperCase()}".
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
            {filteredLibrary.map((item) => {
              const isAlreadyTracked =
                Boolean(data.isSelf) ||
                Boolean(item.mediaId && myTrackedIds.has(item.mediaId)) ||
                myTrackedIds.has(item.id) ||
                myTrackedTitles.has(item.title.toLowerCase().trim());

              return (
                <MediaCard
                  key={item.id}
                  item={item}
                  isFriendView={!data.isSelf}
                  isAlreadyTracked={isAlreadyTracked}
                  readOnly={!data.isSelf}
                  onAddPlan={handleAddPlan}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
