import fs from "node:fs";
import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
import { batchResolveMalMetadata } from "../src/lib/import";

function parseMALXml(xmlText: string) {
  const usernameMatch = xmlText.match(/<user_name>([^<]*)<\/user_name>/);
  const exportTypeMatch = xmlText.match(/<user_export_type>(\d+)<\/user_export_type>/);
  const username = usernameMatch?.[1]?.trim() || "unknown";
  const exportType = exportTypeMatch ? parseInt(exportTypeMatch[1], 10) : 1;
  const tagName = exportType === 2 ? "manga" : "anime";
  const mediaType = exportType === 2 ? "manga" : "anime";

  const entries: any[] = [];
  const blockRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const getText = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
      return m?.[1]?.trim() ?? "";
    };

    const title = getText(mediaType === "anime" ? "series_title" : "manga_title");
    const malId = getText("series_animedb_id") || getText("manga_animedb_id");
    if (!title) continue;
    entries.push({ title, type: mediaType, malId });
  }

  return { entries, exportType, username };
}

async function run() {
  const xml = fs.readFileSync("D:/02_CODE/04_WORKING/ShinDB/docs/animelist_1792176869_-_13864737.xml", "utf8");
  const { entries } = parseMALXml(xml);
  console.log(`Total parsed entries: ${entries.length}`);

  const oshi = entries.find(e => e.title.includes("Oshi no Ko"));
  console.log("Oshi no Ko entry:", oshi);

  console.log("\nResolving with batchResolveMalMetadata (anilist)...");
  const resolvedMap = await batchResolveMalMetadata(entries, "anilist");
  console.log(`Resolved: ${resolvedMap.size} / ${entries.length}`);

  const failed = entries.filter(e => !resolvedMap.get(e.malId));
  console.log(`Failed count: ${failed.length}`);
  console.log("\nALL FAILED ENTRIES:");
  for (const f of failed) {
    console.log(`- [malId=${f.malId}] "${f.title}"`);
  }
}

run().catch(console.error);
