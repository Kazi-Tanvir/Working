"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@clerk/nextjs";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Shield,
  Key,
  Download,
  Check,
  AlertTriangle,
  Sparkles,
  Terminal,
  Loader2,
  Lock,
  RefreshCw,
  FileInput,
} from "lucide-react";
import ImportTab from "@/components/settings/ImportTab";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80",
];

const BADGE_PRESETS = [
  "[SYS_OPERATOR::ELITE]",
  "[SYS_OPERATOR::RECRUIT]",
  "[NEO_ARCHIVIST]",
  "[CYBER_SENTINEL]",
  "[GRID_NAVIGATOR]",
  "[CHRONO_TRACKER]",
];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const isAuthenticated = !!user || isSignedIn;

  const [activeTab, setActiveTab] = useState<"profile" | "account" | "data" | "import">("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Form State
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [customBadge, setCustomBadge] = useState("");

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (!isAuthenticated && isLoaded) {
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          setDisplayName(u.displayName || "");
          setBio(u.bio || "");
          setAvatarUrl(u.avatarUrl || "");
          setCustomBadge(u.customBadge || "[SYS_OPERATOR::RECRUIT]");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, isLoaded]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          customBadge: customBadge.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("PROFILE CONFIGURATION SYNCHRONIZED SUCCESSFULLY");
        await refreshUser();
      } else {
        showToast(`ERROR: ${data.error || "Failed to update profile"}`);
      }
    } catch {
      showToast("ERROR: Network transmission failure");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("ERROR: New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      showToast("ERROR: New password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("SECURITY CIPHER UPDATED SUCCESSFULLY");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(`ERROR: ${data.error || "Password mutation rejected"}`);
      }
    } catch {
      showToast("ERROR: Network failure changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isAuthenticated && isLoaded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-mono">
        <div className="cyber-card p-8 border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] bg-black">
          <Terminal className="w-12 h-12 text-cyber-yellow mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black uppercase text-white mb-2">
            SIGN IN REQUIRED // SETTINGS LOCKED
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Authentication is required to adjust profile settings.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-cyber-purple text-white font-extrabold uppercase text-xs border border-white shadow-[3px_3px_0px_0px_#ffffff]"
            >
              [SIGN IN]
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono select-none">
        <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-400 uppercase tracking-widest">
          ACCESSING SYSTEM CONFIGURATION MODULES...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 font-mono select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white border-2 border-cyber-cyan px-4 py-2.5 shadow-[4px_4px_0px_0px_var(--cyber-cyan)] flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="cyber-card p-6 border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] bg-black mb-8 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-[10px] tracking-widest text-cyber-green uppercase font-bold">
            CONFIGURATION_MODULE::ACTIVE
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-cyber-purple" />
          System Settings
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Customize your profile, security settings, and full data archive exports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full p-3 text-left font-extrabold text-xs uppercase border transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "profile"
                ? "bg-white text-black border-white shadow-[3px_3px_0px_0px_#ffffff]"
                : "bg-black text-gray-400 border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>01 // PROFILE</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`w-full p-3 text-left font-extrabold text-xs uppercase border transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "account"
                ? "bg-cyber-purple text-white border-white shadow-[3px_3px_0px_0px_#ffffff]"
                : "bg-black text-gray-400 border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>02 // SECURITY</span>
          </button>

          <button
            onClick={() => setActiveTab("data")}
            className={`w-full p-3 text-left font-extrabold text-xs uppercase border transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "data"
                ? "bg-cyber-cyan text-black border-white shadow-[3px_3px_0px_0px_#ffffff]"
                : "bg-black text-gray-400 border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>03 // DATA ARCHIVE</span>
          </button>

          <button
            onClick={() => setActiveTab("import")}
            className={`w-full p-3 text-left font-extrabold text-xs uppercase border transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "import"
                ? "bg-cyber-yellow text-black border-white shadow-[3px_3px_0px_0px_#ffffff]"
                : "bg-black text-gray-400 border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <FileInput className="w-4 h-4" />
            <span>04 // IMPORT DATA</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <div className="cyber-card p-6 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black">
              <h2 className="text-sm font-black uppercase text-white tracking-wider mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
                <UserIcon className="w-4 h-4 text-cyber-purple" />
                PROFILE SPECIFICATIONS
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Preview & URL */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                    AVATAR IMAGE
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3">
                    <div className="w-16 h-16 border-2 border-white bg-cyber-purple/20 flex items-center justify-center font-black text-2xl text-white overflow-hidden shadow-[3px_3px_0px_0px_#ffffff] shrink-0">
                      {avatarUrl && avatarUrl.trim() !== "" ? (
                        <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        (user?.username || "OP").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono focus:outline-none focus:border-cyber-cyan"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        Enter any direct WebP/PNG image URL or choose a preset below.
                      </span>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 uppercase">PRESETS:</span>
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className="w-8 h-8 border border-white/40 hover:border-white overflow-hidden cursor-pointer shadow-[1px_1px_0px_0px_#ffffff]"
                      >
                        <img src={preset} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                    DISPLAY NAME
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono focus:outline-none focus:border-cyber-cyan"
                  />
                </div>

                {/* Custom Badge */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                    PROFILE BADGE
                  </label>
                  <input
                    type="text"
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    maxLength={50}
                    className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono focus:outline-none focus:border-cyber-cyan mb-2"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {BADGE_PRESETS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setCustomBadge(b)}
                        className={`text-[9px] px-2 py-0.5 border cursor-pointer ${
                          customBadge === b
                            ? "bg-white text-black border-white font-extrabold"
                            : "bg-white/5 text-gray-400 border-white/20 hover:border-white hover:text-white"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio with Char Counter */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase text-gray-300">
                      BIOGRAPHY
                    </label>
                    <span className="text-[10px] text-gray-500">{bio.length} / 500</span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Enter your personal bio or tracking philosophy..."
                    className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono focus:outline-none focus:border-cyber-cyan resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-white text-black font-extrabold text-xs uppercase border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-cyber-cyan transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>[SAVE PROFILE]</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ACCOUNT & SECURITY */}
          {activeTab === "account" && (
            <div className="space-y-6">
              {/* Account Overview */}
              <div className="cyber-card p-6 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black">
                <h2 className="text-sm font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                  <Shield className="w-4 h-4 text-cyber-green" />
                  ACCOUNT IDENTIFIERS (READ-ONLY)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="border border-white/20 p-3 bg-white/5">
                    <span className="block text-[10px] text-gray-400 uppercase">USERNAME (IMMUTABLE)</span>
                    <span className="font-extrabold text-white">@{user?.username || clerkUser?.username}</span>
                  </div>

                  <div className="border border-white/20 p-3 bg-white/5">
                    <span className="block text-[10px] text-gray-400 uppercase">EMAIL (PRIMARY)</span>
                    <span className="font-extrabold text-white">
                      {user?.email || clerkUser?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>

                  <div className="border border-white/20 p-3 bg-white/5">
                    <span className="block text-[10px] text-gray-400 uppercase">AUTHENTICATION ENGINE</span>
                    <span className="font-extrabold text-cyber-cyan uppercase">
                      [{user?.authProvider || (isSignedIn ? "CLERK_FEDERATED" : "LOCAL_BCRYPT")}]
                    </span>
                  </div>

                  <div className="border border-white/20 p-3 bg-white/5">
                    <span className="block text-[10px] text-gray-400 uppercase">ENCRYPTION PROTOCOL</span>
                    <span className="font-extrabold text-cyber-green">AES_256_GCM // ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Password Change Form (Local Email users) */}
              <div className="cyber-card p-6 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black">
                <h2 className="text-sm font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                  <Key className="w-4 h-4 text-cyber-yellow" />
                  UPDATE PASSWORD
                </h2>

                {user?.authProvider === "google" || user?.authProvider === "discord" || isSignedIn ? (
                  <div className="p-4 border border-cyber-yellow/40 bg-cyber-yellow/5 text-xs text-cyber-yellow">
                    Signed in via federated OAuth / Clerk. Password management is handled through your identity provider.
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                        CURRENT PASSWORD
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono focus:outline-none focus:border-cyber-yellow"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                        NEW PASSWORD (MIN 8 CHARS)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono focus:outline-none focus:border-cyber-yellow"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                        CONFIRM NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono focus:outline-none focus:border-cyber-yellow"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-6 py-2.5 bg-cyber-yellow text-black font-extrabold text-xs uppercase border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>[UPDATE PASSWORD]</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DATA EXPORT */}
          {activeTab === "data" && (
            <div className="cyber-card p-6 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black space-y-6">
              <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                <Download className="w-4 h-4 text-cyber-cyan" />
                OFFLINE DATABASE EXPORT
              </h2>

              <p className="text-xs text-gray-300">
                Download a complete JSON export of all your personal media tracking entries, structured episode history, personal ratings, and profile metadata.
              </p>

              <div className="border border-white/20 bg-white/5 p-4 text-xs space-y-2">
                <div className="text-cyber-green font-bold">ARCHIVE FORMAT: JSON (ShinDB Schema v1.0.0)</div>
                <div className="text-gray-400">
                  Target: Full Library (Anime, Manga, Games, Movies, Series), Seasons, Timestamps, Notes.
                </div>
              </div>

              <div>
                <a
                  href="/api/media/export"
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-cyan text-black font-extrabold text-xs uppercase border border-white shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>[EXPORT LIBRARY DATA (JSON)]</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: IMPORT DATA */}
          {activeTab === "import" && <ImportTab />}
        </div>
      </div>
    </div>
  );
}
