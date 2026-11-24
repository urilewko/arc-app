import { adminDb } from "@/lib/proposalsServer";

/**
 * The public page of a designed proposal: GET /p/<token>
 * Serves the stored html as it is. Adds only: noindex, the signed state (if signed), view tracking,
 * and ?print=1 (opens the print dialog, for "save as PDF").
 *   ?preview=1  no view is counted (used by the app's own buttons)
 *   ?lang=he|en start language (handled by the page itself)
 */
const BOT = /bot|crawl|spider|preview|slack|whatsapp|facebook|telegram|skype|linkedin|embedly|headless/i;

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = adminDb();
  if (!db) return new Response("not configured", { status: 503 });
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return new Response("not found", { status: 404 });

  const { data: p } = await db
    .from("proposals")
    .select("id,html,status,view_count,first_viewed_at,signed_at,signed_name,signed_role,signature")
    .eq("token", token)
    .maybeSingle();
  if (!p) return new Response("not found", { status: 404 });

  const u = new URL(req.url);
  const ua = req.headers.get("user-agent") || "";
  if (!u.searchParams.get("preview") && !BOT.test(ua)) {
    const now = new Date().toISOString();
    await db
      .from("proposals")
      .update({
        status: p.status === "signed" ? "signed" : "viewed",
        view_count: (p.view_count || 0) + 1,
        first_viewed_at: p.first_viewed_at || now,
        last_viewed_at: now,
      })
      .eq("id", p.id);
  }

  const esc = (s: string) => s.replace(/</g, "\\u003c");
  let inject = '<meta name="robots" content="noindex,nofollow">';
  if (p.signed_at) {
    inject += `<script>window.__ARC_SIGNED=${esc(JSON.stringify({ name: p.signed_name, role: p.signed_role, signature: p.signature }))}</script>`;
  }
  if (u.searchParams.get("print")) {
    inject += "<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},1200)})</script>";
  }
  const html = String(p.html).replace("<head>", "<head>" + inject);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
