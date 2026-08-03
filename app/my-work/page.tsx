"use client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { format, parseISO, isValid, isBefore, isToday } from "date-fns";
import { he } from "date-fns/locale";
import Link from "next/link";
import { Plus, X, Check, RefreshCw } from "lucide-react";

const TEAM = ["אורי", "ינון"];
const uid = () => Math.random().toString(36).slice(2, 10);

interface StandaloneTask {
  id: string;
  title: string;
  responsible: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
}

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
  const { leads, projects, infraProjects, updateProjectTask, updateInfraTask } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [person, setPerson] = useState<string>(TEAM[0]);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [standalone, setStandalone] = useState<StandaloneTask[]>([]);

  // Quick-add state
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPerson, setNewPerson] = useState(TEAM[0]);
  const [showAdd, setShowAdd] = useState(false);

  // Load standalone tasks
  useEffect(() => {
    supabase.from("standalone_tasks").select("*").then(({ data }) => {
      if (data) setStandalone(data.map((r) => ({
        id: r.id, title: r.title, responsible: r.responsible,
        dueDate: r.due_date || "", done: r.done || false, createdAt: r.created_at,
      })));
    });
  }, []);

  const addStandalone = async () => {
    if (!newTitle.trim()) return;
    const row = { id: uid(), title: newTitle, responsible: newPerson, due_date: newDue, done: false, created_at: new Date().toISOString() };
    await supabase.from("standalone_tasks").insert(row);
    setStandalone((prev) => [...prev, { id: row.id, title: row.title, responsible: row.responsible, dueDate: row.due_date, done: false, createdAt: row.created_at }]);
    setNewTitle(""); setNewDue(""); setShowAdd(false);
  };

  const toggleStandalone = async (id: string) => {
    const task = standalone.find((t) => t.id === id);
    if (!task) return;
    const done = !task.done;
    await supabase.from("standalone_tasks").update({ done }).eq("id", id);
    setStandalone((prev) => prev.map((t) => t.id === id ? { ...t, done } : t));
  };

  const deleteStandalone = async (id: string) => {
    await supabase.from("standalone_tasks").delete().eq("id", id);
    setStandalone((prev) => prev.filter((t) => t.id !== id));
  };

  const tasks: TaskItem[] = useMemo(() => {
    const items: TaskItem[] = [];

    // Standalone tasks
    standalone.filter((t) => t.responsible === person).forEach((t) => {
      items.push({
        id: `standalone-${t.id}`,
        title: t.title,
        responsible: t.responsible,
        dueDate: t.dueDate,
        source: "כללי",
        sourceLabel: "",
        href: "",
        done: t.done,
        onToggle: () => toggleStandalone(t.id),
      });
    });

    // Leads
    leads.filter((l) => l.responsible === person && !["נסגר", "נפל"].includes(l.status)).forEach((l) => {
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
      (p.tasks || []).filter((t) => t.responsible === person).forEach((t) => {
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
      (p.tasks || []).filter((t) => t.responsible === person).forEach((t) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, projects, infraProjects, person, standalone]);

  const syncAllToTodoist = async () => {
    setSyncing(true);
    setSyncResult(null);
    let synced = 0;

    // Sync project tasks
    for (const project of projects) {
      for (const task of (project.tasks || [])) {
        if (task.todoistId) continue;
        try {
          const res = await fetch("/api/todoist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: task.title,
              dueDate: task.dueDate || undefined,
              responsible: task.responsible || undefined,
              projectName: project.orgName,
              notes: task.notes || undefined,
            }),
          });
          const { todoistId } = await res.json();
          if (todoistId) { updateProjectTask(project.id, task.id, { ...task, todoistId }); synced++; }
        } catch { /* skip */ }
      }
    }

    // Sync infra tasks
    for (const project of infraProjects) {
      for (const task of (project.tasks || [])) {
        if ((task as { todoistId?: string }).todoistId) continue;
        try {
          const res = await fetch("/api/todoist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: task.title,
              dueDate: task.dueDate || undefined,
              responsible: task.responsible || undefined,
              projectName: project.name,
            }),
          });
          const { todoistId } = await res.json();
          if (todoistId) { updateInfraTask(project.id, task.id, { ...(task as object), todoistId } as Parameters<typeof updateInfraTask>[2]); synced++; }
        } catch { /* skip */ }
      }
    }

    // Sync standalone tasks
    for (const task of standalone) {
      if ((task as StandaloneTask & { todoistId?: string }).todoistId) continue;
      try {
        const res = await fetch("/api/todoist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            dueDate: task.dueDate || undefined,
            responsible: task.responsible || undefined,
            projectName: "כללי",
          }),
        });
        const { todoistId } = await res.json();
        if (todoistId) {
          await supabase.from("standalone_tasks").update({ todoist_id: todoistId }).eq("id", task.id);
          setStandalone((prev) => prev.map((t) => t.id === task.id ? { ...t, todoistId } : t));
          synced++;
        }
      } catch { /* skip */ }
    }

    setSyncing(false);
    setSyncResult(`סונכרנו ${synced} משימות ל-Todoist`);
    setTimeout(() => setSyncResult(null), 4000);
  };

  const visible = hideCompleted ? tasks.filter((t) => !t.done) : tasks;
  const sorted = [...visible].sort((a, b) => {
    const da = safeDate(a.dueDate), db = safeDate(b.dueDate);
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
    כללי: "bg-gray-100 text-gray-600",
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
          {syncResult && <span className="text-xs text-green-600 font-medium">{syncResult}</span>}
          <button onClick={syncAllToTodoist} disabled={syncing}
            className="flex items-center gap-2 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "מסנכרן..." : "סנכרן Todoist"}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
            <Plus size={15} /> משימה חדשה
          </button>
        </div>
      </div>

      {/* Quick-add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5 flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-400 mb-1">כותרת *</label>
            <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStandalone()}
              placeholder="מה צריך לעשות?"
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">אחראי</label>
            <select value={newPerson} onChange={(e) => setNewPerson(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm">
              {TEAM.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">תאריך יעד</label>
            <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={addStandalone}
              className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333] flex items-center gap-1">
              <Check size={14} /> הוסף
            </button>
            <button onClick={() => setShowAdd(false)}
              className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-gray-500">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

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
          {tasks.length === 0 ? `אין משימות משויכות ל${person}` : "כל המשימות הושלמו 🎉"}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((task) => {
            const badge = dueBadge(task.dueDate);
            const isStandalone = task.id.startsWith("standalone-");
            const standaloneId = isStandalone ? task.id.replace("standalone-", "") : null;
            return (
              <div key={task.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3.5 flex items-center gap-4 group transition-opacity ${task.done ? "opacity-50" : ""}`}>
                <button onClick={task.onToggle}
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
                    {task.href ? (
                      <Link href={task.href} className="text-[10px] text-gray-400 hover:text-blue-500 hover:underline">
                        {task.sourceLabel} ←
                      </Link>
                    ) : task.sourceLabel && (
                      <span className="text-[10px] text-gray-400">{task.sourceLabel}</span>
                    )}
                  </div>
                </div>
                {badge && (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
                {isStandalone && standaloneId && (
                  <button onClick={() => deleteStandalone(standaloneId)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0 transition-opacity">
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
