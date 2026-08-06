"use client";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  listConversations, saveConversation, deleteConversation, newConversationId,
  listMemories, addMemory, deleteMemory,
  type Conversation, type Memory,
} from "@/lib/agent/store";
import { ConversationRail, MemoryPanel } from "./ConversationRail";
import {
  splitStream,
  type GeneratedDoc,
  type WebSource,
} from "@/lib/agent/protocol";
import {
  Send, Sparkles, FileText, Eye, Download, Globe, Database,
  ChevronDown, ChevronUp,
} from "lucide-react";

type Msg = {
  role: "user" | "assistant";
  content: string;
  docs?: GeneratedDoc[];
  sources?: WebSource[];
};

/**
 * The agent labels every section as coming from ARC's own material or from
 * outside. Colouring those labels makes the split impossible to miss when
 * skimming — the whole point of keeping them separate.
 */
const PROVENANCE = /^\s*\*{0,2}▊\s*(מהמאגר שלנו|מבחוץ)\*{0,2}\s*$/;

function ProvenanceText({ text }: { text: string }) {
  const segments: Array<{ kind: "internal" | "external" | null; body: string[] }> = [];
  let current: (typeof segments)[number] = { kind: null, body: [] };

  for (const line of text.split("\n")) {
    const hit = line.match(PROVENANCE);
    if (hit) {
      if (current.body.length || current.kind) segments.push(current);
      current = { kind: hit[1] === "מבחוץ" ? "external" : "internal", body: [] };
    } else {
      current.body.push(line);
    }
  }
  segments.push(current);

  return (
    <>
      {segments.map((seg, i) => {
        const body = seg.body.join("\n").replace(/^\n+|\n+$/g, "");
        if (!body && !seg.kind) return null;
        if (!seg.kind) {
          return (
            <div key={i} className="whitespace-pre-wrap">
              {body}
            </div>
          );
        }
        const internal = seg.kind === "internal";
        return (
          <div
            key={i}
            className={`my-2 rounded-lg border-r-4 px-3 py-2 ${
              internal
                ? "border-[#2e5775] bg-[#2e5775]/5"
                : "border-orange-400 bg-orange-50"
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1 ${
                internal ? "text-[#2e5775]" : "text-orange-700"
              }`}
            >
              {internal ? <Database className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {internal ? "מהמאגר שלנו" : "מבחוץ · לא נוסה על ידכם"}
            </div>
            <div className="whitespace-pre-wrap">{body}</div>
          </div>
        );
      })}
    </>
  );
}

/** Collapsed by default — a research turn can cite dozens of pages. */
function SourceList({ sources }: { sources: WebSource[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? sources : sources.slice(0, 4);

  return (
    <div className="mt-3 pt-2 border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 mb-1 hover:underline"
      >
        <Globe className="w-3 h-3" />
        מקורות חיצוניים ({sources.length})
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <div className="space-y-0.5">
        {shown.map((s, k) => (
          <a key={k} href={s.url} target="_blank" rel="noreferrer"
            className="block text-xs text-blue-600 hover:underline truncate">
            {s.title}
          </a>
        ))}
        {!open && sources.length > 4 && (
          <button onClick={() => setOpen(true)}
            className="text-xs text-gray-400 hover:text-gray-600">
            ועוד {sources.length - 4}…
          </button>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "ליד חדש: חברת הייטק, 60 מנהלים, יום אחד. אחרי מיזוג, אין אמון בין הקבוצות.",
  "תוציא הצעת ערך ללקוח על בסיס מה שסיכמנו",
  "מה חסר לקפסולות כדי להגיע לרמת הבלנדר?",
  "כתוב one-pager שיווקי לבלנדר",
];

/** Word opens HTML saved as .doc with the styling intact — no converter needed. */
function downloadDoc(doc: GeneratedDoc) {
  const blob = new Blob(["﻿", doc.html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.name}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function previewDoc(doc: GeneratedDoc) {
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(doc.html);
    w.document.close();
  }
}

export default function AgentPage() {
  const { blocks } = useStore();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convId, setConvId] = useState(newConversationId);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryOpen, setMemoryOpen] = useState(false);

  useEffect(() => {
    listConversations().then(setConversations);
    listMemories().then(setMemories);
  }, []);

  function startNew() {
    setMessages([]);
    setConvId(newConversationId());
  }

  function openConversation(c: Conversation) {
    setMessages(c.messages as Msg[]);
    setConvId(c.id);
  }

  async function removeConversation(id: string) {
    await deleteConversation(id);
    setConversations((cs) => cs.filter((c) => c.id !== id));
    if (id === convId) startNew();
  }

  async function forgetMemory(id: string) {
    await deleteMemory(id);
    setMemories((ms) => ms.filter((m) => m.id !== id));
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Documents are rendered server-side; only prose goes back to the model.
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          blocks,
          memories: memories.map((m) => `[${m.kind}] ${m.content}`),
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "שגיאת רשת" }));
        setMessages([
          ...next,
          { role: "assistant", content: `⚠️ ${err.error ?? "שגיאה"}` },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let final: Msg[] = next;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const { text, documents, sources } = splitStream(acc);
        final = [...next, { role: "assistant", content: text, docs: documents, sources }];
        setMessages(final);
      }

      // Persist once the turn settles. Documents are re-derivable and bulky,
      // so only the prose is stored.
      const { memories: learned } = splitStream(acc);
      await saveConversation(
        convId,
        final.map(({ role, content }) => ({ role, content }))
      );
      listConversations().then(setConversations);

      if (learned.length) {
        await Promise.all(learned.map((m) => addMemory(m.content, m.kind, convId)));
        listMemories().then(setMemories);
      }
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "⚠️ החיבור נכשל. נסה שוב." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  const ready = blocks.filter((b) => b.status === "מוכן").length;

  return (
    <div dir="rtl" className="flex gap-4 h-[calc(100vh-2rem)] max-w-6xl mx-auto p-4">
      <ConversationRail
        conversations={conversations}
        activeId={convId}
        onSelect={openConversation}
        onNew={startNew}
        onDelete={removeConversation}
        onOpenMemory={() => setMemoryOpen(true)}
        memoryCount={memories.length}
      />

      {memoryOpen && (
        <MemoryPanel
          memories={memories}
          onClose={() => setMemoryOpen(false)}
          onDelete={forgetMemory}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#aec6cf] to-[#d8eaee] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#4a6b73]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">אדריכל התוכן</h1>
            <p className="text-xs text-gray-500">
              {blocks.length} בלוקים במערכת · {ready} מוכנים
            </p>
          </div>
        </div>

      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="pt-8">
            <p className="text-gray-400 text-sm mb-4 text-center">
              תאר לי בריף של לקוח, ואני ארכיב הצעת תוכן מהבלוקים שלנו.
            </p>
            <div className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-right text-sm px-4 py-3 rounded-xl border border-gray-200 hover:border-[#aec6cf] hover:bg-[#aec6cf]/5 text-gray-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-start" : "flex justify-end"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] bg-[#aec6cf]/20 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-gray-800"
                  : "max-w-[90%] bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 leading-relaxed"
              }
            >
              {m.content ? (
                m.role === "assistant" ? <ProvenanceText text={m.content} /> : m.content
              ) : (m.docs?.length ? null : (
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse [animation-delay:300ms]" />
                </span>
              ))}

              {!!m.sources?.length && <SourceList sources={m.sources} />}

              {m.docs?.map((d, j) => (
                <div
                  key={j}
                  className="mt-3 rounded-xl border border-[#2e5775]/20 bg-[#e7ded2]/40 p-3 flex items-center gap-3"
                >
                  <FileText className="w-5 h-5 text-[#2e5775] shrink-0" />
                  <span className="flex-1 text-sm font-medium text-[#2e5775]">
                    {d.name}
                  </span>
                  <button
                    onClick={() => previewDoc(d)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-[#2e5775] hover:bg-[#2e5775]/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    תצוגה
                  </button>
                  <button
                    onClick={() => downloadDoc(d)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#2e5775] text-white hover:bg-[#24455e]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Word
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="תאר בריף, שאל שאלה, או בקש הצעה…"
          className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#aec6cf]"
        />
        <button
          onClick={() => send()}
          disabled={streaming || !input.trim()}
          className="px-4 rounded-xl bg-[#aec6cf] text-[#2d4a52] disabled:opacity-40 hover:bg-[#9bb8c2]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      </div>
    </div>
  );
}
