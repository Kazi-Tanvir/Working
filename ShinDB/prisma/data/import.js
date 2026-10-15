const fs = require("fs").promises;
const path = require("path");

const DB_DIR = path.join(__dirname);

// Default cover images per media type
const COVER_IMAGES = {
  anime: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  manga: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  game: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
  movie: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
  series: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80"
};

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
}

// Clean Year
function parseYear(yearStr) {
  if (!yearStr) return new Date().getFullYear();
  const cleanStr = yearStr.trim();
  if (cleanStr.toLowerCase() === "unknown" || cleanStr === "nan" || cleanStr === "-") {
    return new Date().getFullYear();
  }
  // Matches first 4-digit number (handles ranges like 2015-2022)
  const match = cleanStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : new Date().getFullYear();
}

// Clean Rating
function parseRating(ratingStr) {
  if (!ratingStr) return "N/A";
  const cleanStr = ratingStr.trim();
  if (cleanStr === "-" || cleanStr === "N/A" || cleanStr.toLowerCase() === "nan") return "N/A";
  
  // Handles fractional format e.g. "★ 8/10" or "8/10" or "8.5/10"
  const match = cleanStr.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (match) {
    const val = parseFloat(match[1]);
    return `${val.toFixed(1)}/10`;
  }
  
  // Handles decimal format e.g. "★ 8.7" or "94"
  const digitMatch = cleanStr.match(/★?\s*(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1]);
    // Map large online score (e.g. 94 or 83 out of 100) to 10 scale
    if (val > 10 && val <= 100) {
      return `${(val / 10).toFixed(1)}/10`;
    }
    if (val > 0 && val <= 10) {
      return `${val.toFixed(1)}/10`;
    }
  }
  return "N/A";
}

// Clean Status
function normalizeStatus(statusStr, type) {
  if (!statusStr) return type === "manga" ? "Plan to Read" : (type === "game" ? "Plan to Play" : "Plan to Watch");
  const status = statusStr.trim().toLowerCase();
  
  if (status.includes("completed") || status.includes("finished")) return "Completed";
  if (status.includes("dropped")) return "Dropped";
  if (status.includes("on hold") || status.includes("onhold")) return "On Hold";
  
  if (status.includes("plan")) {
    if (type === "manga") return "Plan to Read";
    if (type === "game") return "Plan to Play";
    return "Plan to Watch";
  }
  
  // Active states
  if (status.includes("watching") || status.includes("current")) {
    if (type === "manga") return "Reading";
    if (type === "game") return "Playing";
    return "Watching";
  }
  if (status.includes("reading")) return "Reading";
  if (status.includes("playing")) return "Playing";
  
  // Fallbacks
  if (type === "manga") return "Reading";
  if (type === "game") return "Playing";
  return "Watching";
}

// Parse Movie Duration to mins
function parseMovieDuration(durationStr) {
  if (!durationStr) return "0 mins";
  const dur = durationStr.trim().toLowerCase();
  if (dur === "-" || dur === "unknown" || dur === "n/a") return "0 mins";
  
  // e.g. "2 hr 10 min" or "2h 10m"
  const hrMinMatch = dur.match(/(\d+)\s*(?:hr|h)\s*(\d+)\s*(?:min|m)/);
  if (hrMinMatch) {
    const mins = parseInt(hrMinMatch[1], 10) * 60 + parseInt(hrMinMatch[2], 10);
    return `${mins} mins`;
  }
  
  // e.g. "2 hr" or "2h"
  const hrMatch = dur.match(/(\d+)\s*(?:hr|h)/);
  if (hrMatch) {
    const mins = parseInt(hrMatch[1], 10) * 60;
    return `${mins} mins`;
  }
  
  // e.g. "96 min" or "96m"
  const minMatch = dur.match(/(\d+)\s*(?:min|m)/);
  if (minMatch) {
    return `${parseInt(minMatch[1], 10)} mins`;
  }

  // e.g. "96"
  const numMatch = dur.match(/^(\d+)$/);
  if (numMatch) {
    return `${parseInt(numMatch[1], 10)} mins`;
  }
  
  return "0 mins";
}

// Clean Genres
function parseGenres(genresStr) {
  if (!genresStr) return [];
  const cleanStr = genresStr.trim();
  if (cleanStr === "-" || cleanStr === "N/A" || cleanStr === "" || cleanStr.toLowerCase() === "nan") return [];
  return cleanStr
    .split(",")
    .map(g => {
      let name = g.trim();
      if (name.startsWith("genre/")) {
        name = name.replace("genre/", "");
      }
      // Capitalize first letter of each word
      return name
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    })
    .filter(g => g && g !== "-");
}

function cleanTitle(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function findExistingIndex(existingItems, parsedItem) {
  const parsedClean = cleanTitle(parsedItem.title);
  
  // Try clean title match first
  let index = existingItems.findIndex(item => cleanTitle(item.title) === parsedClean);
  if (index !== -1) return index;

  // Also check if existing item title matches parsed item raw title
  if (parsedItem.rawTitle) {
    const rawClean = cleanTitle(parsedItem.rawTitle);
    index = existingItems.findIndex(item => cleanTitle(item.title) === rawClean);
    if (index !== -1) return index;
  }

  return -1;
}

async function migrateFile({ txtFilename, jsonFilename, type, prefix }) {
  console.log(`Starting migration for ${type} (${txtFilename} -> ${jsonFilename})...`);
  
  const txtPath = path.join(DB_DIR, txtFilename);
  const jsonPath = path.join(DB_DIR, jsonFilename);
  
  // Load existing JSON
  let existingItems = [];
  try {
    const jsonContent = await fs.readFile(jsonPath, "utf-8");
    const rawItems = JSON.parse(jsonContent);
    existingItems = rawItems.filter(item => !Object.values(COVER_IMAGES).includes(item.coverImage));
    if (rawItems.length !== existingItems.length) {
      console.log(`Loaded ${rawItems.length} existing items from ${jsonFilename} (removed ${rawItems.length - existingItems.length} with placeholder images)`);
    } else {
      console.log(`Loaded ${existingItems.length} existing items from ${jsonFilename}`);
    }
  } catch (e) {
    console.log(`No existing ${jsonFilename} found. Starting fresh.`);
  }

  // Load TXT
  let txtContent = "";
  try {
    txtContent = await fs.readFile(txtPath, "utf-8");
  } catch (e) {
    console.error(`Error: Could not read ${txtFilename}. Skipping.`);
    return;
  }

  const lines = txtContent.split("\n");
  const parsedItems = [];
  let colIndex = {};
  let headerIndexFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines or separator rows
    if (!line || !line.startsWith("|")) {
      continue;
    }

    // Identify header row
    const cells = line.split("|").map(cell => cell.trim());
    const dataCells = cells.slice(1, cells.length - 1);

    if (line.includes(":---") || line.includes("---")) {
      continue; // Skip the markdown separator row e.g. |:---|:---|
    }

    if (!headerIndexFound) {
      // First row starting with '|' that is not a separator is the header row
      dataCells.forEach((header, idx) => {
        colIndex[header.toLowerCase().trim()] = idx;
      });
      headerIndexFound = true;
      console.log(`Parsed headers for ${type}:`, Object.keys(colIndex).join(", "));
      continue;
    }

    // Helper to get value dynamically by column name
    const getValue = (colName) => {
      const idx = colIndex[colName.toLowerCase().trim()];
      if (idx === undefined || idx >= dataCells.length) return "";
      return dataCells[idx].trim();
    };

    const rawTitle = getValue("title");
    const englishTitle = getValue("english title") || getValue("english-title");

    // Skip if both are empty
    if (!rawTitle && !englishTitle) {
      continue;
    }

    // Prefer English title, fallback to original title
    let title = rawTitle;
    if (englishTitle && englishTitle !== "-" && englishTitle.toLowerCase() !== "nan" && englishTitle.toLowerCase() !== "unknown") {
      title = englishTitle;
    }

    const yearStr = getValue("year") || getValue("release year") || getValue("release-year");
    const statusStr = getValue("status");
    const personalRating = getValue("personal rating") || getValue("personal-rating");
    const onlineRating = getValue("online rating") || getValue("online-rating") || getValue("rating");
    const genresStr = getValue("genres");
    const imageVal = getValue("image") || getValue("coverimage") || getValue("cover-image") || getValue("cover_image");

    const releaseYear = parseYear(yearStr);
    const status = normalizeStatus(statusStr, type);
    const rating = parseRating(personalRating) !== "N/A" ? parseRating(personalRating) : parseRating(onlineRating);
    const genres = parseGenres(genresStr);
    const coverImage = (imageVal && imageVal !== "-" && imageVal.toLowerCase() !== "nan") ? imageVal : COVER_IMAGES[type];

    let progress = "0";

    if (type === "anime") {
      const currentEp = getValue("current episode") || getValue("current-episode") || getValue("current_episode");
      const totalEps = getValue("episodes") || getValue("total-episodes") || getValue("total_episodes");
      
      const totalVal = (totalEps && totalEps !== "-" && totalEps.toLowerCase() !== "unknown") ? parseInt(totalEps) : null;
      if (status === "Completed" && totalVal && totalVal > 0) {
        progress = `${totalVal}/${totalVal} EP`;
      } else {
        const curr = parseInt(currentEp) || 0;
        const total = totalVal ? totalVal : "?";
        progress = `${curr}/${total} EP`;
      }
    } else if (type === "manga") {
      const currentCh = getValue("current chapter") || getValue("current-chapter") || getValue("current_chapter");
      const totalChs = getValue("chapters") || getValue("total-chapters") || getValue("total_chapters");

      const totalVal = (totalChs && totalChs !== "-" && totalChs.toLowerCase() !== "unknown") ? parseInt(totalChs) : null;
      if (status === "Completed" && totalVal && totalVal > 0) {
        progress = `${totalVal}/${totalVal} CH`;
      } else {
        const curr = parseInt(currentCh) || 0;
        const total = totalVal ? totalVal : "?";
        progress = `${curr}/${total} CH`;
      }
    } else if (type === "game") {
      const playtime = getValue("play time") || getValue("playtime") || getValue("play-time") || getValue("play_time");
      const hrs = parseInt(playtime) || 0;
      progress = `${hrs} hrs`;
    } else if (type === "movie") {
      const duration = getValue("duration") || getValue("run-time") || getValue("runtime") || getValue("run time");
      progress = parseMovieDuration(duration);
    } else if (type === "series") {
      const currentEp = getValue("current episode") || getValue("current-episode") || getValue("current_episode");
      const totalEps = getValue("episodes") || getValue("total-episodes") || getValue("total_episodes");

      if (status === "Completed" && totalEps && totalEps !== "-" && totalEps.toLowerCase() !== "unknown") {
        const totalVal = parseInt(totalEps) || 1;
        progress = `S1E${String(totalVal).padStart(2, "0")}`;
      } else {
        const curr = parseInt(currentEp) || 0;
        const epVal = curr > 0 ? curr : 1;
        progress = `S1E${String(epVal).padStart(2, "0")}`;
      }
    }

    // Skip if it uses a placeholder image
    if (Object.values(COVER_IMAGES).includes(coverImage)) {
      continue;
    }

    parsedItems.push({
      title,
      rawTitle,
      releaseYear,
      status,
      progress,
      rating,
      genres,
      coverImage,
      type
    });
  }

  console.log(`Parsed ${parsedItems.length} items from ${txtFilename}`);

  // Merge logic
  const mergedItems = [...existingItems];

  for (const parsedItem of parsedItems) {
    const existingIndex = findExistingIndex(mergedItems, parsedItem);

    if (existingIndex !== -1) {
      // Merge properties
      const existing = mergedItems[existingIndex];
      
      // Update properties carefully
      mergedItems[existingIndex] = {
        ...existing,
        // Override with parsed data if the existing data is default/missing/buggy
        title: existing.title || parsedItem.title,
        releaseYear: (existing.releaseYear === 2026 || !existing.releaseYear) ? parsedItem.releaseYear : existing.releaseYear,
        rating: (existing.rating === "N/A" || !existing.rating) ? parsedItem.rating : existing.rating,
        genres: (existing.genres.length === 0 || existing.genres.includes(type)) ? parsedItem.genres : existing.genres,
        // Upgrade placeholder cover images to real cover images from database
        coverImage: (existing.coverImage.includes("unsplash.com") || !existing.coverImage) ? parsedItem.coverImage : existing.coverImage,
        // Keep the user's active status and progress as the source of truth, unless it was a default placeholder
        status: existing.status || parsedItem.status,
        progress: (existing.progress === "0/? EP" || existing.progress === "0/? CH" || existing.progress === "0 hrs" || existing.progress === "0 mins" || existing.progress === "S1E01") ? parsedItem.progress : existing.progress
      };
    } else {
      // Create new item
      const newItem = {
        id: generateId(prefix),
        title: parsedItem.title,
        rating: parsedItem.rating,
        status: parsedItem.status,
        coverImage: parsedItem.coverImage,
        progress: parsedItem.progress,
        genres: parsedItem.genres,
        releaseYear: parsedItem.releaseYear,
        type: parsedItem.type
      };
      mergedItems.push(newItem);
    }
  }

  // Final cleanup: remove any parsed rawTitle field if it bled through
  const cleanedMerged = mergedItems.map(item => {
    const copy = { ...item };
    delete copy.rawTitle;
    return copy;
  });

  // Save merged items
  await fs.writeFile(jsonPath, JSON.stringify(cleanedMerged, null, 2), "utf-8");
  console.log(`Successfully wrote ${cleanedMerged.length} merged items to ${jsonFilename}\n`);
}

async function main() {
  try {
    await migrateFile({
      txtFilename: "anime.txt",
      jsonFilename: "anime.json",
      type: "anime",
      prefix: "a"
    });

    await migrateFile({
      txtFilename: "games.txt",
      jsonFilename: "games.json",
      type: "game",
      prefix: "g"
    });

    await migrateFile({
      txtFilename: "manga.txt",
      jsonFilename: "manga.json",
      type: "manga",
      prefix: "m"
    });

    await migrateFile({
      txtFilename: "movies.txt",
      jsonFilename: "movies.json",
      type: "movie",
      prefix: "mv"
    });

    await migrateFile({
      txtFilename: "series.txt",
      jsonFilename: "series.json",
      type: "series",
      prefix: "s"
    });

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

main();
