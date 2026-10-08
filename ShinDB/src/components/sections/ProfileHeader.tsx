import React from "react";
import { 
  Tv, 
  BookOpen, 
  Gamepad2, 
  Film, 
  User, 
  Terminal, 
  CheckSquare, 
  PlayCircle, 
  Clock 
} from "lucide-react";
import { MediaItem } from "@/components/common/MediaCard";

interface ProfileHeaderProps {
  animeList: MediaItem[];
  mangaList: MediaItem[];
  gamesList: MediaItem[];
  moviesList: MediaItem[];
  seriesList: MediaItem[];
}

export default function ProfileHeader({
  animeList,
  mangaList,
  gamesList,
  moviesList,
  seriesList,
}: ProfileHeaderProps) {
  // Aggregate statistics dynamically
  const allMedia = [...animeList, ...mangaList, ...gamesList, ...moviesList, ...seriesList];
  
  const totalCount = allMedia.length;
  const activeCount = allMedia.filter(m => 
    m.status === "Watching" || m.status === "Reading" || m.status === "Playing"
  ).length;
  const completedCount = allMedia.filter(m => m.status === "Completed").length;
  const planToWatchCount = allMedia.filter(m => 
    m.status === "Plan to Watch" || m.status === "Plan to Read" || m.status === "Plan to Play"
  ).length;

  return (
    <section className="w-full select-none font-mono mb-8 md:mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* User Card Frame */}
        <div className="lg:col-span-4 bg-cyber-card border-2 border-white p-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_var(--cyber-purple)] transition-all flex flex-col items-center text-center justify-between">
          <div className="w-full flex flex-col items-center">
            {/* User Avatar Setup */}
            <div className="relative w-28 h-28 aspect-square overflow-hidden border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80"
                alt="User Avatar"
                className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-cyber-purple/10 pointer-events-none" />
            </div>

            <div className="bg-cyber-purple border border-white text-white text-[10px] font-bold px-2 py-0.5 mb-2 uppercase tracking-widest">
              [SYS_OPERATOR::ELITE]
            </div>

            <h2 className="font-sans font-black text-xl text-white tracking-wide uppercase mb-1">
              SENPAI_09
            </h2>
            <span className="text-[10px] text-gray-500 mb-3 block">IP: 127.0.0.1 // DEV_NODE</span>

            <p className="text-xs text-gray-400 leading-relaxed border-t border-dashed border-gray-700 pt-3">
              ARCHIVING MEDIA EPHEMERA ACROSS MULTIPLE TIMELINES. DESIGN INSPIRED BY ADVANCED OBSIDIAN SYSTEMS.
            </p>
          </div>

          <div className="w-full bg-black border border-gray-800 p-2 mt-4 text-[10px] text-left text-gray-500">
            <span className="flex items-center gap-1.5 text-cyber-cyan font-bold">
              <Terminal className="w-3.5 h-3.5" />
              STATUS: SYNC_COMPLETE // OK
            </span>
          </div>
        </div>

        {/* Dynamic Aggregated Statistics Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* ANIME COUNTER */}
          <div className="bg-cyber-card border-2 border-cyber-purple p-4 shadow-[4px_4px_0px_0px_var(--cyber-purple)] hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 text-[10px] font-bold tracking-wider">TOTAL ANIME</span>
              <Tv className="w-5 h-5 text-cyber-purple" />
            </div>
            <div>
              <span className="text-3xl font-extrabold text-white block leading-none mb-1">
                {animeList.length}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">[RECORDS_LOGGED]</span>
            </div>
          </div>

          {/* MANGA COUNTER */}
          <div className="bg-cyber-card border-2 border-cyber-orange p-4 shadow-[4px_4px_0px_0px_var(--cyber-orange)] hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 text-[10px] font-bold tracking-wider">TOTAL MANGA</span>
              <BookOpen className="w-5 h-5 text-cyber-orange" />
            </div>
            <div>
              <span className="text-3xl font-extrabold text-white block leading-none mb-1">
                {mangaList.length}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">[RECORDS_LOGGED]</span>
            </div>
          </div>

          {/* GAMES COUNTER */}
          <div className="bg-cyber-card border-2 border-cyber-green p-4 shadow-[4px_4px_0px_0px_var(--cyber-green)] hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 text-[10px] font-bold tracking-wider">TOTAL GAMES</span>
              <Gamepad2 className="w-5 h-5 text-cyber-green" />
            </div>
            <div>
              <span className="text-3xl font-extrabold text-white block leading-none mb-1">
                {gamesList.length}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">[RECORDS_LOGGED]</span>
            </div>
          </div>

          {/* MOVIES / SERIES COUNTER */}
          <div className="bg-cyber-card border-2 border-cyber-cyan p-4 shadow-[4px_4px_0px_0px_var(--cyber-cyan)] hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 text-[10px] font-bold tracking-wider">MOVIES+SERIES</span>
              <Film className="w-5 h-5 text-cyber-cyan" />
            </div>
            <div>
              <span className="text-3xl font-extrabold text-white block leading-none mb-1">
                {moviesList.length + seriesList.length}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">[RECORDS_LOGGED]</span>
            </div>
          </div>

          {/* TOTAL LOGGED PROCESSES */}
          <div className="col-span-2 bg-black border-2 border-white p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <div className="flex items-center gap-3">
              <div className="bg-white text-black p-2 border border-white">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] font-bold tracking-wider">TOTAL TRACKED</span>
                <span className="text-2xl font-black text-white leading-none mt-1">{totalCount} ITEMS</span>
              </div>
            </div>
            <div className="text-[9px] text-right text-gray-500 leading-normal">
              COMPILATION RATE<br />
              <span className="text-cyber-green font-bold">100% SUCCESS</span>
            </div>
          </div>

          {/* STATE SPECIFIC BREAKDOWNS */}
          <div className="col-span-2 bg-cyber-card border-2 border-white p-4 grid grid-cols-3 gap-2 text-center shadow-[4px_4px_0px_0px_#ffffff]">
            <div className="flex flex-col items-center justify-center">
              <PlayCircle className="w-4 h-4 text-cyber-cyan mb-1" />
              <span className="text-lg font-black text-white leading-none">{activeCount}</span>
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1">ACTIVE</span>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-gray-800">
              <CheckSquare className="w-4 h-4 text-cyber-green mb-1" />
              <span className="text-lg font-black text-white leading-none">{completedCount}</span>
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1">DONE</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Clock className="w-4 h-4 text-cyber-yellow mb-1" />
              <span className="text-lg font-black text-white leading-none">{planToWatchCount}</span>
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1">BACKLOG</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
