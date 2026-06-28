import { createClient } from "@supabase/supabase-js";
import { getCalendarClient, ensureCalendar, makeEvent } from "@/lib/googleCalendar";

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get stored tokens
  const { data: tokenRow } = await supabase.from("google_tokens").select("*").eq("id", "arc").single();
  if (!tokenRow) return new Response(JSON.stringify({ error: "לא מחובר ל-Google Calendar" }), { status: 401 });

  const cal = await getCalendarClient(tokenRow.access_token, tokenRow.refresh_token);

  // Ensure the 3 calendars exist
  const [eventsCalId, workCalId, meetingsCalId] = await Promise.all([
    ensureCalendar(cal, "אירועים"),
    ensureCalendar(cal, "Work Management"),
    ensureCalendar(cal, "פגישות ולידים"),
  ]);

  // Fetch all data
  const [{ data: projects }, { data: leads }, { data: infraProjects }] = await Promise.all([
    supabase.from("projects").select("*"),
    supabase.from("leads").select("*"),
    supabase.from("infra_projects").select("*"),
  ]);

  const results = { added: 0, errors: 0 };

  // Sync projects → אירועים calendar
  for (const p of projects ?? []) {
    const date = p.start_date || p.created_at?.slice(0, 10);
    if (!date) continue;
    try {
      await cal.events.insert({
        calendarId: eventsCalId,
        requestBody: makeEvent(p.org_name, date, p.product_type),
      });
      results.added++;
    } catch { results.errors++; }
  }

  // Sync infra → Work Management calendar
  for (const p of infraProjects ?? []) {
    const date = p.due_date || p.created_at?.slice(0, 10);
    if (!date) continue;
    try {
      await cal.events.insert({
        calendarId: workCalId,
        requestBody: makeEvent(p.name, date, p.description),
      });
      results.added++;
    } catch { results.errors++; }
  }

  // Sync leads → פגישות ולידים calendar
  for (const l of leads ?? []) {
    const dates = [
      { date: l.due_date, label: `${l.org_name} — יעד` },
      { date: l.activity_date, label: `${l.org_name} — פגישה` },
    ];
    for (const { date, label } of dates) {
      if (!date) continue;
      try {
        await cal.events.insert({
          calendarId: meetingsCalId,
          requestBody: makeEvent(label, date, l.next_action),
        });
        results.added++;
      } catch { results.errors++; }
    }
  }

  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase.from("google_tokens").select("id,expiry_date").eq("id", "arc").single();
  return new Response(JSON.stringify({ connected: !!data }), { headers: { "Content-Type": "application/json" } });
}
