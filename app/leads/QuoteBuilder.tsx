"use client";
import { useState, useEffect, useRef } from "react";
import { Lead, useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Plus, Trash2, Download, FileCode, Eye, Package, Zap, Link } from "lucide-react";

// ─── Brand ───────────────────────────────────────────────────────────────────
const BRAND_BG     = "#aec6cf"; // light blue — header/footer background
const BRAND_ACCENT = "#aec6cf"; // light blue — accents, lines, highlights
const BRAND_TEXT   = "#4a2e1b"; // dark brown — all text
const BRAND_MUTED  = "#4a2e1b"; // same brown everywhere (no second shade)
const FONT         = "'Heebo', 'Arial Hebrew', Arial, sans-serif";

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuotePackage {
  id: string;
  name: string;
  description: string;
  items: QuoteItem[];
  isRecommended: boolean;
}

interface BrandLink {
  id: string;
  label: string;
  url: string;
}

interface Workshop {
  id: string;
  title: string;
  description: string;
  notes: string;
}

interface QuoteData {
  orgName: string;
  contactName: string;
  quoteDate: string;
  validUntil: string;
  productType: string;
  eventDate: string;       // תאריך האירוע
  location: string;        // מיקום
  participants: string;    // מספר משתתפים
  quoteNumber: string;     // מספר הצעה
  intro: string;
  includes: string;        // מה כלול
  workshops: Workshop[];
  // single mode
  items: QuoteItem[];
  // packages mode
  mode: "single" | "packages";
  packages: QuotePackage[];
  notes: string;
  cancellationPolicy: string; // מדיניות ביטול
  paymentTerms: string;
  // block
  selectedBlockId: string;
  blockLinks: BrandLink[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const todayStr = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const formatDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};
const fmt = (n: number) =>
  "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const calcItems = (items: QuoteItem[]) =>
  items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

// ─── Sub-components ──────────────────────────────────────────────────────────
function ItemsEditor({
  items,
  onChange,
}: {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
}) {
  const set = (id: string, field: keyof QuoteItem, val: string | number) =>
    onChange(items.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  const add = () =>
    onChange([...items, { id: uid(), description: "", quantity: 1, unitPrice: 0 }]);
  const remove = (id: string) => onChange(items.filter((it) => it.id !== id));

  const sub = calcItems(items);
  const vat = Math.round(sub * 0.18);

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">שורה</span>
            <button onClick={() => remove(it.id)} className="text-gray-300 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
          <input
            className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white"
            placeholder="תיאור השירות"
            value={it.description}
            onChange={(e) => set(it.id, "description", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">כמות</label>
              <input
                type="number" min={1}
                className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white"
                value={it.quantity}
                onChange={(e) => set(it.id, "quantity", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">מחיר יחידה (₪)</label>
              <input
                type="number" min={0}
                className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white"
                value={it.unitPrice}
                onChange={(e) => set(it.id, "unitPrice", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="text-xs text-gray-400 text-left">
            סה״כ: <span className="font-bold text-gray-700">{fmt(it.quantity * it.unitPrice)}</span>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus size={13} /> הוסף שורה
      </button>
      <div className="bg-gray-100 rounded-xl p-3 text-sm space-y-1 mt-1">
        <div className="flex justify-between text-gray-500">
          <span>לפני מע״מ</span><span>{fmt(sub)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>מע״מ 18%</span><span>{fmt(vat)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-300">
          <span>סה״כ</span><span>{fmt(sub + vat)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── HTML builder ─────────────────────────────────────────────────────────────
function buildLogoTag(dataUrl: string) {
  return `<img src="${dataUrl}" alt="ARC" style="height:88px;width:88px;object-fit:contain;border-radius:8px;display:block;" />`;
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function QuoteBuilder({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { blocks } = useStore();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [activeSection, setActiveSection] = useState<"details" | "workshops" | "items" | "block" | "extra">("details");
  const [logoDataUrl, setLogoDataUrl] = useState<string>("/arc-logo.png");

  useEffect(() => {
    fetch("/arc-logo.png")
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => setLogoDataUrl(e.target?.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, []);

  const defaultPkg = (): QuotePackage => ({
    id: uid(),
    name: "אפשרות א׳",
    description: "",
    items: [{ id: uid(), description: lead.productType || "חוויה מותאמת", quantity: 1, unitPrice: lead.dealValue || 0 }],
    isRecommended: false,
  });

  interface QuoteVersion { id: string; label: string; createdAt: string; data: QuoteData }

  const LEGACY_KEY = `arc-quote-${lead.id}`;
  const LEGACY_V2  = `arc-quotes-v2-${lead.id}`;

  const quoteNum = `ARC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

  const defaultQuote = (): QuoteData => ({
    orgName: lead.orgName || "",
    contactName: "",
    quoteDate: todayStr(),
    validUntil: plusDays(14),
    productType: lead.productType || "",
    eventDate: lead.activityDate || "",
    location: "",
    participants: "",
    quoteNumber: quoteNum,
    intro: `אנו שמחים להציג בפניכם הצעה לחוויה בלתי ניתנת להחלפה עבור צוות ${lead.orgName}.\nהצעה זו נבנתה בהתאמה אישית לצרכיכם ולמטרות שהגדרתם יחד.`,
    includes: "",
    workshops: [],
    mode: "single",
    items: [{ id: uid(), description: lead.productType || "חוויה מותאמת", quantity: 1, unitPrice: lead.dealValue || 0 }],
    packages: [defaultPkg(), { ...defaultPkg(), id: uid(), name: "אפשרות ב׳" }],
    notes: lead.notes || "",
    cancellationPolicy: "ביטול עד שבוע לפני האירוע — החזר מלא. ביטול לאחר מכן — 50%.",
    paymentTerms: "תשלום מלא עד 30 יום לאחר האירוע.",
    selectedBlockId: "",
    blockLinks: [
      { id: uid(), label: "אלבום תמונות", url: "" },
      { id: uid(), label: "עדויות משתתפים", url: "" },
      { id: uid(), label: "כתבות ופרסומים", url: "" },
    ],
  });

  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Supabase on mount, migrate from localStorage if needed
  useEffect(() => {
    supabase.from("quotes").select("*").eq("lead_id", lead.id).order("created_at").then(({ data }) => {
      if (data && data.length > 0) {
        setVersions(data.map(r => ({ id: r.id, label: r.label, createdAt: r.created_at?.slice(0,10) ?? todayStr(), data: r.data as QuoteData })));
      } else {
        // migrate from localStorage
        let migrated: QuoteVersion[] = [];
        try {
          const v2 = localStorage.getItem(LEGACY_V2);
          if (v2) migrated = JSON.parse(v2);
          else {
            const v1 = localStorage.getItem(LEGACY_KEY);
            if (v1) migrated = [{ id: uid(), label: "הצעה #1", createdAt: todayStr(), data: JSON.parse(v1) as QuoteData }];
          }
        } catch {}
        if (migrated.length === 0) migrated = [{ id: uid(), label: "הצעה #1", createdAt: todayStr(), data: defaultQuote() }];
        setVersions(migrated);
        // push migrated data to Supabase
        migrated.forEach(v => supabase.from("quotes").upsert({ id: v.id, lead_id: lead.id, label: v.label, data: v.data }).then(() => {}));
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const safeIdx = Math.min(activeIdx, versions.length - 1);
  const q = versions[safeIdx]?.data ?? defaultQuote();
  const setQ = (patch: QuoteData | ((prev: QuoteData) => QuoteData)) => {
    setVersions(prev => {
      const next = prev.map((v, i) => {
        if (i !== Math.min(activeIdx, prev.length - 1)) return v;
        return { ...v, data: typeof patch === "function" ? patch(v.data) : patch };
      });
      // debounced save of the changed version
      const changed = next[Math.min(activeIdx, next.length - 1)];
      if (changed) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          supabase.from("quotes").upsert({ id: changed.id, lead_id: lead.id, label: changed.label, data: changed.data }).then(() => {});
        }, 800);
      }
      return next;
    });
  };

  const addVersion = () => {
    const newV: QuoteVersion = { id: uid(), label: `הצעה #${versions.length + 1}`, createdAt: todayStr(), data: defaultQuote() };
    setVersions(prev => [...prev, newV]);
    supabase.from("quotes").insert({ id: newV.id, lead_id: lead.id, label: newV.label, data: newV.data }).then(() => {});
    // stay on current version — user clicks the new tab when ready
  };

  const deleteVersion = (idx: number) => {
    if (versions.length <= 1) return;
    const toDelete = versions[idx];
    setVersions(prev => prev.filter((_, i) => i !== idx));
    setActiveIdx(prev => (idx <= prev && prev > 0) ? prev - 1 : Math.min(prev, versions.length - 2));
    supabase.from("quotes").delete().eq("id", toDelete.id).then(() => {});
  };

  // ── package helpers ──
  const updatePkg = (pkgId: string, patch: Partial<QuotePackage>) =>
    setQ((prev) => ({
      ...prev,
      packages: prev.packages.map((p) => (p.id === pkgId ? { ...p, ...patch } : p)),
    }));
  const addPkg = () =>
    setQ((prev) => ({ ...prev, packages: [...prev.packages, { ...defaultPkg(), id: uid(), name: `אפשרות ${String.fromCharCode(1488 + prev.packages.length)}` }] }));
  const removePkg = (id: string) =>
    setQ((prev) => ({ ...prev, packages: prev.packages.filter((p) => p.id !== id) }));

  // ── block helpers ──
  const selectedBlock = blocks.find((b) => b.id === q.selectedBlockId);
  const applyBlock = (blockId: string) => {
    const b = blocks.find((bl) => bl.id === blockId);
    if (!b) { setQ((prev) => ({ ...prev, selectedBlockId: "" })); return; }
    const blockItem: QuoteItem = { id: uid(), description: b.name + (b.tagline ? ` — ${b.tagline}` : ""), quantity: 1, unitPrice: b.price || 0 };
    setQ((prev) => ({
      ...prev,
      selectedBlockId: blockId,
      productType: b.productType,
      items: prev.mode === "single" ? [blockItem, ...prev.items.filter((i) => i.description !== "")] : prev.items,
    }));
  };

  // ── link helpers ──
  const setLink = (id: string, field: keyof BrandLink, val: string) =>
    setQ((prev) => ({ ...prev, blockLinks: prev.blockLinks.map((l) => (l.id === id ? { ...l, [field]: val } : l)) }));
  const addLink = () =>
    setQ((prev) => ({ ...prev, blockLinks: [...prev.blockLinks, { id: uid(), label: "", url: "" }] }));
  const removeLink = (id: string) =>
    setQ((prev) => ({ ...prev, blockLinks: prev.blockLinks.filter((l) => l.id !== id) }));

  // ── totals (single) ──
  const sub   = calcItems(q.items);
  const vat   = Math.round(sub * 0.18);
  const total = sub + vat;

  // ──────────────────────────────────────────────────────────────────────────
  // HTML generation
  // ──────────────────────────────────────────────────────────────────────────
  const buildHTML = (forPrint = false) => {
    void forPrint;
    const activeLinks = q.blockLinks.filter((l) => l.url);
    const F = FONT;
    const packagesHTML = q.packages.map((pkg) => {
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
    .compact-section{padding:16px 44px !important;}
    .compact-body{padding:16px 44px 20px !important;}
  }
</style>
</head>
<body>
<table class="doc">

  <!-- THIN HEADER — repeats on every page via thead -->
  <thead>
    <tr><td style="padding:0;">
      <div style="background:${BRAND_BG};height:44px;display:flex;align-items:center;padding:0 44px;justify-content:space-between;direction:rtl;font-family:${F};">
        <div style="font-size:15px;font-weight:700;color:${BRAND_TEXT};letter-spacing:3px;font-family:${F};">ARC</div>
        <div style="font-size:9px;color:${BRAND_TEXT};opacity:0.6;letter-spacing:2px;text-transform:uppercase;font-family:${F};">Irreplaceable Experiences</div>
      </div>
    </td></tr>
  </thead>


  <!-- CONTENT -->
  <tbody><tr><td style="padding:0;">

    <!-- THICK HEADER (page 1) — sits right after the thin thead bar -->
    <div class="compact-header" style="background:${BRAND_BG};padding:16px 44px 20px;direction:rtl;font-family:${F};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>${buildLogoTag(logoDataUrl)}</div>
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

  <!-- BODY -->
  <div class="compact-body content-pad" style="padding:36px 44px;direction:rtl;font-family:${F};">

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

    ${selectedBlock && selectedBlock.description ? `
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

    <!-- SERVICES -->
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND_TEXT};margin-bottom:14px;font-family:${F};border-bottom:2px solid ${BRAND_BG};padding-bottom:6px;">
      ${q.mode === "packages" ? "אפשרויות לבחירה" : "פירוט השירותים"}
    </div>

    ${q.mode === "single"
      ? itemsTableHTML(q.items)
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

    <!-- TERMS GRID -->
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

    <!-- SIGNATURE -->
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

<!-- FOOTER: fixed in print (every page bottom), in-flow on screen -->
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
  };

  const handlePrint = () => {
    const html = buildHTML(true);
    const win = window.open("", "_blank", "width=900,height=720");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const handleDownloadHTML = () => {
    const html = buildHTML(false);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `הצעת-מחיר-${q.orgName}-${q.quoteDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  const SECTIONS = [
    { id: "details",   label: "פרטים" },
    { id: "workshops", label: "סדנאות" },
    { id: "items",     label: q.mode === "packages" ? "אפשרויות" : "מחירון" },
    { id: "block",     label: "Block" },
    { id: "extra",     label: "הערות" },
  ] as const;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
      טוען הצעות מחיר...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── TOP BAR ── */}
      <div className="text-white px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg"
        style={{ background: BRAND_BG }}>
        <div className="flex items-center gap-4">
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm">
            <ChevronLeft size={16} /> חזרה
          </button>
          <span className="text-white/30">|</span>
          <span className="font-bold text-white">הצעת מחיר — {q.orgName}</span>
          <span className="text-white/30">|</span>
          <button
            onClick={() => setQ(defaultQuote())}
            className="text-xs text-white/50 hover:text-white/80 transition-colors">
            אפס
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile tab */}
          <div className="flex bg-white/20 rounded-lg overflow-hidden text-sm md:hidden">
            <button onClick={() => setTab("edit")}
              className={`px-3 py-1.5 ${tab === "edit" ? "bg-white/30 text-white" : "text-white/60"}`}>עריכה</button>
            <button onClick={() => setTab("preview")}
              className={`flex items-center gap-1 px-3 py-1.5 ${tab === "preview" ? "bg-white/30 text-white" : "text-white/60"}`}>
              <Eye size={13} /> תצוגה
            </button>
          </div>
          <button onClick={handleDownloadHTML}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors">
            <FileCode size={14} /> HTML
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-white hover:bg-white/90 text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{ color: BRAND_TEXT }}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* ── VERSION BAR ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 overflow-x-auto shrink-0">
        {versions.map((v, idx) => (
          <div key={v.id} className="flex items-center shrink-0">
            <button
              onClick={() => setActiveIdx(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                idx === safeIdx
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              style={idx === safeIdx ? { background: BRAND_BG, color: BRAND_TEXT } : {}}>
              {v.label}
              <span className={`text-[10px] ${idx === safeIdx ? "opacity-60" : "text-gray-400"}`}>
                {v.createdAt}
              </span>
            </button>
            {versions.length > 1 && (
              <button
                onClick={() => deleteVersion(idx)}
                className="mr-0.5 text-gray-300 hover:text-red-400 p-0.5 transition-colors"
                title="מחק גרסה">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addVersion}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-400 border-2 border-dashed border-gray-200 hover:border-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <Plus size={11} /> הצעה חדשה
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── EDIT PANEL ── */}
        <div className={`w-full md:w-[430px] shrink-0 flex flex-col bg-white border-l border-gray-200 ${tab === "preview" ? "hidden md:flex" : ""}`}>

          {/* Section tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  activeSection === s.id
                    ? "border-b-2 text-[#5C2D0A]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                style={activeSection === s.id ? { borderColor: BRAND_BG } : {}}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* ── DETAILS ── */}
            {activeSection === "details" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">פרטי לקוח</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">ארגון</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm" value={q.orgName}
                        onChange={(e) => setQ({ ...q, orgName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">שם איש קשר + תפקיד</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="לדוגמה: ינון כהן, מנהל HR"
                        value={q.contactName} onChange={(e) => setQ({ ...q, contactName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">סוג חוויה</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={q.productType} onChange={(e) => setQ({ ...q, productType: e.target.value })} />
                    </div>
                  </div>
                </div>
                <hr />
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">תאריכים ופרטי אירוע</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">תאריך הצעה</label>
                      <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={q.quoteDate} onChange={(e) => setQ({ ...q, quoteDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">תוקף עד</label>
                      <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={q.validUntil} onChange={(e) => setQ({ ...q, validUntil: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">תאריך האירוע</label>
                      <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={q.eventDate} onChange={(e) => setQ({ ...q, eventDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">מספר משתתפים</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="לדוגמה: 40-50 אנשים"
                        value={q.participants} onChange={(e) => setQ({ ...q, participants: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">מיקום</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="לדוגמה: משרדי החברה, תל אביב"
                        value={q.location} onChange={(e) => setQ({ ...q, location: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">מספר הצעה</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" readOnly
                    value={q.quoteNumber} />
                </div>
                <hr />
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">מבוא</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-y" rows={4} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    value={q.intro} onChange={(e) => setQ({ ...q, intro: e.target.value })} />
                </div>
              </>
            )}

            {/* ── WORKSHOPS ── */}
            {activeSection === "workshops" && (
              <>
                <p className="text-xs text-gray-400">הוסף סדנאות/חוויות עם תיאור מפורט. יופיעו בהצעה לפני טבלת המחירים.</p>
                <div className="space-y-4">
                  {(q.workshops ?? []).map((ws, idx) => (
                    <div key={ws.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                        <span className="text-xs font-semibold text-gray-500">סדנה {idx + 1}</span>
                        <button onClick={() => setQ({ ...q, workshops: q.workshops.filter(w => w.id !== ws.id) })}
                          className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="p-3 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">כותרת הסדנה</label>
                          <input className="w-full border rounded-lg px-3 py-2 text-sm"
                            placeholder="לדוגמה: סדנת גיבוש צוותים"
                            value={ws.title}
                            onChange={e => setQ({ ...q, workshops: q.workshops.map(w => w.id === ws.id ? { ...w, title: e.target.value } : w) })} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">תוכן ופירוט</label>
                          <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-y" rows={4}
                            placeholder={"תאר את תוכן הסדנה, מה יקרה, מה המטרות..."}
                            value={ws.description}
                            onChange={e => setQ({ ...q, workshops: q.workshops.map(w => w.id === ws.id ? { ...w, description: e.target.value } : w) })} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">הערות לסדנה זו</label>
                          <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-y" rows={2}
                            placeholder="משך זמן, ציוד נדרש, מיקום..."
                            value={ws.notes}
                            onChange={e => setQ({ ...q, workshops: q.workshops.map(w => w.id === ws.id ? { ...w, notes: e.target.value } : w) })} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setQ({ ...q, workshops: [...(q.workshops ?? []), { id: uid(), title: "", description: "", notes: "" }] })}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5">
                    <Plus size={13} /> הוסף סדנה
                  </button>
                </div>
              </>
            )}

            {/* ── ITEMS / PACKAGES ── */}
            {activeSection === "items" && (
              <>
                {/* Mode toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">מצב הצעה</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm">
                    <button
                      onClick={() => setQ({ ...q, mode: "single" })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
                        q.mode === "single" ? "text-white font-semibold" : "text-gray-500 hover:bg-gray-50"
                      }`}
                      style={q.mode === "single" ? { background: BRAND_BG } : {}}>
                      <Trash2 size={14} /> הצעה אחת
                    </button>
                    <button
                      onClick={() => setQ({ ...q, mode: "packages" })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
                        q.mode === "packages" ? "text-white font-semibold" : "text-gray-500 hover:bg-gray-50"
                      }`}
                      style={q.mode === "packages" ? { background: BRAND_BG } : {}}>
                      <Package size={14} /> אפשרויות לבחירה
                    </button>
                  </div>
                </div>

                {q.mode === "single" ? (
                  <ItemsEditor items={q.items} onChange={(items) => setQ({ ...q, items })} />
                ) : (
                  <div className="space-y-4">
                    {q.packages.map((pkg, idx) => (
                      <div key={pkg.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                          <input
                            className="font-bold text-sm bg-transparent border-none outline-none flex-1"
                            style={{ color: BRAND_TEXT }}
                            value={pkg.name}
                            onChange={(e) => updatePkg(pkg.id, { name: e.target.value })}
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                              <input type="checkbox" checked={pkg.isRecommended}
                                onChange={(e) => updatePkg(pkg.id, { isRecommended: e.target.checked })} />
                              מומלץ
                            </label>
                            {idx > 1 && (
                              <button onClick={() => removePkg(pkg.id)} className="text-gray-300 hover:text-red-500">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="p-3 space-y-3">
                          <input className="w-full border rounded-lg px-3 py-1.5 text-xs text-gray-500"
                            placeholder="תיאור קצר של האפשרות (אופציונלי)"
                            value={pkg.description}
                            onChange={(e) => updatePkg(pkg.id, { description: e.target.value })} />
                          <ItemsEditor
                            items={pkg.items}
                            onChange={(items) => updatePkg(pkg.id, { items })}
                          />
                        </div>
                      </div>
                    ))}
                    {q.packages.length < 4 && (
                      <button onClick={addPkg}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:border-gray-400 transition-colors flex items-center justify-center gap-1.5">
                        <Plus size={13} /> אפשרות נוספת
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── BLOCK ── */}
            {activeSection === "block" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    <span className="flex items-center gap-1.5"><Zap size={13} className="text-yellow-500" /> שילוב Block</span>
                  </label>
                  {blocks.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">אין Blocks במערכת. צור Block קודם בעמוד The Blocks.</p>
                  ) : (
                    <select className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={q.selectedBlockId}
                      onChange={(e) => applyBlock(e.target.value)}>
                      <option value="">— ללא Block —</option>
                      {blocks.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.productType})</option>
                      ))}
                    </select>
                  )}

                  {selectedBlock && (
                    <div className="mt-3 p-3 rounded-xl text-xs text-gray-600 space-y-1"
                      style={{ background: `${BRAND_BG}20`, borderRight: `3px solid ${BRAND_BG}` }}>
                      <div className="font-bold" style={{ color: BRAND_TEXT }}>{selectedBlock.name}</div>
                      {selectedBlock.tagline && <div className="italic text-gray-500">"{selectedBlock.tagline}"</div>}
                      {selectedBlock.duration && <div>⏱ {selectedBlock.duration}</div>}
                      {selectedBlock.groupSize && <div>👥 {selectedBlock.groupSize}</div>}
                      {selectedBlock.price > 0 && <div className="font-semibold">💰 {fmt(selectedBlock.price)}</div>}
                      <div className="text-gray-400 text-[11px] pt-1">פרטי Block הוזנו אוטומטית למחירון</div>
                    </div>
                  )}
                </div>

                <hr />

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    <span className="flex items-center gap-1.5"><Link size={13} /> קישורים לחומרים</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-3">קישורים שיופיעו בסוף ההצעה (תמונות, עדויות, כתבות וכו׳)</p>
                  <div className="space-y-2">
                    {q.blockLinks.map((l) => (
                      <div key={l.id} className="flex gap-2 items-center">
                        <input className="border rounded-lg px-2 py-1.5 text-xs w-28 shrink-0"
                          placeholder="תווית"
                          value={l.label}
                          onChange={(e) => setLink(l.id, "label", e.target.value)} />
                        <input className="border rounded-lg px-2 py-1.5 text-xs flex-1 min-w-0"
                          placeholder="https://..."
                          value={l.url}
                          onChange={(e) => setLink(l.id, "url", e.target.value)} />
                        <button onClick={() => removeLink(l.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button onClick={addLink}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2 text-xs text-gray-400 hover:border-gray-400 transition-colors flex items-center justify-center gap-1">
                      <Plus size={12} /> קישור נוסף
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── EXTRA ── */}
            {activeSection === "extra" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">מה כלול בהצעה</label>
                  <p className="text-xs text-gray-400 mb-2">רשימת הכלולים שתופיע בהצעה (לוגיסטיקה, ציוד, מנחים וכו׳)</p>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-y" rows={4} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    placeholder={"• מנחה מקצועי\n• ציוד מלא\n• תיעוד וצילום"}
                    value={q.includes} onChange={(e) => setQ({ ...q, includes: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">הערות</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-y" rows={3} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    value={q.notes} onChange={(e) => setQ({ ...q, notes: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">תנאי תשלום</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-y" rows={2} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    value={q.paymentTerms} onChange={(e) => setQ({ ...q, paymentTerms: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">מדיניות ביטול</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-y" rows={2} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    value={q.cancellationPolicy} onChange={(e) => setQ({ ...q, cancellationPolicy: e.target.value })} />
                </div>
              </>
            )}

          </div>
        </div>

        {/* ── PREVIEW PANEL ── */}
        <div className={`flex-1 overflow-y-auto p-6 ${tab === "edit" ? "hidden md:block" : ""}`}
          style={{ background: "#ddd8d2", fontFamily: FONT }}>
          <div className="max-w-[740px] mx-auto bg-white shadow-2xl" style={{ fontFamily: FONT }}>

            {/* Header */}
            <div style={{ background: BRAND_BG, padding: "20px 48px 18px", direction: "rtl", fontFamily: FONT }}>
              <div className="flex justify-between items-center mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/arc-logo.png" alt="ARC" style={{ height: 72, width: 72, objectFit: "contain", display: "block" }} />
                <div style={{ textAlign: "left", fontFamily: FONT }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BRAND_TEXT, opacity: 0.6 }}>הצעת מחיר</div>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: BRAND_TEXT, fontFamily: FONT }}>{q.orgName || "שם הארגון"}</div>
                  {q.contactName && <div style={{ fontSize: 13, color: BRAND_TEXT, marginTop: 2, opacity: 0.75, fontFamily: FONT }}>{q.contactName}</div>}
                  {q.productType && <div style={{ fontSize: 11, color: BRAND_TEXT, opacity: 0.6, letterSpacing: 1, textTransform: "uppercase", marginTop: 5, fontFamily: FONT }}>{q.productType}</div>}
                </div>
                <div style={{ textAlign: "left", fontSize: 12, color: BRAND_TEXT, opacity: 0.8, lineHeight: 1.9, fontFamily: FONT }}>
                  <div><strong>תאריך הצעה:</strong> {formatDate(q.quoteDate)}</div>
                  <div><strong>תוקף:</strong> {formatDate(q.validUntil)}</div>
                  {q.eventDate && <div><strong>תאריך אירוע:</strong> {formatDate(q.eventDate)}</div>}
                  {q.participants && <div><strong>משתתפים:</strong> {q.participants}</div>}
                  {q.location && <div><strong>מיקום:</strong> {q.location}</div>}
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "44px 52px", direction: "rtl", fontFamily: FONT }}>

              {q.intro && <p style={{ fontSize: 13.5, lineHeight: 1.85, color: "#666", marginBottom: 36, whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word", fontFamily: FONT }}>{q.intro}</p>}

              {/* Workshops */}
              {(q.workshops ?? []).length > 0 && (
                <div style={{ marginBottom: 36, fontFamily: FONT }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BRAND_TEXT, marginBottom: 14, borderBottom: `2px solid ${BRAND_BG}`, paddingBottom: 5 }}>תוכנית הפעילות</div>
                  {(q.workshops ?? []).map((ws, i) => (
                    <div key={ws.id} style={{ marginBottom: 16, padding: "16px 20px", background: "#faf8f5", borderRadius: 10, borderRight: `4px solid ${BRAND_BG}` }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: BRAND_TEXT, marginBottom: 6 }}>{i + 1}. {ws.title || "סדנה"}</div>
                      {ws.description && <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8, whiteSpace: "pre-line" }}>{ws.description}</div>}
                      {ws.notes && <div style={{ marginTop: 8, fontSize: 12, color: "#999", fontStyle: "italic" }}>📌 {ws.notes}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Block info */}
              {selectedBlock && selectedBlock.description && (
                <div style={{ background: "#faf8f5", borderRight: `4px solid ${BRAND_BG}`, padding: "18px 22px", borderRadius: "0 10px 10px 0", marginBottom: 32, fontFamily: FONT }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BRAND_TEXT, marginBottom: 6 }}>⚡ על החוויה</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: BRAND_TEXT, marginBottom: 4 }}>{selectedBlock.name}</div>
                  {selectedBlock.tagline && <div style={{ fontSize: 12, color: "#999", fontStyle: "italic", marginBottom: 8 }}>"{selectedBlock.tagline}"</div>}
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.75 }}>{selectedBlock.description}</div>
                  <div className="flex gap-4 mt-2" style={{ fontSize: 12, color: "#999" }}>
                    {selectedBlock.duration && <span>⏱ {selectedBlock.duration}</span>}
                    {selectedBlock.groupSize && <span>👥 {selectedBlock.groupSize}</span>}
                  </div>
                </div>
              )}

              {/* Section label */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BRAND_TEXT, marginBottom: 12, borderBottom: `2px solid ${BRAND_BG}`, paddingBottom: 5, fontFamily: FONT }}>
                {q.mode === "packages" ? "אפשרויות לבחירה" : "פירוט השירותים"}
              </div>

              {q.mode === "single" ? (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8, fontFamily: FONT }}>
                    <thead>
                      <tr>
                        {(["תיאור", "כמות", "מחיר יחידה", "סה״כ"] as const).map((h, i) => (
                          <th key={h} style={{ textAlign: i === 0 ? "right" : i === 1 ? "center" : "left", fontSize: 11, fontWeight: 600, color: "#aaa", padding: "7px 10px", borderBottom: `2px solid ${BRAND_BG}`, width: i === 0 ? "50%" : i === 1 ? "15%" : "17.5%", fontFamily: FONT }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {q.items.map((it) => (
                        <tr key={it.id}>
                          <td style={{ padding: "11px 10px", fontSize: 13, borderBottom: "1px solid #f0ece8", fontWeight: 600, color: BRAND_TEXT }}>{it.description || "—"}</td>
                          <td style={{ padding: "11px 10px", fontSize: 13, borderBottom: "1px solid #f0ece8", textAlign: "center", color: "#777" }}>{it.quantity}</td>
                          <td style={{ padding: "11px 10px", fontSize: 13, borderBottom: "1px solid #f0ece8", textAlign: "left", color: "#777" }}>{fmt(it.unitPrice)}</td>
                          <td style={{ padding: "11px 10px", fontSize: 13, borderBottom: "1px solid #f0ece8", textAlign: "left", fontWeight: 700, color: BRAND_TEXT }}>{fmt(it.quantity * it.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end">
                    <div style={{ width: 260, fontFamily: FONT }}>
                      <div className="flex justify-between" style={{ fontSize: 12, color: "#999", padding: "4px 0" }}><span>לפני מע״מ</span><span>{fmt(sub)}</span></div>
                      <div className="flex justify-between" style={{ fontSize: 12, color: "#999", padding: "4px 0" }}><span>מע״מ 18%</span><span>{fmt(vat)}</span></div>
                      <div className="flex justify-between" style={{ fontSize: 18, fontWeight: 700, color: BRAND_TEXT, borderTop: `2px solid ${BRAND_TEXT}`, paddingTop: 10, marginTop: 4 }}>
                        <span>סה״כ לתשלום</span><span>{fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  {q.packages.map((pkg) => {
                    const pkgSub = calcItems(pkg.items);
                    const pkgTotal = pkgSub + Math.round(pkgSub * 0.18);
                    return (
                      <div key={pkg.id} className="rounded-xl overflow-hidden" style={{ border: `2px solid ${pkg.isRecommended ? BRAND_BG : "#e5e0db"}`, fontFamily: FONT }}>
                        {pkg.isRecommended
                          ? <div className="text-center text-xs font-bold py-1.5 tracking-widest" style={{ background: BRAND_BG, color: BRAND_TEXT }}>מומלץ</div>
                          : <div style={{ height: 28, background: "#f7f4f1" }} />}
                        <div style={{ padding: "16px 14px" }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: BRAND_TEXT, marginBottom: 4 }}>{pkg.name}</div>
                          {pkg.description && <div style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>{pkg.description}</div>}
                          {pkg.items.map((it) => (
                            <div key={it.id} className="flex justify-between" style={{ fontSize: 12, color: "#666", padding: "4px 0", borderBottom: "1px solid #f0ece8" }}>
                              <span>{it.description || "—"}{it.quantity > 1 ? ` ×${it.quantity}` : ""}</span>
                              <span style={{ fontWeight: 600 }}>{fmt(it.quantity * it.unitPrice)}</span>
                            </div>
                          ))}
                          <div style={{ marginTop: 12, paddingTop: 8, borderTop: `2px solid ${BRAND_TEXT}` }}>
                            <div className="flex justify-between" style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}><span>לפני מע״מ</span><span>{fmt(pkgSub)}</span></div>
                            <div className="flex justify-between" style={{ fontSize: 15, fontWeight: 700, color: BRAND_TEXT }}><span>סה״כ + מע״מ</span><span>{fmt(pkgTotal)}</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Includes */}
              {q.includes && (
                <div style={{ marginTop: 32, fontFamily: FONT }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BRAND_TEXT, marginBottom: 10, borderBottom: `2px solid ${BRAND_BG}`, paddingBottom: 5 }}>מה כלול</div>
                  <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8, whiteSpace: "pre-line" }}>{q.includes}</div>
                </div>
              )}

              {/* Notes */}
              {q.notes && (
                <div style={{ background: "#faf8f5", borderRight: `3px solid ${BRAND_BG}`, padding: "14px 18px", marginTop: 28, fontSize: 13, color: "#666", lineHeight: 1.75, whiteSpace: "pre-line", borderRadius: "0 8px 8px 0", fontFamily: FONT }}>
                  <strong style={{ color: BRAND_TEXT }}>הערות:</strong><br />{q.notes}
                </div>
              )}

              {/* Terms grid */}
              {(q.paymentTerms || q.cancellationPolicy) && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {q.paymentTerms && (
                    <div style={{ background: "#f7f5f2", borderRadius: 8, padding: "13px 15px", fontFamily: FONT }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: BRAND_TEXT, marginBottom: 5 }}>תנאי תשלום</div>
                      <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{q.paymentTerms}</div>
                    </div>
                  )}
                  {q.cancellationPolicy && (
                    <div style={{ background: "#f7f5f2", borderRadius: 8, padding: "13px 15px", fontFamily: FONT }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: BRAND_TEXT, marginBottom: 5 }}>מדיניות ביטול</div>
                      <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{q.cancellationPolicy}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Links */}
              {q.blockLinks.filter((l) => l.url).length > 0 && (
                <div style={{ marginTop: 32, fontFamily: FONT }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BRAND_TEXT, marginBottom: 10, borderBottom: `2px solid ${BRAND_BG}`, paddingBottom: 5 }}>חומרים נוספים</div>
                  <div className="flex flex-wrap gap-2">
                    {q.blockLinks.filter((l) => l.url).map((l) => (
                      <span key={l.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#faf8f5", border: `1px solid ${BRAND_BG}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, color: BRAND_TEXT, fontWeight: 600, fontFamily: FONT }}>
                        🔗 {l.label || l.url}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature */}
              <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid #e8e3de", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, fontFamily: FONT }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>חתימת הלקוח</div>
                  <div style={{ height: 90 }} />
                  <div style={{ borderBottom: `2px solid ${BRAND_TEXT}`, opacity: 0.25, marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: "#bbb" }}>שם, תפקיד ותאריך</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#bbb", marginBottom: 8 }}>חתימת ARC</div>
                  <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px solid ${BRAND_BG}`, borderRadius: 8, padding: "6px 12px", gap: 3, opacity: 0.85 }}>
                      <div style={{ fontSize: 13 }}>✓</div>
                      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.5, color: BRAND_TEXT }}>חתום דיגיטלית</div>
                      <div style={{ fontSize: 9, color: "#aaa" }}>{new Date().toLocaleDateString("he-IL")}</div>
                    </div>
                  </div>
                  <div style={{ borderBottom: `2px solid ${BRAND_TEXT}`, opacity: 0.25, marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: "#bbb" }}>אורי לבקוביץ, ARC</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: BRAND_BG, padding: "22px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", direction: "rtl", fontFamily: FONT }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: BRAND_TEXT, letterSpacing: 3 }}>ARC</div>
                <div style={{ fontSize: 10, color: BRAND_MUTED, letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Irreplaceable Experiences</div>
              </div>
              <div style={{ textAlign: "left", fontSize: 11, color: BRAND_TEXT, lineHeight: 1.9, opacity: 0.8 }}>
                <div style={{ fontWeight: 600 }}>אורי לבקוביץ</div>
                <div>urilewko@arcexpe.com</div>
                <div>052-610-8102</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
