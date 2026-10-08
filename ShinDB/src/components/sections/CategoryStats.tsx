"use client";

import React from "react";
import { 
  Tv, 
  BookOpen, 
  Gamepad2, 
  Film,
  ArrowUpRight
} from "lucide-react";
import { MediaItem } from "@/components/common/MediaCard";

interface CategoryStatsProps {
  animeList: MediaItem[];
  mangaList: MediaItem[];
  gamesList: MediaItem[];
  moviesList: MediaItem[];
  seriesList: MediaItem[];
}

export default function CategoryStats({
  animeList,
  mangaList,
  gamesList,
  moviesList,
  seriesList
}: CategoryStatsProps) {

  // Helper: Parse rating string to score number (e.g., "9.8/10" -> 9.8)
  const parseRating = (ratingStr: string): number | null => {
    if (!ratingStr) return null;
    const cleanStr = ratingStr.split("/")[0].trim();
    const score = parseFloat(cleanStr);
    return isNaN(score) ? null : score;
  };

  // Helper: Calculate Mean Score
  const calculateMeanScore = (list: MediaItem[]): string => {
    const scoredItems = list
      .map(item => parseRating(item.rating))
      .filter((score): score is number => score !== null);
    
    if (scoredItems.length === 0) return "-";
    const sum = scoredItems.reduce((acc, val) => acc + val, 0);
    return (sum / scoredItems.length).toFixed(2);
  };

  // Helper: Count status (case-insensitive)
  const countStatus = (list: MediaItem[], statuses: string[]): number => {
    return list.filter(item => 
      statuses.some(s => item.status.toLowerCase() === s.toLowerCase())
    ).length;
  };

  // Helper: Parse progress numerator
  const parseProgressNumerator = (progressStr: string): number => {
    if (!progressStr) return 0;
    // e.g. "18/28 EP" -> 18
    if (progressStr.includes("/")) {
      const num = parseInt(progressStr.split("/")[0]);
      return isNaN(num) ? 0 : num;
    }
    // e.g. "120 hrs" or "135 mins" -> 120 or 135
    const num = parseInt(progressStr);
    return isNaN(num) ? 0 : num;
  };

  // Helper: Estimate series progress episodes from "S3E06" style
  const parseSeriesProgress = (progressStr: string): number => {
    if (!progressStr) return 0;
    const match = progressStr.match(/S(\d+)E(\d+)/i);
    if (match) {
      const season = parseInt(match[1]);
      const episode = parseInt(match[2]);
      return (season - 1) * 10 + episode; // Estimate 10 eps per season
    }
    return parseProgressNumerator(progressStr);
  };

  // Calculate Anime statistics
  const getAnimeStats = () => {
    const list = animeList;
    const totalEntries = list.length;
    const episodesWatched = list.reduce((acc, item) => acc + parseProgressNumerator(item.progress), 0);
    const daysWatched = ((episodesWatched * 23) / 1440).toFixed(1);
    const meanScore = calculateMeanScore(list);
    
    return {
      days: daysWatched,
      mean: meanScore,
      watching: countStatus(list, ["watching", "watching"]),
      completed: countStatus(list, ["completed"]),
      onHold: countStatus(list, ["on-hold", "on hold"]),
      dropped: countStatus(list, ["dropped"]),
      planToWatch: countStatus(list, ["plan to watch", "plan to play", "plan to read"]),
      totalEntries,
      episodesWatched,
      recent: list.slice(-3).reverse() // Show 3 recently updated/added
    };
  };

  // Calculate Manga statistics
  const getMangaStats = () => {
    const list = mangaList;
    const totalEntries = list.length;
    const chaptersRead = list.reduce((acc, item) => acc + parseProgressNumerator(item.progress), 0);
    const daysRead = ((chaptersRead * 5) / 1440).toFixed(1);
    const volumesRead = Math.floor(chaptersRead / 9.15);
    const meanScore = calculateMeanScore(list);

    return {
      days: daysRead,
      mean: meanScore,
      reading: countStatus(list, ["reading", "watching"]),
      completed: countStatus(list, ["completed"]),
      onHold: countStatus(list, ["on-hold", "on hold"]),
      dropped: countStatus(list, ["dropped"]),
      planToRead: countStatus(list, ["plan to read", "plan to watch"]),
      totalEntries,
      chaptersRead,
      volumesRead,
      recent: list.slice(-3).reverse()
    };
  };

  // Calculate Games statistics
  const getGamesStats = () => {
    const list = gamesList;
    const totalEntries = list.length;
    const totalHours = list.reduce((acc, item) => acc + parseProgressNumerator(item.progress), 0);
    const daysPlayed = (totalHours / 24).toFixed(1);
    const meanScore = calculateMeanScore(list);

    return {
      days: daysPlayed,
      mean: meanScore,
      playing: countStatus(list, ["playing", "watching"]),
      completed: countStatus(list, ["completed"]),
      onHold: countStatus(list, ["on-hold", "on hold"]),
      dropped: countStatus(list, ["dropped"]),
      planToPlay: countStatus(list, ["plan to watch", "plan to play", "plan to read"]),
      totalEntries,
      recent: list.slice(-3).reverse()
    };
  };

  // Calculate Series statistics
  const getSeriesStats = () => {
    const list = seriesList;
    const totalEntries = list.length;
    const episodesWatched = list.reduce((acc, item) => acc + parseSeriesProgress(item.progress), 0);
    const daysWatched = ((episodesWatched * 55) / 1440).toFixed(1);
    const meanScore = calculateMeanScore(list);

    return {
      days: daysWatched,
      mean: meanScore,
      watching: countStatus(list, ["watching"]),
      completed: countStatus(list, ["completed"]),
      onHold: countStatus(list, ["on-hold", "on hold"]),
      dropped: countStatus(list, ["dropped"]),
      planToWatch: countStatus(list, ["plan to watch", "plan to play", "plan to read"]),
      totalEntries,
      episodesWatched,
      recent: list.slice(-3).reverse()
    };
  };

  // Calculate Movies statistics
  const getMoviesStats = () => {
    const list = moviesList;
    const totalEntries = list.length;
    const completedMovies = countStatus(list, ["completed"]);
    const daysWatched = ((completedMovies * 130) / 1440).toFixed(1);
    const meanScore = calculateMeanScore(list);

    return {
      days: daysWatched,
      mean: meanScore,
      watching: countStatus(list, ["watching"]),
      completed: completedMovies,
      onHold: countStatus(list, ["on-hold", "on hold"]),
      dropped: countStatus(list, ["dropped"]),
      planToWatch: countStatus(list, ["plan to watch"]),
      totalEntries,
      recent: list.slice(-3).reverse()
    };
  };

  // Helper: Get progress bar width percentage
  const getProgressPercentage = (item: MediaItem): number => {
    if (item.status === "Completed") return 100;
    if (item.progress.includes("/")) {
      const parts = item.progress.split("/");
      const current = parseInt(parts[0]);
      const total = parseInt(parts[1]);
      if (!isNaN(current) && !isNaN(total) && total > 0) {
        return Math.min(100, Math.round((current / total) * 100));
      }
    }
    if (item.progress.match(/S(\d+)E(\d+)/i)) {
      const eps = parseSeriesProgress(item.progress);
      return Math.min(100, Math.round((eps / 30) * 100)); // Standard 30 eps total estimate
    }
    if (item.progress.toLowerCase().includes("hrs")) {
      const hours = parseProgressNumerator(item.progress);
      return Math.min(100, Math.round((hours / 80) * 100)); // Game progress standard limit 80 hrs
    }
    return 0;
  };

  // Pre-calculate all stats
  const anime = getAnimeStats();
  const manga = getMangaStats();
  const games = getGamesStats();
  const tvSeries = getSeriesStats();
  const movies = getMoviesStats();

  return (
    <section className="w-full flex flex-col gap-10 select-none font-mono">
      
      {/* 1. ANIME STATISTICS ROW */}
      <div className="flex flex-col gap-3">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border border-cyber-purple/40 bg-black/60 px-3.5 py-1.5 rounded-md text-xs font-bold text-white shadow-[2px_2px_0px_0px_var(--cyber-purple)]">
            <Tv className="w-4 h-4 text-cyber-purple" />
            <span className="tracking-widest uppercase">Anime Statistics</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-semibold uppercase">
            <a href="/anime" className="hover:text-cyber-purple transition-colors flex items-center gap-0.5">
              All Anime Stats <ArrowUpRight className="w-3 h-3" />
            </a>
            <span className="text-gray-800">|</span>
            <a href="/anime" className="hover:text-cyber-purple transition-colors">Anime Movies</a>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#0b0b0e] border-2 border-white/5 p-6 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.02)]">
          {/* Day count and Mean score */}
          <div className="lg:col-span-3 flex justify-around lg:justify-start lg:gap-12 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Days Watched</span>
              <span className="text-3xl font-black text-cyber-purple leading-none">{anime.days}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Mean Score</span>
              <span className="text-3xl font-black text-white leading-none">{anime.mean}</span>
            </div>
          </div>

          {/* Status Breakdown Lists */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0 lg:px-6">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2ecc71] inline-block animate-pulse" />
                Watching
              </span>
              <span className="font-bold text-white ml-2">{anime.watching}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3498db] inline-block" />
                Completed
              </span>
              <span className="font-bold text-white ml-2">{anime.completed}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f1c40f] inline-block" />
                On-Hold
              </span>
              <span className="font-bold text-white ml-2">{anime.onHold}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e74c3c] inline-block" />
                Dropped
              </span>
              <span className="font-bold text-white ml-2">{anime.dropped}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400 col-span-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7f8c8d] inline-block" />
                Plan to Watch
              </span>
              <span className="font-bold text-white ml-2">{anime.planToWatch}</span>
            </div>
          </div>

          {/* Totals */}
          <div className="lg:col-span-2 flex flex-col justify-center gap-2 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Total Entries</span>
              <span className="font-bold text-white">{anime.totalEntries}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Episodes Watched</span>
              <span className="font-bold text-white">{anime.episodesWatched}</span>
            </div>
          </div>

          {/* Last Anime Updates */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold">Last Anime Updates</span>
            <div className="flex flex-col gap-3">
              {anime.recent.map(item => (
                <div key={item.id} className="flex gap-3 items-center group">
                  <div className="w-8 h-11 relative overflow-hidden rounded bg-black flex-shrink-0 border border-white/10">
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-cyber-purple transition-colors truncate">{item.title}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 truncate">
                      {item.status} • Progress {item.progress} • Scored {item.rating.split('/')[0]}
                    </span>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-cyber-purple transition-all duration-500" 
                        style={{ width: `${getProgressPercentage(item)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MANGA STATISTICS ROW */}
      <div className="flex flex-col gap-3">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border border-cyber-orange/40 bg-black/60 px-3.5 py-1.5 rounded-md text-xs font-bold text-white shadow-[2px_2px_0px_0px_var(--cyber-orange)]">
            <BookOpen className="w-4 h-4 text-cyber-orange" />
            <span className="tracking-widest uppercase">Manga Statistics</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-semibold uppercase">
            <a href="/manga" className="hover:text-cyber-orange transition-colors flex items-center gap-0.5">
              All Manga Stats <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#0b0b0e] border-2 border-white/5 p-6 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.02)]">
          {/* Day count and Mean score */}
          <div className="lg:col-span-3 flex justify-around lg:justify-start lg:gap-12 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Days Read</span>
              <span className="text-3xl font-black text-cyber-orange leading-none">{manga.days}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Mean Score</span>
              <span className="text-3xl font-black text-white leading-none">{manga.mean}</span>
            </div>
          </div>

          {/* Status Breakdown Lists */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0 lg:px-6">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2ecc71] inline-block" />
                Reading
              </span>
              <span className="font-bold text-white ml-2">{manga.reading}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3498db] inline-block" />
                Completed
              </span>
              <span className="font-bold text-white ml-2">{manga.completed}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f1c40f] inline-block" />
                On-Hold
              </span>
              <span className="font-bold text-white ml-2">{manga.onHold}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e74c3c] inline-block" />
                Dropped
              </span>
              <span className="font-bold text-white ml-2">{manga.dropped}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400 col-span-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7f8c8d] inline-block" />
                Plan to Read
              </span>
              <span className="font-bold text-white ml-2">{manga.planToRead}</span>
            </div>
          </div>

          {/* Totals */}
          <div className="lg:col-span-2 flex flex-col justify-center gap-2 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Total Entries</span>
              <span className="font-bold text-white">{manga.totalEntries}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Chapters Read</span>
              <span className="font-bold text-white">{manga.chaptersRead}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Volumes Read</span>
              <span className="font-bold text-white">{manga.volumesRead}</span>
            </div>
          </div>

          {/* Last Manga Updates */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold">Last Manga Updates</span>
            <div className="flex flex-col gap-3">
              {manga.recent.map(item => (
                <div key={item.id} className="flex gap-3 items-center group">
                  <div className="w-8 h-11 relative overflow-hidden rounded bg-black flex-shrink-0 border border-white/10">
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-cyber-orange transition-colors truncate">{item.title}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 truncate">
                      {item.status} • Progress {item.progress} • Scored {item.rating.split('/')[0]}
                    </span>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-cyber-orange transition-all duration-500" 
                        style={{ width: `${getProgressPercentage(item)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. GAME STATISTICS ROW */}
      <div className="flex flex-col gap-3">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border border-cyber-green/40 bg-black/60 px-3.5 py-1.5 rounded-md text-xs font-bold text-white shadow-[2px_2px_0px_0px_var(--cyber-green)]">
            <Gamepad2 className="w-4 h-4 text-cyber-green" />
            <span className="tracking-widest uppercase">Game Statistics</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-semibold uppercase">
            <a href="/games" className="hover:text-cyber-green transition-colors flex items-center gap-0.5">
              All Games <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#0b0b0e] border-2 border-white/5 p-6 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.02)]">
          {/* Day count and Mean score */}
          <div className="lg:col-span-3 flex justify-around lg:justify-start lg:gap-12 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Days Played</span>
              <span className="text-3xl font-black text-cyber-green leading-none">{games.days}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Mean Score</span>
              <span className="text-3xl font-black text-white leading-none">{games.mean}</span>
            </div>
          </div>

          {/* Status Breakdown Lists */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0 lg:px-6">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2ecc71] inline-block animate-pulse" />
                Playing
              </span>
              <span className="font-bold text-white ml-2">{games.playing}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3498db] inline-block" />
                Completed
              </span>
              <span className="font-bold text-white ml-2">{games.completed}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f1c40f] inline-block" />
                On-Hold
              </span>
              <span className="font-bold text-white ml-2">{games.onHold}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e74c3c] inline-block" />
                Dropped
              </span>
              <span className="font-bold text-white ml-2">{games.dropped}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400 col-span-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7f8c8d] inline-block" />
                Plan to Play
              </span>
              <span className="font-bold text-white ml-2">{games.planToPlay}</span>
            </div>
          </div>

          {/* Totals */}
          <div className="lg:col-span-2 flex flex-col justify-center gap-2 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Total Entries</span>
              <span className="font-bold text-white">{games.totalEntries}</span>
            </div>
          </div>

          {/* Last Game Updates */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold">Last Game Updates</span>
            <div className="flex flex-col gap-3">
              {games.recent.map(item => (
                <div key={item.id} className="flex gap-3 items-center group">
                  <div className="w-10 h-8 relative overflow-hidden rounded bg-black flex-shrink-0 border border-white/10">
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-cyber-green transition-colors truncate">{item.title}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 truncate">
                      {item.status} • Time {item.progress} • Scored {item.rating.split('/')[0]}
                    </span>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-cyber-green transition-all duration-500" 
                        style={{ width: `${getProgressPercentage(item)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SERIES STATISTICS ROW */}
      <div className="flex flex-col gap-3">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border border-cyber-cyan/40 bg-black/60 px-3.5 py-1.5 rounded-md text-xs font-bold text-white shadow-[2px_2px_0px_0px_var(--cyber-cyan)]">
            <Tv className="w-4 h-4 text-cyber-cyan" />
            <span className="tracking-widest uppercase">Series Statistics</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-semibold uppercase">
            <a href="/series" className="hover:text-cyber-cyan transition-colors flex items-center gap-0.5">
              All Series Stats <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#0b0b0e] border-2 border-white/5 p-6 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.02)]">
          {/* Day count and Mean score */}
          <div className="lg:col-span-3 flex justify-around lg:justify-start lg:gap-12 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Days Watched</span>
              <span className="text-3xl font-black text-cyber-cyan leading-none">{tvSeries.days}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Mean Score</span>
              <span className="text-3xl font-black text-white leading-none">{tvSeries.mean}</span>
            </div>
          </div>

          {/* Status Breakdown Lists */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0 lg:px-6">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2ecc71] inline-block animate-pulse" />
                Watching
              </span>
              <span className="font-bold text-white ml-2">{tvSeries.watching}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3498db] inline-block" />
                Completed
              </span>
              <span className="font-bold text-white ml-2">{tvSeries.completed}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f1c40f] inline-block" />
                On-Hold
              </span>
              <span className="font-bold text-white ml-2">{tvSeries.onHold}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e74c3c] inline-block" />
                Dropped
              </span>
              <span className="font-bold text-white ml-2">{tvSeries.dropped}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400 col-span-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7f8c8d] inline-block" />
                Plan to Watch
              </span>
              <span className="font-bold text-white ml-2">{tvSeries.planToWatch}</span>
            </div>
          </div>

          {/* Totals */}
          <div className="lg:col-span-2 flex flex-col justify-center gap-2 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Total Entries</span>
              <span className="font-bold text-white">{tvSeries.totalEntries}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Episodes Watched</span>
              <span className="font-bold text-white">{tvSeries.episodesWatched}</span>
            </div>
          </div>

          {/* Last Series Updates */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold">Last Series Updates</span>
            <div className="flex flex-col gap-3">
              {tvSeries.recent.map(item => (
                <div key={item.id} className="flex gap-3 items-center group">
                  <div className="w-8 h-11 relative overflow-hidden rounded bg-black flex-shrink-0 border border-white/10">
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-cyber-cyan transition-colors truncate">{item.title}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 truncate">
                      {item.status} • Progress {item.progress} • Scored {item.rating.split('/')[0]}
                    </span>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-cyber-cyan transition-all duration-500" 
                        style={{ width: `${getProgressPercentage(item)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. MOVIE STATISTICS ROW */}
      <div className="flex flex-col gap-3">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border border-cyber-yellow/40 bg-black/60 px-3.5 py-1.5 rounded-md text-xs font-bold text-white shadow-[2px_2px_0px_0px_var(--cyber-yellow)]">
            <Film className="w-4 h-4 text-cyber-yellow" />
            <span className="tracking-widest uppercase">Movie Statistics</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-semibold uppercase">
            <a href="/movies" className="hover:text-cyber-yellow transition-colors flex items-center gap-0.5">
              All Movie Stats <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#0b0b0e] border-2 border-white/5 p-6 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-8 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.02)]">
          {/* Day count and Mean score */}
          <div className="lg:col-span-3 flex justify-around lg:justify-start lg:gap-12 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Days Watched</span>
              <span className="text-3xl font-black text-cyber-yellow leading-none">{movies.days}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">Mean Score</span>
              <span className="text-3xl font-black text-white leading-none">{movies.mean}</span>
            </div>
          </div>

          {/* Status Breakdown Lists */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0 lg:px-6">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2ecc71] inline-block" />
                Watching
              </span>
              <span className="font-bold text-white ml-2">{movies.watching}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3498db] inline-block" />
                Completed
              </span>
              <span className="font-bold text-white ml-2">{movies.completed}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f1c40f] inline-block" />
                On-Hold
              </span>
              <span className="font-bold text-white ml-2">{movies.onHold}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e74c3c] inline-block" />
                Dropped
              </span>
              <span className="font-bold text-white ml-2">{movies.dropped}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400 col-span-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7f8c8d] inline-block" />
                Plan to Watch
              </span>
              <span className="font-bold text-white ml-2">{movies.planToWatch}</span>
            </div>
          </div>

          {/* Totals */}
          <div className="lg:col-span-2 flex flex-col justify-center gap-2 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Total Entries</span>
              <span className="font-bold text-white">{movies.totalEntries}</span>
            </div>
          </div>

          {/* Last Movie Updates */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold">Last Movie Updates</span>
            <div className="flex flex-col gap-3">
              {movies.recent.map(item => (
                <div key={item.id} className="flex gap-3 items-center group">
                  <div className="w-8 h-11 relative overflow-hidden rounded bg-black flex-shrink-0 border border-white/10">
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-cyber-yellow transition-colors truncate">{item.title}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 truncate">
                      {item.status} • Time {item.progress} • Scored {item.rating.split('/')[0]}
                    </span>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-cyber-yellow transition-all duration-500" 
                        style={{ width: `${getProgressPercentage(item)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
