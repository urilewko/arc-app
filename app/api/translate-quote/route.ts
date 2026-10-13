import { NextRequest, NextResponse } from "next/server";

// Long quotes can take 20-40s to translate; the default serverless timeout is too short.
export const maxDuration = 60;

// Translates the free-text fields of a Hebrew price quote into English.
// The client sends only the translatable pieces; ids are echoed back so they can be matched.
export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });

  try {
    const payload = await req.json();

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 8000,
        system:
          "You translate Hebrew business price-quote text into natural, professional English for ARC, a boutique company that designs transformative team experiences and retreats. " +
          "You receive a JSON object. Translate every string VALUE into English; keep all keys and every `id` value unchanged and keep the exact same structure. " +
          "Keep proper names (people, organizations, places) transliterated sensibly, keep numbers, currency symbols and line breaks, and leave empty strings empty. " +
          "Reply with the translated JSON object only — no commentary, no code fences.",
        messages: [{ role: "user", content: JSON.stringify(payload) }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Anthropic ${res.status}: ${text}` }, { status: 502 });
    }
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const translated = JSON.parse(cleaned);
    return NextResponse.json({ translation: translated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
