import { google } from "googleapis";

export const CALENDAR_IDS = {
  events:     "אירועים",      // projects / closed deals
  work:       "Work Management", // infra / internal
  meetings:   "פגישות ולידים",  // leads / meetings
} as const;

export type CalendarType = keyof typeof CALENDAR_IDS;

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );
}

export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
}

export async function getCalendarClient(accessToken: string, refreshToken: string) {
  const client = getOAuthClient();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: client });
}

// Find or create a calendar by name, return its ID
export async function ensureCalendar(
  cal: Awaited<ReturnType<typeof getCalendarClient>>,
  name: string
): Promise<string> {
  const list = await cal.calendarList.list();
  const existing = list.data.items?.find((c) => c.summary === name);
  if (existing?.id) return existing.id;
  const created = await cal.calendars.insert({ requestBody: { summary: name, timeZone: "Asia/Jerusalem" } });
  return created.data.id!;
}

export function makeEvent(title: string, date: string, description?: string) {
  return {
    summary: title,
    description,
    start: { date, timeZone: "Asia/Jerusalem" },
    end:   { date, timeZone: "Asia/Jerusalem" },
  };
}
