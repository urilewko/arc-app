"use client";
import { MessageSquare, Plus, Trash2, Brain, X } from "lucide-react";
import type { Conversation, Memory } from "@/lib/agent/store";

const KIND_COLOR: Record<string, string> = {
  העדפה: "bg-purple-100 text-purple-700",
  עובדה: "bg-blue-100 text-blue-700",
  החלטה: "bg-emerald-100 text-emerald-700",
  לקוח: "bg-amber-100 text-amber-700",
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק'`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} ש'`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "אתמול" : `לפני ${days} ימים`;
}

export function ConversationRail({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onOpenMemory,
  memoryCount,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (c: Conversation) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onOpenMemory: () => void;
  memoryCount: number;
}) {
  return (
    <aside className="w-56 shrink-0 flex flex-col border-l border-gray-200 pl-3">
      <button
        onClick={onNew}
        className="flex items-center justify-center gap-1.5 text-sm mb-3 py-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#333]"
      >
        <Plus className="w-4 h-4" /> שיחה חדשה
      </button>

      <button
        onClick={onOpenMemory}
        className="flex items-center gap-2 text-xs mb-3 px-2 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        <Brain className="w-4 h-4 text-[#2e5775]" />
        מה הוא זוכר
        <span className="mr-auto text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">
          {memoryCount}
        </span>
      </button>

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-400 px-2 py-4 text-center">
            עוד אין שיחות שמורות
          </p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            className={`group flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer text-xs ${
              c.id === activeId
                ? "bg-[#aec6cf]/25 text-gray-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <div className="flex-1 min-w-0">
              <div className="truncate">{c.title}</div>
              <div className="text-[10px] text-gray-400">
                {timeAgo(c.updatedAt)}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function MemoryPanel({
  memories,
  onClose,
  onDelete,
}: {
  memories: Memory[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Brain className="w-5 h-5 text-[#2e5775]" />
          <h2 className="font-semibold text-gray-800">מה הסוכן זוכר</h2>
          <span className="text-xs text-gray-400">({memories.length})</span>
          <button
            onClick={onClose}
            className="mr-auto text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="px-5 pt-3 text-xs text-gray-500">
          נטען לכל שיחה חדשה. אם משהו כאן לא מדויק — מחק אותו, והסוכן יפסיק
          להסתמך עליו.
        </p>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {memories.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              עוד לא נשמר כלום. הסוכן ישמור בעצמו כשילמד משהו עמיד עליכם.
            </p>
          )}
          {memories.map((m) => (
            <div
              key={m.id}
              className="group flex items-start gap-2 rounded-lg border border-gray-100 px-3 py-2"
            >
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                  KIND_COLOR[m.kind] || KIND_COLOR["עובדה"]
                }`}
              >
                {m.kind}
              </span>
              <span className="flex-1 text-sm text-gray-700">{m.content}</span>
              <button
                onClick={() => onDelete(m.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
