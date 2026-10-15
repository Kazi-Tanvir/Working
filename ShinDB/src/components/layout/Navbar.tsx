"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  Tv, 
  BookOpen, 
  Gamepad2, 
  Film, 
  Terminal,
  Menu,
  X
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Track scroll position for backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/", label: "Dashboard", icon: <Activity className="w-4 h-4" /> },
    { href: "/anime", label: "Anime", icon: <Tv className="w-4 h-4" /> },
    { href: "/manga", label: "Manga", icon: <BookOpen className="w-4 h-4" /> },
    { href: "/games", label: "Games", icon: <Gamepad2 className="w-4 h-4" /> },
    { href: "/movies", label: "Movies", icon: <Film className="w-4 h-4" /> },
    { href: "/series", label: "Series", icon: <Tv className="w-4 h-4" /> },
  ];

  return (
    <nav className={`w-full border-b-2 border-white sticky top-0 z-40 select-none font-mono transition-all duration-300 ${
      scrolled ? "navbar-scrolled" : "bg-black"
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
        {/* Mobile Header containing Branding and Hamburger */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Terminal Logo Branding */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-cyber-purple border border-white px-2 py-1 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#ffffff] group-hover:shadow-[3px_3px_0px_0px_var(--cyber-cyan)] transition-all">
              <Terminal className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="font-extrabold text-sm tracking-widest text-white uppercase group-hover:text-cyber-cyan transition-colors">
              [ShinDB::MVP]
            </span>
          </Link>

          {/* Cyber Hamburger Menu Icon */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-1.5 border border-white/20 hover:border-white text-gray-400 hover:text-white transition-all cursor-pointer bg-black"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Categories Router */}
        <div className={`${isOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-2.5 md:gap-3 w-full md:w-auto`}>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`relative flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 md:py-1.5 border transition-all duration-200 ${
                  isActive
                    ? "bg-white text-black border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]"
                    : "bg-transparent text-gray-400 border-transparent hover:border-white hover:text-white hover:bg-white/5"
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyber-purple rounded-full hidden md:block" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
