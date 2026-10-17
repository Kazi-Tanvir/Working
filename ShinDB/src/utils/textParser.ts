/**
 * Utility for parsing text/list import streams in both browser and node contexts.
 * Pure function with zero node-specific or ORM dependencies.
 */
export function parseTextList(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];

  // Split on newlines or commas
  const items = raw.split(/[\r\n,]+/);

  const cleaned = items
    .map((line) =>
      line
        .replace(/^\s*\d+[\.\)\-:]\s*/, "") // remove numbered prefixes like "1.", "1)", "1-"
        .replace(/^\s*[\-\•\*\–\—\>]\s*/, "") // remove bullet points like "-", "•", "*"
        .trim()
    )
    .filter((line) => line.length > 0);

  // Deduplicate case-insensitively while preserving original casing
  const seen = new Set<string>();
  const uniqueList: string[] = [];
  for (const item of cleaned) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueList.push(item);
    }
  }

  return uniqueList;
}
