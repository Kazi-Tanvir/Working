import React from "react";
import { Terminal, Shield } from "lucide-react";
import ProfileHeader from "@/components/sections/ProfileHeader";
import CurrentlyConsuming from "@/components/sections/CurrentlyConsuming";
import RecentlyCompleted from "@/components/sections/RecentlyCompleted";
import SearchBar from "@/components/common/SearchBar";
import Badge from "@/components/common/Badge";
import CategoryStats from "@/components/sections/CategoryStats";
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
    <div className="w-full flex flex-col gap-8 md:gap-10">
      
      {/* Retro Welcome Terminal Header */}
      <header className="border-2 border-white bg-black p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] select-none font-mono">
        <div className="flex items-center gap-3">
          <div className="bg-cyber-purple border border-white text-white p-2">
            <Shield className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-black text-base md:text-lg tracking-wider text-white uppercase leading-none">
              SYS_OPERATOR::CENTRAL_CONSOLE
            </h1>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mt-1.5 block">
              Obsidian Core Tracking Environment // V1.0.0 Stable
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase hidden md:inline">
            NODE_STATE: SECURE
          </span>
          <Badge color="purple" className="!border-white/40 text-[10px]">
            <span className="flex items-center gap-1.5 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              SESSION: ACTIVE_DEV
            </span>
          </Badge>
        </div>
      </header>

      {/* Prominent Search Bar Section */}
      <section className="flex justify-center w-full">
        <SearchBar />
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
