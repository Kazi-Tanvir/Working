"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Users,
  Database,
  ShieldAlert,
  ArrowLeft,
  Terminal,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

interface AdminSidebarProps {
  adminUser: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    customBadge: string | null;
  };
}

export default function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    {
      href: "/admin",
      label: "Dashboard",
      sub: "Telemetry & Overview",
      icon: <Activity className="w-4 h-4 text-cyber-cyan" />,
      exact: true,
    },
    {
      href: "/admin/users",
      label: "Users Matrix",
      sub: "Accounts & Privileges",
      icon: <Users className="w-4 h-4 text-cyber-purple" />,
      exact: false,
    },
    {
      href: "/admin/media",
      label: "Media Catalog",
      sub: "Metadata & Merge",
      icon: <Database className="w-4 h-4 text-cyber-yellow" />,
      exact: false,
    },
    {
      href: "/admin/audit-log",
      label: "Audit Logs",
      sub: "Security Trail",
      icon: <ShieldAlert className="w-4 h-4 text-cyber-green" />,
      exact: false,
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between p-4 bg-black border-b-2 border-white font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-red animate-pulse" />
          <span className="text-xs font-black uppercase text-white tracking-widest">
            ADMIN // OVERRIDE
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 border border-white text-white hover:bg-white/10"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`${
          mobileOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-black border-b-2 md:border-b-0 md:border-r-2 border-white shrink-0 font-mono`}
      >
        <div className="p-4 border-b border-white/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyber-red text-white border border-white shadow-[2px_2px_0px_0px_#ffffff]">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-cyber-red tracking-wider">
                  SYS_SECURITY::LEVEL_04
                </div>
                <div className="text-xs font-black uppercase text-white tracking-widest">
                  ADMIN CONSOLE
                </div>
              </div>
            </div>
          </div>

          {/* Current Admin Badge */}
          <div className="mt-2 p-2 border border-white/20 bg-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 border border-white bg-cyber-purple/30 flex items-center justify-center overflow-hidden shrink-0">
              {adminUser.avatarUrl && adminUser.avatarUrl.trim() !== "" ? (
                <img
                  src={adminUser.avatarUrl}
                  alt={adminUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-black text-white">
                  {adminUser.username.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-black text-white truncate">
                @{adminUser.username}
              </div>
              <div className="text-[10px] text-cyber-cyan truncate flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3 h-3 text-cyber-cyan inline" />
                ADMINISTRATOR
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {links.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-start gap-3 p-2.5 border transition-all ${
                  isActive
                    ? "bg-white text-black border-white shadow-[3px_3px_0px_0px_#ffffff] font-bold"
                    : "border-transparent text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5"
                }`}
              >
                <div className="mt-0.5">{link.icon}</div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">
                    {link.label}
                  </div>
                  <div
                    className={`text-[10px] tracking-tight ${
                      isActive ? "text-black/70" : "text-gray-500"
                    }`}
                  >
                    {link.sub}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Exit back to app */}
        <div className="p-3 border-t border-white/10 mt-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white border border-white/20 hover:border-white p-2.5 transition-all uppercase tracking-wider bg-black"
          >
            <ArrowLeft className="w-4 h-4 text-cyber-cyan" />
            <span>Return to ShinDB</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
