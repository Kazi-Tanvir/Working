"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  FileInput,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Eye,
  RefreshCw,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Upload,
  UploadCloud,
} from "lucide-react";
import { parseTextList } from "@/utils/textParser";

interface StreamLogItem {
  title: string;
  type: string;
  action: string;
  matched?: boolean;
}

export default function ImportTab() {
  const [activeSubTab, setActiveSubTab] = useState<"anilist" | "mal" | "text">("anilist");

  // ----------------------------------------------------
  // ANILIST STATE
  // ----------------------------------------------------
  const [anilistUsername, setAnilistUsername] = useState("");
  const [anilistAnime, setAnilistAnime] = useState(true);
  const [anilistManga, setAnilistManga] = useState(true);
  const [anilistOverwrite, setAnilistOverwrite] = useState(false);
  const [anilistLoading, setAnilistLoading] = useState(false);
  const [anilistProgress, setAnilistProgress] = useState<{ current: number; total: number; percentage: number } | null>(null);
  const [anilistLogs, setAnilistLogs] = useState<StreamLogItem[]>([]);
  const [anilistPreview, setAnilistPreview] = useState<any | null>(null);
  const [anilistSummary, setAnilistSummary] = useState<any | null>(null);
  const [anilistError, setAnilistError] = useState<string | null>(null);

  // ----------------------------------------------------
  // MAL STATE
  // ----------------------------------------------------
  const [malUsername, setMalUsername] = useState("");
  const [malAnime, setMalAnime] = useState(true);
  const [malManga, setMalManga] = useState(true);
  const [malOverwrite, setMalOverwrite] = useState(false);
  const [malLoading, setMalLoading] = useState(false);
  const [malProgress, setMalProgress] = useState<{ current: number; total: number; percentage: number } | null>(null);
  const [malLogs, setMalLogs] = useState<StreamLogItem[]>([]);
  const [malPreview, setMalPreview] = useState<any | null>(null);
  const [malSummary, setMalSummary] = useState<any | null>(null);
  const [malError, setMalError] = useState<string | null>(null);

  // MAL XML file upload state
  const [malXmlFile, setMalXmlFile] = useState<File | null>(null);
  const [malXmlOverwrite, setMalXmlOverwrite] = useState(false);
  const [malXmlLoading, setMalXmlLoading] = useState(false);
  const [malXmlProgress, setMalXmlProgress] = useState<{ current: number; total: number; percentage: number } | null>(null);
  const [malXmlLogs, setMalXmlLogs] = useState<StreamLogItem[]>([]);
  const [malXmlPreview, setMalXmlPreview] = useState<any | null>(null);
  const [malXmlSummary, setMalXmlSummary] = useState<any | null>(null);
  const [malXmlError, setMalXmlError] = useState<string | null>(null);
  const [malXmlDragOver, setMalXmlDragOver] = useState(false);
  const malXmlFileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // PLAIN TEXT LIST STATE
  // ----------------------------------------------------
  const [textRaw, setTextRaw] = useState("");
  const [textMediaType, setTextMediaType] = useState<"anime" | "manga" | "game" | "movie" | "series">("anime");
  const [textSkipExisting, setTextSkipExisting] = useState(true);
  const [textLoading, setTextLoading] = useState(false);
  const [textProgress, setTextProgress] = useState<{ current: number; total: number; percentage: number } | null>(null);
  const [textLogs, setTextLogs] = useState<StreamLogItem[]>([]);
  const [textPreview, setTextPreview] = useState<any | null>(null);
  const [textSummary, setTextSummary] = useState<any | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  // Live parsed count for plain text
  const parsedCount = useMemo(() => {
    return parseTextList(textRaw).length;
  }, [textRaw]);

  // ----------------------------------------------------
  // STREAM RUNNER HELPER
  // ----------------------------------------------------
  const runStreamImport = async (
    url: string,
    body: any,
    setProgress: (p: any) => void,
    setLogs: React.Dispatch<React.SetStateAction<StreamLogItem[]>>,
    setSummary: (s: any) => void,
    setError: (e: string | null) => void,
    setLoading: (l: boolean) => void
  ) => {
    setError(null);
    setSummary(null);
    setProgress({ current: 0, total: 100, percentage: 0 });
    setLogs([]);
    setLoading(true);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server responded with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Readable stream is unavailable");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "progress") {
              setProgress({
                current: data.current,
                total: data.total,
                percentage: data.percentage,
              });
              if (data.item) {
                setLogs((prev) => [
                  {
                    title: data.item.resolvedTitle || data.item.title || data.item.rawTitle,
                    type: data.item.type,
                    action: data.item.action,
                    matched: data.item.matched,
                  },
                  ...prev.slice(0, 49), // retain last 50
                ]);
              }
            } else if (data.type === "complete") {
              setSummary(data.summary);
            }
          } catch {
            // ignore malformed line
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Import execution encountered a network interruption.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // ANILIST HANDLERS
  // ----------------------------------------------------
  const handleAniListPreview = async () => {
    if (!anilistUsername.trim()) {
      setAnilistError("Please enter an AniList username");
      return;
    }
    setAnilistError(null);
    setAnilistLoading(true);
    setAnilistPreview(null);
    setAnilistSummary(null);

    const importTypes = [
      ...(anilistAnime ? ["anime"] : []),
      ...(anilistManga ? ["manga"] : []),
    ];

    try {
      const res = await fetch("/api/import/anilist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anilistUsername: anilistUsername.trim(),
          importTypes,
          overwriteExisting: anilistOverwrite,
          preview: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate preview");
      }
      setAnilistPreview(data);
    } catch (err: any) {
      setAnilistError(err.message);
    } finally {
      setAnilistLoading(false);
    }
  };

  const handleAniListImport = async () => {
    if (!anilistUsername.trim()) {
      setAnilistError("Please enter an AniList username");
      return;
    }
    const importTypes = [
      ...(anilistAnime ? ["anime"] : []),
      ...(anilistManga ? ["manga"] : []),
    ];

    await runStreamImport(
      "/api/import/anilist",
      {
        anilistUsername: anilistUsername.trim(),
        importTypes,
        overwriteExisting: anilistOverwrite,
        preview: false,
      },
      setAnilistProgress,
      setAnilistLogs,
      setAnilistSummary,
      setAnilistError,
      setAnilistLoading
    );
  };

  // ----------------------------------------------------
  // MAL HANDLERS
  // ----------------------------------------------------
  const handleMalPreview = async () => {
    if (!malUsername.trim()) {
      setMalError("Please enter a MyAnimeList username");
      return;
    }
    setMalError(null);
    setMalLoading(true);
    setMalPreview(null);
    setMalSummary(null);

    const importTypes = [
      ...(malAnime ? ["anime"] : []),
      ...(malManga ? ["manga"] : []),
    ];

    try {
      const res = await fetch("/api/import/mal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          malUsername: malUsername.trim(),
          importTypes,
          overwriteExisting: malOverwrite,
          preview: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate preview");
      }
      setMalPreview(data);
    } catch (err: any) {
      setMalError(err.message);
    } finally {
      setMalLoading(false);
    }
  };

  const handleMalImport = async () => {
    if (!malUsername.trim()) {
      setMalError("Please enter a MyAnimeList username");
      return;
    }
    const importTypes = [
      ...(malAnime ? ["anime"] : []),
      ...(malManga ? ["manga"] : []),
    ];

    await runStreamImport(
      "/api/import/mal",
      {
        malUsername: malUsername.trim(),
        importTypes,
        overwriteExisting: malOverwrite,
        preview: false,
      },
      setMalProgress,
      setMalLogs,
      setMalSummary,
      setMalError,
      setMalLoading
    );
  };

  // ----------------------------------------------------
  // MAL XML HANDLERS
  // ----------------------------------------------------
  const handleMalXmlFileSelect = (file: File) => {
    if (!file.name.endsWith(".xml")) {
      setMalXmlError("Please select a valid .xml MAL export file");
      return;
    }
    setMalXmlFile(file);
    setMalXmlError(null);
    setMalXmlPreview(null);
    setMalXmlSummary(null);
    setMalXmlProgress(null);
    setMalXmlLogs([]);
  };

  const handleMalXmlPreview = async () => {
    if (!malXmlFile) { setMalXmlError("Please select a MAL XML export file"); return; }
    setMalXmlError(null);
    setMalXmlLoading(true);
    setMalXmlPreview(null);
    setMalXmlSummary(null);
    try {
      const formData = new FormData();
      formData.append("file", malXmlFile);
      formData.append("preview", "true");
      const res = await fetch("/api/import/mal-xml", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setMalXmlPreview(data);
    } catch (err: any) {
      setMalXmlError(err.message);
    } finally {
      setMalXmlLoading(false);
    }
  };

  const handleMalXmlImport = async () => {
    if (!malXmlFile) { setMalXmlError("Please select a MAL XML export file"); return; }
    setMalXmlError(null);
    setMalXmlSummary(null);
    setMalXmlLogs([]);
    setMalXmlProgress({ current: 0, total: 100, percentage: 0 });
    setMalXmlLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", malXmlFile);
      formData.append("overwriteExisting", malXmlOverwrite ? "true" : "false");
      formData.append("preview", "false");
      const response = await fetch("/api/import/mal-xml", { method: "POST", body: formData });
      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "progress") {
              setMalXmlProgress({ current: event.current, total: event.total, percentage: event.percentage });
              if (event.item) setMalXmlLogs((prev) => [...prev, { title: event.item.title, type: event.item.type, action: event.item.action }]);
            } else if (event.type === "complete") {
              setMalXmlSummary(event.summary);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMalXmlError(err.message);
    } finally {
      setMalXmlLoading(false);
    }
  };

  // ----------------------------------------------------
  // PLAIN TEXT HANDLERS
  // ----------------------------------------------------
  const handleTextPreview = async () => {
    if (parsedCount === 0) {
      setTextError("Please paste at least one media title");
      return;
    }
    setTextError(null);
    setTextLoading(true);
    setTextPreview(null);
    setTextSummary(null);

    try {
      const res = await fetch("/api/import/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titles: textRaw,
          type: textMediaType,
          skipExisting: textSkipExisting,
          preview: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to preview text list");
      }
      setTextPreview(data);
    } catch (err: any) {
      setTextError(err.message);
    } finally {
      setTextLoading(false);
    }
  };

  const handleTextImport = async () => {
    if (parsedCount === 0) {
      setTextError("Please paste at least one media title");
      return;
    }

    await runStreamImport(
      "/api/import/text",
      {
        titles: textRaw,
        type: textMediaType,
        skipExisting: textSkipExisting,
        preview: false,
      },
      setTextProgress,
      setTextLogs,
      setTextSummary,
      setTextError,
      setTextLoading
    );
  };

  return (
    <div className="cyber-card p-6 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black space-y-6 font-mono select-none">
      {/* Header */}
      <div>
        <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
          <FileInput className="w-4 h-4 text-cyber-yellow" />
          MEDIA IMPORT & CATALOG INTEGRATION
        </h2>
        <p className="text-xs text-gray-400 mt-2">
          Import your anime, manga, and custom watchlists from AniList, MyAnimeList, or raw plain text.
        </p>
      </div>

      {/* Sub-Tabs: AniList, MAL, Plain Text */}
      <div className="flex flex-wrap gap-2 border-b border-white/20 pb-3">
        <button
          onClick={() => setActiveSubTab("anilist")}
          className={`px-4 py-2 text-xs font-black uppercase border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "anilist"
              ? "bg-cyber-cyan text-black border-white shadow-[2px_2px_0px_0px_#ffffff]"
              : "bg-black text-gray-400 border-white/20 hover:border-white hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AniList Import</span>
        </button>

        <button
          onClick={() => setActiveSubTab("mal")}
          className={`px-4 py-2 text-xs font-black uppercase border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "mal"
              ? "bg-cyber-purple text-white border-white shadow-[2px_2px_0px_0px_#ffffff]"
              : "bg-black text-gray-400 border-white/20 hover:border-white hover:text-white"
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>MyAnimeList Import</span>
        </button>

        <button
          onClick={() => setActiveSubTab("text")}
          className={`px-4 py-2 text-xs font-black uppercase border transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "text"
              ? "bg-cyber-yellow text-black border-white shadow-[2px_2px_0px_0px_#ffffff]"
              : "bg-black text-gray-400 border-white/20 hover:border-white hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Plain Text List</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 1. ANILIST IMPORT SUB-SECTION */}
      {/* ==================================================== */}
      {activeSubTab === "anilist" && (
        <div className="space-y-5">
          <div className="p-3 bg-cyber-cyan/10 border border-cyber-cyan/30 text-xs text-gray-300">
            <span className="font-bold text-cyber-cyan uppercase">PUBLIC GRAPHQL GATEWAY:</span> AniList user lists are public. No OAuth token or API keys are required.
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                AniList Username
              </label>
              <input
                type="text"
                value={anilistUsername}
                onChange={(e) => setAnilistUsername(e.target.value)}
                placeholder="e.g. johanliebert"
                className="w-full sm:w-80 px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-cyan"
              />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase text-gray-400">Import Formats:</div>
              <div className="flex items-center gap-6 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={anilistAnime}
                    onChange={(e) => setAnilistAnime(e.target.checked)}
                    className="accent-cyber-cyan w-4 h-4"
                  />
                  <span>Anime Collection</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={anilistManga}
                    onChange={(e) => setAnilistManga(e.target.checked)}
                    className="accent-cyber-cyan w-4 h-4"
                  />
                  <span>Manga Collection</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 pt-1">
              <input
                type="checkbox"
                checked={anilistOverwrite}
                onChange={(e) => setAnilistOverwrite(e.target.checked)}
                className="accent-cyber-cyan w-4 h-4"
              />
              <span>Overwrite existing tracking progress and scores if already in library</span>
            </label>

            {anilistError && (
              <div className="p-3 bg-red-500/20 border border-red-500 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{anilistError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleAniListPreview}
                disabled={anilistLoading || !anilistUsername.trim()}
                className="px-4 py-2 border-2 border-white text-xs font-bold uppercase text-white hover:bg-white hover:text-black transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview List</span>
              </button>

              <button
                onClick={handleAniListImport}
                disabled={anilistLoading || !anilistUsername.trim()}
                className="px-6 py-2 bg-cyber-cyan text-black text-xs font-black uppercase tracking-wider border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-cyan-400 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                {anilistLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black" />
                )}
                <span>Execute AniList Import</span>
              </button>
            </div>
          </div>

          {/* AniList Preview Box */}
          {anilistPreview && (
            <div className="p-4 bg-white/5 border border-white/20 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                <span className="font-bold text-cyber-cyan uppercase">
                  AniList Collection Preview: @{anilistPreview.username}
                </span>
                <span className="text-gray-400">
                  {anilistPreview.totalEntries} total entries found
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 border border-white/10 bg-black">
                  <div className="text-[10px] text-gray-400 uppercase">Anime</div>
                  <div className="text-base font-black text-white">{anilistPreview.animeCount}</div>
                </div>
                <div className="p-2 border border-white/10 bg-black">
                  <div className="text-[10px] text-gray-400 uppercase">Manga</div>
                  <div className="text-base font-black text-white">{anilistPreview.mangaCount}</div>
                </div>
                <div className="p-2 border border-white/10 bg-black">
                  <div className="text-[10px] text-cyber-green uppercase">New Entries</div>
                  <div className="text-base font-black text-cyber-green">{anilistPreview.newEntries}</div>
                </div>
                <div className="p-2 border border-white/10 bg-black">
                  <div className="text-[10px] text-cyber-yellow uppercase">Already Tracked</div>
                  <div className="text-base font-black text-cyber-yellow">{anilistPreview.alreadyTracked}</div>
                </div>
              </div>
            </div>
          )}

          {/* AniList Streaming Progress & Summary */}
          {anilistProgress && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-bold text-gray-300">
                <span>IMPORTING DATA SHARDS...</span>
                <span className="text-cyber-cyan">
                  {anilistProgress.current} / {anilistProgress.total} ({anilistProgress.percentage}%)
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 border border-white/40 overflow-hidden">
                <div
                  className="bg-cyber-cyan h-full transition-all duration-150"
                  style={{ width: `${anilistProgress.percentage}%` }}
                />
              </div>

              {anilistSummary && (
                <div className="p-3 bg-cyber-green/20 border border-cyber-green text-xs text-white space-y-1">
                  <div className="font-black text-cyber-green uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    IMPORT COMPLETE!
                  </div>
                  <div>
                    Imported: <span className="font-bold text-cyber-green">{anilistSummary.imported}</span> • Updated: <span className="font-bold text-cyber-cyan">{anilistSummary.updated}</span> • Skipped: <span className="font-bold text-cyber-yellow">{anilistSummary.skipped}</span> • Failed: <span className="font-bold text-red-400">{anilistSummary.failed}</span>
                  </div>
                </div>
              )}

              {/* Log Stream Box */}
              <div className="max-h-48 overflow-y-auto border border-white/20 bg-black p-2 space-y-1 text-[11px]">
                {anilistLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5 border-b border-white/5">
                    <span className="text-gray-300 truncate max-w-[280px]">
                      {log.title} <span className="text-gray-500 uppercase">({log.type})</span>
                    </span>
                    <span
                      className={`uppercase text-[10px] font-bold ${
                        log.action === "imported"
                          ? "text-cyber-green"
                          : log.action === "updated"
                          ? "text-cyber-cyan"
                          : log.action === "skipped"
                          ? "text-cyber-yellow"
                          : "text-red-400"
                      }`}
                    >
                      {log.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. MYANIMELIST IMPORT SUB-SECTION */}
      {/* ==================================================== */}
      {activeSubTab === "mal" && (
        <div className="space-y-5">
          <div className="p-3 bg-cyber-purple/10 border border-cyber-purple/30 text-xs text-gray-300">
            <span className="font-bold text-cyber-purple uppercase">MAL LIST INGESTION:</span> Uses official MyAnimeList v2 API or high-availability public list gateway. User's MAL list must be set to public.
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                MyAnimeList Username
              </label>
              <input
                type="text"
                value={malUsername}
                onChange={(e) => setMalUsername(e.target.value)}
                placeholder="e.g. tanvir_mal"
                className="w-full sm:w-80 px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-purple"
              />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase text-gray-400">Import Formats:</div>
              <div className="flex items-center gap-6 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={malAnime}
                    onChange={(e) => setMalAnime(e.target.checked)}
                    className="accent-cyber-purple w-4 h-4"
                  />
                  <span>Anime Collection</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={malManga}
                    onChange={(e) => setMalManga(e.target.checked)}
                    className="accent-cyber-purple w-4 h-4"
                  />
                  <span>Manga Collection</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 pt-1">
              <input
                type="checkbox"
                checked={malOverwrite}
                onChange={(e) => setMalOverwrite(e.target.checked)}
                className="accent-cyber-purple w-4 h-4"
              />
              <span>Overwrite existing tracking progress and scores if already in library</span>
            </label>

            {malError && (
              <div className="p-3 bg-red-500/20 border border-red-500 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{malError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleMalPreview}
                disabled={malLoading || !malUsername.trim()}
                className="px-4 py-2 border-2 border-white text-xs font-bold uppercase text-white hover:bg-white hover:text-black transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview List</span>
              </button>

              <button
                onClick={handleMalImport}
                disabled={malLoading || !malUsername.trim()}
                className="px-6 py-2 bg-cyber-purple text-white text-xs font-black uppercase tracking-wider border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-[#7c3aed] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                {malLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
                <span>Execute MAL Import</span>
              </button>
            </div>
          </div>

          {/* MAL Preview Box */}
          {malPreview && (
            <div className="p-4 bg-white/5 border border-white/20 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                <span className="font-bold text-cyber-purple uppercase">
                  MyAnimeList Preview: @{malPreview.username}
                </span>
                <span className="text-gray-400">
                  {malPreview.totalEntries} total entries found
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 border border-white/10 bg-black">
                  <div className="text-[10px] text-gray-400 uppercase">Anime</div>
                  <div className="text-base font-black text-white">{malPreview.animeCount}</div>
                </div>
                <div className="p-2 border border-white/10 bg-black">
                  <div className="text-[10px] text-gray-400 uppercase">Manga</div>
                  <div className="text-base font-black text-white">{malPreview.mangaCount}</div>
                </div>
                <div className="p-2 border border-white/10 bg-black">
                  <div className="text-[10px] text-cyber-green uppercase">New Entries</div>
                  <div className="text-base font-black text-cyber-green">{malPreview.newEntries}</div>
                </div>
                <div className="p-2 border border-white/10 bg-black">
                  <div className="text-[10px] text-cyber-yellow uppercase">Already Tracked</div>
                  <div className="text-base font-black text-cyber-yellow">{malPreview.alreadyTracked}</div>
                </div>
              </div>
            </div>
          )}

          {/* MAL Streaming Progress & Summary */}
          {malProgress && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-bold text-gray-300">
                <span>IMPORTING DATA SHARDS...</span>
                <span className="text-cyber-purple">
                  {malProgress.current} / {malProgress.total} ({malProgress.percentage}%)
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 border border-white/40 overflow-hidden">
                <div
                  className="bg-cyber-purple h-full transition-all duration-150"
                  style={{ width: `${malProgress.percentage}%` }}
                />
              </div>

              {malSummary && (
                <div className="p-3 bg-cyber-green/20 border border-cyber-green text-xs text-white space-y-1">
                  <div className="font-black text-cyber-green uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    IMPORT COMPLETE!
                  </div>
                  <div>
                    Imported: <span className="font-bold text-cyber-green">{malSummary.imported}</span> • Updated: <span className="font-bold text-cyber-cyan">{malSummary.updated}</span> • Skipped: <span className="font-bold text-cyber-yellow">{malSummary.skipped}</span> • Failed: <span className="font-bold text-red-400">{malSummary.failed}</span>
                  </div>
                </div>
              )}

              {/* Log Stream Box */}
              <div className="max-h-48 overflow-y-auto border border-white/20 bg-black p-2 space-y-1 text-[11px]">
                {malLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5 border-b border-white/5">
                    <span className="text-gray-300 truncate max-w-[280px]">
                      {log.title} <span className="text-gray-500 uppercase">({log.type})</span>
                    </span>
                    <span
                      className={`uppercase text-[10px] font-bold ${
                        log.action === "imported"
                          ? "text-cyber-green"
                          : log.action === "updated"
                          ? "text-cyber-cyan"
                          : log.action === "skipped"
                          ? "text-cyber-yellow"
                          : "text-red-400"
                      }`}
                    >
                      {log.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- MAL XML EXPORT UPLOAD ---- */}
          <div className="border-t border-white/10 pt-5 space-y-4">
            <div className="text-[10px] font-black uppercase text-cyber-purple tracking-wider flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              XML Export File Import
            </div>
            <div className="p-3 bg-cyber-purple/5 border border-cyber-purple/20 text-xs text-gray-400">
              <span className="font-bold text-cyber-purple">OFFLINE IMPORT:</span> Upload a MAL XML export file directly — no public list or API key required. Works for both animelist and mangalist exports.
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setMalXmlDragOver(true); }}
              onDragLeave={() => setMalXmlDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setMalXmlDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleMalXmlFileSelect(file);
              }}
              onClick={() => malXmlFileInputRef.current?.click()}
              className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                malXmlDragOver
                  ? "border-cyber-purple bg-cyber-purple/10"
                  : malXmlFile
                  ? "border-cyber-green bg-cyber-green/5"
                  : "border-white/30 hover:border-cyber-purple bg-white/2"
              }`}
            >
              <input
                ref={malXmlFileInputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMalXmlFileSelect(f); }}
              />
              {malXmlFile ? (
                <div className="space-y-1">
                  <div className="text-cyber-green font-black text-xs uppercase flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {malXmlFile.name}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    {(malXmlFile.size / 1024).toFixed(1)} KB — click or drop to replace
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-8 h-8 mx-auto text-gray-500" />
                  <div className="text-xs text-gray-400">
                    <span className="font-bold text-white">Drop your MAL XML file here</span> or click to browse
                  </div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider">
                    animelist_*.xml · mangalist_*.xml
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={malXmlOverwrite}
                onChange={(e) => setMalXmlOverwrite(e.target.checked)}
                className="accent-cyber-purple w-4 h-4"
              />
              <span>Overwrite existing tracking progress and scores</span>
            </label>

            {malXmlError && (
              <div className="p-3 bg-red-500/20 border border-red-500 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{malXmlError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleMalXmlPreview}
                disabled={malXmlLoading || !malXmlFile}
                className="px-4 py-2 border-2 border-white text-xs font-bold uppercase text-white hover:bg-white hover:text-black transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview File</span>
              </button>
              <button
                onClick={handleMalXmlImport}
                disabled={malXmlLoading || !malXmlFile}
                className="px-6 py-2 bg-cyber-purple text-white text-xs font-black uppercase tracking-wider border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-[#7c3aed] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                {malXmlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>Import XML File</span>
              </button>
            </div>

            {/* XML Preview Box */}
            {malXmlPreview && (
              <div className="p-4 bg-white/5 border border-white/20 space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                  <span className="font-bold text-cyber-purple uppercase">
                    MAL XML: @{malXmlPreview.username} — {malXmlPreview.mediaType === "manga" ? "Mangalist" : "Animelist"}
                  </span>
                  <span className="text-gray-400">{malXmlPreview.totalEntries} entries found</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                  {[
                    { label: "Watching", val: malXmlPreview.statusBreakdown?.watching, color: "text-cyber-cyan" },
                    { label: "Completed", val: malXmlPreview.statusBreakdown?.completed, color: "text-cyber-green" },
                    { label: "On Hold", val: malXmlPreview.statusBreakdown?.onHold, color: "text-cyber-yellow" },
                    { label: "Dropped", val: malXmlPreview.statusBreakdown?.dropped, color: "text-red-400" },
                    { label: "Plan to Watch", val: malXmlPreview.statusBreakdown?.planToWatch, color: "text-gray-300" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="p-2 border border-white/10 bg-black">
                      <div className={`text-[10px] uppercase ${color}`}>{label}</div>
                      <div className={`text-base font-black ${color}`}>{val ?? 0}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase">Sample (first 12)</div>
                  {malXmlPreview.sample?.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px] border-b border-white/5 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {s.coverImage && s.coverImage.trim() !== "" ? (
                          <img src={s.coverImage} alt={s.title} className="w-6 h-8 object-cover border border-white/20 shrink-0" />
                        ) : null}
                        <span className="text-gray-300 truncate max-w-[240px]">{s.title}</span>
                      </div>
                      <span className="text-gray-500 uppercase text-[10px] shrink-0">{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* XML Streaming Progress */}
            {malXmlProgress && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>IMPORTING XML ENTRIES...</span>
                  <span className="text-cyber-purple">
                    {malXmlProgress.current} / {malXmlProgress.total} ({malXmlProgress.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 border border-white/40 overflow-hidden">
                  <div className="bg-cyber-purple h-full transition-all duration-150" style={{ width: `${malXmlProgress.percentage}%` }} />
                </div>
                {malXmlSummary && (
                  <div className="p-3 bg-cyber-green/20 border border-cyber-green text-xs text-white space-y-1">
                    <div className="font-black text-cyber-green uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> IMPORT COMPLETE!
                    </div>
                    <div>
                      Imported: <span className="font-bold text-cyber-green">{malXmlSummary.imported}</span> • Updated: <span className="font-bold text-cyber-cyan">{malXmlSummary.updated}</span> • Skipped: <span className="font-bold text-cyber-yellow">{malXmlSummary.skipped}</span> • Failed: <span className="font-bold text-red-400">{malXmlSummary.failed}</span>
                    </div>
                  </div>
                )}
                <div className="max-h-40 overflow-y-auto border border-white/20 bg-black p-2 space-y-1 text-[11px]">
                  {malXmlLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 border-b border-white/5">
                      <span className="text-gray-300 truncate max-w-[280px]">{log.title}</span>
                      <span className={`uppercase text-[10px] font-bold ${
                        log.action === "imported" ? "text-cyber-green" : log.action === "updated" ? "text-cyber-cyan" : log.action === "skipped" ? "text-cyber-yellow" : "text-red-400"
                      }`}>{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. PLAIN TEXT LIST SUB-SECTION (PLAN TO CONSUME) */}
      {/* ==================================================== */}
      {activeSubTab === "text" && (
        <div className="space-y-5">
          <div className="p-3 bg-cyber-yellow/10 border border-cyber-yellow/30 text-xs text-gray-300 space-y-1">
            <div className="font-black text-cyber-yellow uppercase">
              PLAIN TEXT INGESTION PROTOCOL:
            </div>
            <div>
              Paste any plain text, numbered lists, bullet points, or comma-separated titles. Every imported entry will automatically be placed into your library with status <strong className="text-white uppercase font-bold">Plan to Consume</strong>.
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Target Format
                </label>
                <select
                  value={textMediaType}
                  onChange={(e) => setTextMediaType(e.target.value as any)}
                  className="px-3 py-2 bg-black border-2 border-white text-xs text-white font-mono uppercase focus:outline-none focus:border-cyber-yellow"
                >
                  <option value="anime">Anime</option>
                  <option value="manga">Manga</option>
                  <option value="game">Video Game</option>
                  <option value="movie">Movie</option>
                  <option value="series">TV Series</option>
                </select>
              </div>

              <div className="text-xs font-bold uppercase text-gray-400 border border-white/20 p-2 bg-white/5">
                Parsed Titles: <span className="text-cyber-yellow font-black">{parsedCount}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                Paste Titles (One per line or comma-separated)
              </label>
              <textarea
                value={textRaw}
                onChange={(e) => setTextRaw(e.target.value)}
                rows={8}
                placeholder={`Death Note\nAttack on Titan\nSteins;Gate\nFullmetal Alchemist: Brotherhood\nMob Psycho 100`}
                className="w-full px-3 py-2.5 bg-black border-2 border-white text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-cyber-yellow"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={textSkipExisting}
                onChange={(e) => setTextSkipExisting(e.target.checked)}
                className="accent-cyber-yellow w-4 h-4"
              />
              <span>Skip titles already present in my library</span>
            </label>

            {textError && (
              <div className="p-3 bg-red-500/20 border border-red-500 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{textError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleTextPreview}
                disabled={textLoading || parsedCount === 0}
                className="px-4 py-2 border-2 border-white text-xs font-bold uppercase text-white hover:bg-white hover:text-black transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Matching</span>
              </button>

              <button
                onClick={handleTextImport}
                disabled={textLoading || parsedCount === 0}
                className="px-6 py-2 bg-cyber-yellow text-black text-xs font-black uppercase tracking-wider border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-yellow-400 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                {textLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black" />
                )}
                <span>Import {parsedCount} Titles into Plan to Consume</span>
              </button>
            </div>
          </div>

          {/* Text Preview Box */}
          {textPreview && (
            <div className="p-4 bg-white/5 border border-white/20 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                <span className="font-bold text-cyber-yellow uppercase">
                  Text Match Preview (Sample of {textPreview.sample.length})
                </span>
                <span className="text-gray-400">
                  {textPreview.totalParsed} unique titles parsed
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto text-xs">
                {textPreview.sample.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 border border-white/10 bg-black flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-white font-bold">{item.resolvedTitle}</span>
                      {item.rawTitle !== item.resolvedTitle && (
                        <span className="text-[10px] text-gray-500 block">
                          From input: "{item.rawTitle}"
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] flex items-center gap-2 shrink-0">
                      {item.matched ? (
                        <span className="text-cyber-green font-bold">[METADATA FOUND]</span>
                      ) : (
                        <span className="text-cyber-yellow">[BARE ENTRY]</span>
                      )}
                      {item.alreadyTracked ? (
                        <span className="text-gray-500">[ALREADY IN LIBRARY]</span>
                      ) : (
                        <span className="text-cyber-cyan font-bold">[READY TO ADD]</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text Streaming Progress & Summary */}
          {textProgress && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-bold text-gray-300">
                <span>RESOLVING AND COMMITTING TITLES...</span>
                <span className="text-cyber-yellow">
                  {textProgress.current} / {textProgress.total} ({textProgress.percentage}%)
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 border border-white/40 overflow-hidden">
                <div
                  className="bg-cyber-yellow h-full transition-all duration-150"
                  style={{ width: `${textProgress.percentage}%` }}
                />
              </div>

              {textSummary && (
                <div className="p-3 bg-cyber-green/20 border border-cyber-green text-xs text-white space-y-1">
                  <div className="font-black text-cyber-green uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    IMPORT COMPLETED!
                  </div>
                  <div>
                    Added to Plan to Consume: <span className="font-bold text-cyber-green">{textSummary.imported}</span> • Skipped (Already Tracked): <span className="font-bold text-cyber-yellow">{textSummary.skipped}</span> • Failed: <span className="font-bold text-red-400">{textSummary.failed}</span>
                  </div>
                </div>
              )}

              {/* Log Stream Box */}
              <div className="max-h-48 overflow-y-auto border border-white/20 bg-black p-2 space-y-1 text-[11px]">
                {textLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5 border-b border-white/5">
                    <span className="text-gray-300 truncate max-w-[280px]">
                      {log.title}
                    </span>
                    <span
                      className={`uppercase text-[10px] font-bold ${
                        log.action === "imported" || log.action === "updated"
                          ? "text-cyber-green"
                          : log.action === "skipped"
                          ? "text-cyber-yellow"
                          : "text-red-400"
                      }`}
                    >
                      {log.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
