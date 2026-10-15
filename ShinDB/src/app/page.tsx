import React from "react";
import ProfileHeader from "@/components/sections/ProfileHeader";
import CurrentlyConsuming from "@/components/sections/CurrentlyConsuming";
import RecentlyCompleted from "@/components/sections/RecentlyCompleted";
import CategoryStats from "@/components/sections/CategoryStats";
import SearchBar from "@/components/common/SearchBar";
import LandingHero from "@/components/sections/LandingHero";
import { getAllMediaGrouped } from "@/lib/media";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();

  // If unauthenticated visitor, display Cyber-Neobrutalist Landing Page
  if (!sessionUser) {
    const { prisma } = await import("@/lib/prisma");
    const [animeCount, mangaCount, gameCount, movieCount, seriesCount] = await Promise.all([
      prisma.media.count({ where: { type: "anime" } }),
      prisma.media.count({ where: { type: "manga" } }),
      prisma.media.count({ where: { type: "game" } }),
      prisma.media.count({ where: { type: "movie" } }),
      prisma.media.count({ where: { type: "series" } }),
    ]);
    const totalCount = animeCount + mangaCount + gameCount + movieCount + seriesCount;

    return (
      <LandingHero
        totalCount={totalCount}
        animeCount={animeCount}
        mangaCount={mangaCount}
        gameCount={gameCount}
        movieCount={movieCount}
        seriesCount={seriesCount}
      />
    );
  }

  // Load authenticated user's strictly scoped personal library
  const { animeList, mangaList, gamesList, moviesList, seriesList } = await getAllMediaGrouped(
    sessionUser.id
  );

  const allMedia = [...animeList, ...mangaList, ...gamesList, ...moviesList, ...seriesList];

  // Active items for personal console
  const activeItems = allMedia
    .filter((item) => ["Watching", "Reading", "Playing"].includes(item.status))
    .slice(0, 16);

  const completedItems = allMedia.filter((item) => item.status === "Completed");

  return (
    <div className="w-full flex flex-col gap-10 md:gap-14">
      {/* Real-time Multi-Database Search Bar */}
      <section className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 max-w-2xl">
          <SearchBar />
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-gray-500 self-end md:self-center">
          <span className="hidden lg:inline text-[11px] uppercase tracking-wider text-gray-400">
            Search Gateway
          </span>
          <span className="border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] text-gray-300">
            [AniList • RAWG • TVmaze]
          </span>
        </div>
      </section>

      {/* Profile aggregates summary header */}
      <ProfileHeader
        animeList={animeList}
        mangaList={mangaList}
        gamesList={gamesList}
        moviesList={moviesList}
        seriesList={seriesList}
        user={sessionUser}
      />

      {/* Stacked Advanced Media Category Statistics Widgets */}
      <CategoryStats
        animeList={animeList}
        mangaList={mangaList}
        gamesList={gamesList}
        moviesList={moviesList}
        seriesList={seriesList}
      />

      {/* Currently Consuming Grid (Active processes) */}
      <CurrentlyConsuming activeItems={activeItems} />

      {/* Recently Completed row layout (Sealed archives) */}
      <RecentlyCompleted completedItems={completedItems} />
    </div>
  );
}
