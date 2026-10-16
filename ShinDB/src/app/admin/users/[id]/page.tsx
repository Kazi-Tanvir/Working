"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Shield,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Layers,
  Database,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface UserDetailData {
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    customBadge: string | null;
    role: "user" | "admin";
    authProvider: string;
    clerkId: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
      library: number;
      sentFriendships: number;
      receivedFriendships: number;
    };
  };
  stats: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    recentEntries: {
      id: string;
      mediaId: string;
      title: string;
      type: string;
      coverImage: string;
      status: string;
      rating: number | null;
      progressCurrent: number;
      updatedAt: string;
    }[];
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states
  const [role, setRole] = useState<"user" | "admin">("user");
  const [displayName, setDisplayName] = useState("");
  const [customBadge, setCustomBadge] = useState("");
  const [bio, setBio] = useState("");

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    if (!id) return;
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setRole(json.user.role);
          setDisplayName(json.user.displayName || "");
          setCustomBadge(json.user.customBadge || "");
          setBio(json.user.bio || "");
        }
      } catch (err) {
        console.error("Failed to load user detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          displayName,
          customBadge,
          bio,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        showToast("ATTRIBUTES COMMITTED TO SECURITY DIRECTORY");
        setData((prev) => (prev ? { ...prev, user: { ...prev.user, ...json.user } } : null));
      } else {
        showToast(`ERROR: ${json.error || "Failed to update profile"}`);
      }
    } catch {
      showToast("ERROR: Network failure updating user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        router.push("/admin/users");
      } else {
        showToast(`ERROR: ${json.error || "Failed to purge user"}`);
        setIsDeleting(false);
      }
    } catch {
      showToast("ERROR: Network failure deleting user");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-center">
        <Loader2 className="w-10 h-10 text-cyber-purple animate-spin mb-4" />
        <div className="text-xs uppercase tracking-widest text-gray-400">
          DECRYPTING OPERATOR SECURITY CLEARANCE MATRIX...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center font-mono">
        <h2 className="text-xl font-bold uppercase text-white mb-4">
          OPERATOR RECORD NOT FOUND
        </h2>
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-white text-black font-bold uppercase text-xs border border-white"
        >
          Return to User Matrix
        </Link>
      </div>
    );
  }

  const { user, stats } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono select-none">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white border-2 border-cyber-cyan px-4 py-2.5 shadow-[4px_4px_0px_0px_var(--cyber-cyan)] flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 text-cyber-purple" />
          <span>Back to Directory</span>
        </Link>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-3 py-1.5 border border-red-500/40 hover:border-red-500 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Terminate Account</span>
        </button>
      </div>

      {/* Operator Header Card */}
      <div className="p-6 bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border-2 border-white bg-cyber-purple/20 flex items-center justify-center font-black text-2xl text-white shadow-[3px_3px_0px_0px_#ffffff] shrink-0 overflow-hidden">
            {user.avatarUrl && user.avatarUrl.trim() !== "" ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
                @{user.username}
              </h1>
              {user.role === "admin" ? (
                <span className="px-2 py-0.5 border border-cyber-red bg-cyber-red/20 text-cyber-red text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_var(--cyber-red)]">
                  ADMIN
                </span>
              ) : (
                <span className="px-2 py-0.5 border border-white/30 bg-white/5 text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                  USER
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              {user.email} • Provider: <span className="uppercase text-white font-bold">{user.authProvider}</span>
            </div>
            <div className="text-[10px] text-cyber-cyan mt-1">
              Badge: <span className="font-bold text-white">{user.customBadge || "[SYS_OPERATOR::RECRUIT]"}</span>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 gap-1 text-xs text-gray-400">
          <div>
            Registered: <span className="text-white font-bold">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            Total Tracked: <span className="text-cyber-green font-bold">{user._count.library} items</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Edit Permissions & Library Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EDIT ATTRIBUTES FORM */}
        <div className="p-6 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff]">
          <h2 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
            <Shield className="w-4 h-4 text-cyber-purple" />
            Security & Profile Mutation
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                Access Level / Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "user" | "admin")}
                className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-purple"
              >
                <option value="user">Standard User (Level 01)</option>
                <option value="admin">Administrator (Level 04 - Full Override)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-purple"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                Custom Status Badge
              </label>
              <input
                type="text"
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                placeholder="[SYS_OPERATOR::ELITE]"
                className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-purple"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                Operator Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono focus:outline-none focus:border-cyber-purple"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-cyber-purple hover:bg-[#7c3aed] text-white font-black text-xs uppercase tracking-wider border border-white shadow-[2px_2px_0px_0px_#ffffff] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Commit Mutation
            </button>
          </form>
        </div>

        {/* LIBRARY BREAKDOWN */}
        <div className="p-6 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] space-y-4">
          <h2 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
            <Layers className="w-4 h-4 text-cyber-cyan" />
            Collection Telemetry
          </h2>

          {/* Formats */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-gray-400">By Media Format:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {["anime", "manga", "game", "movie", "series"].map((t) => (
                <div key={t} className="p-2 border border-white/20 bg-white/5 text-xs">
                  <div className="text-[10px] uppercase text-gray-400">{t}</div>
                  <div className="text-base font-black text-white">{stats.byType[t] || 0}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Statuses */}
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-black uppercase text-gray-400">By Tracking Status:</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats.byStatus).map(([st, cnt]) => (
                <div key={st} className="p-2 border border-white/10 bg-white/5 flex justify-between items-center text-xs">
                  <span className="uppercase text-gray-300 text-[10px]">{st.replace(/_/g, " ")}</span>
                  <span className="font-black text-cyber-yellow">{cnt}</span>
                </div>
              ))}
              {Object.keys(stats.byStatus).length === 0 && (
                <div className="col-span-2 text-xs text-gray-500 py-2">No tracked media items yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent User Entries */}
      <div className="p-6 bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] space-y-4">
        <h2 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
          <Database className="w-4 h-4 text-cyber-yellow" />
          Recent Additions in Collection
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.recentEntries.map((e) => (
            <div key={e.id} className="border border-white/20 bg-white/5 p-2.5 space-y-2">
              <div className="aspect-[3/4] w-full border border-white/30 bg-black overflow-hidden">
                {e.coverImage && e.coverImage.trim() !== "" ? (
                  <img src={e.coverImage} alt={e.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 font-bold">
                    NO COVER
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-black uppercase text-white truncate">{e.title}</div>
                <div className="text-[10px] text-gray-400 uppercase mt-0.5">{e.type}</div>
              </div>
              <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="text-cyber-yellow font-bold uppercase">{e.status.replace(/_/g, " ")}</span>
                <span className="text-white font-bold">{e.rating ? `${e.rating}/10` : "—"}</span>
              </div>
            </div>
          ))}
          {stats.recentEntries.length === 0 && (
            <div className="col-span-full py-6 text-center text-xs text-gray-500 uppercase">
              No recent entries recorded for this operator.
            </div>
          )}
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cyber-card p-6 border-2 border-cyber-red shadow-[8px_8px_0px_0px_var(--cyber-red)] bg-black max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-cyber-red">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-cyber-red">
                  IRREVERSIBLE SECURITY OPERATION
                </div>
                <h3 className="text-lg font-black uppercase text-white">
                  Terminate User Account?
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you certain you want to purge operator <strong className="text-white">@{user.username}</strong>?
              This operation cannot be reversed.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-white text-xs font-bold uppercase text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-cyber-red text-white text-xs font-black uppercase tracking-wider border border-white shadow-[2px_2px_0px_0px_#ffffff] hover:bg-red-700 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
