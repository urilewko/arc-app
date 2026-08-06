"use client";
import { useState } from "react";
import { useStore, Block, BlockStatus, BlockContentItem, BlockMarketingLink, ExpenseItem, ProductType } from "@/lib/store";
import Link from "next/link";
import { Plus, Pencil, Trash2, Zap, ArrowRight, X, Link2, Eye, Edit3, Check, Download } from "lucide-react";

const BLOCK_STATUSES: BlockStatus[] = ["רעיון", "בפיתוח", "מוכן", "בוצע בשטח"];
const PRODUCT_TYPES: ProductType[] = ["ריטריט", "סדנה חד פעמית", "Offsite", "קורס", "אירוע"];

// ── Visual config ──────────────────────────────────────────────────
const STATUS_BADGE: Record<BlockStatus, string> = {
  "רעיון":       "bg-gray-100 text-gray-500",
  "בפיתוח":      "bg-[#aec6cf]/30 text-[#4a6b73]",
  "מוכן":        "bg-emerald-100 text-emerald-700",
  "בוצע בשטח":   "bg-green-700 text-white",
};
const PILLAR_COLORS = ["bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-rose-500"];
const PILLAR_LABELS = ["תוכן", "חוויה", "לוגיסטיקה", "שיווק"];

// ── Maturity scale: red → orange → yellow → lime → green ──────────
// Read as a traffic light, so a block's readiness is legible at a glance.
const MATURITY = [
  { min: 90, bar: "bg-green-500",  text: "text-green-600",  grad: "from-green-500 to-green-300",   label: "מוכן" },
  { min: 70, bar: "bg-lime-500",   text: "text-lime-600",   grad: "from-lime-500 to-lime-300",     label: "כמעט" },
  { min: 50, bar: "bg-yellow-400", text: "text-yellow-600", grad: "from-yellow-400 to-yellow-200", label: "באמצע" },
  { min: 30, bar: "bg-orange-500", text: "text-orange-600", grad: "from-orange-400 to-orange-200", label: "בתחילת הדרך" },
  { min: 0,  bar: "bg-red-500",    text: "text-red-600",    grad: "from-red-500 to-red-300",       label: "חסר" },
];
const maturity = (pct: number) =>
  MATURITY.find((m) => pct >= m.min) ?? MATURITY[MATURITY.length - 1];

const uid = () => Math.random().toString(36).slice(2);

function emptyBlock(): Omit<Block, "id" | "createdAt"> {
  return {
    name: "",
    productType: "סדנה חד פעמית",
    tagline: "",
    description: "",
    duration: "",
    groupSize: "",
    price: 0,
    status: "רעיון",
    completionPercent: 0,
    contentItems: [],
    experience: "",
    logistics: "",
    marketingPitch: "",
    marketingAudience: "",
    marketingLinks: [],
    expenses: [],
  };
}

// ── Helper: does a block have content in each pillar ──────────────
function pillarFilled(b: Block) {
  return [
    b.contentItems?.length > 0,
    !!(b.experience),
    !!(b.logistics || b.includes),
    !!(b.marketingPitch || b.marketingNotes || b.marketingAudience || b.marketingLinks?.length),
  ];
}

// ══════════════════════════════════════════════════════════════════
// BLOCK DETAIL — full-page, 4-tab editor
// ══════════════════════════════════════════════════════════════════
type DetailTab = "content" | "experience" | "logistics" | "marketing" | "expenses";

function BlockDetail({ block, onBack }: { block: Block; onBack: () => void }) {
  const { updateBlock } = useStore();
  const [tab, setTab] = useState<DetailTab>("content");
  const [editing, setEditing] = useState(false);

  // Local form state
  const [form, setForm] = useState<Block>({ ...block });

  const save = () => {
    updateBlock(block.id, form);
    setEditing(false);
  };

  const cancel = () => {
    setForm({ ...block });
    setEditing(false);
  };

  // ── Content Items helpers ──
  const addContentItem = () => {
    setForm((f) => ({
      ...f,
      contentItems: [...(f.contentItems || []), { id: uid(), title: "", body: "" }],
    }));
  };
  const updateContentItem = (id: string, patch: Partial<BlockContentItem>) => {
    setForm((f) => ({
      ...f,
      contentItems: f.contentItems.map((c) => c.id === id ? { ...c, ...patch } : c),
    }));
  };
  const removeContentItem = (id: string) => {
    setForm((f) => ({ ...f, contentItems: f.contentItems.filter((c) => c.id !== id) }));
  };

  // ── Marketing Links helpers ──
  const addMarketingLink = () => {
    setForm((f) => ({
      ...f,
      marketingLinks: [...(f.marketingLinks || []), { id: uid(), label: "", url: "" }],
    }));
  };
  const updateMarketingLink = (id: string, patch: Partial<BlockMarketingLink>) => {
    setForm((f) => ({
      ...f,
      marketingLinks: f.marketingLinks.map((l) => l.id === id ? { ...l, ...patch } : l),
    }));
  };
  const removeMarketingLink = (id: string) => {
    setForm((f) => ({ ...f, marketingLinks: f.marketingLinks.filter((l) => l.id !== id) }));
  };

  const filled = pillarFilled(form);

  const TABS: { id: DetailTab; label: string; icon: string; color: string }[] = [
    { id: "content",    label: "תוכן",              icon: "📝", color: "blue"   },
    { id: "experience", label: "חוויה",             icon: "✨", color: "purple" },
    { id: "logistics",  label: "לוגיסטיקה",        icon: "📦", color: "amber"  },
    { id: "marketing",  label: "שיווק ומכירה",     icon: "🎯", color: "rose"   },
    { id: "expenses",   label: "הוצאות",            icon: "💸", color: "red"    },
  ];

  const tabIdx = TABS.findIndex((t) => t.id === tab);
  const isTabFilled = filled[tabIdx];

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowRight size={16} /> כל הבלוקים
        </button>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={cancel} className="px-4 py-1.5 text-sm border rounded-lg hover:bg-gray-50">ביטול</button>
              <button onClick={save}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333]">
                <Check size={14} /> שמור שינויים
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <Edit3 size={14} /> ערוך
            </button>
          )}
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className={`rounded-2xl bg-gradient-to-br ${maturity(form.completionPercent).grad} p-6 mb-6 shadow-sm`}>
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">שם הבלוק *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm bg-white/80"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">סוג</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white/80"
                  value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value as ProductType })}>
                  {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">טאגליין</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm bg-white/80"
                placeholder="משפט אחד שמתאר את החוויה"
                value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-600">תיאור כללי</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-white/80" rows={2}
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">משך</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm bg-white/80" placeholder="3 שעות"
                  value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">גודל קבוצה</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm bg-white/80" placeholder="15–30"
                  value={form.groupSize} onChange={(e) => setForm({ ...form, groupSize: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">מחיר (₪)</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm bg-white/80"
                  value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">סטטוס</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white/80"
                  value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BlockStatus })}>
                  {BLOCK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">
                  בשלות —{" "}
                  <span className={maturity(form.completionPercent).text}>
                    {form.completionPercent}% · {maturity(form.completionPercent).label}
                  </span>
                </label>
                <input type="range" min={0} max={100} step={5} className="w-full mt-2 accent-gray-800"
                  value={form.completionPercent}
                  onChange={(e) => setForm({ ...form, completionPercent: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{form.name}</h1>
                {form.tagline && <p className="text-gray-600 mt-1 italic">"{form.tagline}"</p>}
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_BADGE[form.status]}`}>{form.status}</span>
            </div>
            {form.description && <p className="text-sm text-gray-600 mt-3">{form.description}</p>}
            <div className="flex gap-5 mt-4 text-sm text-gray-600 flex-wrap">
              {form.duration && <span>⏱ {form.duration}</span>}
              {form.groupSize && <span>👥 {form.groupSize}</span>}
              {form.price > 0 && <span>💰 ₪{form.price.toLocaleString()}</span>}
              <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">{form.productType}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>בשלות · {maturity(form.completionPercent).label}</span>
                <span className="font-semibold">{form.completionPercent}%</span>
              </div>
              <div className="h-2 bg-white/40 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${maturity(form.completionPercent).bar}`}
                  style={{ width: `${form.completionPercent}%` }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 4 Pillars tabs ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b">
          {TABS.map((t, i) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${
                tab === t.id
                  ? "text-gray-900 bg-gray-50"
                  : "text-gray-400 hover:text-gray-700"
              }`}>
              <span className="flex items-center justify-center gap-1.5">
                {t.icon} {t.label}
                {filled[i] && (
                  <span className={`w-1.5 h-1.5 rounded-full ${PILLAR_COLORS[i]}`} />
                )}
              </span>
              {tab === t.id && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${PILLAR_COLORS[i]}`} />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* ── תוכן ── */}
          {tab === "content" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">פריטי תוכן</h3>
                  <p className="text-xs text-gray-400 mt-0.5">שאלות, מצגות, חוברות — כל מה שמרכיב את התוכן של הבלוק</p>
                </div>
                {editing && (
                  <button onClick={addContentItem}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5">
                    <Plus size={14} /> הוסף פריט
                  </button>
                )}
              </div>

              {(!form.contentItems || form.contentItems.length === 0) && (
                <div className="text-center py-10 text-gray-300">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm">
                    {editing ? 'לחץ "הוסף פריט" להוסיף תוכן ראשון' : "אין פריטי תוכן עדיין"}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {(form.contentItems || []).map((item, idx) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                    {editing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium w-5">{idx + 1}.</span>
                          <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm font-medium"
                            placeholder="כותרת הפריט (למשל: שאלות סיבוב א')"
                            value={item.title}
                            onChange={(e) => updateContentItem(item.id, { title: e.target.value })} />
                          <button onClick={() => removeContentItem(item.id)}
                            className="text-gray-300 hover:text-red-500 shrink-0"><X size={15} /></button>
                        </div>
                        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4}
                          placeholder="התוכן עצמו..."
                          value={item.body}
                          onChange={(e) => updateContentItem(item.id, { body: e.target.value })} />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-blue-500 bg-blue-50 rounded px-1.5 py-0.5">{idx + 1}</span>
                          <h4 className="font-semibold text-sm text-gray-700">{item.title || "ללא כותרת"}</h4>
                        </div>
                        {item.body && <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.body}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── חוויה ── */}
          {tab === "experience" && (
            <div>
              <div className="mb-4">
                <h3 className="font-bold text-gray-800">דרישות החוויה</h3>
                <p className="text-xs text-gray-400 mt-0.5">כל מה שנדרש כדי שהחוויה תקרה — ציוד, מוזיקה, מרחב, אווירה</p>
              </div>
              {editing ? (
                <textarea className="w-full border rounded-xl px-4 py-3 text-sm" rows={10}
                  placeholder={"לדוגמא:\n• אוזניות לכל משתתף\n• פלייליסט מוכן עם 5 שירים\n• חדר עם אפשרות לעמעם אורות\n• שולחנות עגולים (לא שורות)"}
                  value={form.experience || ""}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })} />
              ) : form.experience ? (
                <div className="bg-purple-50 rounded-xl p-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {form.experience}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-300">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-sm">תאר מה דרוש כדי שהחוויה תקרה</p>
                </div>
              )}
            </div>
          )}

          {/* ── לוגיסטיקה ── */}
          {tab === "logistics" && (
            <div>
              <div className="mb-4">
                <h3 className="font-bold text-gray-800">לוגיסטיקה</h3>
                <p className="text-xs text-gray-400 mt-0.5">מה דרוש ברמה הלוגיסטית — זמן הכנה, ציוד, סדר עדיפויות</p>
              </div>
              {editing ? (
                <textarea className="w-full border rounded-xl px-4 py-3 text-sm" rows={10}
                  placeholder={"לדוגמא:\n• הכנה: שעה לפני\n• ציוד: 30 דפי עבודה, עטים, טוש צבעוני\n• צוות: מנחה + עוזר\n• חדר: לפחות 5x8 מטר"}
                  value={form.logistics || (form.includes ?? "")}
                  onChange={(e) => setForm({ ...form, logistics: e.target.value })} />
              ) : (form.logistics || form.includes) ? (
                <div className="bg-amber-50 rounded-xl p-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {form.logistics || form.includes}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-300">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-sm">הוסף פרטי לוגיסטיקה</p>
                </div>
              )}
            </div>
          )}

          {/* ── שיווק ומכירה ── */}
          {tab === "marketing" && (
            <div>
              <div className="mb-4">
                <h3 className="font-bold text-gray-800">שיווק ומכירה</h3>
                <p className="text-xs text-gray-400 mt-0.5">מעטפת המכירה של הבלוק — תיאורים, קהל יעד, חומרים וקישורים</p>
              </div>

              <div className="space-y-5">
                {/* Pitch */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">🎙 הצגת מכירה</label>
                  {editing ? (
                    <textarea className="w-full border rounded-xl px-4 py-3 text-sm" rows={4}
                      placeholder="איך תתאר את החוויה ללקוח פוטנציאלי?"
                      value={form.marketingPitch || (form.marketingNotes ?? "")}
                      onChange={(e) => setForm({ ...form, marketingPitch: e.target.value })} />
                  ) : (form.marketingPitch || form.marketingNotes) ? (
                    <div className="bg-rose-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">
                      {form.marketingPitch || form.marketingNotes}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-300 italic py-2">לא הוגדר טקסט מכירה</div>
                  )}
                </div>

                {/* Target audience */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">🎯 קהל יעד</label>
                  {editing ? (
                    <input className="w-full border rounded-xl px-4 py-2.5 text-sm"
                      placeholder="למי הבלוק הזה מתאים?"
                      value={form.marketingAudience || ""}
                      onChange={(e) => setForm({ ...form, marketingAudience: e.target.value })} />
                  ) : form.marketingAudience ? (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700">
                      {form.marketingAudience}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-300 italic py-2">לא הוגדר קהל יעד</div>
                  )}
                </div>

                {/* Links */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">🔗 קישורים וחומרים</label>
                    {editing && (
                      <button onClick={addMarketingLink}
                        className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 border border-rose-200 rounded-lg px-2.5 py-1">
                        <Plus size={12} /> הוסף קישור
                      </button>
                    )}
                  </div>

                  {(!form.marketingLinks || form.marketingLinks.length === 0) && !editing && (
                    <div className="text-sm text-gray-300 italic py-2">אין קישורים עדיין</div>
                  )}

                  <div className="space-y-2">
                    {(form.marketingLinks || []).map((link) => (
                      <div key={link.id} className={`${editing ? "flex gap-2 items-center" : "flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"}`}>
                        {editing ? (
                          <>
                            <input className="w-36 border rounded-lg px-3 py-1.5 text-sm shrink-0"
                              placeholder="תווית" value={link.label}
                              onChange={(e) => updateMarketingLink(link.id, { label: e.target.value })} />
                            <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                              placeholder="https://..." value={link.url}
                              onChange={(e) => updateMarketingLink(link.id, { url: e.target.value })} />
                            <button onClick={() => removeMarketingLink(link.id)}
                              className="text-gray-300 hover:text-red-500 shrink-0"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <Link2 size={13} className="text-gray-400 shrink-0" />
                            {link.url ? (
                              <a href={link.url} target="_blank" rel="noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate">
                                {link.label || link.url}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-600">{link.label}</span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── הוצאות ── */}
          {tab === "expenses" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">הוצאות הבלוק</h3>
                  <p className="text-xs text-gray-400 mt-0.5">ציוד, מנויים, תשלומים קבועים הקשורים לבלוק זה</p>
                </div>
                {editing && (
                  <button onClick={() => setForm((f) => ({ ...f, expenses: [...(f.expenses||[]), { id: uid(), description: "", amount: 0, paidBy: "", date: "" }] }))}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-3 py-1.5">
                    <Plus size={14} /> הוסף הוצאה
                  </button>
                )}
              </div>

              {(!form.expenses || form.expenses.length === 0) && (
                <div className="text-center py-10 text-gray-300">
                  <div className="text-4xl mb-2">💸</div>
                  <p className="text-sm">{editing ? "לחץ להוסיף הוצאה" : "אין הוצאות רשומות לבלוק זה"}</p>
                </div>
              )}

              {editing ? (
                <div className="space-y-2">
                  {(form.expenses||[]).map((exp) => (
                    <div key={exp.id} className="grid grid-cols-12 gap-2 items-center">
                      <input className="col-span-4 border rounded-lg px-3 py-1.5 text-sm" placeholder="תיאור הוצאה"
                        value={exp.description} onChange={(e) => setForm((f) => ({ ...f, expenses: f.expenses.map((x) => x.id===exp.id ? {...x, description: e.target.value} : x) }))} />
                      <input type="number" className="col-span-2 border rounded-lg px-3 py-1.5 text-sm" placeholder="₪"
                        value={exp.amount||""} onChange={(e) => setForm((f) => ({ ...f, expenses: f.expenses.map((x) => x.id===exp.id ? {...x, amount: Number(e.target.value)} : x) }))} />
                      <select className="col-span-2 border rounded-lg px-2 py-1.5 text-sm"
                        value={exp.paidBy||""} onChange={(e) => setForm((f) => ({ ...f, expenses: f.expenses.map((x) => x.id===exp.id ? {...x, paidBy: e.target.value} : x) }))}>
                        <option value="">שילם?</option>
                        <option>אורי</option><option>ינון</option><option>אחר</option>
                      </select>
                      <input type="date" className="col-span-3 border rounded-lg px-3 py-1.5 text-sm"
                        value={exp.date||""} onChange={(e) => setForm((f) => ({ ...f, expenses: f.expenses.map((x) => x.id===exp.id ? {...x, date: e.target.value} : x) }))} />
                      <button className="col-span-1 text-gray-300 hover:text-red-500 justify-self-center"
                        onClick={() => setForm((f) => ({ ...f, expenses: f.expenses.filter((x) => x.id!==exp.id) }))}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(form.expenses||[]).map((exp, i) => (
                    <div key={exp.id} className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-red-400 w-4">{i+1}</span>
                        <span className="text-sm text-gray-700">{exp.description}</span>
                        {exp.paidBy && <span className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-full">{exp.paidBy}</span>}
                        {exp.date && <span className="text-xs text-gray-400">{exp.date}</span>}
                      </div>
                      <span className="font-semibold text-red-500">₪{exp.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {(form.expenses||[]).length > 0 && (
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <span className="text-sm font-bold text-red-500">
                        סה״כ: ₪{(form.expenses||[]).reduce((s,e)=>s+e.amount,0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// BLOCK CARD — visual card in the grid
// ══════════════════════════════════════════════════════════════════
function BlockCard({ block, onView, onDelete }: {
  block: Block;
  onView: () => void;
  onDelete: () => void;
}) {
  const filled = pillarFilled(block);
  const filledCount = filled.filter(Boolean).length;

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
      onClick={onView}>
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${maturity(block.completionPercent).grad} px-5 pt-5 pb-4 relative`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-gray-800 leading-tight">{block.name}</h3>
            {block.tagline && (
              <p className="text-gray-500 text-sm mt-1 italic leading-snug line-clamp-2">"{block.tagline}"</p>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity mr-2 shrink-0">
            <Trash2 size={14} />
          </button>
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap mt-3">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[block.status]}`}>{block.status}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/50 text-gray-600">{block.productType}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-500 mb-4 flex-wrap">
          {block.duration && <span>⏱ {block.duration}</span>}
          {block.groupSize && <span>👥 {block.groupSize}</span>}
          {block.price > 0 && <span>💰 ₪{block.price.toLocaleString()}</span>}
        </div>

        {/* 4 Pillar indicators */}
        <div className="flex items-center gap-1.5 mb-3">
          {PILLAR_LABELS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${filled[i] ? PILLAR_COLORS[i] : "bg-gray-200"}`} />
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{filledCount}/4 פילרים</span>
            <span className={`font-semibold ${maturity(block.completionPercent).text}`}>
              {block.completionPercent}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${maturity(block.completionPercent).bar}`}
              style={{ width: `${block.completionPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// NEW BLOCK QUICK-FORM — inline creation form
// ══════════════════════════════════════════════════════════════════
function NewBlockForm({ onSave, onCancel }: { onSave: (b: Omit<Block, "id"|"createdAt">) => void; onCancel: () => void }) {
  const [form, setForm] = useState(emptyBlock());
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
      <h3 className="font-bold text-gray-800">Block חדש</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">שם *</label>
          <input className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">סוג</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value as ProductType })}>
            {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1 text-gray-600">טאגליין</label>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="משפט אחד שמתאר את החוויה"
          value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">משך</label>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="3 שעות"
            value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">גודל קבוצה</label>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="15–30"
            value={form.groupSize} onChange={(e) => setForm({ ...form, groupSize: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-600">מחיר (₪)</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => { if (form.name) onSave(form); }} className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">צור Block</button>
        <button onClick={onCancel} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function BlocksPage() {
  const { blocks, addBlock, deleteBlock } = useStore();
  const [detail, setDetail] = useState<Block | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BlockStatus | "הכל">("הכל");

  // If viewing a block detail — re-fetch from store so edits reflect
  const detailFromStore = detail ? blocks.find((b) => b.id === detail.id) ?? null : null;
  if (detailFromStore) return <BlockDetail block={detailFromStore} onBack={() => setDetail(null)} />;

  const filtered = statusFilter === "הכל" ? blocks : blocks.filter((b) => b.status === statusFilter);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap size={22} className="text-yellow-500" /> The Blocks
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">קטלוג חוויות המוצר של ARC — {blocks.length} בלוקים</p>
        </div>
        {!creating && (
          <div className="flex items-center gap-2">
            <Link href="/blocks/import"
              className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              <Download size={16} /> ייבוא מהארכיון
            </Link>
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
              <Plus size={16} /> Block חדש
            </button>
          </div>
        )}
      </div>

      {/* New block form */}
      {creating && (
        <div className="mb-6">
          <NewBlockForm
            onSave={(b) => { addBlock(b); setCreating(false); }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(["הכל", ...BLOCK_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s as BlockStatus | "הכל")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              statusFilter === s
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}>
            {s}
            {s !== "הכל" && blocks.filter((b) => b.status === s).length > 0 && (
              <span className={`mr-1.5 text-xs ${statusFilter === s ? "opacity-70" : "text-gray-400"}`}>
                {blocks.filter((b) => b.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <Zap size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">{statusFilter === "הכל" ? "אין Blocks עדיין — צור את הראשון!" : `אין Blocks בסטטוס "${statusFilter}"`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <BlockCard key={b.id} block={b}
              onView={() => setDetail(b)}
              onDelete={() => deleteBlock(b.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
