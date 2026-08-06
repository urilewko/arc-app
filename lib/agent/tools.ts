import type Anthropic from "@anthropic-ai/sdk";

/**
 * Lets the agent research a topic beyond ARC's own material.
 *
 * Anything it finds here is *external* — the prompt requires it to be labelled
 * as such and kept apart from the block library, which is the team's own IP.
 */
export const WEB_SEARCH = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 5,
} as const;

/**
 * Long-term memory is written explicitly rather than inferred from the
 * transcript, so every remembered fact is one the team can see and delete.
 */
export const REMEMBER: Anthropic.Tool = {
  name: "remember",
  description: `שומר משהו לזיכרון ארוך-טווח, כדי שתדע אותו גם בשיחות הבאות.

השתמש בזה כשאתה לומד משהו **עמיד** על איך ARC עובדת — לא פרט חולף מהשיחה הזאת.

**כן לשמור:**
- העדפות עבודה ("אורי מעדיף טבלאות על פסקאות")
- החלטות שהתקבלו ("החליטו שקפסולות לא נמכרות ליום בודד")
- עובדות על העסק ("ינון לימד בבן-גוריון", "תמחור הבלנדר: X")
- לקחים מלקוחות ("מכבי ביקשו לקצר — 4 שעות זה המקסימום שלהם")

**לא לשמור:**
- מה שכבר כתוב בכרטיסי הבלוקים או במערכת — זה כבר בהישג ידך
- פרטים ספציפיים לשיחה הזאת בלבד
- ניחושים או מסקנות שלך שלא אושרו

**כללים:**
- פריט אחד = עובדה אחת. אל תדחוס כמה דברים למשפט.
- כתוב בגוף שלישי וברור, כך שיהיה מובן בעוד חצי שנה בלי הקשר.
- **אמור למשתמש מה שמרת** — בשורה קצרה, כדי שיוכל לתקן.`,
  input_schema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "העובדה, במשפט אחד ברור ועצמאי",
      },
      kind: {
        type: "string",
        enum: ["העדפה", "עובדה", "החלטה", "לקוח"],
        description: "סוג הפריט",
      },
    },
    required: ["content", "kind"],
  },
};

/**
 * The agent writes proposals by calling this tool rather than printing a
 * document into the chat — that keeps the rendering (brand, layout, totals)
 * on our side and out of the model's hands.
 */
export const CREATE_DOCUMENT: Anthropic.Tool = {
  name: "create_document",
  description: `יוצר מסמך הצעה מעוצב במיתוג ARC, מוכן לפתיחה ב-Word או ב-Google Docs.

השתמש בכלי הזה כשמבקשים ממך "תוציא הצעה", "תכין מסמך", "שלח ללקוח" וכדומה.

שני סוגי מסמכים — **הם לא אותו דבר, ויש ביניהם סדר**:

1. "value" — **הצעת ערך**. מפורטת. מה נעשה, אילו בלוקים, למה כל אחד נבחר, מה
   הלקוח יקבל. זה מה שסוגרים **קודם**.

2. "price" — **הצעת מחיר**. רק שמות הסדנאות והעלות. בלי הסברים ובלי תיאורים.
   נשלחת **אחרי** שהצעת הערך אושרה.

אם ביקשו "הצעה" בלי לפרט — שאל איזו מהשתיים. אל תמציא מחירים: אם אין נתוני
תמחור, בקש אותם לפני שאתה יוצר הצעת מחיר.`,
  input_schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["value", "price"],
        description: "value = הצעת ערך מפורטת · price = הצעת מחיר",
      },
      client: { type: "string", description: "שם הלקוח / הארגון" },
      title: { type: "string", description: "כותרת המסמך" },
      intro: {
        type: "string",
        description: "פתיחה — הבנת הצורך והמטרה. הצעת ערך בלבד.",
      },
      sections: {
        type: "array",
        description: "גוף הצעת הערך — שלבי היום או נושאי ההצעה. הצעת ערך בלבד.",
        items: {
          type: "object",
          properties: {
            heading: { type: "string", description: "כותרת הסעיף / שם הבלוק" },
            body: { type: "string", description: "התיאור" },
            duration: { type: "string", description: "משך, למשל \"60 דקות\"" },
            rationale: {
              type: "string",
              description: "למה בחרנו בזה עבור הלקוח הזה",
            },
          },
          required: ["heading", "body"],
        },
      },
      closing: { type: "string", description: "סיום / הצעדים הבאים" },
      lines: {
        type: "array",
        description: "שורות הצעת המחיר. הצעת מחיר בלבד.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "שם הסדנה / הסעיף" },
            price: { type: "number", description: "עלות בשקלים" },
            note: { type: "string", description: "הערה קצרה, אופציונלי" },
          },
          required: ["title", "price"],
        },
      },
      terms: {
        type: "array",
        items: { type: "string" },
        description: "תנאים, למשל \"המחירים אינם כוללים מע״מ\"",
      },
    },
    required: ["type", "client", "title"],
  },
};
