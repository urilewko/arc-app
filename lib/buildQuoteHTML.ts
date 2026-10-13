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
}

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
};
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

function buildLogoTag(logoUrl: string, color = "#e7ded2") {
  const filter = color === "#e7ded2"
    ? "brightness(0) saturate(100%) invert(93%) sepia(10%) saturate(300%) hue-rotate(330deg) brightness(102%)"
    : "brightness(0) invert(1)";
  return `<img src="${logoUrl}" alt="ARC" style="height:32px;width:auto;max-width:140px;object-fit:contain;display:block;filter:${filter};" />`;
}

function itemsTableHTML(items: QuoteItem[], tr: (he: string) => string = (x) => x): string {
  const sub = calcItems(items);
  const vat = Math.round(sub * 0.18);
  const total = sub + vat;
  const F = FONT;
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-family:${F};">
      <thead>
        <tr>
          <th style="text-align:right;font-size:11px;font-weight:600;color:#999;padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:50%;font-family:${F};">${tr("תיאור")}</th>
          <th style="text-align:center;font-size:11px;font-weight:600;color:#999;padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:15%;font-family:${F};">${tr("כמות")}</th>
          <th style="text-align:left;font-size:11px;font-weight:600;color:#999;padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:18%;font-family:${F};">${tr("מחיר יחידה")}</th>
          <th style="text-align:left;font-size:11px;font-weight:600;color:#999;padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:17%;font-family:${F};">${tr("סה״כ")}</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it) => `
        <tr>
          <td style="padding:13px 12px;font-size:13px;border-bottom:1px solid #f0ece8;font-weight:600;color:${BRAND_TEXT};font-family:${F};">${it.description || "—"}</td>
          <td style="padding:13px 12px;font-size:13px;border-bottom:1px solid #f0ece8;text-align:center;color:#777;font-family:${F};">${it.quantity}</td>
          <td style="padding:13px 12px;font-size:13px;border-bottom:1px solid #f0ece8;text-align:left;color:#777;font-family:${F};">${fmt(it.unitPrice)}</td>
          <td style="padding:13px 12px;font-size:13px;border-bottom:1px solid #f0ece8;text-align:left;font-weight:700;color:${BRAND_TEXT};font-family:${F};">${fmt(it.quantity * it.unitPrice)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:8px;">
      <div style="width:280px;font-family:${F};">
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:#888;">
          <span>${tr("לפני מע״מ")}</span><span>${fmt(sub)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:#888;">
          <span>${tr("מע״מ (18%)")}</span><span>${fmt(vat)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:700;color:${BRAND_TEXT};border-top:2px solid ${BRAND_TEXT};padding-top:12px;margin-top:6px;">
          <span>${tr("סה״כ לתשלום")}</span><span>${fmt(total)}</span>
        </div>
      </div>
    </div>`;
}

// ─── Main builder ─────────────────────────────────────────────────────────────
export function buildQuoteHTML(
  qIn: QuoteData,
  { logoUrl, selectedBlock: blockIn, lang = "he" }: { logoUrl: string; selectedBlock?: SelectedBlock | null; lang?: QuoteLang }
): string {
  const F = FONT;
  const en = lang === "en" ? qIn.en : undefined;
  const tr = (he: string) => (lang === "en" ? (EN_LABELS[he] ?? he) : he);
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

  const packagesHTML = (q.packages ?? []).map((pkg) => {
    const pkgSub = calcItems(pkg.items);
    const pkgVat = Math.round(pkgSub * 0.18);
    return `
    <div style="border:2px solid ${pkg.isRecommended ? BRAND_ACCENT : "#e5e0db"};border-radius:12px;overflow:hidden;font-family:${F};page-break-inside:avoid;">
      ${pkg.isRecommended
        ? `<div style="background:${BRAND_ACCENT};color:white;text-align:center;font-size:11px;font-weight:700;letter-spacing:1px;padding:6px;text-transform:uppercase;font-family:${F};">${tr("מומלץ")}</div>`
        : `<div style="height:29px;background:#d4c9bc;"></div>`}
      <div style="padding:20px 18px;">
        <div style="font-size:16px;font-weight:700;color:${BRAND_TEXT};margin-bottom:6px;font-family:${F};">${pkg.name}</div>
        ${pkg.description ? `<div style="font-size:12px;color:#888;margin-bottom:14px;font-family:${F};">${pkg.description}</div>` : ""}
        ${pkg.items.map((it) => `
          <div style="display:flex;justify-content:space-between;font-size:12px;color:${BRAND_TEXT};padding:5px 0;border-bottom:1px solid #f0ece8;font-family:${F};">
            <span>${it.description || "—"}${it.quantity > 1 ? ` ×${it.quantity}` : ""}</span>
            <span style="font-weight:600;">${fmt(it.quantity * it.unitPrice)}</span>
          </div>`).join("")}
        <div style="margin-top:14px;padding-top:10px;border-top:2px solid ${BRAND_TEXT};font-family:${F};">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#999;margin-bottom:3px;">
            <span>${tr("לפני מע״מ")}</span><span>${fmt(pkgSub)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:${BRAND_TEXT};">
            <span>${tr("סה״כ + מע״מ")}</span><span>${fmt(pkgSub + pkgVat)}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html dir="${lang === "en" ? "ltr" : "rtl"}" lang="${lang}">
<head>
<meta charset="UTF-8"/>
<title>${tr("הצעת מחיר")} — ${q.orgName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}
  html,body{font-family:${F};background:${BRAND_PAPER};color:${BRAND_TEXT};direction:rtl;}
  table.doc{width:100%;max-width:720px;margin:32px auto;background:${BRAND_PAPER};box-shadow:0 4px 40px rgba(46,87,117,0.12);border-radius:2px;border-collapse:collapse;}
  @media(max-width:760px){table.doc{margin:0;border-radius:0;box-shadow:none;}}
  thead{display:none;}
  tfoot.footer-space{display:none;}
  @page{margin:0;size:A4 portrait;}
  @media print{
    html,body{background:${BRAND_PAPER};margin:0;padding:0;zoom:1.18;}
    table.doc{margin:0;box-shadow:none;max-width:100%;width:100%;border-radius:0;}
    .print-footer{position:fixed;bottom:0;left:0;right:0;width:100%;background:${BRAND_BG};display:flex;justify-content:space-between;align-items:center;padding:12px 44px;font-family:${F};z-index:10;}
    .sig-block{page-break-inside:avoid;page-break-before:avoid;}
    .compact-header{padding:10px 44px 14px !important;}
    .compact-body{padding:16px 44px 20px !important}
    .sig-block{margin-top:90px !important;}
    tfoot.footer-space{display:table-footer-group;}
    tfoot.footer-space td{height:76px;}
  }
</style>
</head>
<body>
<table class="doc">
  <thead>
    <tr><td style="padding:0;">
      <div style="background:${BRAND_BG};height:44px;display:flex;align-items:center;padding:0 44px;justify-content:space-between;direction:rtl;font-family:${F};">
        <div style="font-size:15px;font-weight:700;color:${BRAND_ON_BG};letter-spacing:3px;font-family:${F};">ARC</div>
        <div style="font-size:9px;color:${BRAND_ON_BG};opacity:0.6;letter-spacing:2px;text-transform:uppercase;font-family:${F};">Irreplaceable Experiences</div>
      </div>
    </td></tr>
  </thead>
  <tbody><tr><td style="padding:0;">
    <div class="compact-header" style="background:${BRAND_BG};padding:16px 44px 20px;direction:rtl;font-family:${F};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="text-align:left;font-family:${F};">
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_ON_BG};opacity:0.6;">${tr("הצעת מחיר")}</div>
        </div>
        <div>${buildLogoTag(logoUrl)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style="font-size:26px;font-weight:700;color:${BRAND_ON_BG};font-family:${F};">${q.orgName || tr("שם הארגון")}</div>
          ${q.contactName ? `<div style="font-size:13px;color:${BRAND_ON_BG};margin-top:4px;font-family:${F};">${q.contactName}</div>` : ""}
          ${q.productType ? `<div style="font-size:11px;color:${BRAND_ON_BG};letter-spacing:1px;text-transform:uppercase;margin-top:6px;font-family:${F};">${q.productType}</div>` : ""}
        </div>
        <div style="text-align:left;font-size:12px;color:${BRAND_ON_BG};line-height:2;font-family:${F};">
          <div><strong style="color:${BRAND_ON_BG};">${tr("תאריך הצעה:")}</strong> ${formatDate(q.quoteDate, lang)}</div>
          <div><strong style="color:${BRAND_ON_BG};">${tr("תוקף עד:")}</strong> ${formatDate(q.validUntil, lang)}</div>
          ${q.eventDate ? `<div><strong style="color:${BRAND_ON_BG};">${tr("תאריך אירוע:")}</strong> ${formatDate(q.eventDate, lang)}</div>` : ""}
          ${q.participants ? `<div><strong style="color:${BRAND_ON_BG};">${tr("משתתפים:")}</strong> ${q.participants}</div>` : ""}
          ${q.location ? `<div><strong style="color:${BRAND_ON_BG};">${tr("מיקום:")}</strong> ${q.location}</div>` : ""}
        </div>
      </div>
    </div>

  <div class="compact-body" style="padding:36px 44px;direction:rtl;font-family:${F};">

    ${q.intro ? `<p style="font-size:14px;line-height:1.85;color:${BRAND_TEXT};margin-bottom:40px;white-space:pre-line;font-family:${F};">${q.intro}</p>` : ""}

    ${(q.workshops ?? []).length > 0 ? `
    <div style="margin-bottom:40px;font-family:${F};">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:16px;border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;font-family:${F};">${tr("תוכנית הפעילות")}</div>
      ${(q.workshops ?? []).map((ws, i) => `
      <div style="margin-bottom:20px;padding:18px 22px;background:#d4c9bc;border-radius:10px;border-right:4px solid ${BRAND_BG};font-family:${F};">
        <div style="font-size:15px;font-weight:700;color:${BRAND_TEXT};margin-bottom:8px;font-family:${F};">${i + 1}. ${ws.title || tr("סדנה")}</div>
        ${ws.description ? `<div style="font-size:13px;color:${BRAND_TEXT};line-height:1.8;white-space:pre-line;font-family:${F};">${ws.description}</div>` : ""}
        ${ws.notes ? `<div style="margin-top:10px;font-size:12px;color:#999;font-style:italic;font-family:${F};">📌 ${ws.notes}</div>` : ""}
      </div>`).join("")}
    </div>` : ""}

    ${selectedBlock?.description ? `
    <div style="background:#d4c9bc;border-right:4px solid ${BRAND_BG};padding:20px 24px;border-radius:0 10px 10px 0;margin-bottom:36px;font-family:${F};">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_BG};margin-bottom:8px;font-family:${F};">${tr("⚡ על החוויה")}</div>
      <div style="font-size:15px;font-weight:700;color:${BRAND_TEXT};margin-bottom:6px;font-family:${F};">${selectedBlock.name}</div>
      ${selectedBlock.tagline ? `<div style="font-size:13px;color:#999;font-style:italic;margin-bottom:10px;font-family:${F};">"${selectedBlock.tagline}"</div>` : ""}
      <div style="font-size:13px;color:${BRAND_TEXT};line-height:1.75;font-family:${F};">${selectedBlock.description}</div>
      ${selectedBlock.duration || selectedBlock.groupSize ? `
      <div style="display:flex;gap:20px;margin-top:12px;font-size:12px;color:#999;font-family:${F};">
        ${selectedBlock.duration ? `<span>⏱ ${selectedBlock.duration}</span>` : ""}
        ${selectedBlock.groupSize ? `<span>👥 ${selectedBlock.groupSize}</span>` : ""}
      </div>` : ""}
    </div>` : ""}

    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:14px;font-family:${F};border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;">
      ${q.mode === "packages" ? tr("אפשרויות לבחירה") : tr("פירוט השירותים")}
    </div>

    ${q.mode === "single"
      ? itemsTableHTML(q.items ?? [], tr)
      : `<div style="display:flex;flex-direction:column;gap:16px;">${packagesHTML}</div>`
    }

    ${q.includes ? `
    <div style="margin-top:36px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:12px;border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;font-family:${F};">${tr("מה כלול")}</div>
      <div style="font-size:13px;color:${BRAND_TEXT};line-height:1.8;white-space:pre-line;font-family:${F};">${q.includes}</div>
    </div>` : ""}

    ${q.notes ? `
    <div style="background:#d4c9bc;border-right:3px solid ${BRAND_BG};padding:16px 20px;margin-top:36px;font-size:13px;color:${BRAND_TEXT};line-height:1.75;white-space:pre-line;border-radius:0 8px 8px 0;font-family:${F};">
      <strong style="color:${BRAND_TEXT};">${tr("הערות:")}</strong><br/>${q.notes}
    </div>` : ""}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px;font-family:${F};">
      ${q.paymentTerms ? `
      <div style="background:#d4c9bc;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:6px;font-family:${F};">${tr("תנאי תשלום")}</div>
        <div style="font-size:12px;color:${BRAND_TEXT};line-height:1.7;font-family:${F};">${q.paymentTerms}</div>
      </div>` : ""}
      ${q.cancellationPolicy ? `
      <div style="background:#d4c9bc;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:6px;font-family:${F};">${tr("מדיניות ביטול")}</div>
        <div style="font-size:12px;color:${BRAND_TEXT};line-height:1.7;font-family:${F};">${q.cancellationPolicy}</div>
      </div>` : ""}
    </div>

    ${activeLinks.length > 0 ? `
    <div style="margin-top:36px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:12px;border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;font-family:${F};">${tr("חומרים נוספים")}</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${activeLinks.map((l) => `
        <a href="${l.url}" target="_blank"
           style="display:inline-flex;align-items:center;gap:6px;background:#d4c9bc;border:1px solid ${BRAND_BG};border-radius:8px;padding:8px 14px;font-size:13px;color:${BRAND_TEXT};text-decoration:none;font-weight:600;font-family:${F};">
          🔗 ${l.label || l.url}
        </a>`).join("")}
      </div>
    </div>` : ""}

    <div class="sig-block" style="margin-top:52px;padding-top:32px;border-top:1px solid #e8e3de;display:grid;grid-template-columns:1fr 1fr;gap:48px;font-family:${F};">
      <div>
        <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:8px;font-family:${F};">${tr("חתימת הלקוח")}</div>
        <div style="height:90px;"></div>
        <div style="border-bottom:2px solid ${BRAND_TEXT};opacity:0.25;margin-bottom:8px;"></div>
        <div style="font-size:11px;color:${BRAND_TEXT};font-family:${F};">${tr("שם, תפקיד ותאריך")}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:8px;font-family:${F};">${tr("חתימת ARC")}</div>
        <div style="height:90px;display:flex;align-items:center;justify-content:center;">
          <div style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid ${BRAND_BG};border-radius:8px;padding:6px 12px;gap:3px;opacity:0.85;">
            <div style="font-size:13px;">✓</div>
            <div style="font-size:15px;font-weight:700;letter-spacing:0.5px;color:${BRAND_TEXT};font-family:${F};">${tr("חתום דיגיטלית")}</div>
            <div style="font-size:9px;color:#aaa;font-family:${F};">${new Date().toLocaleDateString(lang === "en" ? "en-GB" : "he-IL")}</div>
          </div>
        </div>
        <div style="border-bottom:2px solid ${BRAND_TEXT};opacity:0.25;margin-bottom:8px;"></div>
        <div style="font-size:11px;color:${BRAND_TEXT};font-family:${F};">${tr("אורי לבקוביץ, ARC")}</div>
      </div>
    </div>

  </div>
  </td></tr></tbody>
  <tfoot class="footer-space"><tr><td></td></tr></tfoot>
</table>

<div class="print-footer" style="background:${BRAND_BG};display:flex;justify-content:space-between;align-items:center;direction:rtl;padding:16px 44px;font-family:${F};">
  <div>
    <div style="font-size:17px;font-weight:700;color:${BRAND_ON_BG};letter-spacing:3px;font-family:${F};">ARC</div>
    <div style="font-size:10px;color:${BRAND_ON_BG};opacity:0.75;letter-spacing:2px;text-transform:uppercase;margin-top:2px;font-family:${F};">Irreplaceable Experiences</div>
  </div>
  <div style="text-align:left;font-size:11px;color:${BRAND_ON_BG};line-height:1.9;font-family:${F};">
    <div>Office@arc-exp.com</div>
    <div>052-6108102</div>
  </div>
</div>
</body>
</html>`;
  return lang === "en" ? mirrorToLtr(html) : html;
}

/** Flips right-aligned inline styles so the English document reads left-to-right. */
function mirrorToLtr(html: string): string {
  return html
    .replace(/direction:rtl/g, "direction:ltr")
    .replace(/text-align:right/g, "text-align:@@L")
    .replace(/text-align:left/g, "text-align:right")
    .replace(/text-align:@@L/g, "text-align:left")
    .replace(/border-right:/g, "border-@@L:")
    .replace(/border-left:/g, "border-right:")
    .replace(/border-@@L:/g, "border-left:")
    .replace(/border-radius:0 (\d+px) (\d+px) 0/g, "border-radius:$1 0 0 $2");
}
