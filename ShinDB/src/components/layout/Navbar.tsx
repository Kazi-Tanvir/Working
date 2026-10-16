"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Activity,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Terminal,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Users,
  Settings as SettingsIcon,
  ShieldAlert,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isSignedIn, user: clerkUser } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Poll or check pending friend requests if user is logged in
  useEffect(() => {
    if (!user && !isSignedIn) return;

    let isMounted = true;
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/users/friends/requests");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPendingRequestsCount(data.pendingCount || 0);
          }
        }
      } catch {
        // silent fail
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // 30s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, isSignedIn]);

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
    {
      href: "/friends",
      label: "Friends",
      icon: <Users className="w-4 h-4" />,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
    },
  ];

  return (
    <nav className={`w-full border-b-2 border-white sticky top-0 z-40 select-none font-mono transition-all duration-300 ${scrolled ? "navbar-scrolled" : "bg-black"
      }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-3.5">
        {/* Mobile Header containing Branding, Status, and Hamburger */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Terminal Logo Branding */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-cyber-purple border border-white px-2 py-1 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#ffffff] group-hover:shadow-[3px_3px_0px_0px_var(--cyber-cyan)] transition-all">
              <Terminal className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="font-extrabold text-sm tracking-widest text-white uppercase group-hover:text-cyber-cyan transition-colors">
              ShinDB
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
        <div className={`${isOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-2 md:gap-2.5 w-full md:w-auto`}>
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`relative flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 border transition-all duration-200 ${isActive
                    ? "bg-white text-black border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]"
                    : "bg-transparent text-gray-400 border-transparent hover:border-white hover:text-white hover:bg-white/5"
                  }`}
              >
                {link.icon}
                <span>{link.label}</span>
                {link.badge ? (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-cyber-red text-white font-extrabold border border-white animate-pulse">
                    {link.badge}
                  </span>
                ) : null}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyber-purple rounded-full hidden md:block" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Session Bar */}
        <div className={`${isOpen ? "flex" : "hidden"} md:flex items-center gap-2.5 border-t md:border-t-0 border-white/10 pt-3 md:pt-0`}>
          {isSignedIn ? (
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              {/* Profile Link */}
              <Link
                href="/profile"
                className={`flex items-center gap-2 border px-2.5 py-1 text-xs transition-all ${
                  pathname === "/profile"
                    ? "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan"
                    : "border-white/20 bg-white/5 hover:border-white text-gray-300"
                }`}
                title="View Profile"
              >
                <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-white">
                  @{clerkUser?.username || clerkUser?.firstName || user?.username || "PROFILE"}
                </span>
              </Link>

              {/* Admin Link (Conditional) */}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`p-1.5 border transition-all ${
                    pathname?.startsWith("/admin")
                      ? "border-cyber-red bg-cyber-red/20 text-white"
                      : "border-cyber-red/40 hover:border-cyber-red text-cyber-red bg-cyber-red/5"
                  }`}
                  title="Admin Console"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-cyber-red" />
                </Link>
              )}

              {/* Settings Link */}
              <Link
                href="/settings"
                className={`p-1.5 border transition-all ${
                  pathname === "/settings"
                    ? "border-cyber-purple bg-cyber-purple/20 text-white"
                    : "border-white/20 hover:border-white text-gray-400 hover:text-white bg-white/5"
                }`}
                title="Settings"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
              </Link>

              {/* Clerk User Button */}
              <div className="flex items-center justify-center">
                <UserButton
                  appearance={{
                    elements: {
                      rootBox: "flex items-center justify-center h-7 w-7",
                      userButtonTrigger:
                        "flex items-center justify-center h-7 w-7 rounded-none p-0 border border-white shadow-[2px_2px_0px_0px_#ffffff] hover:shadow-[3px_3px_0px_0px_var(--cyber-cyan)] transition-all bg-black focus:outline-none",
                      userButtonAvatarBox: "h-full w-full rounded-none flex items-center justify-center",
                      userButtonAvatarImage: "rounded-none h-full w-full object-cover",
                      avatarBox: "rounded-none h-full w-full",
                    },
                  }}
                />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              {/* Profile Link */}
              <Link
                href="/profile"
                className={`flex items-center gap-2 border px-2.5 py-1 text-xs transition-all ${
                  pathname === "/profile"
                    ? "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan"
                    : "border-white/20 bg-white/5 hover:border-white text-gray-300"
                }`}
                title="View Profile"
              >
                <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-white">
                  @{user.username}
                </span>
              </Link>

              {/* Admin Link (Conditional) */}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={`p-1.5 border transition-all ${
                    pathname?.startsWith("/admin")
                      ? "border-cyber-red bg-cyber-red/20 text-white"
                      : "border-cyber-red/40 hover:border-cyber-red text-cyber-red bg-cyber-red/5"
                  }`}
                  title="Admin Console"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-cyber-red" />
                </Link>
              )}

              {/* Settings Link */}
              <Link
                href="/settings"
                className={`p-1.5 border transition-all ${
                  pathname === "/settings"
                    ? "border-cyber-purple bg-cyber-purple/20 text-white"
                    : "border-white/20 hover:border-white text-gray-400 hover:text-white bg-white/5"
                }`}
                title="System Settings"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 border border-white/30 hover:border-red-500 hover:bg-red-500/10 hover:text-red-400 text-gray-400 text-xs px-2.5 py-1 uppercase tracking-wider transition-all cursor-pointer"
                title="Disconnect from session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Link
                href="/login"
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 border border-white/30 hover:border-white hover:text-white text-gray-300 px-3 py-1 text-xs uppercase tracking-wider transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
              <Link
                href="/register"
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-white text-black font-extrabold hover:bg-cyber-purple hover:text-white border border-white px-3 py-1 text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]"
              >
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
