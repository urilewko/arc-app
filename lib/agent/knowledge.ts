import fs from "fs";
import path from "path";
import type { Block } from "@/lib/store";

const BLOCKS_DIR = path.join(process.cwd(), "knowledge", "blocks");

/**
 * Reads the block cards from disk. These are the deep methodology documents —
 * the structure, rationale, and what varies per client — that don't fit the
 * DB's flat fields.
 */
export function loadBlockCards(): string {
  let files: string[];
  try {
    files = fs.readdirSync(BLOCKS_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return "(אין כרטיסי בלוקים)";
  }

  // Sort for a stable prefix — a shifting order would break the prompt cache.
  files.sort();

  return files
    .map((f) => fs.readFileSync(path.join(BLOCKS_DIR, f), "utf-8"))
    .join("\n\n---\n\n");
}

/**
 * Renders the live `blocks` rows so the agent knows what is actually sellable
 * today — the cards describe the methodology, this says what state it's in.
 */
export function renderLiveBlocks(blocks: Block[]): string {
  if (!blocks.length) return "";

  const rows = blocks
    .map((b) => {
      const pillars = [
        b.contentItems?.length ? "תוכן" : null,
        b.experience ? "חוויה" : null,
        b.logistics ? "לוגיסטיקה" : null,
        b.marketingPitch || b.marketingLinks?.length ? "שיווק" : null,
      ]
        .filter(Boolean)
        .join(", ");

      return [
        `- **${b.name}** (${b.status}, ${b.completionPercent}%)`,
        b.tagline && `  ${b.tagline}`,
        `  משך: ${b.duration || "—"} · קבוצה: ${b.groupSize || "—"} · מוצר: ${b.productType}`,
        b.price ? `  מחיר: ${b.price.toLocaleString("he-IL")} ₪` : null,
        pillars ? `  עמודים קיימים: ${pillars}` : "  ⚠️ אין עמודים מלאים",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return `## הבלוקים במערכת\n\n${rows}`;
}
