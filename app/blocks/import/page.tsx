"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useStore, type Block } from "@/lib/store";
import { BLOCK_SEEDS, type BlockSeed } from "@/lib/blockSeeds";
import { ArrowRight, Check, RefreshCw, Plus, AlertTriangle } from "lucide-react";

/**
 * Seeds the nine blocks distilled from Yinon's archive.
 *
 * Runs in the browser, under the signed-in user's session, because the blocks
 * table is behind RLS — a server-side script with the anon key sees nothing.
 */

/** Loose match so "The Blender" in the DB finds "הבלנדר · The Blender". */
function matchExisting(seed: BlockSeed, blocks: Block[]): Block | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[·|\-–—\s]+/g, " ").trim();
  const seedParts = norm(seed.name).split(" ").filter((w) => w.length > 2);

  return blocks.find((b) => {
    const existing = norm(b.name);
    if (!existing) return false;
    if (norm(seed.name).includes(existing) || existing.includes(norm(seed.name)))
      return true;
    // Fall back to a distinctive shared word (e.g. "blender", "קפסולות")
    return seedParts.some(
      (w) => existing.includes(w) && w.length > 3
    );
  });
}

export default function ImportBlocksPage() {
  const { blocks, addBlock, updateBlock } = useStore();
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const plan = useMemo(
    () =>
      BLOCK_SEEDS.map((seed) => ({
        seed,
        existing: matchExisting(seed, blocks),
      })),
    [blocks]
  );

  const toUpdate = plan.filter((p) => p.existing).length;
  const toCreate = plan.length - toUpdate;

  async function run() {
    setRunning(true);
    setLog([]);
    for (const { seed, existing } of plan) {
      if (existing) {
        updateBlock(existing.id, seed);
        setLog((l) => [...l, `↻ עודכן: ${seed.name}`]);
      } else {
        addBlock(seed);
        setLog((l) => [...l, `+ נוצר: ${seed.name}`]);
      }
      // Let each write settle so the log reads as progress, not a dump.
      await new Promise((r) => setTimeout(r, 120));
    }
    setRunning(false);
    setDone(true);
  }

  return (
    <div dir="rtl" className="max-w-3xl mx-auto p-6">
      <Link
        href="/blocks"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה ל-The Blocks
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">ייבוא הבלוקים</h1>
      <p className="text-sm text-gray-500 mb-6">
        9 בלוקים שחולצו מהארכיון של ינון — תוכן, חוויה, לוגיסטיקה ושיווק.
      </p>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-emerald-600">{toCreate}</div>
          <div className="text-xs text-gray-500">ייווצרו חדשים</div>
        </div>
        <div className="flex-1 rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-[#2e5775]">{toUpdate}</div>
          <div className="text-xs text-gray-500">יעודכנו קיימים</div>
        </div>
      </div>

      {toUpdate > 0 && (
        <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 mb-6 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            בלוקים קיימים <strong>יידרסו</strong> בתוכן החדש. אם ערכת אותם ידנית —
            בדוק את הרשימה למטה לפני שאתה מריץ.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 mb-6">
        {plan.map(({ seed, existing }) => (
          <div key={seed.name} className="p-3 flex items-center gap-3">
            {existing ? (
              <RefreshCw className="w-4 h-4 text-[#2e5775] shrink-0" />
            ) : (
              <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{seed.name}</div>
              <div className="text-xs text-gray-500 truncate">{seed.tagline}</div>
              {existing && (
                <div className="text-[11px] text-[#2e5775] mt-0.5">
                  יעדכן את &quot;{existing.name}&quot; ({existing.completionPercent}%)
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 shrink-0">
              {seed.completionPercent}%
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={run}
        disabled={running || done}
        className="w-full py-3 rounded-xl bg-[#2e5775] text-white font-medium disabled:opacity-50 hover:bg-[#24455e]"
      >
        {running ? "מייבא…" : done ? "הושלם" : `ייבא ${plan.length} בלוקים`}
      </button>

      {log.length > 0 && (
        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm font-mono space-y-1">
          {log.map((l, i) => (
            <div key={i} className="text-gray-600">
              {l}
            </div>
          ))}
          {done && (
            <div className="flex items-center gap-2 text-emerald-600 pt-2">
              <Check className="w-4 h-4" />
              <Link href="/blocks" className="underline">
                הושלם — לצפייה ב-The Blocks
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
