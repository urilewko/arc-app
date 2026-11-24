import { randomBytes } from "crypto";
import { adminDb, json, requireAdminToken, requireUser } from "@/lib/proposalsServer";

/**
 * GET  /api/proposals?lead_id=<id>   logged-in ARC user. Lists a lead's designed proposals (no html, no signature image).
 * POST /api/proposals                admin token. Creates one: { lead_id, org_name, label, html } -> { id, token, url }
 */
export async function GET(req: Request) {
  if (!(await requireUser(req))) return json({ error: "unauthorized" }, 401);
  const db = adminDb();
  if (!db) return json({ error: "not configured" }, 503);
  const leadId = new URL(req.url).searchParams.get("lead_id") || "";
  const { data, error } = await db
    .from("proposals")
    .select("id,lead_id,org_name,label,token,status,created_at,sent_at,first_viewed_at,last_viewed_at,view_count,signed_at,signed_name,signed_role")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) return json({ error: error.message }, 500);
  return json({ proposals: data });
}

export async function POST(req: Request) {
  if (!requireAdminToken(req)) return json({ error: "unauthorized" }, 401);
  const db = adminDb();
  if (!db) return json({ error: "not configured" }, 503);
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const html = String(b.html || "");
  if (html.length < 1000) return json({ error: "html missing" }, 400);
  const token = randomBytes(18).toString("base64url");
  const id = "prp_" + randomBytes(6).toString("hex");
  const { error } = await db.from("proposals").insert({
    id,
    token,
    lead_id: String(b.lead_id || ""),
    org_name: String(b.org_name || ""),
    label: String(b.label || ""),
    html,
  });
  if (error) return json({ error: error.message }, 500);
  const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  return json({ id, token, url: `${origin}/p/${token}` });
}

/** PUT /api/proposals  admin token. Replaces the html of an existing proposal (same link): { token, html, label? } */
export async function PUT(req: Request) {
  if (!requireAdminToken(req)) return json({ error: "unauthorized" }, 401);
  const db = adminDb();
  if (!db) return json({ error: "not configured" }, 503);
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const token = String(b.token || "");
  const html = String(b.html || "");
  if (html.length < 1000 || !token) return json({ error: "bad request" }, 400);
  const { data: p } = await db.from("proposals").select("id,signed_at").eq("token", token).maybeSingle();
  if (!p) return json({ error: "not found" }, 404);
  if (p.signed_at) return json({ error: "already signed - create a new proposal instead" }, 409);
  const patch: Record<string, unknown> = { html };
  if (b.label) patch.label = String(b.label);
  const { error } = await db.from("proposals").update(patch).eq("id", p.id);
  if (error) return json({ error: error.message }, 500);
  const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  return json({ id: p.id, token, url: `${origin}/p/${token}` });
}
