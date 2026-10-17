"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plus, Check, Film, Tv, BookOpen, Gamepad2, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import type { SearchResultItem } from "@/utils/apiHelpers";
import Badge from "./Badge";
import { getCoverImage, DEFAULT_COVER_IMAGES } from "@/utils/mediaDefaults";

export default function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
  const [errorIds, setErrorIds] = useState<Record<string, string>>({});

  const debouncedQuery = useDebounce(query, 400);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search, and Escape to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "/" &&
        document.activeElement !== inputRef.current &&
        !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch search results from API Route
  useEffect(() => {
    async function fetchResults() {
      if (!debouncedQuery || debouncedQuery.trim() === "") {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${searchType}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Failed to fetch search results", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [debouncedQuery, searchType]);

  // Actually add item to local JSON database via POST /api/track
  const handleAddItem = async (e: React.MouseEvent, item: SearchResultItem) => {
    e.stopPropagation();

    // Prevent double-clicks
    if (addingIds[item.id] || addedIds[item.id]) return;

    setAddingIds(prev => ({ ...prev, [item.id]: true }));
    setErrorIds(prev => ({ ...prev, [item.id]: "" }));

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: item.mediaId || (item.id.includes("-") ? undefined : item.id),
          title: item.title,
          type: item.type,
          releaseYear: item.releaseYear,
          coverImage: item.coverImage,
          rating: item.rating,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Permanently mark as added
        setAddedIds(prev => ({ ...prev, [item.id]: true }));
        router.refresh();
      } else if (res.status === 409) {
        // Already exists in user's library — mark as added
        setAddedIds(prev => ({ ...prev, [item.id]: true }));
        router.refresh();
      } else if (res.status === 401) {
        setErrorIds(prev => ({ ...prev, [item.id]: "LOGIN REQ" }));
        setTimeout(() => {
          setErrorIds(prev => ({ ...prev, [item.id]: "" }));
        }, 4000);
      } else {
        setErrorIds(prev => ({ ...prev, [item.id]: data.error || "Failed to add" }));
        // Clear error after 4s
        setTimeout(() => {
          setErrorIds(prev => ({ ...prev, [item.id]: "" }));
        }, 4000);
      }
    } catch (err) {
      console.error("Failed to add item to database", err);
      setErrorIds(prev => ({ ...prev, [item.id]: "Network error" }));
      setTimeout(() => {
        setErrorIds(prev => ({ ...prev, [item.id]: "" }));
      }, 4000);
    } finally {
      setAddingIds(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "anime":
      case "series":
        return <Tv className="w-3.5 h-3.5" />;
      case "manga":
        return <BookOpen className="w-3.5 h-3.5" />;
      case "game":
        return <Gamepad2 className="w-3.5 h-3.5" />;
      case "movie":
      default:
        return <Film className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full font-mono z-50 ${className || ""}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center bg-black border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-within:shadow-[4px_4px_0px_0px_var(--cyber-purple)] transition-all z-10">
        <Search className="absolute left-3 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="SEARCH EXTERNAL & LOCAL DATABASES... [/]"
          className="w-full bg-transparent text-white pl-11 pr-10 py-3 uppercase tracking-wider text-sm outline-none placeholder:text-gray-600 focus:placeholder:text-gray-700"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Solid Opaque Result Dropdown Panel */}
      {isOpen && (query.trim() !== "") && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0f] border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] z-50 overflow-hidden">
          {/* Quick Filter tabs */}
          <div className="flex border-b-2 border-white bg-black overflow-x-auto text-[10px] uppercase font-bold scrollbar-none">
            {["all", "anime", "manga", "game", "movie", "series"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSearchType(tab)}
                className={`px-4 py-2 border-r-2 border-white transition-all select-none hover:bg-white/10 ${
                  searchType === tab ? "bg-cyber-purple text-white" : "text-gray-400"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Core Results display (Solid background layout) */}
          <div className="max-h-[360px] overflow-y-auto bg-[#0d0d0f]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400 bg-black/40">
                <Loader2 className="w-6 h-6 animate-spin text-cyber-purple" />
                <span className="text-xs uppercase tracking-widest">[STATUS: TUNING_ANTENNA...]</span>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y-2 divide-white bg-[#0d0d0f]">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 gap-3 bg-[#0d0d0f] hover:bg-white/5 transition-all group"
                  >
                    {/* Cover Thumbnail & Meta details */}
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getCoverImage(item.coverImage, item.type)}
                        alt={item.title}
                        className="w-12 h-16 object-cover border border-white grayscale group-hover:grayscale-0 transition-all duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER_IMAGES[item.type] || DEFAULT_COVER_IMAGES.anime;
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold text-white uppercase group-hover:text-cyber-cyan transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge color="white" className="!border-white/40 text-[9px] py-0 px-1">
                            <span className="flex items-center gap-1">
                              {getMediaIcon(item.type)}
                              {item.type}
                            </span>
                          </Badge>
                          {item.releaseYear && (
                            <span className="text-[10px] text-gray-500 font-mono">
                              [{item.releaseYear}]
                            </span>
                          )}
                          {item.rating && (
                            <span className="text-[10px] text-cyber-yellow font-extrabold font-mono">
                              ★ {item.rating}
                            </span>
                          )}
                          {item.isLocal && item.localStatus && (
                            <span className="text-[9px] font-mono font-extrabold uppercase bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 px-1.5 py-0.5 rounded-sm">
                              [IN LIST: {item.localStatus}]
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {item.isLocal ? (
                      <button
                        disabled
                        className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-1.5 border bg-cyber-green/15 text-cyber-green border-cyber-green/30 cursor-not-allowed select-none shrink-0"
                      >
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-cyber-green" />
                          [TRACKED]
                        </span>
                      </button>
                    ) : errorIds[item.id] ? (
                      <button
                        disabled
                        className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-1.5 border bg-cyber-red/15 text-cyber-red border-cyber-red/30 cursor-not-allowed select-none shrink-0"
                      >
                        <span className="flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          [ERROR]
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleAddItem(e, item)}
                        disabled={addedIds[item.id] || addingIds[item.id]}
                        className={`font-mono text-[10px] font-extrabold uppercase px-2.5 py-1.5 border transition-all shrink-0 ${
                          addedIds[item.id]
                            ? "bg-cyber-green text-black border-cyber-green cursor-not-allowed"
                            : addingIds[item.id]
                            ? "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/40 cursor-wait"
                            : "bg-black text-white border-white hover:bg-white hover:text-black hover:scale-95 cursor-pointer"
                        }`}
                      >
                        {addedIds[item.id] ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            [ADDED]
                          </span>
                        ) : addingIds[item.id] ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ADDING...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            ADD TRACK
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-500 bg-black/40">
                <span className="text-xs font-bold uppercase tracking-widest">[SYSTEM_NOTICE: NO_RECORDS_FOUND]</span>
                <span className="text-[10px] text-gray-600">TRY WIDENING SEARCH KEYWORDS OR RESETTING TABS</span>
              </div>
            )}
          </div>

          {/* Terminal Command Status Footer */}
          <div className="bg-black border-t-2 border-white px-3 py-1.5 text-[9px] text-gray-500 flex justify-between uppercase">
            <span>[SEARCH_MODULE: v1.2.0]</span>
            <span>DATABASES: OK // SYNCED</span>
          </div>
        </div>
      )}
    </div>
  );
}
