"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Plus, 
  Star, 
  Calendar, 
  Hash, 
  Image as ImageIcon, 
  Sliders,
  AlertTriangle,
  Search,
  Loader2,
  Check,
  Film,
  Tv,
  BookOpen,
  Gamepad2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import Badge from "./Badge";
import { showToast } from "@/components/common/Toast";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchResultItem } from "@/utils/apiHelpers";
import { MediaItem } from "./MediaCard";
import { DEFAULT_COVER_IMAGES, getCoverImage } from "@/utils/mediaDefaults";

interface CreateMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: "anime" | "manga" | "game" | "movie" | "series";
  onItemAdded?: (item: MediaItem) => void;
}



const SUGGESTIONS: Record<string, string[]> = {
  anime: ["Solo Leveling", "Frieren", "Chainsaw Man", "Demon Slayer", "Jujutsu Kaisen", "Attack on Titan"],
  manga: ["Berserk", "One Piece", "Vagabond", "Monster", "Chainsaw Man", "Tokyo Ghoul"],
  game: ["Elden Ring", "Cyberpunk 2077", "Hades", "The Witcher 3", "Hollow Knight", "Sekiro"],
  movie: ["Oppenheimer", "Dune: Part Two", "Interstellar", "The Dark Knight", "Inception", "Spider-Man"],
  series: ["Severance", "Shogun", "The Last of Us", "Dark", "Breaking Bad", "Stranger Things"],
};

const TRENDING_CATALOG: Record<string, SearchResultItem[]> = {
  anime: [
    {
      id: "trend-a1",
      title: "Attack on Titan",
      type: "anime",
      releaseYear: "2013",
      coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
      rating: "9.1/10",
    },
    {
      id: "trend-a2",
      title: "Death Note",
      type: "anime",
      releaseYear: "2006",
      coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
      rating: "9.0/10",
    },
    {
      id: "trend-a3",
      title: "Demon Slayer",
      type: "anime",
      releaseYear: "2019",
      coverImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
      rating: "8.7/10",
    },
    {
      id: "trend-a4",
      title: "Spirited Away",
      type: "anime",
      releaseYear: "2001",
      coverImage: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&auto=format&fit=crop&q=80",
      rating: "8.9/10",
    },
  ],
  manga: [
    {
      id: "trend-m1",
      title: "One Piece",
      type: "manga",
      releaseYear: "1997",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      rating: "9.2/10",
    },
    {
      id: "trend-m2",
      title: "Fullmetal Alchemist",
      type: "manga",
      releaseYear: "2001",
      coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop&q=80",
      rating: "9.1/10",
    },
    {
      id: "trend-m3",
      title: "Jujutsu Kaisen",
      type: "manga",
      releaseYear: "2018",
      coverImage: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&auto=format&fit=crop&q=80",
      rating: "8.6/10",
    },
    {
      id: "trend-m4",
      title: "Chainsaw Man",
      type: "manga",
      releaseYear: "2018",
      coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
      rating: "8.8/10",
    },
  ],
  game: [
    {
      id: "trend-g1",
      title: "The Witcher 3: Wild Hunt",
      type: "game",
      releaseYear: "2015",
      coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
      rating: "9.8/10",
    },
    {
      id: "trend-g2",
      title: "Hollow Knight",
      type: "game",
      releaseYear: "2017",
      coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
      rating: "9.5/10",
    },
    {
      id: "trend-g3",
      title: "The Legend of Zelda: Breath of the Wild",
      type: "game",
      releaseYear: "2017",
      coverImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
      rating: "9.7/10",
    },
    {
      id: "trend-g4",
      title: "Elden Ring",
      type: "game",
      releaseYear: "2022",
      coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
      rating: "9.6/10",
    },
  ],
  movie: [
    {
      id: "trend-mv1",
      title: "Inception",
      type: "movie",
      releaseYear: "2010",
      coverImage: "https://images.unsplash.com/photo-1539651044458-b092c41d2ec4?w=600&auto=format&fit=crop&q=80",
      rating: "8.8/10",
    },
    {
      id: "trend-mv2",
      title: "The Matrix",
      type: "movie",
      releaseYear: "1999",
      coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
      rating: "8.7/10",
    },
    {
      id: "trend-mv3",
      title: "The Dark Knight",
      type: "movie",
      releaseYear: "2008",
      coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
      rating: "9.0/10",
    },
    {
      id: "trend-mv4",
      title: "Interstellar",
      type: "movie",
      releaseYear: "2014",
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
      rating: "8.7/10",
    },
  ],
  series: [
    {
      id: "trend-s1",
      title: "Stranger Things",
      type: "series",
      releaseYear: "2016",
      coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
      rating: "8.7/10",
    },
    {
      id: "trend-s2",
      title: "The Last of Us",
      type: "series",
      releaseYear: "2023",
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
      rating: "8.8/10",
    },
    {
      id: "trend-s3",
      title: "Dark",
      type: "series",
      releaseYear: "2017",
      coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
      rating: "8.9/10",
    },
    {
      id: "trend-s4",
      title: "Severance",
      type: "series",
      releaseYear: "2022",
      coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
      rating: "8.7/10",
    },
  ],
};

export default function CreateMediaModal({ isOpen, onClose, defaultType, onItemAdded }: CreateMediaModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "manual">("search");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<string>(defaultType);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 350);

  // Manual Form Fields
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"anime" | "manga" | "game" | "movie" | "series">(defaultType);
  const [releaseYear, setReleaseYear] = useState(String(new Date().getFullYear()));
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState("");
  const [genres, setGenres] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync types and clear form on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab("search");
      setSearchQuery("");
      setSearchType(defaultType);
      setSearchResults([]);
      setAddedIds({});
      setAddingIds({});

      setTitle("");
      setType(defaultType);
      setReleaseYear(String(new Date().getFullYear()));
      setRating("");
      setStatus("");
      setProgress("");
      setGenres("");
      setCoverImage("");
      setErrorMsg("");

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultType]);

  // Lock scroll on body and handle Escape key down to close modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Set type-specific defaults when manual type changes
  useEffect(() => {
    if (type === "manga") {
      setStatus("Plan to Read");
      setProgress("0/? CH");
    } else if (type === "game") {
      setStatus("Plan to Play");
      setProgress("0 hrs");
    } else if (type === "movie") {
      setStatus("Plan to Watch");
      setProgress("0 mins");
    } else if (type === "series") {
      setStatus("Plan to Watch");
      setProgress("S1E01");
    } else {
      setStatus("Plan to Watch");
      setProgress("0/? EP");
    }
  }, [type]);

  // Search API execution
  useEffect(() => {
    async function executeSearch() {
      if (!debouncedQuery || debouncedQuery.trim() === "") {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${searchType}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Search fetch failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }

    if (activeTab === "search") {
      executeSearch();
    }
  }, [debouncedQuery, searchType, activeTab]);

  if (!isOpen || !mounted) return null;

  const getTypeMeta = (mediaType: string) => {
    switch (mediaType) {
      case "anime":
        return {
          color: "var(--cyber-purple)",
          borderClass: "border-cyber-purple",
          shadowClass: "neo-shadow-purple",
          accentText: "text-cyber-purple",
          accentBg: "bg-cyber-purple",
          progressPlaceholder: "e.g. 0/12 EP"
        };
      case "manga":
        return {
          color: "var(--cyber-orange)",
          borderClass: "border-cyber-orange",
          shadowClass: "neo-shadow-orange",
          accentText: "text-cyber-orange",
          accentBg: "bg-cyber-orange",
          progressPlaceholder: "e.g. 0/147 CH"
        };
      case "game":
        return {
          color: "var(--cyber-green)",
          borderClass: "border-cyber-green",
          shadowClass: "neo-shadow-green",
          accentText: "text-cyber-green",
          accentBg: "bg-cyber-green",
          progressPlaceholder: "e.g. 0 hrs"
        };
      case "movie":
        return {
          color: "var(--cyber-yellow)",
          borderClass: "border-cyber-yellow",
          shadowClass: "neo-shadow-yellow",
          accentText: "text-cyber-yellow",
          accentBg: "bg-cyber-yellow",
          progressPlaceholder: "e.g. 120 mins"
        };
      case "series":
        return {
          color: "var(--cyber-cyan)",
          borderClass: "border-cyber-cyan",
          shadowClass: "neo-shadow-cyan",
          accentText: "text-cyber-cyan",
          accentBg: "bg-cyber-cyan",
          progressPlaceholder: "e.g. S1E01"
        };
      default:
        return {
          color: "#ffffff",
          borderClass: "border-white",
          shadowClass: "neo-shadow",
          accentText: "text-white",
          accentBg: "bg-white",
          progressPlaceholder: "e.g. 0"
        };
    }
  };

  const meta = getTypeMeta(defaultType);

  const getMediaIcon = (itemType: string) => {
    switch (itemType) {
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

  // Instant add from search results
  const handleQuickAdd = async (item: SearchResultItem) => {
    if (addingIds[item.id] || addedIds[item.id]) return;

    setAddingIds(prev => ({ ...prev, [item.id]: true }));

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
        setAddedIds(prev => ({ ...prev, [item.id]: true }));
        showToast(`✓ Added "${item.title}" to ${item.type.toUpperCase()} archive`, "success");
        if (onItemAdded && data.entry) {
          onItemAdded(data.entry);
        }
        router.refresh();
      } else if (res.status === 409) {
        setAddedIds(prev => ({ ...prev, [item.id]: true }));
        showToast(`"${item.title}" is already in your database`, "info");
      } else if (res.status === 401) {
        showToast("Please authenticate to add items to your library", "error");
      } else {
        showToast(data.error || "Failed to add item.", "error");
      }
    } catch (err) {
      console.error("Quick add failed:", err);
      showToast("Network error while adding item.", "error");
    } finally {
      setAddingIds(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Manual Form Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    let cleanRating = "N/A";
    const rateVal = parseFloat(rating);
    if (!isNaN(rateVal)) {
      cleanRating = `${rateVal.toFixed(1)}/10`;
    }

    const genreArray = genres
      .split(",")
      .map(g => g.trim())
      .filter(g => g !== "");

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          releaseYear: parseInt(releaseYear) || new Date().getFullYear(),
          rating: cleanRating,
          status,
          progress: progress.trim(),
          genres: genreArray,
          coverImage: coverImage.trim() || DEFAULT_COVER_IMAGES[type]
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create item.");
      }

      if (onItemAdded && data.entry) {
        onItemAdded(data.entry);
      }
      router.refresh();
      onClose();
      showToast(`Successfully created record: "${title.trim()}"`, "success");
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to create item.");
      showToast(e.message || "Failed to create item.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToManualWithTitle = (customTitle: string) => {
    setTitle(customTitle);
    setType(defaultType);
    setActiveTab("manual");
  };

  const currentSuggestions = SUGGESTIONS[defaultType] || SUGGESTIONS.anime;
  const aspectClass = type === "game" ? "aspect-video md:aspect-[16/10]" : "aspect-[2/3]";

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none transition-all duration-300"
    >
      {/* Neobrutalist Modal Outer Box */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl max-h-[92vh] overflow-hidden bg-[#09090b] border-2 text-white ${meta.borderClass} ${meta.shadowClass} p-5 sm:p-7 flex flex-col gap-4 font-sans`}
      >
        {/* Top Control Bar & Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5 select-none">
          <div className="flex items-center gap-2.5">
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${meta.accentBg} text-black border border-white`}>
              ADD {defaultType.toUpperCase()}
            </span>
            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest hidden sm:inline">
              GLOBAL_DATABASE_SYNC
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center border border-white/20 bg-black p-0.5 text-xs font-mono">
              <button
                id="btn-tab-search"
                type="button"
                onClick={() => {
                  setActiveTab("search");
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className={`px-3 py-1 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "search"
                    ? `${meta.accentBg} text-black font-bold shadow-[2px_2px_0px_0px_#ffffff]`
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
              <button
                id="btn-tab-manual"
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`px-3 py-1 flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "manual"
                    ? "bg-white text-black font-bold shadow-[2px_2px_0px_0px_#ffffff]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Manual</span>
              </button>
            </div>

            <button
              id="btn-close-modal"
              onClick={onClose}
              className="p-1.5 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Close Dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: SEARCH & INSTANT DISCOVERY */}
        {activeTab === "search" && (
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Search Input Box */}
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center bg-black border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-within:shadow-[3px_3px_0px_0px_var(--cyber-cyan)] transition-all">
                <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  id="input-media-search"
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`SEARCH ${defaultType.toUpperCase()} ARCHIVES... (AniList, TMDB, RAWG)`}
                  className="w-full bg-transparent text-white pl-10 pr-9 py-2.5 font-mono uppercase tracking-wider text-xs sm:text-sm outline-none placeholder:text-gray-600 focus:placeholder:text-gray-700"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scope filter pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="uppercase text-gray-600">FILTER SCOPE:</span>
                  {(["all", "anime", "manga", "game", "movie", "series"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSearchType(t)}
                      className={`px-2 py-0.5 border uppercase transition-all cursor-pointer ${
                        searchType === t
                          ? "border-white bg-white text-black font-bold"
                          : "border-white/10 text-gray-400 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {isSearching && (
                  <span className="flex items-center gap-1 text-cyber-cyan animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>SCANNING DATABASES...</span>
                  </span>
                )}
              </div>
            </div>

            {/* Rich Idle State with Trending Items & Quick Suggestion Chips */}
            {!searchQuery && (
              <div className="flex flex-col gap-3 py-3 border-t border-dashed border-white/10 overflow-hidden">
                {/* Suggestion Chips */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
                    <Sparkles className="w-3.5 h-3.5 text-cyber-yellow" />
                    <span className="uppercase font-bold tracking-wider">Quick Suggestions for {defaultType.toUpperCase()}:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setSearchQuery(sug)}
                        className="px-2.5 py-1 text-xs font-mono bg-[#141417] border border-white/15 text-gray-300 hover:text-white hover:border-white transition-all cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular & Trending Discovery Showcase */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400 border-t border-white/5 pt-2.5">
                    <span className="uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyber-cyan" />
                      Trending in {defaultType.toUpperCase()}:
                    </span>
                    <span className="text-[10px] text-gray-500">Instant 1-Click Add</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto pr-1">
                    {(TRENDING_CATALOG[defaultType] || TRENDING_CATALOG.anime).map((item) => {
                      const isAdded = Boolean(addedIds[item.id]);
                      const isAdding = Boolean(addingIds[item.id]);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2.5 p-2 bg-[#111115] hover:bg-[#181820] border border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-13 shrink-0 bg-black border border-white/20 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getCoverImage(item.coverImage, item.type)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER_IMAGES[item.type] || DEFAULT_COVER_IMAGES.anime;
                                }}
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-white truncate leading-tight">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {item.releaseYear} · ★ {item.rating}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickAdd(item)}
                            disabled={isAdded || isAdding}
                            className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase shrink-0 border transition-all cursor-pointer ${
                              isAdded
                                ? "bg-cyber-green text-black border-cyber-green cursor-default"
                                : isAdding
                                ? "bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan animate-pulse"
                                : "bg-white text-black border-white hover:bg-cyber-purple hover:text-white"
                            }`}
                          >
                            {isAdded ? "✓ Added" : isAdding ? "..." : "+ Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Search Results List */}
            {searchQuery && (
              <div className="max-h-[50vh] overflow-y-auto pr-1 flex flex-col gap-2.5 divide-y divide-white/5">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => {
                    const isAdded = Boolean(addedIds[item.id] || item.isLocal);
                    const isAdding = Boolean(addingIds[item.id]);

                    return (
                      <div
                        key={item.id}
                        className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2 bg-[#101014] hover:bg-[#16161c] border border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail */}
                          <div className="w-12 h-16 shrink-0 bg-black border border-white/20 overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getCoverImage(item.coverImage, item.type)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  DEFAULT_COVER_IMAGES[item.type] || DEFAULT_COVER_IMAGES.anime;
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex flex-col gap-1 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                              {item.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-gray-400">
                              <span className="flex items-center gap-1 uppercase px-1.5 py-0.2 border border-white/20 bg-black text-gray-300">
                                {getMediaIcon(item.type)}
                                {item.type}
                              </span>
                              {item.releaseYear && <span>{item.releaseYear}</span>}
                              {item.rating && (
                                <span className="flex items-center gap-0.5 text-cyber-yellow">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  {item.rating}
                                </span>
                              )}
                              {item.isLocal && item.localStatus && (
                                <span className="text-cyber-green font-bold">
                                  [IN ARCHIVE • {item.localStatus}]
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0">
                          {isAdded ? (
                            <button
                              disabled
                              className="px-3 py-1.5 text-xs font-mono font-bold border border-cyber-green/50 text-cyber-green bg-cyber-green/10 flex items-center gap-1 cursor-default"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">IN ARCHIVE</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleQuickAdd(item)}
                              disabled={isAdding}
                              className={`px-3 py-1.5 text-xs font-mono font-bold border-2 border-white bg-white text-black hover:bg-cyber-cyan hover:border-cyber-cyan transition-all flex items-center gap-1 cursor-pointer active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] ${
                                isAdding ? "opacity-60 cursor-wait" : ""
                              }`}
                            >
                              {isAdding ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>ADDING...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>ADD</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : !isSearching ? (
                  <div className="border border-dashed border-white/20 p-8 text-center flex flex-col items-center justify-center gap-2.5 font-mono">
                    <span className="text-gray-400 text-xs font-bold uppercase">
                      NO MATCHING RECORDS LOCATED IN EXTERNAL ARCHIVES
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Cannot find &ldquo;{searchQuery}&rdquo; online? You can create a custom record manually.
                    </span>
                    <button
                      type="button"
                      onClick={() => switchToManualWithTitle(searchQuery)}
                      className="mt-2 px-4 py-1.5 bg-white text-black text-xs font-bold font-mono border border-white hover:bg-cyber-yellow transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Create custom &ldquo;{searchQuery}&rdquo; manually</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL FORM */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
            {errorMsg && (
              <div className="border border-cyber-red bg-cyber-red/10 text-cyber-red text-xs px-4 py-2 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-5">
              {/* Left Cover preview column */}
              <div className="w-full md:w-1/3 flex flex-col gap-3">
                <div className={`relative w-full ${aspectClass} overflow-hidden border border-white/20 bg-[#000]`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getCoverImage(coverImage, type)}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                    onError={() => setCoverImage(DEFAULT_COVER_IMAGES[type] || DEFAULT_COVER_IMAGES.anime)}
                  />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <label className="text-gray-400 font-mono flex items-center gap-1 text-[11px]">
                    <ImageIcon className="w-3.5 h-3.5" /> COVER IMAGE URL
                  </label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    placeholder="Optional image URL"
                    className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono text-[11px] focus:border-white outline-none"
                  />
                </div>
              </div>

              {/* Right fields column */}
              <div className="w-full md:w-2/3 flex flex-col gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Title */}
                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-1 text-xs">
                    <label className="text-gray-400 font-mono text-[11px]">MEDIA TITLE *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Solo Leveling"
                      className="w-full bg-[#111] text-white border border-white/20 p-2 font-bold focus:border-white outline-none"
                    />
                  </div>

                  {/* Media Type */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-gray-400 font-mono text-[11px]">MEDIA CLASSIFICATION</label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as any)}
                      className="w-full bg-[#111] text-white border border-white/20 p-2 focus:border-white outline-none font-bold"
                    >
                      <option value="anime">Anime</option>
                      <option value="manga">Manga</option>
                      <option value="game">Game</option>
                      <option value="movie">Movie</option>
                      <option value="series">Series</option>
                    </select>
                  </div>

                  {/* Release Year */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-gray-400 font-mono flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" /> RELEASE YEAR
                    </label>
                    <input
                      type="number"
                      value={releaseYear}
                      onChange={e => setReleaseYear(e.target.value)}
                      className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono focus:border-white outline-none"
                    />
                  </div>

                  {/* Rating */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-gray-400 font-mono flex items-center gap-1 text-[11px]">
                      <Star className="w-3.5 h-3.5" /> SCORE (0.0 - 10.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={rating}
                      onChange={e => setRating(e.target.value)}
                      placeholder="e.g. 9.0"
                      className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono focus:border-white outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-gray-400 font-mono flex items-center gap-1 text-[11px]">
                      <Sliders className="w-3.5 h-3.5" /> TRACKING STATUS
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full bg-[#111] text-white border border-white/20 p-2 focus:border-white outline-none font-bold"
                    >
                      {type === "manga" ? (
                        <>
                          <option value="Plan to Read">Plan to Read</option>
                          <option value="Reading">Reading</option>
                        </>
                      ) : type === "game" ? (
                        <>
                          <option value="Plan to Play">Plan to Play</option>
                          <option value="Playing">Playing</option>
                        </>
                      ) : type === "movie" ? (
                        <>
                          <option value="Plan to Watch">Plan to Watch</option>
                        </>
                      ) : (
                        <>
                          <option value="Plan to Watch">Plan to Watch</option>
                          <option value="Watching">Watching</option>
                        </>
                      )}
                      <option value="Completed">Completed</option>
                      {type !== "movie" && <option value="On Hold">On Hold</option>}
                      <option value="Dropped">Dropped</option>
                    </select>
                  </div>

                  {/* Progress */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-gray-400 font-mono flex items-center gap-1 text-[11px]">
                      <Hash className="w-3.5 h-3.5" /> INITIAL PROGRESS
                    </label>
                    <input
                      type="text"
                      value={progress}
                      onChange={e => setProgress(e.target.value)}
                      placeholder={meta.progressPlaceholder}
                      className="w-full bg-[#111] text-white border border-white/20 p-2 font-mono focus:border-white outline-none"
                    />
                  </div>

                  {/* Genres */}
                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-1 text-xs">
                    <label className="text-gray-400 font-mono text-[11px]">GENRES (COMMA-SEPARATED)</label>
                    <input
                      type="text"
                      value={genres}
                      onChange={e => setGenres(e.target.value)}
                      placeholder="Action, Adventure, Fantasy"
                      className="w-full bg-[#111] text-white border border-white/20 p-2 focus:border-white outline-none"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("search")}
                    className="text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Back to Search
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-white/20 text-gray-300 font-bold hover:text-white hover:border-white transition-all cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-white text-black border-2 border-white hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,255,102,1)] font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Plus className="w-4 h-4" /> {isSubmitting ? "Saving..." : "Save Record"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
