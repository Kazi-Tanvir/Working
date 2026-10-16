"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Terminal,
} from "lucide-react";

interface AuditLogRow {
  id: string;
  action: string;
  target: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string | null;
    role?: string;
  } | null;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (actionFilter) params.set("action", actionFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch audit log trail:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    if (action.includes("delete") || action.includes("purge")) {
      return "border-red-500 bg-red-500/20 text-red-400";
    }
    if (action.includes("merge")) {
      return "border-cyber-purple bg-cyber-purple/20 text-cyber-purple";
    }
    if (action.includes("update") || action.includes("edit")) {
      return "border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan";
    }
    if (action.includes("login") || action.includes("register")) {
      return "border-cyber-green bg-cyber-green/20 text-cyber-green";
    }
    return "border-cyber-yellow bg-cyber-yellow/20 text-cyber-yellow";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono select-none">
      {/* Header */}
      <div className="p-6 bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyber-green">
              AUDIT_TRAIL::IMMUTABLE_LOGS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-wider flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-cyber-green" />
            Security & Mutation Audit Trail
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Tamper-evident logs of administrative actions, user changes, and catalog updates.
          </p>
        </div>

        <div className="text-xs font-bold uppercase text-gray-400 border border-white/20 p-2 bg-white/5">
          Recorded Events: <span className="text-white font-black">{total}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH ACTION, TARGET ENTITY, OR OPERATOR..."
              className="w-full pl-9 pr-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-green"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white text-black font-extrabold text-xs uppercase tracking-wider border border-white hover:bg-cyber-green hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-gray-400">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-green"
          >
            <option value="">ALL RECORDED ACTIONS</option>
            <option value="admin.user.update">admin.user.update</option>
            <option value="admin.user.delete">admin.user.delete</option>
            <option value="admin.media.update">admin.media.update</option>
            <option value="admin.media.delete">admin.media.delete</option>
            <option value="admin.media.merge">admin.media.merge</option>
            <option value="import.anilist">import.anilist</option>
            <option value="import.mal">import.mal</option>
            <option value="import.text">import.text</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-white/10 border-b-2 border-white uppercase text-[10px] tracking-wider text-gray-300">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Initiator / Operator</th>
              <th className="p-3">Action Signature</th>
              <th className="p-3">Target Entity</th>
              <th className="p-3">IP Address</th>
              <th className="p-3 text-right">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400 uppercase tracking-widest">
                  <Loader2 className="w-6 h-6 text-cyber-green animate-spin mx-auto mb-2" />
                  Reading security audit journals...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500 uppercase tracking-widest">
                  No security events matching filter criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-white/5 transition-colors">
                      {/* Timestamp */}
                      <td className="p-3 text-gray-400 text-[10px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      {/* Operator */}
                      <td className="p-3">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              @{log.user.username}
                            </span>
                            {log.user.role === "admin" && (
                              <span className="text-[8px] px-1 bg-cyber-red/20 text-cyber-red border border-cyber-red font-black">
                                ADMIN
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">System Kernel</span>
                        )}
                      </td>

                      {/* Action Signature */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 border text-[10px] font-black uppercase tracking-wider inline-block ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="p-3 text-white font-mono text-[11px] truncate max-w-[180px]">
                        {log.target || "—"}
                      </td>

                      {/* IP */}
                      <td className="p-3 text-gray-400 text-[10px]">
                        {log.ipAddress || "Internal"}
                      </td>

                      {/* Payload Toggle */}
                      <td className="p-3 text-right">
                        {log.details ? (
                          <button
                            onClick={() =>
                              setExpandedLogId(isExpanded ? null : log.id)
                            }
                            className="p-1 border border-white/20 hover:border-white text-gray-300 hover:text-white transition-all text-[10px] uppercase font-bold flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <span>Details</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[10px]">None</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable JSON details row */}
                    {isExpanded && log.details && (
                      <tr className="bg-black/90 border-b border-white/20">
                        <td colSpan={6} className="p-4">
                          <div className="p-3 bg-[#0d0d12] border border-white/20 text-[11px] text-cyber-cyan overflow-x-auto">
                            <pre className="font-mono whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
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
    </div>
  );
}
