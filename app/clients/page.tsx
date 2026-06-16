"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, X, ChevronDown, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

type Client = {
  id: string;
  name: string;
  industry: string;
  size: string;
  source: string;
  project_type: string;
  participants: string;
  returned: boolean;
  referred: boolean;
  nps: string;
  quote: string;
  notes: string;
  last_project: string;
  score_positioning: number;
  score_payment: number;
  score_content: number;
};

const emptyClient = (): Omit<Client, "id"> => ({
  name: "",
  industry: "",
  size: "",
  source: "",
  project_type: "",
  participants: "",
  returned: false,
  referred: false,
  nps: "",
  quote: "",
  notes: "",
  last_project: "",
  score_positioning: 5,
  score_payment: 5,
  score_content: 5,
});

// ── Data ───────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "הייטק — תוכנה/SaaS", "הייטק — סייבר", "הייטק — פינטק", "הייטק — ביומד/מדטק",
  "הייטק — AI", "הייטק — אינטרנט/אפליקציות", "הייטק — חומרה/סמיקונדקטור",
  "קרן VC — ישראלית", "קרן VC — בינלאומית", "קרן PE", "אקסלרטור / אינקובטור",
  "פיננסים/בנקאות", "ביטוח", "נדל\"ן", "תקשורת/מדיה", "קמעונאות",
  "תעשייה/ייצור", "בריאות/פארמה", "ייעוץ", "שיווק/פרסום", "משרד עורכי דין",
  "רשות מקומית", "משרד ממשלתי", "בית חולים", "אוניברסיטה/מכללה", "עמותה/קרן",
  "כנס/אירוע חיצוני",
];

const SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];
const SOURCES = ["Referral", "Outbound", "Inbound", "Social Media", "Conference / Event", "Other"];
const PROJECT_TYPES = ["סדנה", "ריטריט", "אופסייט", "תהליך מתמשך", "אחר"];
const NPS_OPTIONS = ["0–6 (מאוכזב)", "7–8 (פסיבי)", "9–10 (ממליץ)"];

// ── Score helpers ──────────────────────────────────────────────────────────

function totalScore(c: Client) {
  return Math.round((c.score_positioning + c.score_payment + c.score_content) / 3);
}

function scoreColor(s: number) {
  if (s >= 8) return "#2d7a4f";
  if (s >= 5) return "#c47c2b";
  return "#b03030";
}

function scoreLabel(s: number) {
  if (s >= 8) return "מצוין";
  if (s >= 5) return "בינוני";
  return "חלש";
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const color = scoreColor(value);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-[#4a2e1b]">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full h-1.5" style={{ accentColor: color }} />
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-[#f5f4f0] border border-black/10 rounded-xl px-4 py-2.5 text-sm text-[#4a2e1b] outline-none focus:border-[#aec6cf] pr-8">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute left-3 top-3 text-[#4a2e1b]/40 pointer-events-none" />
    </div>
  );
}

function ClientModal({ client, onSave, onClose }: {
  client: Partial<Client>;
  onSave: (c: Omit<Client, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Client, "id">>({ ...emptyClient(), ...client });
  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-black/5 flex items-center justify-between z-10">
          <h2 className="font-bold text-[#4a2e1b] text-lg">{client.name ? "עריכת לקוח" : "לקוח חדש"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-5">

          {/* Basic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">שם הארגון</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="לדוגמה: Wix, Bank Hapoalim"
                className="w-full bg-[#f5f4f0] border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#aec6cf]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">תעשייה</label>
              <Select value={form.industry} onChange={v => set("industry", v)} options={INDUSTRIES} placeholder="בחר תעשייה" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">גודל חברה</label>
              <Select value={form.size} onChange={v => set("size", v)} options={SIZES} placeholder="מספר עובדים" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">איך הגיעו</label>
              <Select value={form.source} onChange={v => set("source", v)} options={SOURCES} placeholder="מקור" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">סוג פרויקט</label>
              <Select value={form.project_type} onChange={v => set("project_type", v)} options={PROJECT_TYPES} placeholder="סוג" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">מספר משתתפים</label>
              <input value={form.participants} onChange={e => set("participants", e.target.value)}
                placeholder="לדוגמה: 40"
                className="w-full bg-[#f5f4f0] border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#aec6cf]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">תאריך עבודה אחרונה</label>
              <input type="date" value={form.last_project} onChange={e => set("last_project", e.target.value)}
                className="w-full bg-[#f5f4f0] border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#aec6cf]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">NPS</label>
              <Select value={form.nps} onChange={v => set("nps", v)} options={NPS_OPTIONS} placeholder="שביעות רצון" />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            {[["returned", "חזרו לעבוד איתנו"], ["referred", "הפנו לקוחות אחרים"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form[k as keyof typeof form]}
                  onChange={e => set(k as keyof typeof form, e.target.checked)}
                  className="w-4 h-4 accent-[#4a2e1b]" />
                <span className="text-sm text-[#4a2e1b]">{l}</span>
              </label>
            ))}
          </div>

          {/* Scores */}
          <div className="bg-[#f5f4f0] rounded-xl p-4 space-y-4">
            <p className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider">ציונים</p>
            <ScoreSlider label="השפעה על מיצוב" value={form.score_positioning} onChange={v => set("score_positioning", v)} />
            <ScoreSlider label="כמה שילם" value={form.score_payment} onChange={v => set("score_payment", v)} />
            <ScoreSlider label="תרומה לפיתוח תוכן/חברה" value={form.score_content} onChange={v => set("score_content", v)} />
          </div>

          {/* Text fields */}
          <div>
            <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">ציטוט / המלצה</label>
            <textarea value={form.quote} onChange={e => set("quote", e.target.value)} rows={2}
              placeholder="מה אמרו עלינו..."
              className="w-full bg-[#f5f4f0] border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#aec6cf] resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-[#4a2e1b]/50 uppercase tracking-wider mb-1.5 block">הערות חופשיות</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              placeholder="תובנות, הקשר, מה למדנו..."
              className="w-full bg-[#f5f4f0] border border-black/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#aec6cf] resize-none" />
          </div>

          <button onClick={() => onSave(form)}
            className="w-full py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "#4a2e1b" }}>
            שמור לקוח
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ICP Panel ──────────────────────────────────────────────────────────────

function ICPPanel({ clients }: { clients: Client[] }) {
  if (clients.length < 3) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 text-center">
      <p className="text-2xl mb-2">🧩</p>
      <p className="text-sm font-bold text-[#4a2e1b]">ICP יופיע אחרי 3 לקוחות</p>
      <p className="text-xs text-gray-400 mt-1">יש לך {clients.length} כרגע</p>
    </div>
  );

  const top = [...clients].sort((a, b) => totalScore(b) - totalScore(a)).slice(0, Math.min(3, clients.length));

  const topIndustry = mostCommon(top.map(c => c.industry));
  const topSize = mostCommon(top.map(c => c.size));
  const topSource = mostCommon(top.map(c => c.source));
  const topProject = mostCommon(top.map(c => c.project_type));
  const returnRate = Math.round((clients.filter(c => c.returned).length / clients.length) * 100);
  const referralRate = Math.round((clients.filter(c => c.referred).length / clients.length) * 100);

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "linear-gradient(135deg, #2a1a0e, #4a2e1b)" }}>
      <div className="px-6 py-4 border-b border-white/10">
        <p className="text-[#aec6cf] text-[10px] tracking-widest uppercase mb-0.5">מבוסס על {clients.length} לקוחות</p>
        <h2 className="text-lg font-bold text-white">Ideal Customer Profile</h2>
      </div>
      <div className="p-6 grid grid-cols-2 gap-3">
        {[
          ["תעשייה", topIndustry],
          ["גודל", topSize],
          ["איך הגיעו", topSource],
          ["סוג פרויקט", topProject],
          ["חזרו לעבוד", `${returnRate}%`],
          ["הפנו לקוחות", `${referralRate}%`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white/8 rounded-xl p-3">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-white text-sm font-bold">{value || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function mostCommon(arr: string[]) {
  const filtered = arr.filter(Boolean);
  if (!filtered.length) return "";
  const freq: Record<string, number> = {};
  filtered.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Stats ──────────────────────────────────────────────────────────────────

function StatsBar({ clients }: { clients: Client[] }) {
  if (!clients.length) return null;
  const avg = Math.round(clients.reduce((a, c) => a + totalScore(c), 0) / clients.length);
  const byIndustry = clients.reduce((acc, c) => {
    if (c.industry) acc[c.industry] = (acc[c.industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topIndustry = Object.entries(byIndustry).sort((a, b) => b[1] - a[1])[0];
  const bySource = clients.reduce((acc, c) => {
    if (c.source) acc[c.source] = (acc[c.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: "סה״כ לקוחות", value: clients.length },
        { label: "ציון ממוצע", value: `${avg}/10` },
        { label: "תעשייה מובילה", value: topIndustry?.[0]?.split("—")[1]?.trim() || topIndustry?.[0] || "—" },
        { label: "מקור מוביל", value: topSource?.[0] || "—" },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 text-center">
          <p className="text-2xl font-black text-[#4a2e1b]">{s.value}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [modal, setModal] = useState<Partial<Client> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("clients").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setClients(data); setLoading(false); });
  }, []);

  const saveClient = async (form: Omit<Client, "id">) => {
    if (modal?.id) {
      const { data } = await supabase.from("clients").update(form).eq("id", modal.id).select().single();
      if (data) setClients(c => c.map(x => x.id === modal.id ? data : x));
    } else {
      const { data } = await supabase.from("clients").insert(form).select().single();
      if (data) setClients(c => [data, ...c]);
    }
    setModal(null);
  };

  const deleteClient = async (id: string) => {
    await supabase.from("clients").delete().eq("id", id);
    setClients(c => c.filter(x => x.id !== id));
  };

  return (
    <div dir="rtl" className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#4a2e1b]">ניתוח לקוחות</h1>
          <p className="text-sm text-gray-400 mt-0.5">ICP · ציונים · תובנות</p>
        </div>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "#4a2e1b" }}>
          <Plus size={15} /> לקוח חדש
        </button>
      </div>

      <StatsBar clients={clients} />

      <div className="grid grid-cols-3 gap-6">
        {/* Client list */}
        <div className="col-span-2 space-y-3">
          {loading && <p className="text-sm text-gray-400 text-center py-10">טוען...</p>}
          {!loading && clients.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-black/5">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-sm font-bold text-[#4a2e1b]">אין לקוחות עדיין</p>
              <p className="text-xs text-gray-400 mt-1">לחץ על "לקוח חדש" כדי להתחיל</p>
            </div>
          )}
          {clients.map(c => {
            const score = totalScore(c);
            const color = scoreColor(score);
            return (
              <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: color }}>
                      {score}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#4a2e1b] truncate">{c.name || "ללא שם"}</p>
                      <p className="text-xs text-gray-400 truncate">{c.industry}{c.size ? ` · ${c.size} עובדים` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.returned && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">חזרו</span>}
                    {c.referred && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">הפנו</span>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: color + "15", color }}>
                      {scoreLabel(score)}
                    </span>
                    <button onClick={() => setModal(c)} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[#4a2e1b] text-xs border border-[#4a2e1b]/20 px-2 py-1 rounded-lg transition-opacity">
                      ערוך
                    </button>
                    <button onClick={() => deleteClient(c.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-red-400 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {c.quote && (
                  <p className="mt-2 text-xs text-gray-500 italic border-r-2 border-[#aec6cf] pr-2 mr-12">
                    "{c.quote}"
                  </p>
                )}
                <div className="mt-2 flex gap-3 mr-12">
                  {[
                    ["מיצוב", c.score_positioning],
                    ["תשלום", c.score_payment],
                    ["תוכן", c.score_content],
                  ].map(([l, v]) => (
                    <div key={l as string} className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">{l}</span>
                      <span className="text-[10px] font-bold text-[#4a2e1b]">{v}</span>
                    </div>
                  ))}
                  {c.last_project && (
                    <span className="text-[10px] text-gray-400 mr-auto">עבודה אחרונה: {c.last_project}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ICP */}
        <div>
          <ICPPanel clients={clients} />
        </div>
      </div>

      {modal !== null && (
        <ClientModal client={modal} onSave={saveClient} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
