// src/utils/animeHelpers.ts

export const KNOWN_ANIME_DURATIONS: Record<string, number> = {
  // Shorts (< 15 mins per ep)
  "aho-girl": 12,
  "saiki k": 5,
  "the disastrous life of saiki k": 5,
  "teekyuu": 2,
  "chi's sweet home": 3,
  "hetalia": 5,
  "tonari no seki-kun": 7,
  "poyopoyo": 3,
  "space patrol luluco": 8,
  "i can't understand what my husband is saying": 3,
  "she and her cat": 8,
  "yama no susume": 3,
  "senryu girl": 12,
  "dagashi kashi": 24,

  // Specials, OVAs & Long Episodes
  "attack on titan final season the final chapters special 1": 61,
  "attack on titan final season the final chapters special 2": 85,
  "katanagatari": 50,
  "hellsing ultimate": 50,
  "the garden of words": 46,
  "into the forest of fireflies' light": 45,
  "look back": 58,
  "shelter": 6,
  "golden boy": 30,
  "5 centimeters per second": 22,
  "link click episode 5.5": 23,
  "steins;gate 0: 23β -divide by zero-": 24,
  "hyouka: what should be had": 25,
  "kaguya-sama wa kokurasetai: tensaitachi no renai zunousen ova": 24,
  "no game no life specials": 3,
  "road of naruto": 10,
  "naruto: honoo no chuunin shiken! naruto vs konohamaru!!": 14,
  "naruto: shippuuden - sunny side battle!!!": 11,
  "one piece: django's dance carnival": 6,

  // Popular Feature Anime Movies
  "your name.": 107,
  "your name": 107,
  "a silent voice": 130,
  "spirited away": 125,
  "i want to eat your pancreas": 108,
  "grave of the fireflies": 88,
  "demon slayer -kimetsu no yaiba- the movie: mugen train": 117,
  "demon slayer: kimetsu no yaiba infinity castle": 110,
  "demon slayer: kimetsu no yaiba infinity castle part 2": 110,
  "jujutsu kaisen 0": 105,
  "haikyu!! the dumpster battle": 85,
  "haikyu!! the movie: the end and the beginning": 89,
  "haikyuu!! the movie: the winner and the loser": 88,
  "haikyu!! the movie: talent and sense": 89,
  "haikyu!! the movie: battle of concepts": 89,
  "suzume": 122,
  "weathering with you": 112,
  "josee, the tiger and the fish": 98,
  "the girl who leapt through time": 98,
  "perfect blue": 81,
  "princess mononoke": 134,
  "howl's moving castle": 119,
  "my neighbor totoro": 86,
  "akira": 124,
  "the wind rises": 126,
  "kiki's delivery service": 103,
  "castle in the sky": 124,
  "nausicaä of the valley of the wind": 117,
  "wolf children": 117,
  "the boy and the heron": 124,
  "evangelion: 1.0 you are (not) alone": 101,
  "evangelion: 2.0 you can (not) advance": 112,
  "evangelion: 3.0 you can (not) redo": 96,
  "evangelion: 3.0+1.0 thrice upon a time": 155,
  "neon genesis evangelion: the end of evangelion": 87,
  "gintama - the movie": 95,
  "gintama: the final chapter - be forever yorozuya": 110,
  "gintama: the very final": 104,
  "one piece film: gold": 120,
  "one piece film: red": 115,
  "one piece film: strong world": 113,
  "one piece film: z": 108,
  "one piece: stampede": 101,
  "one piece: the movie": 50,
  "one piece: clockwork island adventure": 60,
  "one piece: chopper’s kingdom on the island of strange animals": 56,
  "one piece the movie: the dead end adventure": 95,
  "one piece: the curse of the sacred sword": 95,
  "one piece: baron omatsuri and the secret island": 91,
  "no game, no life zero": 106,
  "boruto: naruto the movie": 95,
  "boruto: naruto the movie - the day naruto became hokage": 10,
  "the last: naruto the movie": 112,
  "road to ninja: naruto the movie": 109,
  "naruto the movie: ninja clash in the land of snow": 82,
  "naruto the movie: legend of the stone of gelel": 97,
  "naruto the movie: guardians of the crescent moon kingdom": 95,
  "naruto shippuden the movie": 94,
  "naruto shippuden the movie: bonds": 93,
  "naruto shippuden the movie: the will of fire": 96,
  "naruto shippuden the movie: the lost tower": 85,
  "naruto shippuden the movie: blood prison": 94,
  "chainsaw man – the movie: reze arc": 100,
  "the night is short, walk on girl": 93,
  "fullmetal alchemist: the movie - conqueror of shamballa": 105,
  "fullmetal alchemist: the sacred star of milos": 110,
  "fullmetal alchemist: reflections": 56,
  "bâan: the boundary of adulthood": 25,
  "100 meters": 25,
};

function matchesKey(cleanTitle: string, canonicalKey: string): boolean {
  if (cleanTitle === canonicalKey) return true;
  const escaped = canonicalKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return regex.test(cleanTitle);
}

export function isAnimeMovie(title: string, totalEpisodes: number | null, unit?: string): boolean {
  if (unit === "mins") return true;
  const clean = title.toLowerCase().trim();

  // Explicit title triggers
  if (
    clean.includes("the movie") ||
    clean.includes(" movie") ||
    clean.includes("film:") ||
    clean.includes(" film") ||
    clean.includes("gekijouban") ||
    clean.includes("the final chapter") ||
    clean.includes("the very final")
  ) {
    return true;
  }

  // 1-episode standalone anime check
  if (totalEpisodes === 1) {
    if (
      clean.includes("special") ||
      clean.includes("ova") ||
      clean.includes("ona") ||
      clean.includes("music") ||
      clean.includes("pv") ||
      clean.includes("episode 0") ||
      clean.includes("prologue")
    ) {
      return false;
    }
    return true;
  }

  return false;
}

export function getAnimeDuration(item: {
  title: string;
  totalEpisodes?: number | null;
  progressUnit?: string;
}): {
  durationPerEp: number;
  isMovie: boolean;
} {
  const clean = item.title.toLowerCase().trim();

  // 1. Check known anime durations map (longest keys first)
  const sortedKeys = Object.keys(KNOWN_ANIME_DURATIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (matchesKey(clean, key)) {
      const dur = KNOWN_ANIME_DURATIONS[key];
      const isSpecialOrOva = clean.includes("special") || clean.includes("ova") || clean.includes("ona");
      const isMov = !isSpecialOrOva && (dur >= 65 || clean.includes("movie") || clean.includes("film") || (item.totalEpisodes === 1 && dur >= 50));
      return { durationPerEp: dur, isMovie: isMov };
    }
  }

  // 2. Movie heuristic
  if (isAnimeMovie(item.title, item.totalEpisodes ?? null, item.progressUnit)) {
    return { durationPerEp: 100, isMovie: true };
  }

  // 3. Specials / OVAs heuristic
  if (clean.includes("special") || clean.includes("ova") || clean.includes("ona")) {
    return { durationPerEp: 25, isMovie: false };
  }

  // 4. Music video / short clip heuristic
  if (clean.includes("music") || clean.includes("pv")) {
    return { durationPerEp: 5, isMovie: false };
  }

  // 5. Standard television episodic anime (23.5 minutes average)
  return { durationPerEp: 23.5, isMovie: false };
}
