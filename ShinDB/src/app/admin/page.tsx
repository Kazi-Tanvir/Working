"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Users,
  Database,
  ShieldCheck,
  TrendingUp,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Sparkles,
  Loader2,
  RefreshCw,
  ArrowRight,
  Clock,
  Layers,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalEntries: number;
  totalMedia: number;
  totalFriendships: number;
  signups: {
    past24h: number;
    past7d: number;
    past30d: number;
  };
  mediaByType: Record<string, number>;
  entriesByStatus: Record<string, number>;
  topMedia: {
    id: string;
    title: string;
    type: string;
    coverImage: string;
    releaseYear: number;
    trackedCount: number;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load telemetry stats:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-center">
        <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin mb-4" />
        <div className="text-xs uppercase tracking-widest text-gray-400">
          COMPILING SYSTEM TELEMETRY & NETWORK VITALS...
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "anime":
        return <Tv className="w-3.5 h-3.5 text-cyber-purple" />;
      case "manga":
        return <BookOpen className="w-3.5 h-3.5 text-cyber-cyan" />;
      case "game":
        return <Gamepad2 className="w-3.5 h-3.5 text-cyber-green" />;
      case "movie":
        return <Film className="w-3.5 h-3.5 text-cyber-yellow" />;
      case "series":
        return <Tv className="w-3.5 h-3.5 text-cyber-red" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-white" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-mono select-none">
      {/* Header Banner */}
      <div className="p-6 bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyber-green">
              TELEMETRY_ENGINE::ACTIVE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Activity className="w-7 h-7 text-cyber-cyan" />
            Admin Telemetry & Operations
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time aggregate data, storage footprint, and media tracking activity.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start md:self-auto px-4 py-2 bg-white text-black font-extrabold uppercase text-xs border border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] hover:bg-cyber-purple hover:text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Sync Telemetry</span>
        </button>
      </div>

      {/* Top Level Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-cyber-purple" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalUsers || 0}</div>
          <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-2">
            <span className="text-cyber-green font-bold">+{stats?.signups.past24h || 0}</span>
            <span>in last 24 hours</span>
          </div>
        </div>

        <div className="p-5 bg-black border-2 border-white shadow-[4px_4px_0px_0px_var(--cyber-cyan)] relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Master Catalog</span>
            <Database className="w-4 h-4 text-cyber-cyan" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalMedia || 0}</div>
          <div className="text-[10px] text-gray-400 mt-2">
            Titles across 5 media formats
          </div>
        </div>

        <div className="p-5 bg-black border-2 border-white shadow-[4px_4px_0px_0px_var(--cyber-yellow)] relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">User Tracked Entries</span>
            <TrendingUp className="w-4 h-4 text-cyber-yellow" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalEntries || 0}</div>
          <div className="text-[10px] text-gray-400 mt-2">
            Personal list records in database
          </div>
        </div>

        <div className="p-5 bg-black border-2 border-white shadow-[4px_4px_0px_0px_var(--cyber-green)] relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Active Friendships</span>
            <ShieldCheck className="w-4 h-4 text-cyber-green" />
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalFriendships || 0}</div>
          <div className="text-[10px] text-gray-400 mt-2">
            Mutually accepted connections
          </div>
        </div>
      </div>

      {/* Middle Section: User Signups Growth & Format Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Growth Velocity */}
        <div className="p-5 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] space-y-4">
          <h2 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
            <Clock className="w-4 h-4 text-cyber-purple" />
            Sign-up Growth Intervals
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2.5 bg-white/5 border border-white/10">
              <span className="text-xs text-gray-300 uppercase">Past 24 Hours</span>
              <span className="text-sm font-black text-cyber-green">
                {stats?.signups.past24h || 0} users
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-white/5 border border-white/10">
              <span className="text-xs text-gray-300 uppercase">Past 7 Days</span>
              <span className="text-sm font-black text-cyber-cyan">
                {stats?.signups.past7d || 0} users
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-white/5 border border-white/10">
              <span className="text-xs text-gray-300 uppercase">Past 30 Days</span>
              <span className="text-sm font-black text-cyber-yellow">
                {stats?.signups.past30d || 0} users
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/users"
              className="w-full py-2 bg-cyber-purple/20 hover:bg-cyber-purple text-white text-center text-xs font-bold uppercase tracking-wider border border-white/40 hover:border-white block transition-all"
            >
              Open User Directory &rarr;
            </Link>
          </div>
        </div>

        {/* Catalog Breakdown by Format */}
        <div className="p-5 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] space-y-4">
          <h2 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
            <Database className="w-4 h-4 text-cyber-cyan" />
            Catalog Media Formats
          </h2>
          <div className="space-y-2">
            {["anime", "manga", "game", "movie", "series"].map((type) => {
              const count = stats?.mediaByType[type] || 0;
              const total = stats?.totalMedia || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs uppercase font-bold text-gray-300">
                    <span className="flex items-center gap-1.5">
                      {getTypeIcon(type)}
                      {type}
                    </span>
                    <span className="text-white">
                      {count} <span className="text-gray-500 text-[10px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                    <div
                      className="bg-cyber-cyan h-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/admin/media"
              className="w-full py-2 bg-cyber-cyan/20 hover:bg-cyber-cyan hover:text-black text-white text-center text-xs font-bold uppercase tracking-wider border border-white/40 hover:border-white block transition-all"
            >
              Manage Catalog Catalog &rarr;
            </Link>
          </div>
        </div>

        {/* Tracking Status Breakdown */}
        <div className="p-5 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] space-y-4">
          <h2 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
            <TrendingUp className="w-4 h-4 text-cyber-yellow" />
            List Status Distribution
          </h2>
          <div className="space-y-2">
            {stats &&
              Object.entries(stats.entriesByStatus).map(([status, count]) => {
                const total = stats.totalEntries || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={status} className="flex items-center justify-between p-1.5 bg-white/5 border border-white/10 text-xs">
                    <span className="font-bold uppercase text-gray-300">{status.replace(/_/g, " ")}</span>
                    <span className="text-cyber-yellow font-black">{count}</span>
                  </div>
                );
              })}
            {(!stats || Object.keys(stats.entriesByStatus).length === 0) && (
              <div className="text-xs text-gray-500 py-4 text-center">No entry records yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top 10 Most Tracked Media */}
      <div className="p-6 bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyber-cyan" />
            Top 10 Most Tracked Master Entries
          </h2>
          <span className="text-xs text-gray-400">Ranked by user library additions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {stats?.topMedia.map((m, idx) => (
            <div
              key={m.id}
              className="border border-white/20 bg-white/5 p-3 flex flex-col justify-between hover:border-white transition-all group"
            >
              <div>
                <div className="relative aspect-[3/4] w-full border border-white/30 bg-black overflow-hidden mb-2">
                  {m.coverImage && m.coverImage.trim() !== "" ? (
                    <img
                      src={m.coverImage}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 font-bold">
                      NO COVER
                    </div>
                  )}
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black border border-white text-[10px] font-black text-white">
                    #{idx + 1}
                  </div>
                </div>
                <div className="text-xs font-black uppercase text-white line-clamp-1">
                  {m.title}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 uppercase">
                  <span>{m.type}</span>
                  <span>•</span>
                  <span>{m.releaseYear}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 uppercase">Trackers</span>
                <span className="text-xs font-black text-cyber-green">
                  {m.trackedCount} users
                </span>
              </div>
            </div>
          ))}
          {(!stats?.topMedia || stats.topMedia.length === 0) && (
            <div className="col-span-full py-8 text-center text-xs text-gray-500 uppercase">
              No media tracked yet in master catalog.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
