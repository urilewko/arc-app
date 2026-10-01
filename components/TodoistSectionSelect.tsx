"use client";
import { RefreshCw } from "lucide-react";
import { useTodoistSections } from "@/lib/useTodoistSections";

export default function TodoistSectionSelect({
  value,
  onChange,
  className = "w-full border rounded-lg px-3 py-2 text-sm",
}: {
  value: string;
  onChange: (sectionId: string, sectionName: string) => void;
  className?: string;
}) {
  const { sections, loading, refresh } = useTodoistSections();

  return (
    <div className="flex gap-2 items-center">
      <select
        className={className}
        value={value}
        onChange={(e) => {
          const s = sections.find((x) => x.id === e.target.value);
          onChange(e.target.value, s?.name || "");
        }}
      >
        <option value="">ללא קטגוריה</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button
        type="button"
        title="רענן קטגוריות מ-Todoist"
        onClick={refresh}
        className="shrink-0 text-gray-400 hover:text-gray-700 p-2"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
