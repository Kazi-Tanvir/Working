"use client";

import React, { useEffect, useState } from "react";
import {
  Database,
  Search,
  Edit2,
  Trash2,
  GitMerge,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Sparkles,
  Save,
  X,
  Filter,
} from "lucide-react";

interface MediaCatalogRow {
  id: string;
  title: string;
  type: string;
  coverImage: string;
  releaseYear: number;
  genres: any;
  externalRating: number | null;
  totalEpisodes: number | null;
  progressUnit: string;
  externalId: string | null;
  externalSource: string | null;
  trackedCount: number;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaCatalogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("tracked");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selection for merge
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [targetMergeId, setTargetMergeId] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<MediaCatalogRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCover, setEditCover] = useState("");
  const [editYear, setEditYear] = useState(2026);
  const [editGenres, setEditGenres] = useState("");
  const [editEpisodes, setEditEpisodes] = useState<number | "">("");
  const [editRating, setEditRating] = useState<number | "">("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<MediaCatalogRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      });
      if (search.trim()) params.set("q", search.trim());
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load catalog media:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [page, typeFilter, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMedia();
  };

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const openEditModal = (item: MediaCatalogRow) => {
    setEditTarget(item);
    setEditTitle(item.title);
    setEditCover(item.coverImage);
    setEditYear(item.releaseYear);
    const genreStr = Array.isArray(item.genres)
      ? item.genres.join(", ")
      : typeof item.genres === "string"
      ? item.genres
      : "";
    setEditGenres(genreStr);
    setEditEpisodes(item.totalEpisodes ?? "");
    setEditRating(item.externalRating ?? "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsSavingEdit(true);

    try {
      const parsedGenres = editGenres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/media/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          coverImage: editCover,
          releaseYear: Number(editYear),
          genres: parsedGenres,
          totalEpisodes: editEpisodes === "" ? null : Number(editEpisodes),
          externalRating: editRating === "" ? null : Number(editRating),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        showToast(`UPDATED: "${editTitle}" saved to catalog`);
        setEditTarget(null);
        fetchMedia();
      } else {
        showToast(`ERROR: ${json.error || "Failed to update media"}`);
      }
    } catch {
      showToast("ERROR: Network failure saving media edits");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteMedia = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`DELETED: "${deleteTarget.title}" dropped from catalog`);
        setDeleteTarget(null);
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        fetchMedia();
      } else {
        showToast(`ERROR: ${json.error || "Failed to delete media"}`);
      }
    } catch {
      showToast("ERROR: Network failure deleting media");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMergeSubmit = async () => {
    if (selectedIds.length !== 2 || !targetMergeId) return;
    const sourceId = selectedIds.find((id) => id !== targetMergeId);
    if (!sourceId) return;

    setIsMerging(true);
    try {
      const res = await fetch("/api/admin/media/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          targetId: targetMergeId,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message || "Merge operation completed successfully");
        setShowMergeModal(false);
        setSelectedIds([]);
        fetchMedia();
      } else {
        showToast(`ERROR: ${json.error || "Failed to execute merge"}`);
      }
    } catch {
      showToast("ERROR: Network failure during merge execution");
    } finally {
      setIsMerging(false);
    }
  };

  const selectedMediaItems = media.filter((m) => selectedIds.includes(m.id));

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
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-yellow animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyber-yellow">
              CATALOG_MATRIX::MASTER_DATA
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Database className="w-7 h-7 text-cyber-yellow" />
            Master Media Catalog & Deduplication
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Global media library entries. Edit canonical records or merge duplicate records.
          </p>
        </div>

        <div className="text-xs font-bold uppercase text-gray-400 border border-white/20 p-2 bg-white/5">
          Catalog Size: <span className="text-white font-black">{total}</span>
        </div>
      </div>

      {/* Merge Selection Alert Bar */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-cyber-purple/20 border-2 border-cyber-purple shadow-[4px_4px_0px_0px_var(--cyber-purple)] flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <GitMerge className="w-5 h-5 text-cyber-purple animate-pulse" />
            <div className="text-xs">
              <span className="font-bold text-white uppercase">
                {selectedIds.length} OF 2 ENTRIES SELECTED FOR MERGE:
              </span>{" "}
              <span className="text-gray-300">
                {selectedMediaItems.map((m) => m.title).join("  //  ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 border border-white/40 text-xs font-bold uppercase text-white hover:bg-white/10"
            >
              Clear
            </button>
            <button
              onClick={() => {
                setTargetMergeId(selectedIds[0]);
                setShowMergeModal(true);
              }}
              disabled={selectedIds.length !== 2}
              className="px-4 py-1.5 bg-cyber-purple text-white font-black text-xs uppercase tracking-wider border border-white shadow-[2px_2px_0px_0px_#ffffff] hover:bg-[#7c3aed] disabled:opacity-40 cursor-pointer"
            >
              Launch Merge Protocol
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 bg-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH CATALOG TITLES..."
              className="w-full pl-9 pr-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-yellow"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white text-black font-extrabold text-xs uppercase tracking-wider border border-white hover:bg-cyber-yellow hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase text-gray-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-yellow"
            >
              <option value="">ALL FORMATS</option>
              <option value="anime">ANIME</option>
              <option value="manga">MANGA</option>
              <option value="game">GAME</option>
              <option value="movie">MOVIE</option>
              <option value="series">SERIES</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase text-gray-400">Sort:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-yellow"
            >
              <option value="tracked">MOST TRACKED</option>
              <option value="title">TITLE (A-Z)</option>
              <option value="year">RELEASE YEAR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-black border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-white/10 border-b-2 border-white uppercase text-[10px] tracking-wider text-gray-300">
            <tr>
              <th className="p-3 text-center w-10">Select</th>
              <th className="p-3">Cover</th>
              <th className="p-3">Canonical Title</th>
              <th className="p-3">Format</th>
              <th className="p-3">Year</th>
              <th className="p-3">Genres</th>
              <th className="p-3 text-center">Trackers</th>
              <th className="p-3">Source ID</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-gray-400 uppercase tracking-widest">
                  <Loader2 className="w-6 h-6 text-cyber-yellow animate-spin mx-auto mb-2" />
                  Streaming master catalog records...
                </td>
              </tr>
            ) : media.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-gray-500 uppercase tracking-widest">
                  No catalog items found matching parameters.
                </td>
              </tr>
            ) : (
              media.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/5 transition-colors ${
                      isSelected ? "bg-cyber-purple/10" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectToggle(item.id)}
                        className="w-4 h-4 cursor-pointer accent-cyber-purple"
                        title="Select up to 2 items to merge"
                      />
                    </td>

                    {/* Cover Thumbnail */}
                    <td className="p-3">
                      <div className="w-10 h-14 border border-white/40 bg-black overflow-hidden shrink-0">
                        {item.coverImage && item.coverImage.trim() !== "" ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600 font-bold">
                            N/A
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title */}
                    <td className="p-3 font-bold text-white max-w-[220px]">
                      <div className="truncate">{item.title}</div>
                      <div className="text-[10px] text-gray-500">ID: {item.id}</div>
                    </td>

                    {/* Format */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 border border-white/20 bg-white/5 uppercase text-[10px] font-bold">
                        {item.type}
                      </span>
                    </td>

                    {/* Release Year */}
                    <td className="p-3 text-gray-300">{item.releaseYear}</td>

                    {/* Genres */}
                    <td className="p-3 text-gray-400 text-[10px] max-w-[160px] truncate">
                      {Array.isArray(item.genres)
                        ? item.genres.slice(0, 3).join(", ")
                        : typeof item.genres === "string"
                        ? item.genres
                        : "—"}
                    </td>

                    {/* Trackers Count */}
                    <td className="p-3 text-center font-black text-cyber-green">
                      {item.trackedCount}
                    </td>

                    {/* External Source */}
                    <td className="p-3 text-[10px] text-gray-400">
                      {item.externalSource ? (
                        <span className="uppercase font-bold text-cyber-cyan">
                          {item.externalSource}#{item.externalId}
                        </span>
                      ) : (
                        <span className="text-gray-600">Local Entry</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit catalog metadata"
                          className="p-1.5 border border-white/30 hover:border-white text-gray-300 hover:text-white transition-all bg-black cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete from catalog"
                          className="p-1.5 border border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
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

      {/* EDIT METADATA MODAL */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cyber-card p-6 border-2 border-white shadow-[8px_8px_0px_0px_#ffffff] bg-black max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyber-yellow" />
                Edit Master Media Record
              </h3>
              <button
                onClick={() => setEditTarget(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Canonical Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-black border-2 border-white text-white font-mono uppercase focus:outline-none focus:border-cyber-yellow"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={editCover}
                  onChange={(e) => setEditCover(e.target.value)}
                  className="w-full px-3 py-2 bg-black border-2 border-white text-white font-mono focus:outline-none focus:border-cyber-yellow"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    Release Year
                  </label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black border-2 border-white text-white font-mono focus:outline-none focus:border-cyber-yellow"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    Episodes / Ch
                  </label>
                  <input
                    type="number"
                    value={editEpisodes}
                    onChange={(e) =>
                      setEditEpisodes(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Null"
                    className="w-full px-3 py-2 bg-black border-2 border-white text-white font-mono focus:outline-none focus:border-cyber-yellow"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                    Ext Rating (0-10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={editRating}
                    onChange={(e) =>
                      setEditRating(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Null"
                    className="w-full px-3 py-2 bg-black border-2 border-white text-white font-mono focus:outline-none focus:border-cyber-yellow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
                  Genres (Comma separated)
                </label>
                <input
                  type="text"
                  value={editGenres}
                  onChange={(e) => setEditGenres(e.target.value)}
                  placeholder="Action, Sci-Fi, Psychological"
                  className="w-full px-3 py-2 bg-black border-2 border-white text-white font-mono focus:outline-none focus:border-cyber-yellow"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 border border-white text-white uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-cyber-yellow text-black uppercase font-black border border-white shadow-[2px_2px_0px_0px_#ffffff] flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE DUPLICATES MODAL */}
      {showMergeModal && selectedMediaItems.length === 2 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cyber-card p-6 border-2 border-cyber-purple shadow-[8px_8px_0px_0px_var(--cyber-purple)] bg-black max-w-lg w-full space-y-4">
            <div className="flex items-center gap-2 border-b border-white/20 pb-3 text-cyber-purple">
              <GitMerge className="w-6 h-6" />
              <div>
                <div className="text-[10px] font-black uppercase text-cyber-purple">
                  DEDUPLICATION MERGE PROTOCOL
                </div>
                <h3 className="text-base font-black uppercase text-white">
                  Merge 2 Duplicate Media Catalog Records
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Select which entity should be preserved as the <strong className="text-cyber-green">TARGET</strong>.
              All users tracking the other item (<strong className="text-cyber-red">SOURCE</strong>) will be transferred over to the target, and the source will be permanently dropped.
            </p>

            <div className="space-y-3">
              {selectedMediaItems.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 border-2 cursor-pointer transition-all ${
                    targetMergeId === item.id
                      ? "border-cyber-green bg-cyber-green/10 text-white"
                      : "border-white/20 bg-white/5 text-gray-300 hover:border-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetMerge"
                    checked={targetMergeId === item.id}
                    onChange={() => setTargetMergeId(item.id)}
                    className="mt-1 accent-cyber-green"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-xs uppercase flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-[10px] text-cyber-cyan font-mono">
                        {item.trackedCount} trackers
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Format: {item.type} • Year: {item.releaseYear} • ID: {item.id}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/20">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 border border-white text-xs font-bold uppercase text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeSubmit}
                disabled={isMerging || !targetMergeId}
                className="px-5 py-2 bg-cyber-purple text-white uppercase font-black text-xs border border-white shadow-[2px_2px_0px_0px_#ffffff] flex items-center gap-2 hover:bg-[#7c3aed] disabled:opacity-40 cursor-pointer"
              >
                {isMerging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <GitMerge className="w-3.5 h-3.5" />
                )}
                Execute Catalog Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cyber-card p-6 border-2 border-cyber-red shadow-[8px_8px_0px_0px_var(--cyber-red)] bg-black max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-cyber-red">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <div>
                <div className="text-[10px] font-black uppercase text-cyber-red">
                  CATALOG PURGE WARNING
                </div>
                <h3 className="text-lg font-black uppercase text-white">
                  Delete Media Record?
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Purging <strong className="text-white">"{deleteTarget.title}"</strong> ({deleteTarget.type}) will cascade-delete tracked progress for all{" "}
              <strong className="text-cyber-red">{deleteTarget.trackedCount} users</strong> tracking this entry.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-white text-xs font-bold uppercase text-white hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMedia}
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
