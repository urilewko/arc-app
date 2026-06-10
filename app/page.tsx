"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { TrendingUp, FolderOpen, ChevronRight, ChevronLeft, Users, Zap, BookOpen, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addWeeks, addMonths, subMonths, subWeeks, subDays,
  isSameDay, isSameMonth, parseISO, isValid,
} from "date-fns";
import { he } from "date-fns/locale";

type CalView = "day" | "week" | "month";

interface CalEvent {
  date: Date;
  label: string;
  type: "פרויקט" | "ליד" | "תשתית";
}

const TYPE_COLORS: Record<string, string> = {
  פרויקט: "bg-emerald-100 text-emerald-700",
  ליד:    "bg-[#aec6cf]/40 text-[#4a6b73]",
  תשתית:  "bg-purple-100 text-purple-700",
};
const TYPE_DOT: Record<string, string> = {
  פרויקט: "bg-emerald-500",
  ליד:    "bg-[#aec6cf]",
  תשתית:  "bg-purple-400",
};

function safeDate(str: string): Date | null {
  if (!str) return null;
  const d = parseISO(str);
  return isValid(d) ? d : null;
}

// ── Stat card ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, subAlert, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; subAlert?: boolean;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4 border border-gray-100">
      <div className={`p-2.5 rounded-xl ${accent} shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-gray-800 leading-tight">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub && (
          <div className={`text-xs mt-1 flex items-center gap-1 ${subAlert ? "text-orange-500" : "text-gray-400"}`}>
            {subAlert && <AlertCircle size={11} />}{sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

type FinancePeriod = "h1" | "h2" | "year";

function blockColor(pct: number): string {
  if (pct <= 20) return "bg-red-400";
  if (pct <= 40) return "bg-orange-400";
  if (pct <= 60) return "bg-yellow-400";
  if (pct <= 80) return "bg-lime-400";
  return "bg-emerald-500";
}

export default function Dashboard() {
  const { leads, projects, debriefs, blocks, collaborators } = useStore();
  const [calView, setCalView] = useState<CalView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [financePeriod, setFinancePeriod] = useState<FinancePeriod>("h2");
  const [financeYear, setFinanceYear] = useState<number>(2026);

  const activeProjects = projects.filter((p) => p.productionStatus !== "בוצע");
  const openLeads = leads.filter((l) => !["נסגר", "נפל"].includes(l.status));
  const pipelineRevenue = openLeads.reduce((s, l) => s + (l.dealValue || 0), 0);       // leads
  const expectedRevenue = activeProjects.reduce((s, p) => s + (p.price || 0), 0);      // active projects
  const urgentLeads = openLeads.filter((l) => {
    if (!l.dueDate) return false;
    return Math.ceil((new Date(l.dueDate).getTime() - Date.now()) / 86400000) <= 3;
  });

  function inPeriod(dateStr: string): boolean {
    const date = safeDate(dateStr);
    if (!date) return false;
    if (date.getFullYear() !== financeYear) return false;
    if (financePeriod === "h1") return date.getMonth() < 6;
    if (financePeriod === "h2") return date.getMonth() >= 6;
    return true;
  }

  // Actual income = only paid finance records
  const { financeRecords, infraProjects } = useStore();
  const paidRecords = useMemo(
    () => financeRecords.filter((r) => (!r.recordType || r.recordType === "income") && r.paymentStatus === "שולם במלואו" && inPeriod(r.paidDate || r.invoiceDate || r.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [financeRecords, financePeriod, financeYear]
  );
  const totalIncome = paidRecords.reduce((s, r) => s + r.amount, 0);

  // All expenses from all sources in period
  const totalExpenses = useMemo(() => {
    const fromDebriefs  = debriefs.filter((d) => inPeriod(d.eventDate || d.createdAt)).flatMap((d) => d.expenses || []).reduce((s, e) => s + e.amount, 0);
    const fromInfra     = infraProjects.flatMap((p) => (p.expenses || []).filter((e) => inPeriod(e.date || "2099"))).reduce((s, e) => s + e.amount, 0);
    const fromBlocks    = blocks.flatMap((b) => (b.expenses || []).filter((e) => inPeriod(e.date || "2099"))).reduce((s, e) => s + e.amount, 0);
    const fromGeneral   = financeRecords.filter((r) => r.recordType === "expense" && inPeriod(r.invoiceDate || r.createdAt)).reduce((s, r) => s + r.amount, 0);
    return fromDebriefs + fromInfra + fromBlocks + fromGeneral;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debriefs, infraProjects, blocks, financeRecords, financePeriod, financeYear]);

  const totalProfit = totalIncome - totalExpenses;

  const projectsWithoutDebrief = projects.filter(
    (p) => p.productionStatus === "בוצע" && !debriefs.find((d) => d.projectId === p.id)
  );

  const revenueData = useMemo(() => {
    // Build list of months based on selected period/year
    const monthIndices = financePeriod === "h1" ? [0,1,2,3,4,5]
                       : financePeriod === "h2" ? [6,7,8,9,10,11]
                       : [0,1,2,3,4,5,6,7,8,9,10,11];
    return monthIndices.map((monthIdx) => {
      const m = new Date(financeYear, monthIdx, 1);
      const label = format(m, "MMM", { locale: he });
      const expected = projects
        .filter((p) => { const d = safeDate(p.startDate); return p.productionStatus !== "בוצע" && d && isSameMonth(d, m); })
        .reduce((s, p) => s + (p.price || 0), 0);
      const actual = financeRecords
        .filter((r) => { const d = safeDate(r.paidDate || r.invoiceDate); return (!r.recordType || r.recordType === "income") && r.paymentStatus === "שולם במלואו" && d && isSameMonth(d, m); })
        .reduce((s, r) => s + r.amount, 0);
      const expD = debriefs.filter((d) => { const date = safeDate(d.eventDate); return date && isSameMonth(date, m); }).flatMap((d) => d.expenses || []).reduce((s, e) => s + e.amount, 0);
      const expI = infraProjects.flatMap((p) => (p.expenses||[]).filter((e) => { const d = safeDate(e.date||""); return d && isSameMonth(d, m); })).reduce((s, e) => s + e.amount, 0);
      const expB = blocks.flatMap((b) => (b.expenses||[]).filter((e) => { const d = safeDate(e.date||""); return d && isSameMonth(d, m); })).reduce((s, e) => s + e.amount, 0);
      const expG = financeRecords.filter((r) => { const d = safeDate(r.invoiceDate); return r.recordType === "expense" && d && isSameMonth(d, m); }).reduce((s, r) => s + r.amount, 0);
      const expenses = expD + expI + expB + expG;
      return { month: label, "הכנסה צפויה": expected, "בפועל": actual, הוצאות: expenses, רווח: actual - expenses };
    });
  }, [projects, debriefs, financeRecords, infraProjects, blocks, financePeriod, financeYear]);

  const allEvents: CalEvent[] = useMemo(() => {
    const evs: CalEvent[] = [];
    projects.forEach((p) => { const d = safeDate(p.startDate); if (d) evs.push({ date: d, label: p.orgName, type: "פרויקט" }); });
    leads.forEach((l) => {
      const d = safeDate(l.dueDate); if (d) evs.push({ date: d, label: `${l.orgName} — ${l.nextAction}`, type: "ליד" });
      const a = safeDate(l.activityDate); if (a) evs.push({ date: a, label: `${l.orgName} (פעילות)`, type: "פרויקט" });
    });
    infraProjects.forEach((p) => { const d = safeDate(p.dueDate); if (d) evs.push({ date: d, label: p.name, type: "תשתית" }); });
    return evs;
  }, [projects, leads, infraProjects]);

  const eventsOn = (day: Date) => allEvents.filter((e) => isSameDay(e.date, day));

  const prev = () => {
    if (calView === "month") setCursor(subMonths(cursor, 1));
    else if (calView === "week") setCursor(subWeeks(cursor, 1));
    else setCursor(subDays(cursor, 1));
  };
  const next = () => {
    if (calView === "month") setCursor(addMonths(cursor, 1));
    else if (calView === "week") setCursor(addWeeks(cursor, 1));
    else setCursor(addDays(cursor, 1));
  };
  const navLabel = () => {
    if (calView === "month") return format(cursor, "MMMM yyyy", { locale: he });
    if (calView === "week") {
      const s = startOfWeek(cursor, { weekStartsOn: 0 });
      const e = endOfWeek(cursor, { weekStartsOn: 0 });
      return `${format(s, "d MMM", { locale: he })} — ${format(e, "d MMM yyyy", { locale: he })}`;
    }
    return format(cursor, "EEEE, d MMMM yyyy", { locale: he });
  };

  const PERIOD_LABELS: Record<FinancePeriod, string> = { h1: "1/2", h2: "2/2", year: "שנה" };
  const YEAR_OPTIONS = [2025, 2026, 2027];

  const MonthGrid = () => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return (
      <div>
        <div className="grid grid-cols-7 mb-2">
          {["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"].map((n) => (
            <div key={n} className="text-center text-xs font-medium text-gray-400 py-1">{n}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
            const evs = eventsOn(day);
            return (
              <div key={i} className={`min-h-[76px] p-1.5 ${inMonth ? "bg-white" : "bg-gray-50/60"}`}>
                <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? "bg-[#4a2e1b] text-white" : inMonth ? "text-gray-700" : "text-gray-300"
                }`}>{format(day, "d")}</div>
                <div className="space-y-0.5">
                  {evs.slice(0, 2).map((e, j) => (
                    <div key={j} className={`text-[10px] px-1 py-0.5 rounded truncate ${TYPE_COLORS[e.type]}`}>{e.label}</div>
                  ))}
                  {evs.length > 2 && <div className="text-[10px] text-gray-400">+{evs.length - 2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const WeekView = () => {
    const start = startOfWeek(cursor, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const evs = eventsOn(day);
          return (
            <div key={i} className="min-h-[140px]">
              <div className={`text-center text-xs font-medium py-1.5 rounded-xl mb-2 ${
                isToday ? "bg-[#4a2e1b] text-white" : "bg-gray-100 text-gray-600"
              }`}>
                <div>{["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"][i]}</div>
                <div className="text-base font-bold">{format(day, "d")}</div>
              </div>
              <div className="space-y-1">
                {evs.map((e, j) => (
                  <div key={j} className={`text-[11px] px-1.5 py-1 rounded truncate ${TYPE_COLORS[e.type]}`}>{e.label}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const DayView = () => {
    const evs = eventsOn(cursor);
    return evs.length === 0 ? (
      <p className="text-gray-400 text-sm text-center py-10">אין אירועים היום</p>
    ) : (
      <div className="space-y-2">
        {evs.map((e, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${TYPE_COLORS[e.type]}`}>
            <div className={`w-2 h-2 rounded-full ${TYPE_DOT[e.type]}`} />
            <span className="text-sm font-medium">{e.label}</span>
            <span className="text-xs opacity-60 mr-auto">{e.type}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-7">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">דאשבורד</h1>
            <p className="text-sm text-gray-400 mt-0.5">{format(new Date(), "EEEE, d MMMM yyyy", { locale: he })}</p>
          </div>
          {urgentLeads.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2 rounded-xl">
              <AlertCircle size={15} />
              {urgentLeads.length} לידים דחופים
            </div>
          )}
        </div>
      </div>

      {/* ── Row 1: Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="פרויקטים פעילים" value={activeProjects.length} icon={FolderOpen}
          accent="bg-[#aec6cf]" />
        <StatCard label="לידים פתוחים" value={openLeads.length}
          sub={urgentLeads.length > 0 ? `${urgentLeads.length} דחופים` : undefined}
          subAlert={urgentLeads.length > 0}
          icon={TrendingUp} accent="bg-[#4a2e1b]" />
        <StatCard label="שימור ידע"
          value={`${debriefs.length}/${projects.length}`}
          sub={projectsWithoutDebrief.length > 0 ? `${projectsWithoutDebrief.length} ממתינים לתחקיר` : "הכל מתוחקר ✓"}
          subAlert={projectsWithoutDebrief.length > 0}
          icon={BookOpen} accent="bg-purple-500" />
        <StatCard label="אנשים ברשת" value={collaborators.length} icon={Users} accent="bg-teal-500" />
      </div>

      {/* ── Row 2: Blocks ── */}
      <Section title="The Blocks — סטטוס התקדמות"
        action={<a href="/blocks" className="text-xs text-[#4a2e1b] hover:underline">לכל הבלוקים ←</a>}>
        {blocks.length === 0 ? (
          <p className="text-sm text-gray-400">אין Blocks עדיין.</p>
        ) : (
          <>
            <div className="flex gap-4 flex-wrap">
              {blocks.map((b) => {
                const pct = b.completionPercent || 0;
                return (
                  <div key={b.id} className="flex flex-col items-center gap-2 w-20 group">
                    <div className="w-full relative">
                      <div className={`w-full h-14 rounded-xl ${blockColor(pct)} flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm drop-shadow-sm">{pct}%</span>
                      </div>
                      {/* Progress underbar */}
                      <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${blockColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 text-center leading-tight">{b.name}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-5 mt-5 pt-4 border-t border-gray-50 flex-wrap">
              {[
                { label: "0–20%", color: "bg-red-400" },
                { label: "21–40%", color: "bg-orange-400" },
                { label: "41–60%", color: "bg-yellow-400" },
                { label: "61–80%", color: "bg-lime-400" },
                { label: "81–100%", color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* ── Period selector — shared for summary + chart ── */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium text-gray-500">תקופה:</span>
        <select value={financeYear} onChange={(e) => setFinanceYear(Number(e.target.value))}
          className="border rounded-lg px-2.5 py-1.5 text-sm bg-white text-gray-700 focus:outline-none shadow-sm">
          {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm shadow-sm">
          {(Object.keys(PERIOD_LABELS) as FinancePeriod[]).map((p) => (
            <button key={p} onClick={() => setFinancePeriod(p)}
              className={`px-3 py-1.5 transition-colors ${financePeriod === p ? "bg-[#4a2e1b] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 3: Financial summary ── */}
      <Section title="נתונים כספיים">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "הכנסה בפועל",     value: totalIncome,     color: "text-emerald-600", bg: "bg-emerald-50"  },
            { label: "הכנסה צפויה",     value: expectedRevenue, color: "text-blue-600",    bg: "bg-blue-50"     },
            { label: "הוצאות",          value: totalExpenses,   color: "text-red-500",     bg: "bg-red-50"      },
            { label: "רווח בפועל",      value: totalProfit,     color: totalProfit >= 0 ? "text-emerald-700" : "text-red-600", bg: totalProfit >= 0 ? "bg-emerald-50" : "bg-red-50" },
            { label: "פוטנציאל צינור",  value: pipelineRevenue, color: "text-orange-500",  bg: "bg-orange-50"   },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
              <div className={`text-2xl font-bold ${item.color}`}>₪{item.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Row 4: Revenue chart ── */}
      <Section
        title={`גרף פיננסי — ${PERIOD_LABELS[financePeriod]} ${financeYear}`}
        action={
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#aec6cf] inline-block"/> צפויה</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#4a2e1b] inline-block"/> בפועל</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block"/> הוצאות</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"/> רווח</span>
          </div>
        }>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueData} barSize={12} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(v) => v === 0 ? "0" : `₪${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => `₪${Number(v).toLocaleString()}`}
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 13 }} />
            <Bar dataKey="הכנסה צפויה" fill="#aec6cf" radius={[4, 4, 0, 0]} />
            <Bar dataKey="בפועל" fill="#4a2e1b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="הוצאות" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="רווח" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Row 5: Calendar ── */}
      <Section
        title="לוח שנה"
        action={
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg overflow-hidden text-xs">
              {(["month", "week", "day"] as CalView[]).map((v) => (
                <button key={v} onClick={() => setCalView(v)}
                  className={`px-3 py-1.5 transition-colors ${calView === v ? "bg-[#4a2e1b] text-white" : "text-gray-500 hover:bg-gray-200"}`}>
                  {v === "month" ? "חודש" : v === "week" ? "שבוע" : "יום"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prev} className="p-1 rounded-lg hover:bg-gray-100"><ChevronRight size={16} /></button>
              <span className="text-xs font-medium min-w-[140px] text-center text-gray-600">{navLabel()}</span>
              <button onClick={next} className="p-1 rounded-lg hover:bg-gray-100"><ChevronLeft size={16} /></button>
            </div>
          </div>
        }>
        {calView === "month" && <MonthGrid />}
        {calView === "week" && <WeekView />}
        {calView === "day" && <DayView />}
        <div className="flex gap-5 mt-4 pt-3 border-t border-gray-50">
          {Object.entries(TYPE_DOT).map(([type, dot]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className={`w-2 h-2 rounded-full ${dot}`} /> {type}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
