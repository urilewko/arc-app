"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { format, parseISO, isValid, isBefore, isToday } from "date-fns";
import { he } from "date-fns/locale";
import Link from "next/link";

const TEAM = ["אורי", "ינון"];

type TaskItem = {
  id: string;
  title: string;
  responsible: string;
  dueDate: string;
  source: string;
  sourceLabel: string;
  href: string;
  done: boolean;
  onToggle: () => void;
};

function safeDate(s: string) {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
}

function dueBadge(dateStr: string) {
  const d = safeDate(dateStr);
  if (!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  if (isBefore(d, today)) return { label: `איחור ${Math.ceil((today.getTime()-d.getTime())/86400000)}י`, cls: "bg-red-100 text-red-700" };
  if (isToday(d)) return { label: "היום!", cls: "bg-orange-100 text-orange-700 font-bold" };
  const days = Math.ceil((d.getTime()-today.getTime())/86400000);
  if (days <= 3) return { label: `${days} ימים`, cls: "bg-yellow-100 text-yellow-700" };
  return { label: format(d, "d MMM", { locale: he }), cls: "bg-gray-100 text-gray-500" };
}

export default function MyWorkPage() {
  const { leads, projects, infraProjects, updateLead, updateProjectTask, updateInfraTask } = useStore();
  const [person, setPerson] = useState<string>(TEAM[0]);
  const [hideCompleted, setHideCompleted] = useState(true);

  const tasks: TaskItem[] = useMemo(() => {
    const items: TaskItem[] = [];

    // Leads — next action assigned to person
    leads
      .filter((l) => l.responsible === person && !["נסגר", "נפל"].includes(l.status))
      .forEach((l) => {
        items.push({
          id: `lead-${l.id}`,
          title: `${l.nextAction || "פעולה הבאה"} — ${l.orgName}`,
          responsible: l.responsible,
          dueDate: l.dueDate,
          source: "ליד",
          sourceLabel: l.orgName,
          href: "/leads",
          done: false,
          onToggle: () => {},
        });
      });

    // Project tasks
    projects.forEach((p) => {
      (p.tasks || [])
        .filter((t) => t.responsible === person)
        .forEach((t) => {
          items.push({
            id: `task-${p.id}-${t.id}`,
            title: t.title,
            responsible: t.responsible,
            dueDate: t.dueDate,
            source: "פרויקט",
            sourceLabel: p.orgName,
            href: "/projects",
            done: t.status === "הושלם",
            onToggle: () => updateProjectTask(p.id, t.id, { status: t.status === "הושלם" ? "לביצוע" : "הושלם" }),
          });
        });
    });

    // Infra tasks
    infraProjects.forEach((p) => {
      (p.tasks || [])
        .filter((t) => t.responsible === person)
        .forEach((t) => {
          items.push({
            id: `infra-${p.id}-${t.id}`,
            title: t.title,
            responsible: t.responsible,
            dueDate: t.dueDate,
            source: "תשתית",
            sourceLabel: p.name,
            href: "/infra",
            done: t.status === "הושלם",
            onToggle: () => updateInfraTask(p.id, t.id, { status: t.status === "הושלם" ? "לביצוע" : "הושלם" }),
          });
        });
    });

    return items;
  }, [leads, projects, infraProjects, person, updateLead, updateProjectTask, updateInfraTask]);

  const visible = hideCompleted ? tasks.filter((t) => !t.done) : tasks;

  // Sort: overdue first, then by date, undated last
  const sorted = [...visible].sort((a, b) => {
    const da = safeDate(a.dueDate);
    const db = safeDate(b.dueDate);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.getTime() - db.getTime();
  });

  const doneCnt = tasks.filter((t) => t.done).length;

  const SOURCE_COLORS: Record<string, string> = {
    ליד: "bg-cyan-100 text-cyan-700",
    פרויקט: "bg-emerald-100 text-emerald-700",
    תשתית: "bg-violet-100 text-violet-700",
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">העבודה שלי</h1>
          <p className="text-sm text-gray-400 mt-0.5">כל המשימות שמשויכות אליך, ממוינות לפי תאריך יעד</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border rounded-lg overflow-hidden shadow-sm">
            {TEAM.map((name) => (
              <button key={name} onClick={() => setPerson(name)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${person === name ? "bg-[#1a1a1a] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100 flex-1">
          <div className="text-2xl font-black text-gray-800">{tasks.filter(t => !t.done).length}</div>
          <div className="text-xs text-gray-400">משימות פתוחות</div>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100 flex-1">
          <div className="text-2xl font-black text-orange-500">
            {tasks.filter(t => !t.done && t.dueDate && (() => { const d = safeDate(t.dueDate); const now = new Date(); now.setHours(0,0,0,0); return d && (isBefore(d,now) || isToday(d)); })()).length}
          </div>
          <div className="text-xs text-gray-400">דחופות / באיחור</div>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100 flex-1">
          <div className="text-2xl font-black text-green-500">{doneCnt}</div>
          <div className="text-xs text-gray-400">הושלמו</div>
        </div>
        <div className="flex items-center bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100 gap-2">
          <input type="checkbox" id="hideCompleted" checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)}
            className="w-4 h-4 accent-[#1a1a1a]" />
          <label htmlFor="hideCompleted" className="text-sm text-gray-600 cursor-pointer">הסתר שהושלמו</label>
        </div>
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center text-gray-400 shadow-sm">
          {tasks.length === 0
            ? `אין משימות משויכות ל${person}`
            : "כל המשימות הושלמו 🎉"}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((task) => {
            const badge = dueBadge(task.dueDate);
            return (
              <div key={task.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3.5 flex items-center gap-4 group transition-opacity ${task.done ? "opacity-50" : ""}`}>
                <button
                  onClick={task.onToggle}
                  disabled={task.source === "ליד"}
                  className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    task.done ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"
                  } ${task.source === "ליד" ? "opacity-30 cursor-default" : ""}`}>
                  {task.done && <span className="text-white text-[10px]">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[task.source]}`}>
                      {task.source}
                    </span>
                    <Link href={task.href} className="text-[10px] text-gray-400 hover:text-blue-500 hover:underline">
                      {task.sourceLabel} ←
                    </Link>
                  </div>
                </div>
                {badge && (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
