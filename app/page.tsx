"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { TrendingUp, FolderOpen, ChevronRight, ChevronLeft, Users, BookOpen, AlertCircle, ExternalLink, CalendarDays, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addWeeks, addMonths, subMonths, subWeeks, subDays,
  isSameDay, isSameMonth, parseISO, isValid,
} from "date-fns";
import { he } from "date-fns/locale";

type CalView = "day" | "week" | "month";
interface CalEvent { date: Date; label: string; type: "פרויקט" | "ליד" | "תשתית"; href: string; }
type FinancePeriod = "h1" | "h2" | "year";

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  פרויקט: { bg: "bg-emerald-500", text: "text-white" },
  ליד:    { bg: "bg-cyan-500",    text: "text-white" },
  תשתית:  { bg: "bg-violet-500",  text: "text-white" },
};

function safeDate(str: string): Date | null {
  if (!str) return null;
  const d = parseISO(str);
  return isValid(d) ? d : null;
}

function blockColor(pct: number) {
  if (pct <= 20) return { bg: "#ef4444", glow: "rgba(239,68,68,0.4)", label: "#fca5a5" };
  if (pct <= 40) return { bg: "#f97316", glow: "rgba(249,115,22,0.4)", label: "#fdba74" };
  if (pct <= 60) return { bg: "#eab308", glow: "rgba(234,179,8,0.4)", label: "#fde047" };
  if (pct <= 80) return { bg: "#84cc16", glow: "rgba(132,204,22,0.4)", label: "#bef264" };
  return { bg: "#10b981", glow: "rgba(16,185,129,0.4)", label: "#6ee7b7" };
}

function StatCard({ label, value, sub, subAlert, icon: Icon, color, href }: {
  label: string; value: string | number; sub?: string; subAlert?: boolean;
  icon: React.ElementType; color: string; href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="relative rounded-2xl p-5 overflow-hidden border cursor-pointer transition-transform hover:scale-[1.02]"
        style={{ background: "rgba(255,255,255,0.03)", borderColor: color + "40" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 50%, ${color}, transparent 70%)` }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl" style={{ background: color + "20", border: `1px solid ${color}40` }}>
              <Icon size={16} style={{ color }} />
            </div>
            {subAlert && <AlertCircle size={14} style={{ color: "#f97316" }} />}
          </div>
          <div className="text-3xl font-black text-white mb-1">{value}</div>
          <div className="text-xs font-medium" style={{ color: color + "cc" }}>{label}</div>
          {sub && <div className={`text-xs mt-1 ${subAlert ? "text-orange-400" : "text-white/30"}`}>{sub}</div>}
        </div>
      </div>
    </Link>
  );
}

function Panel({ title, children, action, className }: {
  title: string; children: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-white/8 ${className}`}
      style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
        <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { leads, projects, debriefs, blocks, collaborators, financeRecords, infraProjects } = useStore();
  const [calView, setCalView] = useState<CalView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    fetch("/api/calendar/sync").then(r => r.json()).then(d => setGcalConnected(d.connected)).catch(() => setGcalConnected(false));
  }, []);

  const connectGoogle = useCallback(() => {
    window.open("/api/auth/google", "_blank", "width=500,height=600");
    const timer = setInterval(() => {
      fetch("/api/calendar/sync").then(r => r.json()).then(d => {
        if (d.connected) { setGcalConnected(true); clearInterval(timer); }
      });
    }, 2000);
    setTimeout(() => clearInterval(timer), 60000);
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true); setSyncMsg("");
    const res = await fetch("/api/calendar/sync", { method: "POST" });
    const data = await res.json();
    setSyncMsg(data.error ? `שגיאה: ${data.error}` : `✓ סונכרנו ${data.added} אירועים`);
    setSyncing(false);
  }, []);
  const [financePeriod, setFinancePeriod] = useState<FinancePeriod>("h2");
  const [financeYear, setFinanceYear] = useState<number>(2026);

  const activeProjects = projects.filter((p) => p.productionStatus !== "בוצע");
  const openLeads = leads.filter((l) => !["נסגר", "נפל"].includes(l.status));
  const pipelineRevenue = openLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
  const expectedRevenue = activeProjects.reduce((s, p) => s + (p.price || 0), 0);
  const urgentLeads = openLeads.filter((l) => {
    if (!l.dueDate) return false;
    return Math.ceil((new Date(l.dueDate).getTime() - Date.now()) / 86400000) <= 3;
  });
  const projectsWithoutDebrief = projects.filter(
    (p) => p.productionStatus === "בוצע" && !debriefs.find((d) => d.projectId === p.id)
  );

  function inPeriod(dateStr: string): boolean {
    const date = safeDate(dateStr);
    if (!date) return false;
    if (date.getFullYear() !== financeYear) return false;
    if (financePeriod === "h1") return date.getMonth() < 6;
    if (financePeriod === "h2") return date.getMonth() >= 6;
    return true;
  }

  const paidRecords = useMemo(
    () => financeRecords.filter((r) => (!r.recordType || r.recordType === "income") && r.paymentStatus === "שולם במלואו" && inPeriod(r.paidDate || r.invoiceDate || r.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [financeRecords, financePeriod, financeYear]
  );
  const totalIncome = paidRecords.reduce((s, r) => s + r.amount, 0);

  const totalExpenses = useMemo(() => {
    const fromDebriefs = debriefs.filter((d) => inPeriod(d.eventDate || d.createdAt)).flatMap((d) => d.expenses || []).reduce((s, e) => s + e.amount, 0);
    const fromInfra = infraProjects.flatMap((p) => (p.expenses || []).filter((e) => inPeriod(e.date || "2099"))).reduce((s, e) => s + e.amount, 0);
    const fromBlocks = blocks.flatMap((b) => (b.expenses || []).filter((e) => inPeriod(e.date || "2099"))).reduce((s, e) => s + e.amount, 0);
    const fromGeneral = financeRecords.filter((r) => r.recordType === "expense" && inPeriod(r.invoiceDate || r.createdAt)).reduce((s, r) => s + r.amount, 0);
    return fromDebriefs + fromInfra + fromBlocks + fromGeneral;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debriefs, infraProjects, blocks, financeRecords, financePeriod, financeYear]);

  const totalProfit = totalIncome - totalExpenses;

  const revenueData = useMemo(() => {
    const monthIndices = financePeriod === "h1" ? [0,1,2,3,4,5]
      : financePeriod === "h2" ? [6,7,8,9,10,11]
      : [0,1,2,3,4,5,6,7,8,9,10,11];
    return monthIndices.map((monthIdx) => {
      const m = new Date(financeYear, monthIdx, 1);
      const label = format(m, "MMM", { locale: he });
      const expected = projects.filter((p) => { const d = safeDate(p.startDate); return p.productionStatus !== "בוצע" && d && isSameMonth(d, m); }).reduce((s, p) => s + (p.price || 0), 0);
      const actual = financeRecords.filter((r) => { const d = safeDate(r.paidDate || r.invoiceDate); return (!r.recordType || r.recordType === "income") && r.paymentStatus === "שולם במלואו" && d && isSameMonth(d, m); }).reduce((s, r) => s + r.amount, 0);
      const expD = debriefs.filter((d) => { const date = safeDate(d.eventDate); return date && isSameMonth(date, m); }).flatMap((d) => d.expenses || []).reduce((s, e) => s + e.amount, 0);
      const expI = infraProjects.flatMap((p) => (p.expenses||[]).filter((e) => { const d = safeDate(e.date||""); return d && isSameMonth(d, m); })).reduce((s, e) => s + e.amount, 0);
      const expB = blocks.flatMap((b) => (b.expenses||[]).filter((e) => { const d = safeDate(e.date||""); return d && isSameMonth(d, m); })).reduce((s, e) => s + e.amount, 0);
      const expG = financeRecords.filter((r) => { const d = safeDate(r.invoiceDate); return r.recordType === "expense" && d && isSameMonth(d, m); }).reduce((s, r) => s + r.amount, 0);
      const expenses = expD + expI + expB + expG;
      return { month: label, "צפויה": expected, "בפועל": actual, "הוצאות": expenses, "רווח": actual - expenses };
    });
  }, [projects, debriefs, financeRecords, infraProjects, blocks, financePeriod, financeYear]);

  const allEvents: CalEvent[] = useMemo(() => {
    const evs: CalEvent[] = [];
    projects.forEach((p) => { const d = safeDate(p.startDate); if (d) evs.push({ date: d, label: p.orgName, type: "פרויקט", href: "/projects" }); });
    leads.forEach((l) => {
      const d = safeDate(l.dueDate); if (d) evs.push({ date: d, label: `${l.orgName} — ${l.nextAction}`, type: "ליד", href: "/leads" });
      const a = safeDate(l.activityDate); if (a) evs.push({ date: a, label: `${l.orgName} (פעילות)`, type: "פרויקט", href: "/leads" });
    });
    infraProjects.forEach((p) => { const d = safeDate(p.dueDate); if (d) evs.push({ date: d, label: p.name, type: "תשתית", href: "/infra" }); });
    return evs;
  }, [projects, leads, infraProjects]);

  const eventsOn = (day: Date) => allEvents.filter((e) => isSameDay(e.date, day));
  const prev = () => { if (calView === "month") setCursor(subMonths(cursor, 1)); else if (calView === "week") setCursor(subWeeks(cursor, 1)); else setCursor(subDays(cursor, 1)); };
  const next = () => { if (calView === "month") setCursor(addMonths(cursor, 1)); else if (calView === "week") setCursor(addWeeks(cursor, 1)); else setCursor(addDays(cursor, 1)); };
  const navLabel = () => {
    if (calView === "month") return format(cursor, "MMMM yyyy", { locale: he });
    if (calView === "week") { const s = startOfWeek(cursor, { weekStartsOn: 0 }); const e = endOfWeek(cursor, { weekStartsOn: 0 }); return `${format(s, "d MMM", { locale: he })} — ${format(e, "d MMM yyyy", { locale: he })}`; }
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
            <div key={n} className="text-center text-[10px] font-medium text-white/30 py-1">{n}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
            const evs = eventsOn(day);
            return (
              <div key={i} className="min-h-[70px] p-1.5" style={{ background: inMonth ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.2)" }}>
                <div className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? "bg-cyan-500 text-black" : inMonth ? "text-white/60" : "text-white/15"
                }`}>{format(day, "d")}</div>
                <div className="space-y-0.5">
                  {evs.slice(0, 2).map((e, j) => (
                    <Link key={j} href={e.href}>
                      <div className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${TYPE_STYLE[e.type].bg} ${TYPE_STYLE[e.type].text}`}>{e.label}</div>
                    </Link>
                  ))}
                  {evs.length > 2 && <div className="text-[9px] text-white/30">+{evs.length - 2}</div>}
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
            <div key={i} className="min-h-[120px]">
              <div className={`text-center text-xs py-1.5 rounded-xl mb-2 ${isToday ? "bg-cyan-500 text-black font-bold" : "text-white/40"}`} style={{ background: isToday ? undefined : "rgba(255,255,255,0.05)" }}>
                <div>{["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"][i]}</div>
                <div className="font-bold">{format(day, "d")}</div>
              </div>
              <div className="space-y-1">
                {evs.map((e, j) => (
                  <Link key={j} href={e.href}>
                    <div className={`text-[10px] px-1.5 py-1 rounded truncate font-medium ${TYPE_STYLE[e.type].bg} ${TYPE_STYLE[e.type].text}`}>{e.label}</div>
                  </Link>
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
      <p className="text-white/20 text-sm text-center py-10">אין אירועים היום</p>
    ) : (
      <div className="space-y-2">
        {evs.map((e, i) => (
          <Link key={i} href={e.href}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${TYPE_STYLE[e.type].bg}`}>
              <span className="text-sm font-medium text-white">{e.label}</span>
              <span className="text-xs opacity-60 mr-auto">{e.type}</span>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div dir="rtl" style={{ background: "#0a0e1a", minHeight: "100vh", margin: "-24px", padding: "24px" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-cyan-400 text-[10px] tracking-widest uppercase mb-1">ARC · מערכת ניהול</p>
          <h1 className="text-2xl font-black text-white">דאשבורד</h1>
          <p className="text-white/30 text-xs mt-0.5">{format(new Date(), "EEEE, d MMMM yyyy", { locale: he })}</p>
        </div>
        <div className="flex items-center gap-2">
          {urgentLeads.length > 0 && (
            <Link href="/leads">
              <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-orange-500/40 text-orange-400 cursor-pointer hover:bg-orange-500/10 transition-colors" style={{ background: "rgba(249,115,22,0.1)" }}>
                <AlertCircle size={15} />
                {urgentLeads.length} לידים דחופים
              </div>
            </Link>
          )}
          {/* Google Calendar sync */}
          {gcalConnected === false && (
            <button onClick={connectGoogle}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">
              <CalendarDays size={15} /> חבר Google Calendar
            </button>
          )}
          {gcalConnected === true && (
            <button onClick={syncNow} disabled={syncing}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50">
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "מסנכרן..." : "סנכרן יומן"}
            </button>
          )}
          {syncMsg && <span className="text-xs text-white/40">{syncMsg}</span>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="פרויקטים פעילים" value={activeProjects.length} icon={FolderOpen} color="#aec6cf" href="/projects" />
        <StatCard label="לידים פתוחים" value={openLeads.length}
          sub={urgentLeads.length > 0 ? `${urgentLeads.length} דחופים` : undefined}
          subAlert={urgentLeads.length > 0} icon={TrendingUp} color="#f97316" href="/leads" />
        <StatCard label="שימור ידע" value={`${debriefs.length}/${projects.length}`}
          sub={projectsWithoutDebrief.length > 0 ? `${projectsWithoutDebrief.length} ממתינים לתחקיר` : "הכל מתוחקר ✓"}
          subAlert={projectsWithoutDebrief.length > 0} icon={BookOpen} color="#a78bfa" href="/debriefs" />
        <StatCard label="אנשים ברשת" value={collaborators.length} icon={Users} color="#34d399" href="/collaborators" />
      </div>

      {/* Finance + Blocks */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-white/30 text-xs">תקופה:</span>
            <select value={financeYear} onChange={(e) => setFinanceYear(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white/70 outline-none">
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
              {(Object.keys(PERIOD_LABELS) as FinancePeriod[]).map((p) => (
                <button key={p} onClick={() => setFinancePeriod(p)}
                  className={`px-3 py-1 transition-colors ${financePeriod === p ? "bg-cyan-500 text-black font-bold" : "text-white/40 hover:text-white"}`}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <Link href="/finance" className="text-cyan-400 text-[10px] hover:underline mr-auto">לפיננסים ←</Link>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {[
              { label: "הכנסה בפועל", value: totalIncome, color: "#10b981" },
              { label: "הכנסה צפויה", value: expectedRevenue, color: "#38bdf8" },
              { label: "הוצאות", value: totalExpenses, color: "#f87171" },
              { label: "רווח בפועל", value: totalProfit, color: totalProfit >= 0 ? "#10b981" : "#f87171" },
              { label: "פוטנציאל צינור", value: pipelineRevenue, color: "#fb923c" },
            ].map((item) => (
              <Link key={item.label} href="/finance">
                <div className="rounded-xl p-3 border border-white/5 hover:border-white/15 transition-colors" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-lg font-black" style={{ color: item.color }}>₪{item.value.toLocaleString()}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{item.label}</div>
                </div>
              </Link>
            ))}
          </div>

          <Panel title={`גרף פיננסי — ${PERIOD_LABELS[financePeriod]} ${financeYear}`}
            action={
              <div className="flex gap-3 text-[10px] text-white/30">
                {[["צפויה","#38bdf8"],["בפועל","#10b981"],["הוצאות","#f87171"],["רווח","#a78bfa"]].map(([l,c]) => (
                  <span key={l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: c }} />{l}</span>
                ))}
              </div>
            }>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={revenueData} barSize={10} barGap={2}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => v === 0 ? "0" : `₪${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => `₪${Number(v).toLocaleString()}`}
                  contentStyle={{ background: "#1a2035", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "white" }} />
                <Bar dataKey="צפויה" fill="#38bdf8" radius={[3,3,0,0]} />
                <Bar dataKey="בפועל" fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="הוצאות" fill="#f87171" radius={[3,3,0,0]} />
                <Bar dataKey="רווח" fill="#a78bfa" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Blocks — visual cards */}
        <Panel title="The Blocks" action={<Link href="/blocks" className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1">כל הבלוקים <ExternalLink size={10} /></Link>}>
          {blocks.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">אין Blocks עדיין</p>
          ) : (
            <div className="space-y-4">
              {blocks.map((b) => {
                const pct = b.completionPercent || 0;
                const { bg, glow, label: labelColor } = blockColor(pct);
                return (
                  <Link key={b.id} href="/blocks" className="block">
                    <div className="rounded-xl p-3 border border-white/5 hover:border-white/20 transition-colors" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-white/80 leading-tight">{b.name}</span>
                        <span className="text-sm font-black mr-2 shrink-0" style={{ color: labelColor }}>{pct}%</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bg, boxShadow: `0 0 10px ${glow}` }} />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[9px] text-white/25">
                        <span>{b.status}</span>
                        <span>{b.productType}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Calendar */}
      <Panel title="לוח שנה"
        action={
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-[10px]">
              {(["month","week","day"] as CalView[]).map((v) => (
                <button key={v} onClick={() => setCalView(v)}
                  className={`px-3 py-1.5 transition-colors ${calView === v ? "bg-cyan-500 text-black font-bold" : "text-white/40"}`}>
                  {v === "month" ? "חודש" : v === "week" ? "שבוע" : "יום"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prev} className="p-1 rounded-lg hover:bg-white/10 text-white/40"><ChevronRight size={14} /></button>
              <span className="text-xs font-medium min-w-[130px] text-center text-white/50">{navLabel()}</span>
              <button onClick={next} className="p-1 rounded-lg hover:bg-white/10 text-white/40"><ChevronLeft size={14} /></button>
            </div>
          </div>
        }>
        {calView === "month" && <MonthGrid />}
        {calView === "week" && <WeekView />}
        {calView === "day" && <DayView />}
        <div className="flex gap-5 mt-4 pt-3 border-t border-white/5">
          {Object.entries(TYPE_STYLE).map(([type, s]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px] text-white/40">
              <div className={`w-2.5 h-2.5 rounded-sm ${s.bg}`} /> {type}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
