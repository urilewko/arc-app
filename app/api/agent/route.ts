import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystem } from "@/lib/agent/prompt";
import { loadBlockCards, renderLiveBlocks } from "@/lib/agent/knowledge";
import { CREATE_DOCUMENT, WEB_SEARCH, REMEMBER } from "@/lib/agent/tools";
import { renderDocument, type AgentDocument } from "@/lib/agent/documentHTML";
import {
  DOC_MARKER,
  type WebSource,
  type NewMemory,
} from "@/lib/agent/protocol";
import type { Block } from "@/lib/store";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Pulls the pages the agent actually consulted out of the response so the UI
 * can show them — external claims stay auditable rather than asserted.
 */
function collectSources(content: unknown[], into: WebSource[]) {
  for (const block of content) {
    const b = block as { type?: string; content?: unknown };
    if (b.type !== "web_search_tool_result" || !Array.isArray(b.content)) continue;
    for (const r of b.content as Array<{ url?: string; title?: string }>) {
      if (r.url && !into.some((s) => s.url === r.url)) {
        into.push({ url: r.url, title: r.title || r.url });
      }
    }
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "חסר ANTHROPIC_API_KEY בקובץ .env.local" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: {
    messages?: ChatMessage[];
    blocks?: Block[];
    memories?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "בקשה לא תקינה" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const incoming = body.messages ?? [];
  if (!incoming.length) {
    return new Response(JSON.stringify({ error: "אין הודעות" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const remembered = (body.memories ?? []).map((m) => `- ${m}`).join("\n");
  const system = buildSystem(
    loadBlockCards(),
    renderLiveBlocks(body.blocks ?? []),
    remembered || undefined
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const say = (s: string) => controller.enqueue(encoder.encode(s));

      try {
        const messages: Anthropic.MessageParam[] = incoming.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const documents: Array<{ name: string; html: string }> = [];
        const sources: WebSource[] = [];
        const memories: NewMemory[] = [];

        // Tool loop: the agent may research, write a document, then narrate what
        // it did. Bounded so a misbehaving turn can't spin.
        for (let turn = 0; turn < 6; turn++) {
          const claude = client.messages.stream({
            model: "claude-opus-5",
            max_tokens: 16000,
            thinking: { type: "adaptive" },
            output_config: { effort: "high" },
            system,
            tools: [CREATE_DOCUMENT, WEB_SEARCH, REMEMBER],
            messages,
          });

          for await (const event of claude) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              say(event.delta.text);
            }
          }

          const final = await claude.finalMessage();

          if (final.stop_reason === "refusal") {
            say("\n\n[הבקשה נדחתה]");
            break;
          }

          collectSources(final.content, sources);

          // Web search ran long enough to hit the server-side iteration cap.
          // Echo the turn back and the server picks up where it stopped.
          if (final.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: final.content });
            continue;
          }

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          if (!toolUses.length) break;

          messages.push({ role: "assistant", content: final.content });

          const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
            if (tu.name === REMEMBER.name) {
              const m = tu.input as NewMemory;
              memories.push({ content: m.content, kind: m.kind });
              return {
                type: "tool_result",
                tool_use_id: tu.id,
                content: "נשמר לזיכרון.",
              };
            }
            try {
              const doc = tu.input as AgentDocument;
              documents.push({
                name: `${doc.type === "price" ? "הצעת מחיר" : "הצעת ערך"} — ${doc.client}`,
                html: renderDocument(doc),
              });
              return {
                type: "tool_result",
                tool_use_id: tu.id,
                content: "המסמך נוצר והוצג למשתמש עם כפתור הורדה.",
              };
            } catch (e) {
              return {
                type: "tool_result",
                tool_use_id: tu.id,
                content: `יצירת המסמך נכשלה: ${
                  e instanceof Error ? e.message : "שגיאה"
                }`,
                is_error: true,
              };
            }
          });

          messages.push({ role: "user", content: results });
        }

        if (documents.length || sources.length || memories.length) {
          say(DOC_MARKER + JSON.stringify({ documents, sources, memories }));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
        say(`\n\n[שגיאה: ${msg}]`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
