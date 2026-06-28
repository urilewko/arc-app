import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOAuthClient } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("google_tokens").upsert({
    id: "arc",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  return new Response(`<html><body><script>window.close();</script><p>חיבור הצליח! אפשר לסגור חלון זה.</p></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
