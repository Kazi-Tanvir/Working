import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { toMediaItem } from "@/lib/media";


export interface SearchResultItem {
  id: string;
  title: string;
  type: 'anime' | 'manga' | 'game' | 'movie' | 'series';
  releaseYear?: string;
  coverImage: string;
  rating?: string;
  isLocal?: boolean;
  localStatus?: string;
}

// ----------------------------------------------------
// HIGH-FIDELITY OFFLINE/MOCK FALLBACK DATA
// ----------------------------------------------------
const FALLBACK_MOCK_DATABASE: SearchResultItem[] = [
  // Anime
  {
    id: "mock-a1",
    title: "Death Note",
    type: "anime",
    releaseYear: "2006",
    coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    rating: "9.0/10"
  },
  {
    id: "mock-a2",
    title: "Attack on Titan",
    type: "anime",
    releaseYear: "2013",
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
    rating: "9.1/10"
  },
  {
    id: "mock-a3",
    title: "Spirited Away",
    type: "anime",
    releaseYear: "2001",
    coverImage: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&auto=format&fit=crop&q=80",
    rating: "8.9/10"
  },
  {
    id: "mock-a4",
    title: "Demon Slayer",
    type: "anime",
    releaseYear: "2019",
    coverImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    rating: "8.7/10"
  },

  // Manga
  {
    id: "mock-m1",
    title: "One Piece",
    type: "manga",
    releaseYear: "1997",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    rating: "9.2/10"
  },
  {
    id: "mock-m2",
    title: "Fullmetal Alchemist",
    type: "manga",
    releaseYear: "2001",
    coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop&q=80",
    rating: "9.1/10"
  },
  {
    id: "mock-m3",
    title: "Jujutsu Kaisen",
    type: "manga",
    releaseYear: "2018",
    coverImage: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=600&auto=format&fit=crop&q=80",
    rating: "8.6/10"
  },

  // Games
  {
    id: "mock-g1",
    title: "The Witcher 3: Wild Hunt",
    type: "game",
    releaseYear: "2015",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    rating: "9.8/10"
  },
  {
    id: "mock-g2",
    title: "Hollow Knight",
    type: "game",
    releaseYear: "2017",
    coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
    rating: "9.5/10"
  },
  {
    id: "mock-g3",
    title: "The Legend of Zelda: Breath of the Wild",
    type: "game",
    releaseYear: "2017",
    coverImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    rating: "9.7/10"
  },

  // Movies
  {
    id: "mock-mv1",
    title: "Inception",
    type: "movie",
    releaseYear: "2010",
    coverImage: "https://images.unsplash.com/photo-1539651044458-b092c41d2ec4?w=600&auto=format&fit=crop&q=80",
    rating: "8.8/10"
  },
  {
    id: "mock-mv2",
    title: "The Matrix",
    type: "movie",
    releaseYear: "1999",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    rating: "8.7/10"
  },
  {
    id: "mock-mv3",
    title: "The Dark Knight",
    type: "movie",
    releaseYear: "2008",
    coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    rating: "9.0/10"
  },

  // Series
  {
    id: "mock-s1",
    title: "Stranger Things",
    type: "series",
    releaseYear: "2016",
    coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
    rating: "8.7/10"
  },
  {
    id: "mock-s2",
    title: "The Last of Us",
    type: "series",
    releaseYear: "2023",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    rating: "8.8/10"
  },
  {
    id: "mock-s3",
    title: "Dark",
    type: "series",
    releaseYear: "2017",
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    rating: "8.9/10"
  }
];

function queryFallbackMock(query: string, type?: string): SearchResultItem[] {
  const normQuery = query.toLowerCase().trim();
  return FALLBACK_MOCK_DATABASE.filter(item => {
    const matchesType = !type || type === "all" || item.type === type;
    const matchesQuery = !normQuery || item.title.toLowerCase().includes(normQuery);
    return matchesType && matchesQuery;
  }).slice(0, 5);
}

// ----------------------------------------------------
// LOCAL JSON DATABASE SEARCH HELPER
// ----------------------------------------------------
async function searchLocalDatabase(query: string, type: string): Promise<SearchResultItem[]> {
  const normQuery = query.trim();
  const validTypes = ["anime", "manga", "game", "movie", "series"];
  const typeFilter =
    type !== "all" && validTypes.includes(type.toLowerCase())
      ? (type.toLowerCase() as MediaType)
      : undefined;

  try {
    // Note: MySQL default collation (utf8mb4_0900_ai_ci) is case-insensitive automatically
    const entries = await prisma.mediaEntry.findMany({
      where: {
        ...(typeFilter && { type: typeFilter }),
        title: {
          contains: normQuery,
        },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    });

    return entries.map((entry) => {
      const uiItem = toMediaItem(entry);
      return {
        id: `local-${entry.type}-${entry.id}`,
        title: uiItem.title,
        type: uiItem.type,
        releaseYear: String(uiItem.releaseYear),
        coverImage: uiItem.coverImage,
        rating: uiItem.rating !== "N/A" ? uiItem.rating : undefined,
        isLocal: true,
        localStatus: uiItem.status,
      };
    });
  } catch (e) {
    console.warn("[SYS_WARN] Local MySQL lookup failed:", e);
    return [];
  }
}


// ----------------------------------------------------
// ANILIST INTEGRATION (Anime & Manga)
// ----------------------------------------------------
async function searchAniList(query: string, type: "ANIME" | "MANGA"): Promise<SearchResultItem[]> {
  const graphqlQuery = `
    query ($search: String, $type: MediaType) {
      Page(page: 1, perPage: 5) {
        media(search: $search, type: $type) {
          id
          title {
            english
            romaji
          }
          coverImage {
            large
          }
          startDate {
            year
          }
          averageScore
        }
      }
    }
  `;

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          search: query,
          type: type
        }
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`AniList returned status ${response.status}`);
    }

    const json = await response.json();
    const mediaList = json.data?.Page?.media || [];

    return mediaList.map((item: any) => ({
      id: `anilist-${item.id}`,
      title: item.title.english || item.title.romaji || "Unknown Title",
      type: type === "ANIME" ? "anime" : "manga",
      releaseYear: item.startDate?.year ? String(item.startDate.year) : undefined,
      coverImage: item.coverImage?.large || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
      rating: item.averageScore ? `${(item.averageScore / 10).toFixed(1)}/10` : undefined
    }));
  } catch (error) {
    console.warn("AniList search failed, using fallback mocks:", error);
    return queryFallbackMock(query, type === "ANIME" ? "anime" : "manga");
  }
}

// ----------------------------------------------------
// TMDB INTEGRATION (Movies & TV Series)
// ----------------------------------------------------
async function searchTMDB(query: string, type: "movie" | "tv"): Promise<SearchResultItem[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.log("TMDB API Key missing, invoking fallback mocks.");
    return queryFallbackMock(query, type === "movie" ? "movie" : "series");
  }

  try {
    const endpoint = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) {
      throw new Error(`TMDB returned status ${response.status}`);
    }

    const json = await response.json();
    const results = json.results || [];

    return results.slice(0, 5).map((item: any) => {
      const releaseDate = item.release_date || item.first_air_date || "";
      const releaseYear = releaseDate ? releaseDate.split("-")[0] : undefined;
      const posterPath = item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80";

      return {
        id: `tmdb-${type}-${item.id}`,
        title: item.title || item.name || "Unknown Title",
        type: type === "movie" ? "movie" : "series",
        releaseYear,
        coverImage: posterPath,
        rating: item.vote_average ? `${item.vote_average.toFixed(1)}/10` : undefined
      };
    });
  } catch (error) {
    console.warn("TMDB search failed, using fallback mocks:", error);
    return queryFallbackMock(query, type === "movie" ? "movie" : "series");
  }
}

// ----------------------------------------------------
// RAWG INTEGRATION (Video Games)
// ----------------------------------------------------
async function searchRAWG(query: string): Promise<SearchResultItem[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.log("RAWG API Key missing, invoking fallback mocks.");
    return queryFallbackMock(query, "game");
  }

  try {
    const endpoint = `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) {
      throw new Error(`RAWG returned status ${response.status}`);
    }

    const json = await response.json();
    const results = json.results || [];

    return results.slice(0, 5).map((item: any) => {
      const releaseYear = item.released ? item.released.split("-")[0] : undefined;
      return {
        id: `rawg-${item.id}`,
        title: item.name || "Unknown Game",
        type: "game",
        releaseYear,
        coverImage: item.background_image || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
        rating: item.metacritic ? `${(item.metacritic / 10).toFixed(1)}/10` : (item.rating ? `${(item.rating * 2).toFixed(1)}/10` : undefined)
      };
    });
  } catch (error) {
    console.warn("RAWG search failed, using fallback mocks:", error);
    return queryFallbackMock(query, "game");
  }
}

// ----------------------------------------------------
// UNIFIED SEARCH ROUTINE
// ----------------------------------------------------
export async function searchMedia(query: string, type: string): Promise<SearchResultItem[]> {
  if (!query || query.trim() === "") {
    return [];
  }

  const normalizedType = type.toLowerCase();

  // 1. Fetch matching records from local database collections first
  const localResults = await searchLocalDatabase(query, normalizedType);

  // 2. Fetch records from external endpoints (or offline fallback list)
  let externalResults: SearchResultItem[] = [];

  switch (normalizedType) {
    case "anime":
      externalResults = await searchAniList(query, "ANIME");
      break;
    case "manga":
      externalResults = await searchAniList(query, "MANGA");
      break;
    case "movie":
      externalResults = await searchTMDB(query, "movie");
      break;
    case "series":
      externalResults = await searchTMDB(query, "tv");
      break;
    case "game":
      externalResults = await searchRAWG(query);
      break;
    case "all":
    default: {
      const promises = [
        searchAniList(query, "ANIME"),
        searchAniList(query, "MANGA"),
        searchTMDB(query, "movie"),
        searchTMDB(query, "tv"),
        searchRAWG(query)
      ];
      
      try {
        const fetchResults = await Promise.all(promises);
        externalResults = fetchResults.flat();
      } catch (err) {
        console.warn("Unified external fetch failed, using offline fallback mocks", err);
        externalResults = queryFallbackMock(query, "all");
      }
      break;
    }
  }

  // 3. Merge and de-duplicate by title (case-insensitive) to prevent repeats
  const merged = [...localResults];
  const titlesSeen = new Set(localResults.map(r => r.title.toLowerCase()));

  for (const item of externalResults) {
    if (!titlesSeen.has(item.title.toLowerCase())) {
      merged.push(item);
      titlesSeen.add(item.title.toLowerCase());
    }
  }

  // Return top 12 combined matches
  return merged.slice(0, 12);
}
