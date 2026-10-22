"use client";
import { useState, useEffect, useRef } from "react";
import { Lead, useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { reportDbError } from "@/lib/dbErrors";
import { ChevronLeft, Plus, Trash2, Download, FileCode, Eye, Package, Zap, Link, Languages } from "lucide-react";
import { buildQuoteHTML, FIXED_TEXT_GROUPS, defaultFixedText, type QuoteEnglish, type QuoteLang, type QuoteLabels } from "@/lib/buildQuoteHTML";

// ─── Brand ───────────────────────────────────────────────────────────────────
const BRAND_BG     = "#2e5775";
const BRAND_ACCENT = "#2e5775";
const BRAND_TEXT   = "#987859";
const BRAND_MUTED  = "#987859";
const BRAND_PAPER  = "#e7ded2";
const BRAND_ON_BG  = "#e7ded2"; // text color on top of the blue header
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
  en?: QuoteEnglish;
  labels?: QuoteLabels;
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
          <th style="text-align:right;font-size:11px;font-weight:600;color:${BRAND_TEXT};padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:50%;font-family:${F};">תיאור</th>
          <th style="text-align:center;font-size:11px;font-weight:600;color:${BRAND_TEXT};padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:15%;font-family:${F};">כמות</th>
          <th style="text-align:left;font-size:11px;font-weight:600;color:${BRAND_TEXT};padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:18%;font-family:${F};">מחיר יחידה</th>
          <th style="text-align:left;font-size:11px;font-weight:600;color:${BRAND_TEXT};padding:8px 12px;border-bottom:2px solid ${BRAND_ACCENT};width:17%;font-family:${F};">סה״כ</th>
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
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:${BRAND_TEXT};">
          <span>לפני מע״מ</span><span>${fmt(sub)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:${BRAND_TEXT};">
          <span>מע״מ (18%)</span><span>${fmt(vat)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:700;color:${BRAND_TEXT};border-top:2px solid ${BRAND_TEXT};padding-top:12px;margin-top:6px;">
          <span>סה״כ לתשלום</span><span>${fmt(total)}</span>
        </div>
      </div>
    </div>`;
}

function QuotePreviewFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const fit = () => {
    const doc = ref.current?.contentDocument;
    if (doc) ref.current!.style.height = `${doc.documentElement.scrollHeight + 8}px`;
  };
  return (
    <iframe ref={ref} title="Quote preview" srcDoc={html} onLoad={fit}
      className="w-full max-w-[740px] mx-auto block shadow-2xl" style={{ height: 1200, border: 0, background: BRAND_PAPER }} />
  );
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
    cancellationPolicy: "ביטול עד שבועיים לפני האירוע — החזר מלא. ביטול לאחר מכן — 50%.",
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
    supabase.from("quotes").insert({ id: newV.id, lead_id: lead.id, label: newV.label, data: newV.data }).then(({ error }) => { if (error) reportDbError("quotes", "insert", error.message); });
    // stay on current version — user clicks the new tab when ready
  };

  const deleteVersion = (idx: number) => {
    if (versions.length <= 1) return;
    const toDelete = versions[idx];
    setVersions(prev => prev.filter((_, i) => i !== idx));
    setActiveIdx(prev => (idx <= prev && prev > 0) ? prev - 1 : Math.min(prev, versions.length - 2));
    supabase.from("quotes").delete().eq("id", toDelete.id).then(({ error }) => { if (error) reportDbError("quotes", "delete", error.message); });
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

  // ── English version ────────────────────────────────────────────────
  const [lang, setLang] = useState<QuoteLang>("he");
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

  const translateQuote = async () => {
    setTranslating(true);
    setTranslateError("");
    try {
      const payload = {
        productType: q.productType, location: q.location, intro: q.intro, includes: q.includes,
        notes: q.notes, cancellationPolicy: q.cancellationPolicy, paymentTerms: q.paymentTerms,
        workshops: (q.workshops ?? []).map((w) => ({ id: w.id, title: w.title, description: w.description, notes: w.notes })),
        items: (q.items ?? []).map((it) => ({ id: it.id, description: it.description })),
        packages: (q.packages ?? []).map((pk) => ({
          id: pk.id, name: pk.name, description: pk.description,
          items: pk.items.map((it) => ({ id: it.id, description: it.description })),
        })),
        blockLinks: (q.blockLinks ?? []).map((l) => ({ id: l.id, label: l.label })),
        block: selectedBlock
          ? { name: selectedBlock.name, tagline: selectedBlock.tagline, description: selectedBlock.description, duration: selectedBlock.duration, groupSize: selectedBlock.groupSize }
          : undefined,
      };
      const res = await fetch("/api/translate-quote", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let data: { translation?: unknown; error?: string } = {};
      try { data = JSON.parse(raw); } catch { /* non-JSON (e.g. timeout page) */ }
      if (!res.ok || !data.translation) {
        throw new Error(data.error || (res.status === 504 || !raw ? "התרגום לקח יותר מדי זמן — נסה שוב" : `שגיאת תרגום (${res.status})`));
      }
      setQ((prev) => ({ ...prev, en: data.translation as QuoteEnglish }));
      setLang("en");
    } catch (e) {
      setTranslateError(String(e instanceof Error ? e.message : e));
    }
    setTranslating(false);
  };

  const previewHtml = buildQuoteHTML(q, {
    logoUrl: typeof window !== "undefined" ? `${window.location.origin}/arc-logo.png` : "/arc-logo.png",
    selectedBlock: selectedBlock ? { id: selectedBlock.id, name: selectedBlock.name, tagline: selectedBlock.tagline, description: selectedBlock.description, duration: selectedBlock.duration, groupSize: selectedBlock.groupSize } : null,
    lang: lang === "en" && q.en ? "en" : "he",
  });
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

  const handlePrint = () => {
    const quoteId = versions[safeIdx]?.id;
    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const url = quoteId ? `${base}/quote/${quoteId}${lang === "en" ? "?lang=en" : ""}` : null;
    if (url) {
      const win = window.open(url, "_blank");
      if (!win) return;
      // wait for page to load then print
      win.addEventListener("load", () => setTimeout(() => win.print(), 500));
    } else {
      // fallback — no saved quote yet
      const html = previewHtml;
      const win = window.open("", "_blank", "width=900,height=720");
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const [copied, setCopied] = useState(false);
  const handleCopyLink = async () => {
    const quoteId = versions[safeIdx]?.id;
    if (!quoteId) return;
    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    await navigator.clipboard.writeText(`${base}/quote/${quoteId}${lang === "en" ? "?lang=en" : ""}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="flex bg-white/20 rounded-lg overflow-hidden text-sm">
            <button onClick={() => setLang("he")}
              className={`px-3 py-2 ${lang === "he" ? "bg-white/30 text-white" : "text-white/60 hover:text-white"}`}>עב</button>
            <button onClick={() => (q.en ? setLang("en") : translateQuote())} disabled={translating}
              className={`flex items-center gap-1.5 px-3 py-2 ${lang === "en" ? "bg-white/30 text-white" : "text-white/60 hover:text-white"} disabled:opacity-60`}>
              <Languages size={13} /> {translating ? "מתרגם..." : "EN"}
            </button>
          </div>
          {lang === "en" && (
            <button onClick={translateQuote} disabled={translating} title="תרגם מחדש אחרי עריכות"
              className="text-xs text-white/70 hover:text-white underline disabled:opacity-60">
              {translating ? "מתרגם..." : "תרגם מחדש"}
            </button>
          )}
          <button onClick={handleCopyLink}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors">
            <Link size={14} /> {copied ? "הועתק!" : "שלח הצעה"}
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

                {/* Every fixed text on the document — headings, labels, signature and footer */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">טקסטים קבועים במסמך</label>
                    <span className="text-[11px] text-gray-400">עורך את הגרסה: {lang === "en" ? "English" : "עברית"}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">כותרות, תוויות, חתימות ותחתית. השאר ריק כדי להשתמש בברירת המחדל.</p>
                  {FIXED_TEXT_GROUPS.map((g) => (
                    <details key={g.title} className="mb-2 rounded-lg border border-gray-200 bg-white">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-600">{g.title}</summary>
                      <div className="px-3 pb-3 space-y-2">
                        {g.keys.map((key) => {
                          const active: QuoteLang = lang === "en" && q.en ? "en" : "he";
                          const value = q.labels?.[active]?.[key] ?? "";
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                                dir={active === "en" ? "ltr" : "rtl"}
                                placeholder={defaultFixedText(key, active)}
                                value={value}
                                onChange={(e) => setQ((prev) => ({
                                  ...prev,
                                  labels: { ...prev.labels, [active]: { ...prev.labels?.[active], [key]: e.target.value } },
                                }))} />
                              {value && (
                                <button title="החזר לברירת מחדל" className="text-xs text-gray-400 hover:text-gray-700"
                                  onClick={() => setQ((prev) => {
                                    const cur = { ...prev.labels?.[active] };
                                    delete cur[key];
                                    return { ...prev, labels: { ...prev.labels, [active]: cur } };
                                  })}>איפוס</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>

        {/* ── PREVIEW PANEL ── */}
        <div className={`flex-1 overflow-y-auto p-6 ${tab === "edit" ? "hidden md:block" : ""}`}
          style={{ background: BRAND_PAPER, fontFamily: FONT }}>
          {translateError && (
            <div className="max-w-[740px] mx-auto mb-3 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">{translateError}</div>
          )}
          <QuotePreviewFrame html={previewHtml} />
        </div>
      </div>
    </div>
  );
}
