"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Pencil, ChevronRight, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

type OKR = { id: number; text: string; progress: number };
type Principle = { id: number; title: string; description: string };
type Focus = { id: number; title: string; description: string };
type PeriodData = { okrs: OKR[]; principles: Principle[]; focuses: Focus[] };

function emptyPeriod(): PeriodData {
  return {
    okrs: [{ id: Date.now(), text: "Objective חדש", progress: 0 }],
    principles: [{ id: Date.now() + 1, title: "עקרון ראשון", description: "תאר כאן" }],
    focuses: [{ id: Date.now() + 2, title: "מיקוד ראשון", description: "תאר כאן" }],
  };
}

// Generate periods: H1/H2 for years 2025–2030
const ALL_PERIODS: string[] = [];
for (let y = 2025; y <= 2030; y++) {
  ALL_PERIODS.push(`H1 ${y}`, `H2 ${y}`);
}
const DEFAULT_PERIOD_IDX = ALL_PERIODS.indexOf("H2 2026");

function EditableText({
  value, onSave, className, multiline,
}: { value: string; onSave: (v: string) => void; className?: string; multiline?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing) return (
    <span className={`cursor-pointer group relative ${className}`} onClick={() => { setDraft(value); setEditing(true); }}>
      {value}
      <Pencil size={10} className="inline opacity-0 group-hover:opacity-30 mr-1 mb-0.5" />
    </span>
  );
  return multiline ? (
    <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={() => { onSave(draft); setEditing(false); }}
      className={`bg-transparent border-b border-[#4a2e1b]/30 outline-none resize-none w-full ${className}`} rows={2} />
  ) : (
    <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={() => { onSave(draft); setEditing(false); }}
      onKeyDown={e => { if (e.key === "Enter") { onSave(draft); setEditing(false); } }}
      className={`bg-transparent border-b border-[#4a2e1b]/30 outline-none w-full ${className}`} />
  );
}

function Sidekick({ okrs, principles }: { okrs: OKR[]; principles: Principle[] }) {
  const [clientInfo, setClientInfo] = useState("");
  const [asked, setAsked] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 100%)" }}>
      <div className="px-7 pt-6 pb-4 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="text-white/30 text-[10px] tracking-widest uppercase mb-0.5">ARC</p>
          <h2 className="text-xl font-bold text-white">Sidekick</h2>
        </div>
        <span className="text-[10px] bg-white/10 text-white/50 px-3 py-1 rounded-full">AI · בקרוב</span>
      </div>
      <div className="p-7 grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">OKRs פעילים</p>
            <div className="space-y-1.5">
              {okrs.map((o, i) => (
                <div key={o.id} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/10 text-white/50 text-[9px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                  <p className="text-white/60 text-xs truncate">{o.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">עקרונות</p>
            <div className="flex flex-wrap gap-1.5">
              {principles.map(p => (
                <span key={p.id} className="text-[10px] bg-white/10 text-white/50 px-2.5 py-1 rounded-full">{p.title}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">ספר על הלקוח</p>
            <textarea
              value={clientInfo}
              onChange={e => { setClientInfo(e.target.value); setAsked(false); }}
              placeholder="מי הם? מה הם מחפשים? מה הסיטואציה?"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/25 resize-none transition-colors"
            />
          </div>
          <button
            onClick={() => setAsked(true)}
            disabled={!clientInfo.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
            style={{ background: "#aec6cf", color: "#1a1a2e" }}
          >
            תן לי המלצה
          </button>
          {asked && (
            <div className="rounded-xl p-4 border border-white/10 bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#aec6cf] animate-pulse" />
                <p className="text-[#aec6cf] text-xs font-semibold">ממתין לחיבור AI</p>
              </div>
              <p className="text-white/30 text-xs leading-relaxed">
                כאן תופיע המלצה מנומקת שתתבסס על ה-OKRs, העקרונות והמידע שהכנסת — ברגע שנחבר את ה-API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const [periodIdx, setPeriodIdx] = useState(DEFAULT_PERIOD_IDX);
  const [allData, setAllData] = useState<Record<string, PeriodData>>({});
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const period = ALL_PERIODS[periodIdx];
  const data: PeriodData = allData[period] ?? emptyPeriod();

  // Load from Supabase when period changes
  useEffect(() => {
    if (allData[period]) return; // already loaded
    supabase
      .from("strategy_periods")
      .select("okrs, principles, focuses")
      .eq("period", period)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) {
          setAllData(d => ({ ...d, [period]: row as PeriodData }));
        }
      });
  }, [period]);

  // Debounced save to Supabase
  const saveToSupabase = useCallback((p: string, d: PeriodData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth session:", session?.user?.email ?? "NOT LOGGED IN");
      const { error } = await supabase.from("strategy_periods").upsert(
        { period: p, okrs: d.okrs, principles: d.principles, focuses: d.focuses, updated_at: new Date().toISOString() },
        { onConflict: "period" }
      );
      if (error) console.error("Strategy save error:", error.message, error.code);
      setSaving(false);
    }, 800);
  }, []);

  const setData = (patch: Partial<PeriodData>) => {
    const next = { ...data, ...patch };
    setAllData(d => ({ ...d, [period]: next }));
    saveToSupabase(period, next);
  };

  const okrs = data.okrs;
  const principles = data.principles;
  const focuses = data.focuses;

  const setOkrs = (fn: (o: OKR[]) => OKR[]) => setData({ okrs: fn(okrs) });
  const setPrinciples = (fn: (p: Principle[]) => Principle[]) => setData({ principles: fn(principles) });
  const setFocuses = (fn: (f: Focus[]) => Focus[]) => setData({ focuses: fn(focuses) });

  const addOkr = () => {
    if (okrs.length >= 5) return;
    setOkrs(o => [...o, { id: Date.now(), text: "Objective חדש", progress: 0 }]);
  };
  const removeOkr = (id: number) => setOkrs(o => o.filter(x => x.id !== id));
  const updateOkr = (id: number, patch: Partial<OKR>) => setOkrs(o => o.map(x => x.id === id ? { ...x, ...patch } : x));

  const addPrinciple = () => setPrinciples(p => [...p, { id: Date.now(), title: "עקרון חדש", description: "תאר כאן" }]);
  const removePrinciple = (id: number) => setPrinciples(p => p.filter(x => x.id !== id));
  const updatePrinciple = (id: number, patch: Partial<Principle>) => setPrinciples(p => p.map(x => x.id === id ? { ...x, ...patch } : x));

  const addFocus = () => setFocuses(f => [...f, { id: Date.now(), title: "מיקוד חדש", description: "תאר כאן" }]);
  const removeFocus = (id: number) => setFocuses(f => f.filter(x => x.id !== id));
  const updateFocus = (id: number, patch: Partial<Focus>) => setFocuses(f => f.map(x => x.id === id ? { ...x, ...patch } : x));

  const avgProgress = okrs.length ? Math.round(okrs.reduce((a, o) => a + o.progress, 0) / okrs.length) : 0;

  const PRINCIPLE_COLORS = ["#4a2e1b", "#2d4a3e", "#3a2d5e", "#5e3a2d", "#2d4a4a"];

  return (
    <div dir="rtl" className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl px-8 py-6 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #2a1a0e, #4a2e1b)" }}>
        <div>
          <p className="text-[#aec6cf] text-xs tracking-widest uppercase mb-1">
            ניהול אסטרטגי{saving && <span className="mr-2 opacity-60">· שומר...</span>}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <button onClick={() => setPeriodIdx(i => Math.max(0, i - 1))} disabled={periodIdx === 0}
              className="text-white/40 hover:text-white disabled:opacity-20 transition-colors">
              <ChevronRight size={20} />
            </button>
            <h1 className="text-3xl font-bold text-white w-32 text-center">{period}</h1>
            <button onClick={() => setPeriodIdx(i => Math.min(ALL_PERIODS.length - 1, i + 1))} disabled={periodIdx === ALL_PERIODS.length - 1}
              className="text-white/40 hover:text-white disabled:opacity-20 transition-colors">
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>
        <div className="text-center">
          <p className="text-white/30 text-xs mb-0.5">התקדמות כוללת</p>
          <p className="text-4xl font-black text-[#aec6cf]">{avgProgress}%</p>
        </div>
      </div>

      {/* OKRs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[#4a2e1b]/40 tracking-widest uppercase">OKRs</h2>
          {okrs.length < 5 && (
            <button onClick={addOkr} className="flex items-center gap-1 text-xs text-[#4a2e1b]/50 hover:text-[#4a2e1b] transition-colors">
              <Plus size={12} /> הוסף OKR
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3">
          {okrs.map((okr, i) => {
            const r = Math.round(220 - (okr.progress / 100) * (220 - 80));
            const g = Math.round(80 + (okr.progress / 100) * (180 - 80));
            const b = Math.round(80 - (okr.progress / 100) * 30);
            const color = `rgb(${r},${g},${b})`;
            return (
            <div key={okr.id} className="group rounded-2xl p-4 shadow-sm border transition-colors duration-500"
              style={{ background: `rgba(${r},${g},${b},0.07)`, borderColor: `rgba(${r},${g},${b},0.25)` }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors duration-500" style={{ background: color }}>{i + 1}</span>
                <EditableText
                  value={okr.text}
                  onSave={v => updateOkr(okr.id, { text: v })}
                  className="flex-1 text-sm font-medium text-[#4a2e1b]"
                />
                <span className="text-xs font-bold w-8 text-left shrink-0 transition-colors duration-500" style={{ color }}>{okr.progress}%</span>
                <button onClick={() => removeOkr(okr.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center gap-3 pr-8">
                <input
                  type="range" min={0} max={100} step={5}
                  value={okr.progress}
                  onChange={e => updateOkr(okr.id, { progress: +e.target.value })}
                  className="flex-1 h-1.5"
                  style={{ accentColor: color }}
                />
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Principles + Focuses side by side */}
      <div className="grid grid-cols-2 gap-6">

        {/* Principles */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-[#4a2e1b]/40 tracking-widest uppercase">עקרונות</h2>
            <button onClick={addPrinciple} className="flex items-center gap-1 text-xs text-[#4a2e1b]/50 hover:text-[#4a2e1b] transition-colors">
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {principles.map((p, i) => (
              <div key={p.id} className="group rounded-xl p-3 flex items-start gap-3" style={{ background: PRINCIPLE_COLORS[i % PRINCIPLE_COLORS.length] + "12" }}>
                <div className="flex-1 min-w-0">
                  <EditableText
                    value={p.title}
                    onSave={v => updatePrinciple(p.id, { title: v })}
                    className="text-sm font-bold text-[#4a2e1b] block w-full"
                  />
                  <EditableText
                    value={p.description}
                    onSave={v => updatePrinciple(p.id, { description: v })}
                    className="text-xs text-gray-500 block w-full mt-0.5"
                    multiline
                  />
                </div>
                <button onClick={() => removePrinciple(p.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-red-400 shrink-0 mt-0.5">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Focuses */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-[#4a2e1b]/40 tracking-widest uppercase">מיקודים</h2>
            <button onClick={addFocus} className="flex items-center gap-1 text-xs text-[#4a2e1b]/50 hover:text-[#4a2e1b] transition-colors">
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {focuses.map((f) => (
              <div key={f.id} className="group rounded-xl p-3 bg-[#aec6cf]/10 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <EditableText
                    value={f.title}
                    onSave={v => updateFocus(f.id, { title: v })}
                    className="text-sm font-bold text-[#4a2e1b] block w-full"
                  />
                  <EditableText
                    value={f.description}
                    onSave={v => updateFocus(f.id, { description: v })}
                    className="text-xs text-gray-500 block w-full mt-0.5"
                    multiline
                  />
                </div>
                <button onClick={() => removeFocus(f.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-red-400 shrink-0 mt-0.5">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sidekick */}
      <Sidekick okrs={okrs} principles={principles} />

    </div>
  );
}

