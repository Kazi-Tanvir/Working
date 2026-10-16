"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  customBadge: string | null;
  role: "user" | "admin";
  authProvider: string;
  createdAt: string;
  entriesCount: number;
  friendsCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) params.set("q", search.trim());
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch user directory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleToggle = async (user: AdminUserRow) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        showToast(`ROLE UPDATED: @${user.username} is now [${newRole.toUpperCase()}]`);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      } else {
        const data = await res.json();
        showToast(`ERROR: ${data.error || "Failed to update role"}`);
      }
    } catch {
      showToast("ERROR: Network failure updating user privileges");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`PURGED: @${deleteTarget.username} erased completely`);
        setDeleteTarget(null);
        fetchUsers();
      } else {
        showToast(`ERROR: ${data.error || "Failed to delete user"}`);
      }
    } catch {
      showToast("ERROR: Network failure during account termination");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono select-none">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white border-2 border-cyber-cyan px-4 py-2.5 shadow-[4px_4px_0px_0px_var(--cyber-cyan)] flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-purple animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyber-purple">
              DIRECTORY_MATRIX::SECURITY_CLEARANCE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Users className="w-7 h-7 text-cyber-purple" />
            User Management Directory
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Query operator registries, inspect personal collections, and adjust permissions.
          </p>
        </div>

        <div className="text-xs font-bold uppercase text-gray-400 border border-white/20 p-2 bg-white/5">
          Total Operators: <span className="text-white font-black">{total}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH USERNAME, EMAIL, OR DISPLAY NAME..."
              className="w-full pl-9 pr-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-cyan"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white text-black font-extrabold text-xs uppercase tracking-wider border border-white hover:bg-cyber-purple hover:text-white transition-all cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            Find
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-gray-400">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-purple"
          >
            <option value="">ALL ROLES</option>
            <option value="admin">ADMINS ONLY</option>
            <option value="user">STANDARD USERS</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-white/10 border-b-2 border-white uppercase text-[10px] tracking-wider text-gray-300">
            <tr>
              <th className="p-3.5">Operator</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Auth</th>
              <th className="p-3.5 text-center">Entries</th>
              <th className="p-3.5 text-center">Friends</th>
              <th className="p-3.5">Registered</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-400 uppercase tracking-widest">
                  <Loader2 className="w-6 h-6 text-cyber-cyan animate-spin mx-auto mb-2" />
                  Accessing directory shards...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-500 uppercase tracking-widest">
                  No matching user credentials detected.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  {/* Operator Info */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 border border-white bg-cyber-purple/20 flex items-center justify-center font-black text-xs text-white shrink-0 overflow-hidden">
                        {u.avatarUrl && u.avatarUrl.trim() !== "" ? (
                          <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="font-bold text-white hover:text-cyber-cyan transition-colors block"
                        >
                          @{u.username}
                        </Link>
                        <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                          {u.displayName || u.username}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="p-3.5 text-gray-300 truncate max-w-[160px]">
                    {u.email}
                  </td>

                  {/* Role Badge */}
                  <td className="p-3.5">
                    {u.role === "admin" ? (
                      <span className="px-2 py-0.5 border border-cyber-red bg-cyber-red/20 text-cyber-red text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-[1px_1px_0px_0px_var(--cyber-red)]">
                        <ShieldAlert className="w-3 h-3 inline" />
                        ADMIN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 border border-white/30 bg-white/5 text-gray-300 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3 inline" />
                        USER
                      </span>
                    )}
                  </td>

                  {/* Auth Provider */}
                  <td className="p-3.5 text-gray-400 uppercase text-[10px]">
                    {u.authProvider}
                  </td>

                  {/* Tracked Entries */}
                  <td className="p-3.5 text-center font-black text-white">
                    {u.entriesCount}
                  </td>

                  {/* Friends Count */}
                  <td className="p-3.5 text-center font-black text-white">
                    {u.friendsCount}
                  </td>

                  {/* Joined Date */}
                  <td className="p-3.5 text-gray-400 text-[10px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/users/${u.id}`}
                        title="View Full Profile Matrix"
                        className="p-1.5 border border-white/20 hover:border-white text-gray-300 hover:text-white transition-all bg-black"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleRoleToggle(u)}
                        title={u.role === "admin" ? "Demote to standard user" : "Promote to Admin"}
                        className={`p-1.5 border transition-all cursor-pointer ${
                          u.role === "admin"
                            ? "border-cyber-red/40 hover:border-cyber-red text-cyber-red"
                            : "border-cyber-purple/40 hover:border-cyber-purple text-cyber-purple"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(u)}
                        title="Purge account completely"
                        className="p-1.5 border border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between p-4 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff]">
        <div className="text-xs text-gray-400">
          PAGE <span className="text-white font-bold">{page}</span> OF{" "}
          <span className="text-white font-bold">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-white text-xs font-bold uppercase text-white hover:bg-white hover:text-black transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 inline" /> Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-white text-xs font-bold uppercase text-white hover:bg-white hover:text-black transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4 inline" />
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {deleteTarget && (
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
              You are about to completely wipe operator{" "}
              <strong className="text-white">@{deleteTarget.username}</strong> ({deleteTarget.email}).
              All tracked entries ({deleteTarget.entriesCount}), friendships, and session data will be permanently cascade-deleted.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-white text-xs font-bold uppercase text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
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
