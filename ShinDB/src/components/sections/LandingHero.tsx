"use client";

import React from "react";
import Link from "next/link";
import { 
  Terminal, 
  ShieldCheck, 
  Tv, 
  BookOpen, 
  Gamepad2, 
  Film, 
  ArrowRight, 
  Zap, 
  Database,
  Layers,
  Lock
} from "lucide-react";

interface LandingHeroProps {
  totalCount: number;
  animeCount: number;
  mangaCount: number;
  gameCount: number;
  movieCount: number;
  seriesCount: number;
}

export default function LandingHero({
  totalCount,
  animeCount,
  mangaCount,
  gameCount,
  movieCount,
  seriesCount,
}: LandingHeroProps) {
  const categories = [
    { label: "Anime", count: animeCount, icon: <Tv className="w-4 h-4 text-cyber-purple" />, href: "/anime" },
    { label: "Manga", count: mangaCount, icon: <BookOpen className="w-4 h-4 text-cyber-cyan" />, href: "/manga" },
    { label: "Games", count: gameCount, icon: <Gamepad2 className="w-4 h-4 text-cyber-lime" />, href: "/games" },
    { label: "Movies", count: movieCount, icon: <Film className="w-4 h-4 text-cyber-amber" />, href: "/movies" },
    { label: "Series", count: seriesCount, icon: <Tv className="w-4 h-4 text-cyber-rose" />, href: "/series" },
  ];

  return (
    <div className="w-full flex flex-col gap-12 font-mono py-4">
      {/* Top Protocol Status Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/20 pb-3 text-xs text-gray-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-cyber-lime rounded-full animate-ping" />
          <span className="text-white font-bold tracking-wider">[ShinDB::V2.0_ONLINE]</span>
          <span className="text-gray-500 hidden sm:inline">// NODE_ALPHA // ARCHIVE ENGINE</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="border border-white/20 bg-white/5 px-2 py-0.5 text-gray-300">
            TOTAL ARCHIVES: <strong className="text-white">{totalCount}+</strong>
          </span>
          <span className="border border-white/20 bg-white/5 px-2 py-0.5 text-cyber-cyan">
            CLEARANCE: PUBLIC_GATEWAY
          </span>
        </div>
      </div>

      {/* Hero Visual Box */}
      <div className="relative border-2 border-white bg-[#0a0a0f] p-8 md:p-14 shadow-[8px_8px_0px_0px_#ffffff] flex flex-col gap-8 overflow-hidden">
        {/* Subtle background tech grid effect */}
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none select-none">
          <Terminal className="w-72 h-72 text-white" />
        </div>

        {/* Hero Title & Subtitle */}
        <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-cyber-purple/20 border border-cyber-purple text-cyber-purple px-3 py-1 text-xs font-bold tracking-widest uppercase w-fit">
            <Zap className="w-3.5 h-3.5" />
            <span>Cyber-Neobrutalist Universal Tracker</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
            UNIFIED MEDIA ARCHIVE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
              FOR CYBERNETIC MINDS.
            </span>
          </h1>

          <p className="text-sm md:text-base text-gray-400 leading-relaxed font-sans max-w-2xl">
            Track Anime, Manga, Games, Movies, and Series with multi-season auto-allocation, real-time AniList/RAWG/TVmaze discovery, and strict multi-user privacy in an obsidian-class interface.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="relative z-10 flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="/register"
            className="h-12 px-6 bg-white hover:bg-cyber-purple text-black hover:text-white font-extrabold text-xs uppercase tracking-widest border border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] hover:shadow-[5px_5px_0px_0px_#ffffff] transition-all flex items-center gap-2.5 cursor-pointer"
          >
            <span>INITIALIZE OPERATOR ACCOUNT</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="h-12 px-6 bg-black hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[5px_5px_0px_0px_#ffffff] transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-cyber-cyan" />
            <span>AUTHENTICATE SESSION</span>
          </Link>
        </div>

        {/* Live Catalog Category Chips */}
        <div className="relative z-10 border-t border-white/20 pt-6 flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-gray-500 mr-2">
            PREVIEW PROTOCOLS:
          </span>
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex items-center gap-2 border border-white/20 hover:border-white bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-all"
            >
              {cat.icon}
              <span className="font-bold uppercase tracking-wider">{cat.label}</span>
              <span className="text-[10px] text-gray-500 font-mono">[{cat.count}]</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Feature Architecture Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-2 border-white/40 hover:border-white bg-black/60 p-6 flex flex-col gap-3 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="flex items-center gap-2 text-cyber-purple">
            <Layers className="w-5 h-5" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
              Multi-Season Engine
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Automatic cumulative episode calculation, interactive season checklists, and per-season completion tracking without awkward regex parsing.
          </p>
        </div>

        <div className="border-2 border-white/40 hover:border-white bg-black/60 p-6 flex flex-col gap-3 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="flex items-center gap-2 text-cyber-cyan">
            <Database className="w-5 h-5" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
              Unified Discovery & Sync
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            AniList GraphQL, RAWG REST, and TVmaze integration with 1-click addition and automatic airing synchronization for unreleased counts.
          </p>
        </div>

        <div className="border-2 border-white/40 hover:border-white bg-black/60 p-6 flex flex-col gap-3 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="flex items-center gap-2 text-cyber-lime">
            <Lock className="w-5 h-5" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
              Multi-Tenant Isolation
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Strict user library scoping with bcrypt password encryption, JWT session rotation, and multi-provider OAuth federation.
          </p>
        </div>
      </div>
    </div>
  );
}
