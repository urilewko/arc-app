import type { Block } from "@/lib/store";

/**
 * The four Signature workshops, as defined in the deck "Arc - Signature
 * workshops" (22/10/2026). This replaces the earlier nine-block library, which
 * Uri retired the same day. The previous seeds are kept for reference in
 * knowledge/blocks-archive/.
 *
 * Only what the deck states is filled in. Prices are 0 and completion is 0:
 * the deck carries no structure, logistics, pricing or field history, and
 * inventing them would poison both the quotes screen and the agent. The next
 * task is to complete these with Yinon.
 *
 * Kept as data (not a migration) so /blocks/import can re-run it after the
 * cards are revised.
 */
export type BlockSeed = Omit<Block, "id" | "createdAt">;

const item = (title: string, body: string) => ({ id: title, title, body });

export const BLOCK_SEEDS: BlockSeed[] = [
  {
    name: "Connect",
    productType: "סדנה חד פעמית",
    tagline: "Lower the price of being Me",
    description:
      "An immersive headphone journey that moves from playful encounters to meaningful conversations, helping colleagues meet beyond their roles.\nLight, surprising and carefully guided to build psychological safety, trust and genuine connection without forcing vulnerability.",
    duration: "60-90 דק'",
    groupSize: "עד 150",
    price: 0,
    status: "בפיתוח",
    completionPercent: 0,
    contentItems: [
      item("תוצאות", "Trust · Connection · Belonging"),
      item("יחס אישי / מקצועי", "70% Personal / 30% Professional"),
    ],
    experience: "אוזניות (immersive headphone journey). יתר הפרטים לא נמסרו עדיין.",
    logistics: "",
    marketingPitch: "",
    marketingAudience: "",
    marketingLinks: [],
    expenses: [],
    includes: "",
    marketingNotes:
      "הבלנדר בשם חדש (אורי, 22/10/2026). ⚠️ חסר: קשת ותזמונים, קבוע מול מותאם, לוגיסטיקה, תמחור, איפה רץ בפועל. חומרי הבלנדר הישן בארכיון הם נקודת מוצא, לא מקור אמת.",
  },
  {
    name: "Attune",
    productType: "סדנה חד פעמית",
    tagline: "Change your state. Find clarity.",
    description:
      "An immersive journey combining classical music, gentle breathing and guided imagination, experienced on mattresses with headphones, or accompanied by live musicians.\nDesigned to quiet the noise and create space for presence, perspective and leadership clarity.",
    duration: "60-90 דק'",
    groupSize: "עד 150",
    price: 0,
    status: "בפיתוח",
    completionPercent: 0,
    contentItems: [
      item("תוצאות", "Clarity · Presence · Perspective"),
      item("יחס אישי / מקצועי", "60% Personal / 40% Professional"),
    ],
    experience:
      "מוזיקה קלאסית, נשימה עדינה ודמיון מודרך. מזרנים עם אוזניות, או בליווי מוזיקאים חיים. יתר הפרטים לא נמסרו עדיין.",
    logistics: "",
    marketingPitch: "",
    marketingAudience: "",
    marketingLinks: [],
    expenses: [],
    includes: "",
    marketingNotes:
      "⚠️ חסר: קשת ותזמונים, קבוע מול מותאם, לוגיסטיקה (מזרנים, אוזניות, מוזיקאים), תמחור לכל גרסה, איפה רץ בפועל.",
  },
  {
    name: "Change",
    productType: "סדנה חד פעמית",
    tagline: "Closing the gap",
    description:
      "Participants go through a structured, precise process that helps them map the change they want to make, and what it takes to move toward it.\nAlong the way, a window opens onto the deeper forces that run them: the core beliefs they hold, the automatic strategies they built, and the prices they pay for them.\n\nEach participant leaves with a deeper understanding of themselves, and with the practical tools and the drive to start making the change happen.",
    duration: "60-90 דק'",
    groupSize: "עד 35",
    price: 0,
    status: "בפיתוח",
    completionPercent: 0,
    contentItems: [
      item("תוצאות", "Awareness · Mindset Shift · Momentum"),
      item("יחס אישי / מקצועי", "70% Personal / 30% Professional"),
    ],
    experience: "",
    logistics: "",
    marketingPitch: "",
    marketingAudience: "",
    marketingLinks: [],
    expenses: [],
    includes: "",
    marketingNotes:
      "⚠️ חסר: קשת ותזמונים, הכלים המעשיים, אמצעי חוויה, לוגיסטיקה, תמחור, איפה רץ בפועל.",
  },
  {
    name: "Collaborate",
    productType: "סדנה חד פעמית",
    tagline: "Make the invisible, visible",
    description:
      "Participants enter a room covered in canvas. Using long colored drawing sticks, they map their working relationships across the floor, revealing dependencies, friction, gaps and silos.\nThe live map sparks a guided conversation that turns insight into alignment and concrete decisions.",
    duration: "90-120 דק'",
    groupSize: "עד 25",
    price: 0,
    status: "בפיתוח",
    completionPercent: 0,
    contentItems: [
      item("תוצאות", "Alignment · Breaking Silos · Lowering Friction"),
      item("יחס אישי / מקצועי", "20% Personal / 80% Professional"),
    ],
    experience: "חדר מכוסה בבד קנבס, ומקלות ציור צבעוניים ארוכים. יתר הפרטים לא נמסרו עדיין.",
    logistics: "",
    marketingPitch: "",
    marketingAudience: "",
    marketingLinks: [],
    expenses: [],
    includes: "",
    marketingNotes:
      "⚠️ חסר: קשת ותזמונים, לוגיסטיקה (כמה בד, איזה מרחב), מה קורה עם המפה בסוף, תמחור, איפה רץ בפועל.",
  },
];
