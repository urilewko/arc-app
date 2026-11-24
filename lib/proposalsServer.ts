import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

/**
 * Server-side helpers for the designed proposals (table `proposals`).
 * The table has RLS on and no policies, so everything goes through the service role key
 * and is gated here: logged-in ARC users for the app screens, an admin token for the publish script,
 * and the unguessable token for the public page and the signature.
 */

export function adminDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

/** A logged-in ARC user (Supabase session sent as a Bearer token), limited to the ARC email domain. */
export async function requireUser(req: Request): Promise<boolean> {
  const h = req.headers.get("authorization") || "";
  const token = h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
  if (!token) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;
  const { data, error } = await createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.getUser(token);
  if (error || !data.user) return false;
  const domain = (process.env.PROPOSALS_ALLOWED_DOMAIN || "arc-exp.com").toLowerCase();
  return (data.user.email || "").toLowerCase().endsWith("@" + domain);
}

/** The publish script (runs on Uri's machine) proves itself with PROPOSALS_ADMIN_TOKEN. */
export function requireAdminToken(req: Request): boolean {
  const want = process.env.PROPOSALS_ADMIN_TOKEN || "";
  const got = req.headers.get("x-admin-token") || "";
  if (want.length < 16 || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function sendMail(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = (process.env.NOTIFY_TO || "uri@arc-exp.com,inon@arc-exp.com").split(",").map(s => s.trim()).filter(Boolean);
  const from = process.env.NOTIFY_FROM || "ARC Proposals <leads@arc-exp.com>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });
  } catch {
    // a failed notification must never fail the signature
  }
}
