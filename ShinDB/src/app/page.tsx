import React from "react";
import Link from "next/link";
import ProfileHeader from "@/components/sections/ProfileHeader";
import CurrentlyConsuming from "@/components/sections/CurrentlyConsuming";
import RecentlyCompleted from "@/components/sections/RecentlyCompleted";
import CategoryStats from "@/components/sections/CategoryStats";
import SearchBar from "@/components/common/SearchBar";
import { getAllMediaGrouped } from "@/lib/media";
import { getSessionUser } from "@/lib/auth";
import { ACTIVE_SEARCH_GATEWAYS } from "@/utils/apiHelpers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();

  // Load user's personal library if logged in, otherwise empty library
  const { animeList, mangaList, gamesList, moviesList, seriesList } = await getAllMediaGrouped(
    sessionUser?.id
  );

  const allMedia = [...animeList, ...mangaList, ...gamesList, ...moviesList, ...seriesList];

  // Active items for personal console
  const activeItems = allMedia
    .filter((item) => ["Watching", "Reading", "Playing"].includes(item.status))
    .slice(0, 16);

  const completedItems = allMedia.filter((item) => item.status === "Completed");

  return (
    <div className="w-full flex flex-col gap-10 md:gap-14">
      {/* Real-time Multi-Database Search Bar (Right-aligned) */}
      <section className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-xs text-gray-500 self-start md:self-center order-2 md:order-1">
          <span className="hidden lg:inline text-[11px] uppercase tracking-wider text-gray-400">
            APIs
          </span>
          <span className="border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] text-gray-300">
            [{ACTIVE_SEARCH_GATEWAYS.join(" • ")}]
          </span>
        </div>
        <div className="flex-1 max-w-2xl md:ml-auto order-1 md:order-2">
          <SearchBar />
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

      {/* Empty Library Onboarding Banner */}
      {allMedia.length === 0 && (
        <section className="w-full border-2 border-dashed border-cyber-purple/50 bg-[#09090b]/80 p-8 md:p-12 text-center flex flex-col items-center justify-center gap-4 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.3)] animate-section-in font-mono">
          <div className="bg-cyber-purple/20 text-cyber-purple border border-cyber-purple px-3 py-1 text-xs font-bold uppercase tracking-widest">
            [EMPTY LIBRARY]
          </div>
          <h2 className="font-sans font-black text-xl md:text-2xl text-white uppercase tracking-wider">
            Ready // No Media Tracked Yet
          </h2>
          <p className="text-xs md:text-sm text-gray-400 max-w-xl leading-relaxed">
            Your personal media database is ready. Use the search bar above to log Anime from AniList, Games from RAWG, or Movies &amp; TV from TVmaze.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs">
            <Link
              href="/anime"
              className="neo-btn-primary px-4 py-2 border border-white text-white font-bold tracking-wider uppercase transition-all shadow-[2px_2px_0px_0px_#ffffff]"
            >
              Browse Anime
            </Link>
            <Link
              href="/games"
              className="neo-btn-green px-4 py-2 border border-black text-black font-bold tracking-wider uppercase transition-all shadow-[2px_2px_0px_0px_#000000]"
            >
              Browse Games
            </Link>
          </div>
        </section>
      )}

      {/* Currently Consuming Grid (Active processes) */}
      <CurrentlyConsuming activeItems={activeItems} />

      {/* Recently Completed row layout (Sealed archives) */}
      <RecentlyCompleted completedItems={completedItems} />
    </div>
  );
}
