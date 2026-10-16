import React from "react";
import Link from "next/link";
import { Terminal, ArrowLeft, Tv, BookOpen, Gamepad2, Film, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center py-12 px-4 select-none font-mono">
      <div className="w-full max-w-2xl bg-[#09090b] border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] p-6 sm:p-10 flex flex-col gap-6 text-white animate-page-in">
        
        {/* Top Terminal Ribbon */}
        <div className="flex items-center justify-between border-b border-white/20 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-red animate-pulse" />
            <span className="text-cyber-red font-bold uppercase tracking-widest">
              [SYS_ERROR: 404 // ADDRESS_NOT_FOUND]
            </span>
          </div>
          <span className="text-gray-500 text-[10px] hidden sm:inline">
            BUS_OFFSET: 0xDEADBEEF
          </span>
        </div>

        {/* ASCII Glitch Banner */}
        <div className="bg-black border border-white/10 p-4 text-center overflow-x-auto text-[11px] sm:text-xs text-cyber-purple font-mono leading-tight">
          <pre className="inline-block text-left text-cyber-cyan font-bold">
{`  ██████╗  ██████╗  ██╗  ██╗
  ██╔══██╗██╔═████╗ ██║  ██║
  ██████╔╝██║██╔██║ ███████║
  ██╔═══╝ ████╔╝██║ ╚════██║
  ██║     ╚██████╔╝      ██║
  ╚═╝      ╚═════╝       ╚═╝`}
          </pre>
          <div className="mt-2 text-gray-400 text-[11px] uppercase tracking-wider">
            &gt; ROUTING_TABLE_LOOKUP_FAILED: SPECIFIED_SECTOR_DOES_NOT_EXIST
          </div>
        </div>

        {/* Main Message */}
        <div className="flex flex-col gap-2">
          <h1 className="font-sans font-black text-xl sm:text-2xl uppercase tracking-wider text-white">
            Lost in Cyberspace // Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            The media record, profile dossier, or routing pathway you requested does not exist in ShinDB archives or has been purged.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/"
            className="flex-1 bg-cyber-purple hover:bg-white text-white hover:text-black font-extrabold text-xs py-3 px-4 border-2 border-white tracking-widest uppercase transition-all shadow-[3px_3px_0px_0px_#ffffff] text-center flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO DASHBOARD</span>
          </Link>

          <Link
            href="/anime"
            className="bg-black hover:bg-white/10 text-white font-bold text-xs py-3 px-4 border border-white/40 tracking-widest uppercase transition-all text-center flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>BROWSE ARCHIVES</span>
          </Link>
        </div>

        {/* Quick Directory Links */}
        <div className="border-t border-dashed border-white/10 pt-4 flex flex-col gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            AVAILABLE_MEMORY_REGIONS:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Link
              href="/anime"
              className="border border-white/20 p-2 hover:border-cyber-purple hover:text-cyber-purple transition-all flex items-center gap-1.5 bg-black"
            >
              <Tv className="w-3.5 h-3.5 text-cyber-purple" />
              <span>/anime</span>
            </Link>
            <Link
              href="/manga"
              className="border border-white/20 p-2 hover:border-cyber-orange hover:text-cyber-orange transition-all flex items-center gap-1.5 bg-black"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyber-orange" />
              <span>/manga</span>
            </Link>
            <Link
              href="/games"
              className="border border-white/20 p-2 hover:border-cyber-green hover:text-cyber-green transition-all flex items-center gap-1.5 bg-black"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-cyber-green" />
              <span>/games</span>
            </Link>
            <Link
              href="/movies"
              className="border border-white/20 p-2 hover:border-cyber-yellow hover:text-cyber-yellow transition-all flex items-center gap-1.5 bg-black"
            >
              <Film className="w-3.5 h-3.5 text-cyber-yellow" />
              <span>/movies</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
