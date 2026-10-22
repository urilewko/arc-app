// ─── Brand ────────────────────────────────────────────────────────────────────
export const BRAND_BG     = "#2e5775";
export const BRAND_ACCENT = "#2e5775";
export const BRAND_TEXT   = "#987859";
export const BRAND_MUTED  = "#987859";
export const BRAND_PAPER  = "#e7ded2";
export const BRAND_ON_BG  = "#e7ded2";
export const FONT         = "'Heebo', 'Arial Hebrew', Arial, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotePackage {
  id: string;
  name: string;
  description: string;
  items: QuoteItem[];
  isRecommended: boolean;
}

export interface BrandLink {
  id: string;
  label: string;
  url: string;
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  notes: string;
}

export interface QuoteData {
  orgName: string;
  contactName: string;
  quoteDate: string;
  validUntil: string;
  productType: string;
  eventDate: string;
  location: string;
  participants: string;
  quoteNumber: string;
  intro: string;
  includes: string;
  workshops: Workshop[];
  items: QuoteItem[];
  mode: "single" | "packages";
  packages: QuotePackage[];
  notes: string;
  cancellationPolicy: string;
  paymentTerms: string;
  selectedBlockId: string;
  blockLinks: BrandLink[];
  /** English translation of the free-text fields (matched by id), filled by the translate button. */
  en?: QuoteEnglish;
  /** User overrides for every fixed text on the document, per language, keyed by the default Hebrew text. */
  labels?: QuoteLabels;
}

export type QuoteLabels = { he?: Record<string, string>; en?: Record<string, string> };

export interface QuoteEnglish {
  productType?: string;
  location?: string;
  intro?: string;
  includes?: string;
  notes?: string;
  cancellationPolicy?: string;
  paymentTerms?: string;
  workshops?: { id: string; title: string; description: string; notes: string }[];
  items?: { id: string; description: string }[];
  packages?: { id: string; name: string; description: string; items: { id: string; description: string }[] }[];
  blockLinks?: { id: string; label: string }[];
  block?: { name?: string; tagline?: string; description?: string; duration?: string; groupSize?: string };
}

export type QuoteLang = "he" | "en";

const EN_LABELS: Record<string, string> = {
  "הצעת מחיר": "Price Quote",
  "תאריך הצעה:": "Quote date:",
  "תוקף עד:": "Valid until:",
  "תאריך אירוע:": "Event date:",
  "משתתפים:": "Participants:",
  "מיקום:": "Location:",
  "שם הארגון": "Organization",
  "סדנה": "Workshop",
  "תוכנית הפעילות": "Program",
  "⚡ על החוויה": "⚡ About the experience",
  "אפשרויות לבחירה": "Options",
  "פירוט השירותים": "Services",
  "מה כלול": "What's included",
  "הערות:": "Notes:",
  "תנאי תשלום": "Payment terms",
  "מדיניות ביטול": "Cancellation policy",
  "חומרים נוספים": "Additional materials",
  "חתימת הלקוח": "Client signature",
  "שם, תפקיד ותאריך": "Name, title and date",
  "חתימת ARC": "ARC signature",
  "חתום דיגיטלית": "Digitally signed",
  "אורי לבקוביץ, ARC": "Uri Lewkowicz, ARC",
  "תיאור": "Description",
  "כמות": "Qty",
  "מחיר יחידה": "Unit price",
  "סה״כ": "Total",
  "לפני מע״מ": "Before VAT",
  "מע״מ (18%)": "VAT (18%)",
  "סה״כ לתשלום": "Total payable",
  "מומלץ": "Recommended",
  "סה״כ + מע״מ": "Total incl. VAT",
  "משך:": "Duration:",
  "גודל קבוצה:": "Group size:",
};
/** Every fixed text on the quote that can be edited from the builder (key = default Hebrew text). */
export const FIXED_TEXT_GROUPS: { title: string; keys: string[] }[] = [
  { title: "כותרת עליונה", keys: ["הצעת מחיר", "תאריך הצעה:", "תוקף עד:", "תאריך אירוע:", "משתתפים:", "מיקום:", "שם הארגון"] },
  { title: "כותרות קטעים", keys: ["תוכנית הפעילות", "⚡ על החוויה", "אפשרויות לבחירה", "פירוט השירותים", "מה כלול", "הערות:", "תנאי תשלום", "מדיניות ביטול", "חומרים נוספים"] },
  { title: "טבלת מחירים", keys: ["תיאור", "כמות", "מחיר יחידה", "סה״כ", "לפני מע״מ", "מע״מ (18%)", "סה״כ לתשלום", "מומלץ", "סה״כ + מע״מ"] },
  { title: "על החוויה", keys: ["משך:", "גודל קבוצה:"] },
  { title: "חתימות", keys: ["חתימת הלקוח", "שם, תפקיד ותאריך", "חתימת ARC", "חתום דיגיטלית", "אורי לבקוביץ, ARC"] },
  { title: "תחתית", keys: ["ARC", "Irreplaceable Experiences", "Office@arc-exp.com", "052-6108102"] },
];
export const defaultFixedText = (key: string, lang: QuoteLang) => (lang === "en" ? (EN_LABELS[key] ?? key) : key);

const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


export interface SelectedBlock {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  duration?: string;
  groupSize?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const formatDate = (iso: string, lang: QuoteLang = "he") => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (lang === "en") return `${Number(d)} ${EN_MONTHS[Number(m) - 1] ?? m} ${y}`;
  return `${d}.${m}.${y}`;
};

export const fmt = (n: number) =>
  "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const calcItems = (items: QuoteItem[]) =>
  items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

function buildLogoTag(logoUrl: string) {
  const filter = "brightness(0) saturate(100%) invert(93%) sepia(10%) saturate(300%) hue-rotate(330deg) brightness(102%)";
  return `<img src="${logoUrl}" alt="ARC" style="height:34px;width:auto;max-width:150px;object-fit:contain;display:block;filter:${filter};" />`;
}

// ─── Main builder ─────────────────────────────────────────────────────────────
export function buildQuoteHTML(
  qIn: QuoteData,
  { logoUrl, selectedBlock: blockIn, lang = "he" }: { logoUrl: string; selectedBlock?: SelectedBlock | null; lang?: QuoteLang }
): string {
  const F = FONT;
  const en = lang === "en" ? qIn.en : undefined;
  const money = (n: number) => (lang === "en" ? `NIS ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : fmt(n));
  const tr = (he: string) => qIn.labels?.[lang]?.[he]?.trim() || defaultFixedText(he, lang);
  const byId = <T extends { id: string }>(list: T[] | undefined, id: string) => list?.find((x) => x.id === id);
  const q: QuoteData = !en ? qIn : {
    ...qIn,
    productType: en.productType ?? qIn.productType,
    location: en.location ?? qIn.location,
    intro: en.intro ?? qIn.intro,
    includes: en.includes ?? qIn.includes,
    notes: en.notes ?? qIn.notes,
    cancellationPolicy: en.cancellationPolicy ?? qIn.cancellationPolicy,
    paymentTerms: en.paymentTerms ?? qIn.paymentTerms,
    workshops: (qIn.workshops ?? []).map((w) => ({ ...w, ...byId(en.workshops, w.id) })),
    items: (qIn.items ?? []).map((it) => ({ ...it, description: byId(en.items, it.id)?.description ?? it.description })),
    packages: (qIn.packages ?? []).map((pk) => {
      const e = byId(en.packages, pk.id);
      return { ...pk, name: e?.name ?? pk.name, description: e?.description ?? pk.description,
        items: pk.items.map((it) => ({ ...it, description: byId(e?.items, it.id)?.description ?? it.description })) };
    }),
    blockLinks: (qIn.blockLinks ?? []).map((l) => ({ ...l, label: byId(en.blockLinks, l.id)?.label ?? l.label })),
  };
  const selectedBlock = blockIn && en?.block ? { ...blockIn, ...en.block } : blockIn;
  const activeLinks = q.blockLinks?.filter((l) => l.url) ?? [];

  const lbl = (k: string) => tr(k).replace(/[:：]\s*$/, "");
  let secN = 0;
  const sec = (title: string) =>
    `<div class="sec-h"><span class="num">${String(++secN).padStart(2, "0")}</span><span class="lbl">${title}</span><span class="rule"></span></div>`;
  const introShort = (q.intro || "").length < 260;

  const itemsTable = (items: QuoteItem[]) => {
    const sub = calcItems(items);
    const vat = Math.round(sub * 0.18);
    return `
    <table class="items">
      <thead><tr>
        <th class="c-desc">${tr("תיאור")}</th><th class="c-qty">${tr("כמות")}</th>
        <th class="c-num">${tr("מחיר יחידה")}</th><th class="c-num">${tr("סה״כ")}</th>
      </tr></thead>
      <tbody>
        ${items.map((it) => `<tr>
          <td class="c-desc strong">${it.description || "—"}</td>
          <td class="c-qty">${it.quantity}</td>
          <td class="c-num muted">${money(it.unitPrice)}</td>
          <td class="c-num strong">${money(it.quantity * it.unitPrice)}</td></tr>`).join("")}
      </tbody>
    </table>
    <div class="totals avoid">
      <div class="trow"><span>${tr("לפני מע״מ")}</span><span class="n">${money(sub)}</span></div>
      <div class="trow"><span>${tr("מע״מ (18%)")}</span><span class="n">${money(vat)}</span></div>
      <div class="grand"><span class="gl">${tr("סה״כ לתשלום")}</span><span class="gv">${money(sub + vat)}</span></div>
    </div>`;
  };

  const packagesHTML = (q.packages ?? []).map((pkg) => {
    const pkgSub = calcItems(pkg.items);
    const pkgVat = Math.round(pkgSub * 0.18);
    return `
    <div class="pkg avoid ${pkg.isRecommended ? "rec" : ""}">
      <div class="pkg-tag">${pkg.isRecommended ? tr("מומלץ") : "&nbsp;"}</div>
      <div class="pkg-body">
        <div class="pkg-name">${pkg.name}</div>
        ${pkg.description ? `<div class="pkg-desc">${pkg.description}</div>` : ""}
        <div class="pkg-items">
          ${pkg.items.map((it) => `<div class="pkg-item"><span>${it.description || "—"}${it.quantity > 1 ? ` ×${it.quantity}` : ""}</span><span class="n">${money(it.quantity * it.unitPrice)}</span></div>`).join("")}
        </div>
        <div class="pkg-sum">
          <div class="trow"><span>${tr("לפני מע״מ")}</span><span class="n">${money(pkgSub)}</span></div>
          <div class="pkg-total"><span>${tr("סה״כ + מע״מ")}</span><span class="n">${money(pkgSub + pkgVat)}</span></div>
        </div>
      </div>
    </div>`;
  }).join("");

  const meta: [string, string][] = ([
    [lbl("תאריך הצעה:"), formatDate(q.quoteDate, lang)],
    [lbl("תוקף עד:"), formatDate(q.validUntil, lang)],
    [lbl("תאריך אירוע:"), q.eventDate ? formatDate(q.eventDate, lang) : ""],
    [lbl("משתתפים:"), q.participants || ""],
    [lbl("מיקום:"), q.location || ""],
  ] as [string, string][]).filter(([, v]) => v);

  const grain = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>")`;
  const today = new Date().toLocaleDateString(lang === "en" ? "en-GB" : "he-IL");

  const html = `<!DOCTYPE html>
<html dir="${lang === "en" ? "ltr" : "rtl"}" lang="${lang}">
<head>
<meta charset="UTF-8"/>
<title>${tr("הצעת מחיר")} — ${q.orgName}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@200;400;600&family=Heebo:wght@300;400;500;600;700&family=Mynerve&display=swap" rel="stylesheet"/>
<style>
  :root{--harbor:#2e5775;--harbor-900:#172b3b;--harbor-100:#dde6ec;--linen:#e7ded2;--bg:#f7f3ed;--surface:#fcfaf6;--surface-2:#efe8de;--border:#ddd3c5;--dune:#b29a7f;--bark:#987859;--bark-700:#6f5640;--text:#22201d;--muted:#5e554b;--subtle:#6e6357;}
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}
  html,body{font-family:${F};background:var(--surface-2);color:var(--text);line-height:1.65;}
  .n,.gv,.mono{font-variant-numeric:tabular-nums;}
  table.doc{width:100%;max-width:760px;margin:32px auto;background:var(--bg);border-collapse:collapse;box-shadow:0 10px 30px -12px rgba(34,32,29,.22);}
  @media(max-width:780px){table.doc{margin:0;box-shadow:none;}}
  tfoot.footer-space{display:none;}
  .print-footer{display:none;}

  .cover{position:relative;background:var(--harbor);color:var(--linen);padding:30px 48px 28px;overflow:hidden;}
  .cover::after{content:"";position:absolute;inset:0;background-image:${grain};opacity:.10;mix-blend-mode:screen;pointer-events:none;}
  .cover > *{position:relative;z-index:1;}
  .cover-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:34px;}
  .kicker{font-family:'Assistant',${F};font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.85;}
  .org{font-size:40px;font-weight:500;line-height:1.15;letter-spacing:-.01em;}
  .contact{font-family:'Assistant',${F};font-weight:200;font-size:22px;line-height:1.4;margin-top:6px;opacity:.95;}
  .ptype{margin-top:14px;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.8;}
  .meta{display:flex;flex-wrap:wrap;gap:18px 40px;margin-top:28px;padding-top:18px;border-top:1px solid rgba(231,222,210,.28);}
  .meta .k{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.7;}
  .meta .v{font-size:15px;font-weight:500;margin-top:2px;}

  .body{padding:44px 48px 40px;}
  .lead{font-family:'Assistant',${F};font-weight:200;font-size:22px;line-height:1.55;color:var(--text);white-space:pre-line;margin-bottom:44px;}
  .lead.long{font-weight:400;font-size:16px;line-height:1.85;color:var(--muted);}
  .section{margin-bottom:40px;}
  .sec-h{break-after:avoid;page-break-after:avoid;display:flex;align-items:baseline;gap:14px;margin-bottom:18px;}
  .sec-h .num{font-family:'Mynerve',cursive;font-size:26px;color:var(--bark-700);line-height:1;}
  .sec-h .lbl{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--text);white-space:nowrap;}
  .sec-h .rule{flex:1;height:1px;background:var(--dune);opacity:.6;transform:translateY(-3px);}
  .avoid{break-inside:avoid;page-break-inside:avoid;}

  /* dots and the line */
  .steps{position:relative;padding-inline-start:34px;}
  .steps::before{content:"";position:absolute;inset-inline-start:7px;top:10px;bottom:10px;width:1px;background:var(--dune);}
  .step{position:relative;padding-bottom:26px;break-inside:avoid;page-break-inside:avoid;}
  .step:last-child{padding-bottom:0;}
  .step .dot{position:absolute;inset-inline-start:-34px;top:5px;width:15px;height:15px;border-radius:50%;background:var(--harbor);border:3px solid var(--bg);box-sizing:content-box;margin:-3px;}
  .step.up .dot{background:var(--bg);border:1.5px solid var(--harbor);margin:0;}
  .step-t{font-size:20px;font-weight:500;line-height:1.35;}
  .step-d{margin-top:6px;font-size:15px;color:var(--muted);line-height:1.75;white-space:pre-line;}
  .step-n{margin-top:8px;font-size:13px;color:var(--bark-700);white-space:pre-line;}

  .xp{background:var(--surface-2);border-radius:8px;padding:24px 28px;}
  .xp-name{font-size:24px;font-weight:500;line-height:1.3;}
  .xp-tag{font-family:'Assistant',${F};font-weight:200;font-size:22px;line-height:1.4;color:var(--muted);margin-top:4px;}
  .xp-desc{margin-top:12px;font-size:15px;color:var(--muted);line-height:1.8;}
  .xp-meta{display:flex;gap:32px;margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:13px;}
  .xp-meta b{font-weight:600;letter-spacing:.06em;color:var(--bark-700);margin-inline-end:6px;}

  table.items{width:100%;border-collapse:collapse;}
  table.items th{background:var(--surface-2);font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--subtle);padding:11px 14px;text-align:start;white-space:nowrap;}
  table.items td{padding:14px;font-size:15px;border-bottom:1px solid var(--border);}
  table.items tr{break-inside:avoid;page-break-inside:avoid;}
  .c-desc{width:44%;} .c-qty{width:12%;text-align:center !important;} .c-num{width:22%;text-align:end !important;}
  .strong{font-weight:600;} .muted{color:var(--muted);}
  .totals{width:320px;margin-inline-start:auto;margin-top:18px;}
  .trow{display:flex;justify-content:space-between;font-size:14px;color:var(--muted);padding:5px 0;}
  .grand{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:14px;border-top:1px solid var(--dune);}
  .gl{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;}
  .br{font-family:'Assistant',${F};font-weight:200;font-size:46px;line-height:1;transform:translateY(-3px);}
  .gv{font-size:26px;font-weight:600;color:var(--harbor);}

  .pkgs{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;}
  .pkg{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;display:flex;flex-direction:column;}
  .pkg.rec{border-color:var(--harbor);}
  .pkg-tag{height:26px;background:var(--surface-2);color:transparent;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-align:center;line-height:26px;}
  .pkg.rec .pkg-tag{background:var(--harbor);color:var(--bg);}
  .pkg-body{padding:20px;flex:1;display:flex;flex-direction:column;}
  .pkg-name{font-size:20px;font-weight:500;}
  .pkg-desc{font-size:13px;color:var(--muted);margin-top:4px;}
  .pkg-items{margin-top:14px;flex:1;}
  .pkg-item{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:7px 0;border-bottom:1px solid var(--border);}
  .pkg-sum{margin-top:14px;}
  .pkg-total{display:flex;justify-content:space-between;font-size:17px;font-weight:600;color:var(--harbor);padding-top:8px;border-top:1px solid var(--dune);margin-top:4px;}

  .prose{font-size:15px;color:var(--muted);line-height:1.85;white-space:pre-line;}
  .note{background:var(--surface-2);border-radius:8px;padding:18px 22px;font-size:14px;line-height:1.8;color:var(--text);white-space:pre-line;}
  .note b{display:block;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--bark-700);margin-bottom:6px;}
  .terms{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:40px;}
  .term{border-top:1px solid var(--dune);padding-top:12px;}
  .term .t{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--bark-700);margin-bottom:6px;}
  .term .v{font-size:13px;color:var(--muted);line-height:1.8;}
  .links{display:flex;flex-wrap:wrap;gap:8px 24px;}
  .links a{color:var(--harbor);font-size:15px;font-weight:600;text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px;}

  .sig-block{margin-top:48px;padding-top:28px;border-top:1px solid var(--dune);display:grid;grid-template-columns:1fr 1fr;gap:48px;break-inside:avoid;page-break-inside:avoid;}
  .sig-block .t{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--bark-700);}
  .sig-gap{height:88px;display:flex;align-items:center;}
  .sig-line{border-bottom:1px solid var(--text);opacity:.35;margin-bottom:8px;}
  .sig-sub{font-size:12px;color:var(--subtle);}
  .stamp{display:inline-flex;align-items:center;gap:10px;direction:ltr;color:var(--harbor);}
  .stamp .txt{text-align:center;direction:${lang === "en" ? "ltr" : "rtl"};}
  .stamp .a{font-size:16px;font-weight:600;line-height:1.2;}
  .stamp .d{font-size:11px;color:var(--subtle);font-family:ui-monospace,Menlo,monospace;}
  .stamp .br{font-size:56px;transform:translateY(-4px);}

  @page{margin:0;size:A4 portrait;}
  @media print{
    html,body{background:var(--bg);margin:0;padding:0;zoom:1.18;}
    .cover::after{display:none;}
    table.doc{margin:0;box-shadow:none;max-width:100%;width:100%;}
    .cover{padding:22px 44px 22px;}
    .cover-top{margin-bottom:22px;}
    .org{font-size:34px;}
    .meta{margin-top:20px;}
    .body{padding:28px 44px 20px;}
    .lead{margin-bottom:30px;}
    .section{margin-bottom:22px;}
    .xp{padding:18px 24px;}
    .sig-block{margin-top:30px;padding-top:20px;}
    .sig-gap{height:72px;}
    tfoot.footer-space{display:table-footer-group;}
    tfoot.footer-space td{height:70px;}
    .print-footer{display:flex;position:fixed;bottom:0;left:0;right:0;width:100%;background:var(--harbor-900);color:var(--linen);justify-content:space-between;align-items:center;padding:13px 44px;z-index:10;}
  }
</style>
</head>
<body>
<table class="doc">
  <tbody><tr><td style="padding:0;">
    <div class="cover">
      <div class="cover-top">
        <div>${buildLogoTag(logoUrl)}</div>
        <div class="kicker">${tr("הצעת מחיר")}</div>
      </div>
      <div class="org">${q.orgName || tr("שם הארגון")}</div>
      ${q.contactName ? `<div class="contact">${q.contactName}</div>` : ""}
      ${q.productType ? `<div class="ptype">${q.productType}</div>` : ""}
      <div class="meta">
        ${meta.map(([k, v]) => `<div><div class="k">${k}</div><div class="v n">${v}</div></div>`).join("")}
      </div>
    </div>

    <div class="body">
      ${q.intro ? `<p class="lead ${introShort ? "" : "long"}">${q.intro}</p>` : ""}

      ${(q.workshops ?? []).length > 0 ? `
      <div class="section">
        ${sec(tr("תוכנית הפעילות"))}
        <div class="steps">
          ${(q.workshops ?? []).map((ws, i) => `
          <div class="step ${i === 0 ? "" : ""}">
            <span class="dot"></span>
            <div class="step-t">${ws.title || tr("סדנה")}</div>
            ${ws.description ? `<div class="step-d">${ws.description}</div>` : ""}
            ${ws.notes ? `<div class="step-n">${ws.notes}</div>` : ""}
          </div>`).join("")}
        </div>
      </div>` : ""}

      ${selectedBlock?.description ? `
      <div class="section avoid">
        ${sec(tr("⚡ על החוויה").replace(/^⚡\s*/, ""))}
        <div class="xp">
          <div class="xp-name">${selectedBlock.name}</div>
          ${selectedBlock.tagline ? `<div class="xp-tag">${selectedBlock.tagline}</div>` : ""}
          <div class="xp-desc">${selectedBlock.description}</div>
          ${selectedBlock.duration || selectedBlock.groupSize ? `
          <div class="xp-meta">
            ${selectedBlock.duration ? `<span><b>${lbl("משך:")}</b>${selectedBlock.duration}</span>` : ""}
            ${selectedBlock.groupSize ? `<span><b>${lbl("גודל קבוצה:")}</b>${selectedBlock.groupSize}</span>` : ""}
          </div>` : ""}
        </div>
      </div>` : ""}

      <div class="section">
        ${sec(q.mode === "packages" ? tr("אפשרויות לבחירה") : tr("פירוט השירותים"))}
        ${q.mode === "single" ? itemsTable(q.items ?? []) : `<div class="pkgs">${packagesHTML}</div>`}
      </div>

      ${q.includes ? `
      <div class="section">
        ${sec(tr("מה כלול"))}
        <div class="prose">${q.includes}</div>
      </div>` : ""}

      ${q.notes ? `<div class="section avoid"><div class="note"><b>${lbl("הערות:")}</b>${q.notes}</div></div>` : ""}

      ${q.paymentTerms || q.cancellationPolicy ? `
      <div class="terms avoid">
        ${q.paymentTerms ? `<div class="term"><div class="t">${tr("תנאי תשלום")}</div><div class="v">${q.paymentTerms}</div></div>` : "<div></div>"}
        ${q.cancellationPolicy ? `<div class="term"><div class="t">${tr("מדיניות ביטול")}</div><div class="v">${q.cancellationPolicy}</div></div>` : "<div></div>"}
      </div>` : ""}

      ${activeLinks.length > 0 ? `
      <div class="section avoid">
        ${sec(tr("חומרים נוספים"))}
        <div class="links">
          ${activeLinks.map((l) => `<a href="${l.url}" target="_blank">${l.label || l.url} ↗</a>`).join("")}
        </div>
      </div>` : ""}

      <div class="sig-block">
        <div>
          <div class="t">${tr("חתימת הלקוח")}</div>
          <div class="sig-gap"></div>
          <div class="sig-line"></div>
          <div class="sig-sub">${tr("שם, תפקיד ותאריך")}</div>
        </div>
        <div>
          <div class="t">${tr("חתימת ARC")}</div>
          <div class="sig-gap">
            <div class="stamp">
              <span class="br">(</span>
              <div class="txt"><div class="a">${tr("חתום דיגיטלית")}</div><div class="d">${today}</div></div>
              <span class="br">)</span>
            </div>
          </div>
          <div class="sig-line"></div>
          <div class="sig-sub">${tr("אורי לבקוביץ, ARC")}</div>
        </div>
      </div>
    </div>
  </td></tr></tbody>
  <tfoot class="footer-space"><tr><td></td></tr></tfoot>
</table>

<div class="print-footer">
  <div>
    <div style="font-size:16px;font-weight:600;letter-spacing:.3em;">${tr("ARC")}</div>
    <div style="font-size:10px;opacity:.75;letter-spacing:.2em;text-transform:uppercase;margin-top:2px;">${tr("Irreplaceable Experiences")}</div>
  </div>
  <div style="font-size:12px;line-height:1.8;text-align:end;">
    <div>${tr("Office@arc-exp.com")}</div>
    <div>${tr("052-6108102")}</div>
  </div>
</div>
</body>
</html>`;
  return html;
}
