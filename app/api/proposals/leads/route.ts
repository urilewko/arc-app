import { adminDb, json, requireAdminToken } from "@/lib/proposalsServer";

/** GET /api/proposals/leads?q=<text>   admin token. Finds leads by organisation name, so the publish script can attach a proposal. */
export async function GET(req: Request) {
  if (!requireAdminToken(req)) return json({ error: "unauthorized" }, 401);
  const db = adminDb();
  if (!db) return json({ error: "not configured" }, 503);
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  let query = db.from("leads").select("id,org_name,status,created_at").order("created_at", { ascending: false }).limit(20);
  if (q) query = query.ilike("org_name", `%${q.replace(/[%_]/g, "")}%`);
  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ leads: data });
}
