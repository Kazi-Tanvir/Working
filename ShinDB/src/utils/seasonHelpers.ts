// src/utils/seasonHelpers.ts

export interface SeasonData {
  seasonNumber: number;
  title?: string;
  episodeCount: number;
  episodesWatched: number;
  isCompleted: boolean;
}

// Canonical season episode patterns for popular series & multi-season anime
export const CANONICAL_SEASONS_MAP: Record<string, number[]> = {
  // TV Series
  "the witcher": [8, 8, 8, 8],
  "peaky blinders": [6, 6, 6, 6, 6, 6],
  "sherlock": [3, 3, 3, 3],
  "narcos": [10, 10, 10],
  "breaking bad": [7, 13, 13, 13, 16],
  "invincible": [8, 8, 8],
  "ozark": [10, 10, 10, 14],
  "game of thrones": [10, 10, 10, 10, 10, 10, 7, 6],
  "dark": [10, 8, 8],
  "stranger things": [8, 9, 8, 9],
  "the boys": [8, 8, 8, 8, 8],
  "better call saul": [10, 10, 10, 10, 10, 13],
  "severance": [9, 10],
  "house of the dragon": [10, 8, 8],
  "chernobyl": [5],
  "shogun": [10],
  "hannibal": [13, 13, 13],
  "gen v": [8, 8],

  // Anime
  "dan da dan": [12, 12, 12],
  "jujutsu kaisen": [24, 23],
  "demon slayer: kimetsu no yaiba": [26, 7, 11, 11, 8],
  "attack on titan": [25, 12, 22, 28],
  "haikyu!!": [25, 25, 10, 25],
  "kaguya-sama: love is war": [12, 12, 13],
  "bocchi the rock!": [12, 12],
  "delicious in dungeon": [24, 12],
  "mob psycho 100": [12, 13, 12],
  "vinland saga": [24, 24],
  "classroom of the elite": [12, 13, 13],
  "dr. stone": [24, 11, 22],
  "one-punch man": [12, 12],
  "chainsaw man": [12, 12],
  "bleach: thousand-year blood war": [13, 13, 10],
  "re:zero": [25, 25, 16],
  "hell's paradise": [13, 12],
  "the apothecary diaries": [24, 12]
};

// Canonical external ratings map (IMDb / MAL out of 10)
export const CANONICAL_EXTERNAL_RATINGS: Record<string, number> = {
  "the witcher": 7.9,
  "peaky blinders": 8.8,
  "sherlock": 8.9,
  "breaking bad": 9.5,
  "better call saul": 9.0,
  "game of thrones": 9.2,
  "dark": 8.7,
  "stranger things": 8.7,
  "the boys": 8.7,
  "narcos": 8.8,
  "ozark": 8.5,
  "invincible": 8.7,
  "shogun": 8.7,
  "severance": 8.7,
  "house of the dragon": 8.4,
  "chernobyl": 9.3,
  "death note": 8.7,
  "fullmetal alchemist: brotherhood": 9.1,
  "hunter x hunter": 9.0,
  "attack on titan": 9.1,
  "jujutsu kaisen": 8.5,
  "demon slayer: kimetsu no yaiba": 8.6,
  "frieren: beyond journey's end": 9.1,
  "bleach": 8.2,
  "one piece": 9.0,
  "dan da dan": 8.4,
  "bocchi the rock!": 8.7,
  "delicious in dungeon": 8.4,
  "chainsaw man": 8.4,
  "vinland saga": 8.8,
  "haikyu!!": 8.7,
  "kaguya-sama: love is war": 8.7
};

function matchesCanonicalTitle(cleanTitle: string, canonicalKey: string): boolean {
  if (cleanTitle === canonicalKey) return true;
  const escaped = canonicalKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return regex.test(cleanTitle);
}

/**
 * Generate default structured seasons for a title
 */
export function generateDefaultSeasons(
  title: string,
  totalEpisodes?: number | null,
  currentWatched: number = 0
): SeasonData[] {
  const cleanTitle = title.toLowerCase().trim();
  
  // 1. Check known canonical patterns (sorted by length descending for best specificity)
  const sortedSeasonKeys = Object.keys(CANONICAL_SEASONS_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedSeasonKeys) {
    if (matchesCanonicalTitle(cleanTitle, key)) {
      const pattern = CANONICAL_SEASONS_MAP[key];
      let remaining = currentWatched;
      return pattern.map((eps, idx) => {
        const sNum = idx + 1;
        const watched = Math.min(eps, Math.max(0, remaining));
        remaining -= watched;
        return {
          seasonNumber: sNum,
          title: `Season ${sNum}`,
          episodeCount: eps,
          episodesWatched: watched,
          isCompleted: watched >= eps
        };
      });
    }
  }

  // 2. Fallback based on total episodes
  if (totalEpisodes && totalEpisodes > 0) {
    if (totalEpisodes <= 16) {
      const watched = Math.min(totalEpisodes, Math.max(0, currentWatched));
      return [
        {
          seasonNumber: 1,
          title: "Season 1",
          episodeCount: totalEpisodes,
          episodesWatched: watched,
          isCompleted: watched >= totalEpisodes
        }
      ];
    } else {
      // Split into approximate seasons of 10-13 episodes
      const seasonSize = totalEpisodes <= 26 ? 12 : 10;
      const seasonCount = Math.ceil(totalEpisodes / seasonSize);
      let remaining = currentWatched;
      let totalRemaining = totalEpisodes;

      const seasons: SeasonData[] = [];
      for (let i = 1; i <= seasonCount; i++) {
        const eps = i === seasonCount ? totalRemaining : seasonSize;
        totalRemaining -= eps;
        const watched = Math.min(eps, Math.max(0, remaining));
        remaining -= watched;

        seasons.push({
          seasonNumber: i,
          title: `Season ${i}`,
          episodeCount: eps,
          episodesWatched: watched,
          isCompleted: watched >= eps
        });
      }
      return seasons;
    }
  }

  // 3. Fallback default season
  return [
    {
      seasonNumber: 1,
      title: "Season 1",
      episodeCount: 12,
      episodesWatched: Math.min(12, Math.max(0, currentWatched)),
      isCompleted: currentWatched >= 12
    }
  ];
}

/**
 * Sync total episodes watched across seasons array
 */
export function syncSeasonsWithTotalWatched(
  seasons: SeasonData[],
  totalWatched: number
): SeasonData[] {
  let remaining = totalWatched;
  return seasons.map(s => {
    const watched = Math.min(s.episodeCount, Math.max(0, remaining));
    remaining -= watched;
    return {
      ...s,
      episodesWatched: watched,
      isCompleted: watched >= s.episodeCount && s.episodeCount > 0
    };
  });
}

/**
 * Calculate total watched episodes across all seasons
 */
export function calculateTotalWatched(seasons: SeasonData[]): number {
  return seasons.reduce((sum, s) => sum + (s.episodesWatched || 0), 0);
}

/**
 * Calculate total announced episodes across all seasons
 */
export function calculateTotalEpisodes(seasons: SeasonData[]): number {
  return seasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0);
}

/**
 * Determine the currently active season
 */
export function getActiveSeasonNumber(
  seasons: SeasonData[],
  explicitCurrentSeason?: number | null
): number {
  if (explicitCurrentSeason && explicitCurrentSeason > 0 && explicitCurrentSeason <= seasons.length) {
    return explicitCurrentSeason;
  }
  // Find first season that is not completed
  const firstIncomplete = seasons.find(s => !s.isCompleted);
  return firstIncomplete ? firstIncomplete.seasonNumber : seasons.length || 1;
}

/**
 * Format season-aware progress string
 */
export function formatStructuredProgress(
  seasons: SeasonData[] | null | undefined,
  currentSeason: number = 1,
  fallbackCurrent: number = 0,
  fallbackTotal: number | null = null,
  unitLabel: string = "EP"
): string {
  if (!seasons || seasons.length === 0) {
    const tot = fallbackTotal !== null ? fallbackTotal : "?";
    return `${fallbackCurrent}/${tot} ${unitLabel.toUpperCase()}`;
  }

  const totalWatched = calculateTotalWatched(seasons);
  const totalEpisodes = calculateTotalEpisodes(seasons);
  const activeSeason = seasons.find(s => s.seasonNumber === currentSeason) || seasons[0];

  if (!activeSeason) {
    return `${totalWatched}/${totalEpisodes} ${unitLabel.toUpperCase()}`;
  }

  const sWatched = activeSeason.episodesWatched;
  const sTotal = activeSeason.episodeCount;

  // Single season show
  if (seasons.length === 1) {
    return `${sWatched}/${sTotal} ${unitLabel.toUpperCase()}`;
  }

  // Multi-season show: e.g. "S2E04 (12/32 EP)" or "S1✓ • S2E04"
  if (activeSeason.isCompleted) {
    return `S${activeSeason.seasonNumber} Complete (${totalWatched}/${totalEpisodes} ${unitLabel.toUpperCase()})`;
  }

  return `S${activeSeason.seasonNumber}E${String(sWatched).padStart(2, "0")} (${totalWatched}/${totalEpisodes} ${unitLabel.toUpperCase()})`;
}

/**
 * Get canonical external rating for a title (e.g. IMDb or MAL)
 */
export function getCanonicalExternalRating(title: string): number | null {
  const cleanTitle = title.toLowerCase().trim();
  const sortedRatingKeys = Object.keys(CANONICAL_EXTERNAL_RATINGS).sort((a, b) => b.length - a.length);
  for (const key of sortedRatingKeys) {
    if (matchesCanonicalTitle(cleanTitle, key)) {
      return CANONICAL_EXTERNAL_RATINGS[key];
    }
  }
  return null;
}
