// src/components/sections/CategoryStats.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Tv, BookOpen, Gamepad2, Film, ArrowUpRight, LucideIcon } from "lucide-react";
import { MediaItem } from "@/components/common/MediaCard";
import { getCoverImage, DEFAULT_COVER_IMAGES } from "@/utils/mediaDefaults";

interface CategoryStatsProps {
  animeList: MediaItem[];
  mangaList: MediaItem[];
  gamesList: MediaItem[];
  moviesList: MediaItem[];
  seriesList: MediaItem[];
}

interface StatRowConfig {
  key: string;
  title: string;
  href: string;
  linkLabel: string;
  daysLabel: string;
  activeLabel: string;
  planLabel: string;
  updatesLabel: string;
  icon: LucideIcon;
  accentText: string;
  accentBg: string;
  borderShadowClass: string;
  list: MediaItem[];
  daysValue: string;
  extraMetrics: { label: string; value: number }[];
}

export default function CategoryStats({
  animeList,
  mangaList,
  gamesList,
  moviesList,
  seriesList,
}: CategoryStatsProps) {
  const parseScore = (r: string) => {
    const val = parseFloat((r || "").split("/")[0]);
    return isNaN(val) ? null : val;
  };

  const calcMean = (list: MediaItem[]) => {
    const scores = list.map((i) => parseScore(i.rating)).filter((v): v is number => v !== null);
    if (!scores.length) return "-";
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
  };

  const countStatus = (list: MediaItem[], targets: string[]) =>
    list.filter((i) => targets.includes(i.status.toLowerCase())).length;

  const parseProgressNum = (p: string) => {
    const se = (p || "").match(/S(\d+)E(\d+)/i);
    if (se) return (parseInt(se[1], 10) - 1) * 10 + parseInt(se[2], 10);
    return parseInt((p || "").split("/")[0], 10) || 0;
  };

  const getProgressPercent = (item: MediaItem) => {
    if (item.status.toLowerCase() === "completed") return 100;
    if (item.progress.includes("/")) {
      const [c, t] = item.progress.split("/");
      const curr = parseInt(c, 10);
      const tot = parseInt(t, 10);
      if (curr && tot > 0) return Math.min(100, Math.round((curr / tot) * 100));
    }
    return 25;
  };

  // Differentiate anime series episodes and anime movie runtimes
  let animeSeriesEps = 0;
  let animeMovieMins = 0;
  let completedAnimeMovies = 0;

  for (const item of animeList) {
    const isMovie = item.progressUnit === "mins" || item.progress.toLowerCase().includes("min");
    const num = parseProgressNum(item.progress);
    if (isMovie) {
      animeMovieMins += num;
      if (item.status.toLowerCase() === "completed" || num > 0) {
        completedAnimeMovies += 1;
      }
    } else {
      animeSeriesEps += num;
    }
  }

  const totalAnimeMinutes = (animeSeriesEps * 23) + animeMovieMins;
  const animeDays = (totalAnimeMinutes / 1440).toFixed(1);
  const totalAnimeWatched = animeSeriesEps + completedAnimeMovies;

  const mangaChs = mangaList.reduce((acc, i) => acc + parseProgressNum(i.progress), 0);
  const gameHrs = gamesList.reduce((acc, i) => acc + parseProgressNum(i.progress), 0);
  const seriesEps = seriesList.reduce((acc, i) => acc + parseProgressNum(i.progress), 0);
  const completedMovies = countStatus(moviesList, ["completed"]);
  const moviesDurationMins = moviesList.reduce((acc, i) => {
    if (i.status.toLowerCase() === "completed") {
      return acc + (parseProgressNum(i.progress) || 120);
    }
    return acc;
  }, 0);

  const rows: StatRowConfig[] = [
    {
      key: "anime",
      title: "Anime Statistics",
      href: "/anime",
      linkLabel: "All Anime Stats",
      daysLabel: "Days Watched",
      activeLabel: "Watching",
      planLabel: "Plan to Watch",
      updatesLabel: "Last Anime Updates",
      icon: Tv,
      accentText: "text-cyber-purple",
      accentBg: "bg-cyber-purple",
      borderShadowClass:
        "border-cyber-purple/40 shadow-[2px_2px_0px_0px_var(--cyber-purple)]",
      list: animeList,
      daysValue: animeDays,
      extraMetrics: [{ label: "Episodes Watched", value: totalAnimeWatched }],
    },
    {
      key: "manga",
      title: "Manga Statistics",
      href: "/manga",
      linkLabel: "All Manga Stats",
      daysLabel: "Days Read",
      activeLabel: "Reading",
      planLabel: "Plan to Read",
      updatesLabel: "Last Manga Updates",
      icon: BookOpen,
      accentText: "text-cyber-orange",
      accentBg: "bg-cyber-orange",
      borderShadowClass:
        "border-cyber-orange/40 shadow-[2px_2px_0px_0px_var(--cyber-orange)]",
      list: mangaList,
      daysValue: ((mangaChs * 5) / 1440).toFixed(1),
      extraMetrics: [
        { label: "Chapters Read", value: mangaChs },
        { label: "Volumes Read", value: Math.floor(mangaChs / 9) },
      ],
    },
    {
      key: "game",
      title: "Game Statistics",
      href: "/games",
      linkLabel: "All Games",
      daysLabel: "Days Played",
      activeLabel: "Playing",
      planLabel: "Plan to Play",
      updatesLabel: "Last Game Updates",
      icon: Gamepad2,
      accentText: "text-cyber-green",
      accentBg: "bg-cyber-green",
      borderShadowClass:
        "border-cyber-green/40 shadow-[2px_2px_0px_0px_var(--cyber-green)]",
      list: gamesList,
      daysValue: (gameHrs / 24).toFixed(1),
      extraMetrics: [{ label: "Hours Played", value: gameHrs }],
    },
    {
      key: "series",
      title: "Series Statistics",
      href: "/series",
      linkLabel: "All Series Stats",
      daysLabel: "Days Watched",
      activeLabel: "Watching",
      planLabel: "Plan to Watch",
      updatesLabel: "Last Series Updates",
      icon: Tv,
      accentText: "text-cyber-cyan",
      accentBg: "bg-cyber-cyan",
      borderShadowClass: "border-cyber-cyan/40 shadow-[2px_2px_0px_0px_var(--cyber-cyan)]",
      list: seriesList,
      daysValue: ((seriesEps * 55) / 1440).toFixed(1),
      extraMetrics: [{ label: "Episodes Watched", value: seriesEps }],
    },
    {
      key: "movie",
      title: "Movie Statistics",
      href: "/movies",
      linkLabel: "All Movie Stats",
      daysLabel: "Days Watched",
      activeLabel: "Watching",
      planLabel: "Plan to Watch",
      updatesLabel: "Last Movie Updates",
      icon: Film,
      accentText: "text-cyber-yellow",
      accentBg: "bg-cyber-yellow",
      borderShadowClass:
        "border-cyber-yellow/40 shadow-[2px_2px_0px_0px_var(--cyber-yellow)]",
      list: moviesList,
      daysValue: (moviesDurationMins / 1440).toFixed(1),
      extraMetrics: [{ label: "Movies Watched", value: completedMovies }],
    },
  ];

  return (
    <section className="w-full flex flex-col gap-12 md:gap-14 select-none font-mono">
      {rows.map((row) => {
        const Icon = row.icon;
        const active = countStatus(row.list, ["watching", "reading", "playing"]);
        const completed = countStatus(row.list, ["completed"]);
        const onHold = countStatus(row.list, ["on-hold", "on hold"]);
        const dropped = countStatus(row.list, ["dropped"]);
        const plan = countStatus(row.list, ["plan to watch", "plan to read", "plan to play"]);
        const recent = row.list.slice(0, 3);

        return (
          <div key={row.key} className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-2 border bg-black/60 px-3.5 py-1.5 rounded-md text-xs font-bold text-white ${row.borderShadowClass}`}
              >
                <Icon className={`w-4 h-4 ${row.accentText}`} />
                <span className="font-sans tracking-wider uppercase font-bold">{row.title}</span>
              </div>
              <Link
                href={row.href}
                className={`text-[10px] text-gray-500 font-semibold uppercase hover:${row.accentText} transition-colors flex items-center gap-0.5`}
              >
                {row.linkLabel}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-[#0b0b0e] border-2 border-white/5 p-6 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-3 flex justify-around lg:justify-start lg:gap-12 items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">
                    {row.daysLabel}
                  </span>
                  <span className={`text-3xl font-black ${row.accentText} leading-none`}>
                    {row.daysValue}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold mb-1">
                    Mean Score
                  </span>
                  <span className="text-3xl font-black text-white leading-none">
                    {calcMean(row.list)}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs border-y lg:border-y-0 lg:border-x border-white/5 py-4 lg:py-0 lg:px-6 content-center">
                <div className="flex items-center justify-between text-gray-400 leading-normal">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2ecc71] inline-block" />
                    {row.activeLabel}
                  </span>
                  <span className="font-bold text-white ml-2">{active}</span>
                </div>

                <div className="flex items-center justify-between text-gray-400 leading-normal">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#3498db] inline-block" />
                    Completed
                  </span>
                  <span className="font-bold text-white ml-2">{completed}</span>
                </div>

                <div className="flex items-center justify-between text-gray-400 leading-normal">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#f1c40f] inline-block" />
                    On-Hold
                  </span>
                  <span className="font-bold text-white ml-2">{onHold}</span>
                </div>

                <div className="flex items-center justify-between text-gray-400 leading-normal">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#e74c3c] inline-block" />
                    Dropped
                  </span>
                  <span className="font-bold text-white ml-2">{dropped}</span>
                </div>

                <div className="flex items-center justify-between text-gray-400 col-span-2 leading-normal">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#7f8c8d] inline-block" />
                    {row.planLabel}
                  </span>
                  <span className="font-bold text-white ml-2">{plan}</span>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col justify-center gap-2.5 text-xs">
                <div className="flex justify-between items-center text-gray-400 leading-normal">
                  <span>Total Entries</span>
                  <span className="font-bold text-white">{row.list.length}</span>
                </div>
                {row.extraMetrics.map((m) => (
                  <div key={m.label} className="flex justify-between items-center text-gray-400 leading-normal">
                    <span>{m.label}</span>
                    <span className="font-bold text-white">{m.value}</span>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4 flex flex-col gap-2.5">
                <span className="text-[10px] text-gray-500 tracking-wider uppercase font-bold">
                  {row.updatesLabel}
                </span>
                <div className="flex flex-col gap-3">
                  {recent.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center group">
                      <div className="w-8 h-11 relative overflow-hidden rounded bg-black flex-shrink-0 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getCoverImage(item.coverImage, item.type)}
                          alt={item.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER_IMAGES[item.type] || DEFAULT_COVER_IMAGES.anime;
                          }}
                        />
                      </div>
                      <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                        <span className="font-sans text-xs font-bold text-gray-200 group-hover:text-white transition-colors truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] text-gray-500 truncate">
                          {item.status} · {item.progress} · Scored {item.rating.split("/")[0]}
                        </span>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${row.accentBg} transition-all duration-500`}
                            style={{ width: `${getProgressPercent(item)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
