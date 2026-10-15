import React from "react";
import ProfileHeader from "@/components/sections/ProfileHeader";
import CurrentlyConsuming from "@/components/sections/CurrentlyConsuming";
import RecentlyCompleted from "@/components/sections/RecentlyCompleted";
import CategoryStats from "@/components/sections/CategoryStats";
import SearchBar from "@/components/common/SearchBar";
import { getAllMediaGrouped } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { animeList, mangaList, gamesList, moviesList, seriesList } = await getAllMediaGrouped();

  // Aggregate active and completed items across all classes
  const allMedia = [...animeList, ...mangaList, ...gamesList, ...moviesList, ...seriesList];
  
  const activeItems = allMedia
    .filter((item) => ["Watching", "Reading", "Playing"].includes(item.status))
    .slice(0, 16); // Cap to 16 most recently updated active items on Dashboard
  
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
