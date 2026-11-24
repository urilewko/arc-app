import { createHash } from "crypto";
import { adminDb, json, sendMail } from "@/lib/proposalsServer";

/**
 * POST /api/proposals/sign   (public - the page calls it)
 * body: { token, name, role, signature (png data url), consent: true, lang }
 * Stores the signature once. A second call returns what was already signed (409).
 */
export async function POST(req: Request) {
  const db = adminDb();
  if (!db) return json({ error: "not configured" }, 503);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const token = String(b.token || "");
  const name = String(b.name || "").trim().slice(0, 120);
  const role = String(b.role || "").trim().slice(0, 120);
  const signature = String(b.signature || "");
  const lang = String(b.lang || "").slice(0, 8);
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return json({ error: "not found" }, 404);
  if (!name || b.consent !== true) return json({ error: "missing fields" }, 400);
  if (!signature.startsWith("data:image/png;base64,") || signature.length > 400_000) {
    return json({ error: "bad signature" }, 400);
  }

  const { data: p } = await db
    .from("proposals")
    .select("id,html,org_name,label,signed_at,signed_name,signed_role,signature")
    .eq("token", token)
    .maybeSingle();
  if (!p) return json({ error: "not found" }, 404);
  if (p.signed_at) {
    return json({ error: "already signed", name: p.signed_name, role: p.signed_role, signature: p.signature }, 409);
  }

  const now = new Date().toISOString();
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 64);
  const ua = (req.headers.get("user-agent") || "").slice(0, 300);
  const sha = createHash("sha256").update(String(p.html)).digest("hex");

  const { data: done, error } = await db
    .from("proposals")
    .update({
      status: "signed",
      signed_at: now,
      signed_name: name,
      signed_role: role,
      signed_lang: lang,
      signature,
      signed_ip: ip,
      signed_ua: ua,
      signed_html_sha256: sha,
    })
    .eq("id", p.id)
    .is("signed_at", null)
    .select("id");
  if (error) return json({ error: "save failed" }, 500);
  if (!done || done.length === 0) return json({ error: "already signed" }, 409);

  const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  await sendMail(
    `הצעה אושרה: ${p.org_name || p.label}`,
    [
      `${name}${role ? " (" + role + ")" : ""} אישר/ה את ההצעה.`,
      `לקוח: ${p.org_name || "-"}`,
      `הצעה: ${p.label || "-"}`,
      `זמן: ${now}`,
      `שפת העמוד: ${lang || "-"}`,
      `קישור: ${origin}/p/${token}?preview=1`,
    ].join("\n")
  );

  return json({ ok: true, name, role, signature });
}
