import { adminDb, json, requireUser } from "@/lib/proposalsServer";

/** PATCH /api/proposals/<id>   logged-in ARC user. Body { status: "draft" | "sent" } (viewed and signed are set by the page itself). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireUser(req))) return json({ error: "unauthorized" }, 401);
  const db = adminDb();
  if (!db) return json({ error: "not configured" }, 503);
  const { id } = await params;
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const status = String(b.status || "");
  if (status !== "draft" && status !== "sent") return json({ error: "bad status" }, 400);
  const { data: p } = await db.from("proposals").select("status").eq("id", id).maybeSingle();
  if (!p) return json({ error: "not found" }, 404);
  if (p.status === "signed") return json({ error: "already signed" }, 409);
  const { error } = await db
    .from("proposals")
    .update({ status, sent_at: status === "sent" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
