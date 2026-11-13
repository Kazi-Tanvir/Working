import React from "react";
import Link from "next/link";
import {
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Terminal,
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
  FileUp,
  Sparkles,
  Zap,
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import { ACTIVE_SEARCH_GATEWAYS } from "@/utils/apiHelpers";

export default function LandingPage() {
  const mediaTypes = [
    {
      title: "ANIME",
      icon: <Tv className="w-5 h-5" />,
      source: "AniList GraphQL",
      badgeColor: "border-cyber-purple text-cyber-purple bg-cyber-purple/10",
      desc: "Track episodes, seasonal airings, and broadcast status with automatic title fallback across English, Romaji & Japanese.",
      href: "/anime",
    },
    {
      title: "MANGA",
      icon: <BookOpen className="w-5 h-5" />,
      source: "AniList GraphQL",
      badgeColor: "border-cyber-purple text-cyber-purple bg-cyber-purple/10",
      desc: "Log read chapters, completed volumes, and ongoing releases with canonical author and publishing metadata.",
      href: "/manga",
    },
    {
      title: "VIDEO GAMES",
      icon: <Gamepad2 className="w-5 h-5" />,
      source: "RAWG Database",
      badgeColor: "border-cyber-green text-cyber-green bg-cyber-green/10",
      desc: "Catalog backlogs, hours played, platforms, and Metacritic scores across PC, console, and retro titles.",
      href: "/games",
    },
    {
      title: "MOVIES",
      icon: <Film className="w-5 h-5" />,
      source: "The Movie DB (TMDB)",
      badgeColor: "border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10",
      desc: "Archive feature films, release dates, runtime minutes, and verified community ratings with high-res poster art.",
      href: "/movies",
    },
    {
      title: "SERIES",
      icon: <Tv className="w-5 h-5" />,
      source: "The Movie DB (TMDB)",
      badgeColor: "border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10",
      desc: "Manage episode-by-episode progress across multiple seasons and ongoing network broadcasts.",
      href: "/series",
    },
  ];

  const features = [
    {
      num: "01",
      title: "ALL-IN-ONE MEDIA VAULT",
      icon: <Layers className="w-5 h-5 text-cyber-purple" />,
      desc: "Stop fragmenting your media history between MyAnimeList, Backloggd, and Letterboxd. ShinDB brings all 5 entertainment mediums together into one cohesive, obsidian-style tracking matrix.",
      highlight: "Anime • Manga • Games • Movies • Series",
    },
    {
      num: "02",
      title: "STRICT API INTEGRITY",
      icon: <ShieldCheck className="w-5 h-5 text-cyber-green" />,
      desc: "Zero fake or corrupt entries. Every single item is strictly verified against AniList, TMDB, or RAWG in real time. Accurate cover art, canonical ratings, and release metadata guaranteed.",
      highlight: "AniList • TMDB • RAWG Live Gateways",
    },
    {
      num: "03",
      title: "1-CLICK MAL XML IMPORT",
      icon: <FileUp className="w-5 h-5 text-cyber-cyan" />,
      desc: "Migrate years of anime history in seconds. Built-in rate-limit backoff handles large exports without dropping items, backed by smart multi-language fallback matching.",
      highlight: "Resilient Import • Zero Dropped Entries",
    },
    {
      num: "04",
      title: "DEEP PERSONAL PROGRESS",
      icon: <Zap className="w-5 h-5 text-cyber-yellow" />,
      desc: "Log progress in episodes, chapters, or hours. Manage multi-season shows, rewatch counters, personal 10-point ratings, custom markdown notes, and favorite highlights.",
      highlight: "Seasons • Rewatches • 10-Point Scoring",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-12 md:gap-20 font-mono text-white select-none">
      {/* Top Gateway Telemetry Bar */}
      <section className="w-full flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/20 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">
            GATEWAY // PUBLIC_ACCESS_MODE
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span className="hidden sm:inline uppercase">LIVE GATEWAYS:</span>
          <span className="border border-white/20 bg-white/5 px-2 py-0.5 text-gray-300">
            [{ACTIVE_SEARCH_GATEWAYS.join(" • ")}]
          </span>
        </div>
      </section>

      {/* Hero Section */}
      <section className="w-full flex flex-col items-start gap-6 pt-2 pb-6 border-b-2 border-white">
        <div className="inline-flex items-center gap-2 bg-cyber-purple/20 border border-cyber-purple px-3 py-1 text-xs font-bold text-cyber-purple tracking-widest uppercase">
          <Terminal className="w-3.5 h-3.5" />
          <span>SHINDB // OBSIDIAN-STYLE PERSONAL MEDIA TRACKER</span>
        </div>

        <h1 className="font-sans font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white leading-none">
          ARCHIVE YOUR CULTURAL FOOTPRINT.
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-purple mt-2">
            ALL 5 MEDIUMS. ONE VAULT.
          </span>
        </h1>

        <p className="font-sans text-base sm:text-lg text-gray-300 max-w-3xl leading-relaxed font-normal">
          A high-contrast, distraction-free command center for cataloging{" "}
          <strong className="text-white">Anime</strong>,{" "}
          <strong className="text-white">Manga</strong>,{" "}
          <strong className="text-white">Video Games</strong>,{" "}
          <strong className="text-white">Movies</strong>, and{" "}
          <strong className="text-white">TV Series</strong>. Real-time metadata verified by
          AniList, TMDB, and RAWG — zero manual clutter.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <Link
            href="/register"
            className="flex items-center gap-2.5 bg-white text-black hover:bg-cyber-purple hover:text-white border-2 border-white px-6 py-3 font-mono font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_#8b5cf6] hover:shadow-[6px_6px_0px_0px_#ffffff] active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>CREATE VAULT // REGISTER</span>
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2.5 bg-black hover:bg-white/10 text-white border-2 border-white px-6 py-3 font-mono font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_#ffffff] active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>ACCESS VAULT // SIGN IN</span>
          </Link>
        </div>
      </section>

      {/* Live Interactive Search Sandbox */}
      <section className="w-full flex flex-col gap-4 bg-[#09090b] border-2 border-white p-6 md:p-8 shadow-[6px_6px_0px_0px_#ffffff]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/20 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyber-cyan" />
            <h2 className="font-sans font-black text-lg uppercase tracking-wider text-white">
              TRY LIVE API SEARCH
            </h2>
          </div>
          <span className="text-[11px] text-gray-400">
            QUERY ANILIST, TMDB &amp; RAWG DIRECTLY // PRESS{" "}
            <kbd className="bg-white/10 border border-white/30 px-1 py-0.5 text-white">/</kbd> TO FOCUS
          </span>
        </div>

        <p className="text-xs text-gray-400 font-sans leading-relaxed">
          Search any title across anime, manga, games, movies, and TV series to test the live external discovery gateways.
        </p>

        <div className="w-full max-w-3xl mt-1">
          <SearchBar />
        </div>
      </section>

      {/* What ShinDB Does: 4-Core Feature Pillars */}
      <section className="w-full flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-white text-black font-black text-xs px-2 py-0.5 uppercase tracking-wider">
            SYSTEM_CAPABILITIES
          </div>
          <h2 className="font-sans font-black text-2xl md:text-3xl uppercase tracking-wider text-white">
            WHAT SHINDB DOES
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat) => (
            <div
              key={feat.num}
              className="bg-[#0d0d0f] border-2 border-white p-6 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[6px_6px_0px_0px_var(--cyber-cyan)] transition-all group"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cyber-purple font-black text-xs font-mono">
                      // {feat.num}
                    </span>
                    <h3 className="font-sans font-black text-base uppercase tracking-wider text-white group-hover:text-cyber-cyan transition-colors">
                      {feat.title}
                    </h3>
                  </div>
                  <div className="p-1.5 border border-white/20 bg-black">{feat.icon}</div>
                </div>

                <p className="font-sans text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
                  {feat.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-dashed border-white/20">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  [ {feat.highlight} ]
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The 5 Supported Mediums */}
      <section className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyber-yellow" />
            <h2 className="font-sans font-black text-xl uppercase tracking-wider text-white">
              SUPPORTED SECTORS
            </h2>
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            5 MEDIUMS // ZERO COMPROMISES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {mediaTypes.map((item) => (
            <div
              key={item.title}
              className="bg-[#0d0d0f] border-2 border-white/40 hover:border-white p-4 flex flex-col justify-between gap-3 transition-all hover:bg-white/5 group shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[4px_4px_0px_0px_#ffffff]"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="p-1 border border-white/20 bg-black text-white group-hover:text-cyber-cyan transition-colors">
                    {item.icon}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 border uppercase ${item.badgeColor}`}
                  >
                    {item.source.split(" ")[0]}
                  </span>
                </div>
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-white group-hover:text-cyber-cyan transition-colors">
                  {item.title}
                </h3>
                <p className="font-sans text-[11px] text-gray-400 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              <Link
                href={item.href}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyber-cyan group-hover:underline pt-2 border-t border-white/10"
              >
                <span>EXPLORE SECTOR</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison: Why ShinDB */}
      <section className="w-full bg-[#0d0d0f] border-2 border-white p-6 md:p-8 shadow-[6px_6px_0px_0px_#ffffff] flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyber-purple" />
          <h2 className="font-sans font-black text-xl uppercase tracking-wider text-white">
            BUILT FOR COLLECTORS // ZERO BLOAT
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs">
          <div className="border border-white/20 p-4 bg-black/60 flex flex-col gap-2">
            <span className="font-mono text-cyber-cyan font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              NO SOCIAL ALGORITHMS
            </span>
            <p className="text-gray-300 leading-relaxed font-normal">
              No engagement-bait feeds, recommended advertisements, or corporate tracking pixels.
              Just your pure, structured media catalog.
            </p>
          </div>

          <div className="border border-white/20 p-4 bg-black/60 flex flex-col gap-2">
            <span className="font-mono text-cyber-green font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ACCURATE CANONICAL METADATA
            </span>
            <p className="text-gray-300 leading-relaxed font-normal">
              Direct integration with AniList, TMDB, and RAWG prevents typo duplicates, broken
              covers, and fragmented duplicate entries.
            </p>
          </div>

          <div className="border border-white/20 p-4 bg-black/60 flex flex-col gap-2">
            <span className="font-mono text-cyber-purple font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              OBSIDIAN PHILOSOPHY
            </span>
            <p className="text-gray-300 leading-relaxed font-normal">
              Monospace telemetry, high contrast neobrutalist aesthetic, instant keyboard triggers,
              and full JSON/XML export capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action Footer Banner */}
      <section className="w-full bg-cyber-purple/10 border-2 border-cyber-purple p-8 md:p-12 text-center flex flex-col items-center justify-center gap-6 shadow-[6px_6px_0px_0px_var(--cyber-purple)]">
        <div className="bg-cyber-purple text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
          [INITIALIZE // NEW SYSTEM OPERATOR]
        </div>

        <h2 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl text-white uppercase tracking-tight max-w-2xl">
          READY TO START TRACKING YOUR MEDIA?
        </h2>

        <p className="font-sans text-sm text-gray-300 max-w-lg leading-relaxed font-normal">
          Create a free account to unlock your personal media vault, sync your MAL list, and track
          your progress across Anime, Manga, Games, Movies, and TV.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-white text-black hover:bg-cyber-purple hover:text-white border-2 border-white px-8 py-3.5 font-mono font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_#ffffff] active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>CREATE FREE VAULT</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-black hover:bg-white/10 text-white border-2 border-white px-8 py-3.5 font-mono font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_#8b5cf6] active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>SIGN IN</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

