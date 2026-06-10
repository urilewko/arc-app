"use client";
import { useState } from "react";
import { supabase, toSnake } from "@/lib/supabase";

type Rec = Record<string, unknown>;

const TABLES: { key: string; table: string }[] = [
  { key: "contacts",      table: "contacts" },
  { key: "leads",         table: "leads" },
  { key: "projects",      table: "projects" },
  { key: "infraProjects", table: "infra_projects" },
  { key: "blocks",        table: "blocks" },
  { key: "collaborators", table: "collaborators" },
  { key: "financeRecords",table: "finance_records" },
  { key: "debriefs",      table: "debriefs" },
];

export default function MigratePage() {
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);

  const addLog = (msg: string) => setLog((l) => [...l, msg]);

  const migrate = async () => {
    setRunning(true);
    setLog([]);

    const raw = localStorage.getItem("arc-store");
    if (!raw) {
      addLog("❌ No data found in localStorage (arc-store). Nothing to migrate.");
      setRunning(false);
      return;
    }

    let parsed: Rec;
    try {
      parsed = JSON.parse(raw);
    } catch {
      addLog("❌ Failed to parse localStorage data.");
      setRunning(false);
      return;
    }

    const state = (parsed.state || parsed) as Rec;

    for (const { key, table } of TABLES) {
      const items = state[key] as Rec[] | undefined;
      if (!items || items.length === 0) {
        addLog(`⏭ ${table}: empty, skipping`);
        continue;
      }

      addLog(`⬆️ ${table}: migrating ${items.length} records...`);

      // Delete existing rows first to avoid duplicates
      await supabase.from(table).delete().neq("id", "___none___");

      // Insert in batches of 50
      const batch = 50;
      for (let i = 0; i < items.length; i += batch) {
        const chunk = items.slice(i, i + batch).map((item) => toSnake(item));
        const { error } = await supabase.from(table).insert(chunk);
        if (error) {
          addLog(`  ❌ Error: ${error.message}`);
        } else {
          addLog(`  ✅ Inserted ${chunk.length} rows`);
        }
      }
    }

    addLog("🎉 Migration complete!");
    setDone(true);
    setRunning(false);
  };

  return (
    <div className="max-w-xl mx-auto py-10" dir="rtl">
      <h1 className="text-2xl font-bold mb-2">העברת נתונים ל-Supabase</h1>
      <p className="text-gray-500 text-sm mb-6">
        כלי חד-פעמי שמעתיק את כל הנתונים מה-localStorage לבסיס הנתונים בענן.
        הרץ אותו <strong>פעם אחת בלבד</strong> מהדפדפן שבו עבדת עד עכשיו.
      </p>

      {!done && (
        <button
          onClick={migrate}
          disabled={running}
          className="bg-[#4a2e1b] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#3a2415] disabled:opacity-60 mb-6"
        >
          {running ? "מעביר נתונים..." : "התחל העברה"}
        </button>
      )}

      {log.length > 0 && (
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs space-y-1">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {done && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          ✅ הכל הועבר בהצלחה. עכשיו אפשר למחוק את הדף הזה ולעבוד רגיל.
          <br />
          <a href="/" className="font-bold underline mt-2 inline-block">חזור לדשבורד ←</a>
        </div>
      )}
    </div>
  );
}
