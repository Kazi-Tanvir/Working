"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@clerk/nextjs";
import {
  User as UserIcon,
  Shield,
  Activity,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Star,
  Settings,
  Download,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Terminal,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { MediaItem } from "@/types/media";

interface ProfileStats {
  totalEntries: number;
  animeCount: number;
  mangaCount: number;
  gameCount: number;
  movieCount: number;
  seriesCount: number;
  completedCount: number;
  inProgressCount: number;
  planCount: number;
  onHoldCount: number;
  droppedCount: number;
  favoritesCount: number;
  averageRating: number | null;
  friendsCount: number;
}

export default function OwnProfilePage() {
  const { user } = useAuth();
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const isAuthenticated = !!user || isSignedIn;

  const [profileData, setProfileData] = useState<{
    user: any;
    stats: ProfileStats;
    favorites: MediaItem[];
    currentlyConsuming: MediaItem[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && isLoaded) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, isLoaded]);

  if (!isAuthenticated && isLoaded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-mono">
        <div className="cyber-card p-8 border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] bg-black">
          <Terminal className="w-12 h-12 text-cyber-yellow mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black uppercase text-white mb-2">
            ACCESS_RESTRICTED // DOSSIER LOCKED
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Sign in to access your personal command dossier and telemetry data.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-cyber-purple text-white font-extrabold uppercase text-xs border border-white shadow-[3px_3px_0px_0px_#ffffff]"
            >
              [AUTHENTICATE SESSION]
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono">
        <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-400 uppercase tracking-widest">
          DECRYPTING OPERATOR DOSSIER TELEMETRY...
        </p>
      </div>
    );
  }

  const u = profileData?.user || user;
  const stats = profileData?.stats;
  const favorites = profileData?.favorites || [];
  const currentlyConsuming = profileData?.currentlyConsuming || [];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 font-mono select-none">
      {/* Operator Banner Header */}
      <div className="cyber-card p-6 md:p-8 border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] bg-black mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-cyan/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Cyber Avatar Box */}
            <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-white bg-cyber-purple/20 flex items-center justify-center font-black text-3xl text-white overflow-hidden shadow-[4px_4px_0px_0px_#ffffff] shrink-0">
              {u?.avatarUrl || clerkUser?.imageUrl ? (
                <img
                  src={u?.avatarUrl || clerkUser?.imageUrl}
                  alt={u?.username || "Operator"}
                  className="w-full h-full object-cover"
                />
              ) : (
                (u?.username || "OP").slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
                <span className="text-[10px] tracking-widest text-cyber-green uppercase font-bold">
                  SYS_OPERATOR::PRIMARY_NODE
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white/10 text-cyber-cyan border border-cyber-cyan/40 font-bold ml-2">
                  {u?.customBadge || "[SYS_OPERATOR::ELITE]"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase">
                {u?.displayName || clerkUser?.fullName || u?.username}
              </h1>
              <div className="text-xs text-gray-400 mt-0.5">
                @{u?.username || clerkUser?.username} // {u?.email || clerkUser?.primaryEmailAddress?.emailAddress}
              </div>

              {u?.bio && (
                <p className="text-xs text-gray-300 italic mt-3 bg-white/5 p-2.5 border-l-2 border-cyber-cyan max-w-xl">
                  "{u.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <Link
              href="/settings"
              className="flex-1 sm:flex-initial px-4 py-2 bg-white text-black font-extrabold text-xs uppercase text-center border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-cyber-cyan transition-all flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>[EDIT SETTINGS]</span>
            </Link>

            <a
              href="/api/media/export"
              download
              className="flex-1 sm:flex-initial px-4 py-2 bg-cyber-purple text-white font-extrabold text-xs uppercase text-center border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>[EXPORT ARCHIVE]</span>
            </a>
          </div>
        </div>

        {/* Status Line */}
        <div className="mt-6 border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
          <div>
            ENCRYPTION: <span className="text-cyber-green font-bold">AES_256_ACTIVE</span> // SESSION: <span className="text-cyber-cyan font-bold">VERIFIED</span>
          </div>
          <div>
            OPERATOR SINCE: <span className="text-white font-bold">{new Date(u?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Primary Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">TOTAL LOGGED</span>
          <span className="text-2xl font-black text-white">{stats?.totalEntries ?? 0}</span>
        </div>

        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">COMPLETED</span>
          <span className="text-2xl font-black text-cyber-green">{stats?.completedCount ?? 0}</span>
        </div>

        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">CONSUMING</span>
          <span className="text-2xl font-black text-cyber-yellow">{stats?.inProgressCount ?? 0}</span>
        </div>

        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">PLANNING</span>
          <span className="text-2xl font-black text-gray-300">{stats?.planCount ?? 0}</span>
        </div>

        <div className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest">FAVORITES</span>
          <span className="text-2xl font-black text-cyber-red">{stats?.favoritesCount ?? 0}</span>
        </div>

        <Link
          href="/friends"
          className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black text-center hover:border-cyber-cyan transition-all group"
        >
          <span className="block text-[10px] text-gray-400 uppercase tracking-widest group-hover:text-cyber-cyan">
            FRIENDS NETWORK
          </span>
          <span className="text-2xl font-black text-cyber-cyan">{stats?.friendsCount ?? 0}</span>
        </Link>
      </div>

      {/* Category Breakdown Bar */}
      <div className="cyber-card p-6 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-purple" />
          CATEGORY DISTRIBUTION BREAKDOWN
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/anime"
            className="p-3 border border-white/20 bg-white/5 hover:border-white transition-all text-center"
          >
            <Tv className="w-4 h-4 text-cyber-purple mx-auto mb-1" />
            <div className="text-[10px] text-gray-400 uppercase">ANIME</div>
            <div className="text-lg font-black text-white">{stats?.animeCount ?? 0}</div>
          </Link>

          <Link
            href="/manga"
            className="p-3 border border-white/20 bg-white/5 hover:border-white transition-all text-center"
          >
            <BookOpen className="w-4 h-4 text-cyber-cyan mx-auto mb-1" />
            <div className="text-[10px] text-gray-400 uppercase">MANGA</div>
            <div className="text-lg font-black text-white">{stats?.mangaCount ?? 0}</div>
          </Link>

          <Link
            href="/games"
            className="p-3 border border-white/20 bg-white/5 hover:border-white transition-all text-center"
          >
            <Gamepad2 className="w-4 h-4 text-cyber-yellow mx-auto mb-1" />
            <div className="text-[10px] text-gray-400 uppercase">GAMES</div>
            <div className="text-lg font-black text-white">{stats?.gameCount ?? 0}</div>
          </Link>

          <Link
            href="/movies"
            className="p-3 border border-white/20 bg-white/5 hover:border-white transition-all text-center"
          >
            <Film className="w-4 h-4 text-cyber-red mx-auto mb-1" />
            <div className="text-[10px] text-gray-400 uppercase">MOVIES</div>
            <div className="text-lg font-black text-white">{stats?.movieCount ?? 0}</div>
          </Link>

          <Link
            href="/series"
            className="p-3 border border-white/20 bg-white/5 hover:border-white transition-all text-center"
          >
            <Tv className="w-4 h-4 text-cyber-green mx-auto mb-1" />
            <div className="text-[10px] text-gray-400 uppercase">SERIES</div>
            <div className="text-lg font-black text-white">{stats?.seriesCount ?? 0}</div>
          </Link>
        </div>
      </div>

      {/* Currently Consuming Showcase */}
      {currentlyConsuming.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyber-yellow" />
              CURRENTLY CONSUMING ACTIVE LOGS ({currentlyConsuming.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentlyConsuming.map((item) => (
              <div
                key={item.id}
                className="cyber-card border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] bg-white/5 overflow-hidden">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      NO POSTER
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-[9px] uppercase px-1.5 py-0.5 bg-black border border-white text-white font-bold">
                    {item.type}
                  </span>
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-bold text-white truncate" title={item.title}>
                    {item.title}
                  </div>
                  <div className="text-[10px] text-cyber-yellow font-bold mt-1">
                    {item.progress}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites Showcase */}
      {favorites.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-cyber-red fill-cyber-red" />
              PRIORITY FAVORITES HALL OF FAME ({favorites.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="cyber-card border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] bg-white/5 overflow-hidden">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      NO POSTER
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-[9px] uppercase px-1.5 py-0.5 bg-black border border-white text-white font-bold">
                    {item.type}
                  </span>
                  {item.rating && (
                    <span className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 bg-cyber-purple text-white border border-white">
                      ★ {item.rating}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-bold text-white truncate" title={item.title}>
                    {item.title}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {item.releaseYear || "Archive"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
