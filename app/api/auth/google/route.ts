import { getAuthUrl } from "@/lib/googleCalendar";
import { redirect } from "next/navigation";

export async function GET() {
  const url = getAuthUrl();
  redirect(url);
}
