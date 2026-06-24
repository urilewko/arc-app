// ─── Brand ────────────────────────────────────────────────────────────────────
export const BRAND_BG     = "#aec6cf";
export const BRAND_ACCENT = "#aec6cf";
export const BRAND_TEXT   = "#4a2e1b";
export const BRAND_MUTED  = "#4a2e1b";
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
}

export interface SelectedBlock {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  duration?: string;
  groupSize?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const formatDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

export const fmt = (n: number) =>
  "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const calcItems = (items: QuoteItem[]) =>
  items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

function buildLogoTag(logoUrl: string) {
  return `<img src="${logoUrl}" alt="ARC" style="height:88px;width:88px;object-fit:contain;border-radius:8px;display:block;" />`;
}

function itemsTableHTML(items: QuoteItem[]): string {
  const sub = calcItems(items);
  const vat = Math.round(sub * 0.18);
  const total = sub + vat;
  const F = FONT;
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-family:${F};">
      <thead>
        <tr>
          <th style="text-align:right;font-size:11px;font-weight:600;color:#999;padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:50%;font-family:${F};">תיאור</th>
          <th style="text-align:center;font-size:11px;font-weight:600;color:#999;padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:15%;font-family:${F};">כמות</th>
          <th style="text-align:left;font-size:11px;font-weight:600;color:#999;padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:18%;font-family:${F};">מחיר יחידה</th>
          <th style="text-align:left;font-size:11px;font-weight:600;color:#999;padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:17%;font-family:${F};">סה״כ</th>
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
          <span>לפני מע״מ</span><span>${fmt(sub)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:#888;">
          <span>מע״מ (18%)</span><span>${fmt(vat)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:700;color:${BRAND_TEXT};border-top:2px solid ${BRAND_TEXT};padding-top:12px;margin-top:6px;">
          <span>סה״כ לתשלום</span><span>${fmt(total)}</span>
        </div>
      </div>
    </div>`;
}

// ─── Main builder ─────────────────────────────────────────────────────────────
export function buildQuoteHTML(
  q: QuoteData,
  { logoUrl, selectedBlock }: { logoUrl: string; selectedBlock?: SelectedBlock | null }
): string {
  const F = FONT;
  const activeLinks = q.blockLinks?.filter((l) => l.url) ?? [];

  const packagesHTML = (q.packages ?? []).map((pkg) => {
    const pkgSub = calcItems(pkg.items);
    const pkgVat = Math.round(pkgSub * 0.18);
    return `
    <div style="border:2px solid ${pkg.isRecommended ? BRAND_ACCENT : "#e5e0db"};border-radius:12px;overflow:hidden;font-family:${F};page-break-inside:avoid;">
      ${pkg.isRecommended
        ? `<div style="background:${BRAND_ACCENT};color:white;text-align:center;font-size:11px;font-weight:700;letter-spacing:1px;padding:6px;text-transform:uppercase;font-family:${F};">מומלץ</div>`
        : `<div style="height:29px;background:#f7f4f1;"></div>`}
      <div style="padding:20px 18px;">
        <div style="font-size:16px;font-weight:700;color:${BRAND_TEXT};margin-bottom:6px;font-family:${F};">${pkg.name}</div>
        ${pkg.description ? `<div style="font-size:12px;color:#888;margin-bottom:14px;font-family:${F};">${pkg.description}</div>` : ""}
        ${pkg.items.map((it) => `
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;padding:5px 0;border-bottom:1px solid #f0ece8;font-family:${F};">
            <span>${it.description || "—"}${it.quantity > 1 ? ` ×${it.quantity}` : ""}</span>
            <span style="font-weight:600;">${fmt(it.quantity * it.unitPrice)}</span>
          </div>`).join("")}
        <div style="margin-top:14px;padding-top:10px;border-top:2px solid ${BRAND_TEXT};font-family:${F};">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#999;margin-bottom:3px;">
            <span>לפני מע״מ</span><span>${fmt(pkgSub)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:${BRAND_TEXT};">
            <span>סה״כ + מע״מ</span><span>${fmt(pkgSub + pkgVat)}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8"/>
<title>הצעת מחיר — ${q.orgName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}
  html,body{font-family:${F};background:#e8e3de;color:${BRAND_TEXT};direction:rtl;}
  table.doc{width:100%;max-width:720px;margin:32px auto;background:#fff;box-shadow:0 4px 40px rgba(74,46,27,0.12);border-radius:2px;border-collapse:collapse;}
  @media(max-width:760px){table.doc{margin:0;border-radius:0;box-shadow:none;}}
  @page{margin:0 0 58px 0;size:A4 portrait;}
  @media print{
    html,body{background:#fff;margin:0;padding:0;zoom:0.88;}
    table.doc{margin:0;box-shadow:none;max-width:100%;width:100%;border-radius:0;}
    .print-footer{position:fixed;bottom:0;left:0;right:0;width:100%;background:${BRAND_BG};display:flex;justify-content:space-between;align-items:center;padding:12px 44px;font-family:${F};z-index:10;}
    .sig-block{page-break-inside:avoid;page-break-before:avoid;}
    .compact-header{padding:10px 44px 14px !important;}
    .compact-body{padding:16px 44px 20px !important;}
  }
</style>
</head>
<body>
<table class="doc">
  <thead>
    <tr><td style="padding:0;">
      <div style="background:${BRAND_BG};height:44px;display:flex;align-items:center;padding:0 44px;justify-content:space-between;direction:rtl;font-family:${F};">
        <div style="font-size:15px;font-weight:700;color:${BRAND_TEXT};letter-spacing:3px;font-family:${F};">ARC</div>
        <div style="font-size:9px;color:${BRAND_TEXT};opacity:0.6;letter-spacing:2px;text-transform:uppercase;font-family:${F};">Irreplaceable Experiences</div>
      </div>
    </td></tr>
  </thead>
  <tbody><tr><td style="padding:0;">
    <div class="compact-header" style="background:${BRAND_BG};padding:16px 44px 20px;direction:rtl;font-family:${F};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>${buildLogoTag(logoUrl)}</div>
        <div style="text-align:left;font-family:${F};">
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};opacity:0.6;">הצעת מחיר</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style="font-size:26px;font-weight:700;color:${BRAND_TEXT};font-family:${F};">${q.orgName || "שם הארגון"}</div>
          ${q.contactName ? `<div style="font-size:13px;color:${BRAND_MUTED};margin-top:4px;font-family:${F};">${q.contactName}</div>` : ""}
          ${q.productType ? `<div style="font-size:11px;color:${BRAND_MUTED};letter-spacing:1px;text-transform:uppercase;margin-top:6px;font-family:${F};">${q.productType}</div>` : ""}
        </div>
        <div style="text-align:left;font-size:12px;color:${BRAND_MUTED};line-height:2;font-family:${F};">
          <div><strong style="color:${BRAND_TEXT};">תאריך הצעה:</strong> ${formatDate(q.quoteDate)}</div>
          <div><strong style="color:${BRAND_TEXT};">תוקף עד:</strong> ${formatDate(q.validUntil)}</div>
          ${q.eventDate ? `<div><strong style="color:${BRAND_TEXT};">תאריך אירוע:</strong> ${formatDate(q.eventDate)}</div>` : ""}
          ${q.participants ? `<div><strong style="color:${BRAND_TEXT};">משתתפים:</strong> ${q.participants}</div>` : ""}
          ${q.location ? `<div><strong style="color:${BRAND_TEXT};">מיקום:</strong> ${q.location}</div>` : ""}
        </div>
      </div>
    </div>

  <div class="compact-body" style="padding:36px 44px;direction:rtl;font-family:${F};">

    ${q.intro ? `<p style="font-size:14px;line-height:1.85;color:#666;margin-bottom:40px;white-space:pre-line;font-family:${F};">${q.intro}</p>` : ""}

    ${(q.workshops ?? []).length > 0 ? `
    <div style="margin-bottom:40px;font-family:${F};">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:16px;border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;font-family:${F};">תוכנית הפעילות</div>
      ${(q.workshops ?? []).map((ws, i) => `
      <div style="margin-bottom:20px;padding:18px 22px;background:#faf8f5;border-radius:10px;border-right:4px solid ${BRAND_BG};font-family:${F};">
        <div style="font-size:15px;font-weight:700;color:${BRAND_TEXT};margin-bottom:8px;font-family:${F};">${i + 1}. ${ws.title || "סדנה"}</div>
        ${ws.description ? `<div style="font-size:13px;color:#555;line-height:1.8;white-space:pre-line;font-family:${F};">${ws.description}</div>` : ""}
        ${ws.notes ? `<div style="margin-top:10px;font-size:12px;color:#999;font-style:italic;font-family:${F};">📌 ${ws.notes}</div>` : ""}
      </div>`).join("")}
    </div>` : ""}

    ${selectedBlock?.description ? `
    <div style="background:#faf8f5;border-right:4px solid ${BRAND_BG};padding:20px 24px;border-radius:0 10px 10px 0;margin-bottom:36px;font-family:${F};">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_BG};margin-bottom:8px;font-family:${F};">⚡ על החוויה</div>
      <div style="font-size:15px;font-weight:700;color:${BRAND_TEXT};margin-bottom:6px;font-family:${F};">${selectedBlock.name}</div>
      ${selectedBlock.tagline ? `<div style="font-size:13px;color:#999;font-style:italic;margin-bottom:10px;font-family:${F};">"${selectedBlock.tagline}"</div>` : ""}
      <div style="font-size:13px;color:#666;line-height:1.75;font-family:${F};">${selectedBlock.description}</div>
      ${selectedBlock.duration || selectedBlock.groupSize ? `
      <div style="display:flex;gap:20px;margin-top:12px;font-size:12px;color:#999;font-family:${F};">
        ${selectedBlock.duration ? `<span>⏱ ${selectedBlock.duration}</span>` : ""}
        ${selectedBlock.groupSize ? `<span>👥 ${selectedBlock.groupSize}</span>` : ""}
      </div>` : ""}
    </div>` : ""}

    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:14px;font-family:${F};border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;">
      ${q.mode === "packages" ? "אפשרויות לבחירה" : "פירוט השירותים"}
    </div>

    ${q.mode === "single"
      ? itemsTableHTML(q.items ?? [])
      : `<div style="display:flex;flex-direction:column;gap:16px;">${packagesHTML}</div>`
    }

    ${q.includes ? `
    <div style="margin-top:36px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:12px;border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;font-family:${F};">מה כלול</div>
      <div style="font-size:13px;color:#555;line-height:1.8;white-space:pre-line;font-family:${F};">${q.includes}</div>
    </div>` : ""}

    ${q.notes ? `
    <div style="background:#faf8f5;border-right:3px solid ${BRAND_BG};padding:16px 20px;margin-top:36px;font-size:13px;color:#666;line-height:1.75;white-space:pre-line;border-radius:0 8px 8px 0;font-family:${F};">
      <strong style="color:${BRAND_TEXT};">הערות:</strong><br/>${q.notes}
    </div>` : ""}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px;font-family:${F};">
      ${q.paymentTerms ? `
      <div style="background:#f7f5f2;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:6px;font-family:${F};">תנאי תשלום</div>
        <div style="font-size:12px;color:#666;line-height:1.7;font-family:${F};">${q.paymentTerms}</div>
      </div>` : ""}
      ${q.cancellationPolicy ? `
      <div style="background:#f7f5f2;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:6px;font-family:${F};">מדיניות ביטול</div>
        <div style="font-size:12px;color:#666;line-height:1.7;font-family:${F};">${q.cancellationPolicy}</div>
      </div>` : ""}
    </div>

    ${activeLinks.length > 0 ? `
    <div style="margin-top:36px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:12px;border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;font-family:${F};">חומרים נוספים</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${activeLinks.map((l) => `
        <a href="${l.url}" target="_blank"
           style="display:inline-flex;align-items:center;gap:6px;background:#faf8f5;border:1px solid ${BRAND_BG};border-radius:8px;padding:8px 14px;font-size:13px;color:${BRAND_TEXT};text-decoration:none;font-weight:600;font-family:${F};">
          🔗 ${l.label || l.url}
        </a>`).join("")}
      </div>
    </div>` : ""}

    <div class="sig-block" style="margin-top:52px;padding-top:32px;border-top:1px solid #e8e3de;display:grid;grid-template-columns:1fr 1fr;gap:48px;font-family:${F};">
      <div>
        <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#bbb;margin-bottom:8px;font-family:${F};">חתימת הלקוח</div>
        <div style="height:90px;"></div>
        <div style="border-bottom:2px solid ${BRAND_TEXT};opacity:0.25;margin-bottom:8px;"></div>
        <div style="font-size:11px;color:#bbb;font-family:${F};">שם, תפקיד ותאריך</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#bbb;margin-bottom:8px;font-family:${F};">חתימת ARC</div>
        <div style="height:90px;display:flex;align-items:center;justify-content:center;">
          <div style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid ${BRAND_BG};border-radius:8px;padding:6px 12px;gap:3px;opacity:0.85;">
            <div style="font-size:13px;">✓</div>
            <div style="font-size:15px;font-weight:700;letter-spacing:0.5px;color:${BRAND_TEXT};font-family:${F};">חתום דיגיטלית</div>
            <div style="font-size:9px;color:#aaa;font-family:${F};">${new Date().toLocaleDateString("he-IL")}</div>
          </div>
        </div>
        <div style="border-bottom:2px solid ${BRAND_TEXT};opacity:0.25;margin-bottom:8px;"></div>
        <div style="font-size:11px;color:#bbb;font-family:${F};">אורי לבקוביץ, ARC</div>
      </div>
    </div>

  </div>
  </td></tr></tbody>
</table>

<div class="print-footer" style="background:${BRAND_BG};display:flex;justify-content:space-between;align-items:center;direction:rtl;padding:16px 44px;font-family:${F};">
  <div>
    <div style="font-size:17px;font-weight:700;color:${BRAND_TEXT};letter-spacing:3px;font-family:${F};">ARC</div>
    <div style="font-size:10px;color:${BRAND_MUTED};letter-spacing:2px;text-transform:uppercase;margin-top:2px;font-family:${F};">Irreplaceable Experiences</div>
  </div>
  <div style="text-align:left;font-size:11px;color:${BRAND_MUTED};line-height:1.9;font-family:${F};">
    <div style="font-weight:600;color:${BRAND_TEXT};">אורי לבקוביץ</div>
    <div>urilewko@arcexpe.com</div>
    <div>052-610-8102</div>
  </div>
</div>
</body>
</html>`;
}
