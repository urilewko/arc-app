"use client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { format, parseISO, isValid, isBefore, isToday } from "date-fns";
import { he } from "date-fns/locale";
import Link from "next/link";
import { Plus, X, Check, RefreshCw, Pencil } from "lucide-react";
import TodoistSectionSelect from "@/components/TodoistSectionSelect";
import { useTodoistSections } from "@/lib/useTodoistSections";
import Modal from "@/components/Modal";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners, useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const TEAM = ["אורי", "ינון"];
const uid = () => Math.random().toString(36).slice(2, 10);
const NO_SECTION = "__none__";

interface StandaloneTask {
  id: string;
  title: string;
  responsible: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
  todoistId?: string;
  todoistSectionId?: string;
  todoistSectionName?: string;
}

type TaskKind = "standalone" | "lead" | "project" | "infra";

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
  sectionId: string;
  sectionName: string;
  isStandalone?: string; // standalone task's own id, for delete
  kind: TaskKind;
  projectId?: string; // for project/infra tasks
  rawId?: string; // underlying task id (project/infra/standalone), for edit/move
  editable: boolean;
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
  const { leads, projects, infraProjects, updateProjectTask, updateInfraTask, updateLead } = useStore();
  const { sections: todoistSections, loading: sectionsLoading, refresh: refreshSections } = useTodoistSections();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [person, setPerson] = useState<string>(TEAM[0]);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [standalone, setStandalone] = useState<StandaloneTask[]>([]);
  const [standaloneSectionId, setStandaloneSectionId] = useState("");

  useEffect(() => {
    setStandaloneSectionId(localStorage.getItem("arc_standalone_todoist_section_id") || "");
  }, []);

  // Quick-add state
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPerson, setNewPerson] = useState(TEAM[0]);
  const [newSectionId, setNewSectionId] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Load standalone tasks
  useEffect(() => {
    supabase.from("standalone_tasks").select("*").then(({ data }) => {
      if (data) setStandalone(data.map((r) => ({
        id: r.id, title: r.title, responsible: r.responsible,
        dueDate: r.due_date || "", done: r.done || false, createdAt: r.created_at,
        todoistId: r.todoist_id || undefined,
        todoistSectionId: r.todoist_section_id || undefined,
        todoistSectionName: r.todoist_section_name || undefined,
      })));
    });
  }, []);

  useEffect(() => {
    if (!standaloneSectionId) return;
    const s = todoistSections.find((x) => x.id === standaloneSectionId);
    setNewSectionId(standaloneSectionId);
    setNewSectionName(s?.name || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standaloneSectionId, todoistSections.length]);

  const addStandalone = async () => {
    if (!newTitle.trim()) return;
    const row = {
      id: uid(), title: newTitle, responsible: newPerson, due_date: newDue, done: false,
      created_at: new Date().toISOString(),
      todoist_section_id: newSectionId || null, todoist_section_name: newSectionName || null,
    };
    await supabase.from("standalone_tasks").insert(row);
    const added: StandaloneTask = {
      id: row.id, title: row.title, responsible: row.responsible, dueDate: row.due_date, done: false,
      createdAt: row.created_at, todoistSectionId: newSectionId || undefined, todoistSectionName: newSectionName || undefined,
    };
    setStandalone((prev) => [...prev, added]);
    setNewTitle(""); setNewDue(""); setShowAdd(false);

    // Sync to Todoist immediately
    try {
      const res = await fetch("/api/todoist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: added.title, dueDate: added.dueDate || undefined, responsible: added.responsible || undefined, sectionId: newSectionId || undefined }),
      });
      const { todoistId } = await res.json();
      if (todoistId) {
        await supabase.from("standalone_tasks").update({ todoist_id: todoistId }).eq("id", row.id);
        setStandalone((prev) => prev.map((t) => t.id === row.id ? { ...t, todoistId } : t));
      }
    } catch { /* skip */ }
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
        sectionId: t.todoistSectionId || "",
        sectionName: t.todoistSectionName || "",
        isStandalone: t.id,
        kind: "standalone",
        rawId: t.id,
        editable: true,
      });
    });

    // Leads
    leads.filter((l) => l.responsible === person && !["נסגר", "נפל"].includes(l.status) && l.nextAction).forEach((l) => {
      items.push({
        id: `lead-${l.id}`,
        title: `${l.nextAction} — ${l.orgName}`,
        responsible: l.responsible,
        dueDate: l.dueDate,
        source: "ליד",
        sourceLabel: l.orgName,
        href: "/leads",
        done: false,
        onToggle: () => updateLead(l.id, { nextAction: "" }),
        sectionId: "",
        sectionName: "",
        kind: "lead",
        editable: false,
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
          sectionId: t.todoistSectionId || p.todoistSectionId || "",
          sectionName: t.todoistSectionName || p.todoistSectionName || "",
          kind: "project",
          projectId: p.id,
          rawId: t.id,
          editable: true,
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
          sectionId: t.todoistSectionId || p.todoistSectionId || "",
          sectionName: t.todoistSectionName || p.todoistSectionName || "",
          kind: "infra",
          projectId: p.id,
          rawId: t.id,
          editable: true,
        });
      });
    });

    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, projects, infraProjects, person, standalone]);

  // Move a task to a different Todoist category — drag-and-drop or edit modal
  const moveTaskToSection = (task: TaskItem, sectionId: string, sectionName: string) => {
    if (task.sectionId === sectionId) return;
    if (task.kind === "standalone" && task.rawId) {
      supabase.from("standalone_tasks").update({ todoist_section_id: sectionId || null, todoist_section_name: sectionName || null }).eq("id", task.rawId).then(() => {});
      setStandalone((prev) => prev.map((t) => t.id === task.rawId ? { ...t, todoistSectionId: sectionId, todoistSectionName: sectionName } : t));
      const st = standalone.find((t) => t.id === task.rawId);
      if (st?.todoistId) {
        fetch("/api/todoist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ todoistId: st.todoistId, sectionId }),
        }).catch(() => {});
      }
    } else if (task.kind === "project" && task.projectId && task.rawId) {
      updateProjectTask(task.projectId, task.rawId, { todoistSectionId: sectionId, todoistSectionName: sectionName });
    } else if (task.kind === "infra" && task.projectId && task.rawId) {
      updateInfraTask(task.projectId, task.rawId, { todoistSectionId: sectionId, todoistSectionName: sectionName });
    }
  };

  // ── Edit modal ───────────────────────────────────────────────────
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editForm, setEditForm] = useState({ title: "", dueDate: "", responsible: "", sectionId: "", sectionName: "" });

  const openEditTask = (task: TaskItem) => {
    if (!task.editable) return;
    setEditingTask(task);
    setEditForm({ title: task.title, dueDate: task.dueDate, responsible: task.responsible, sectionId: task.sectionId, sectionName: task.sectionName });
  };

  const saveEditTask = () => {
    if (!editingTask || !editForm.title.trim()) return;
    if (editForm.sectionId !== editingTask.sectionId) {
      moveTaskToSection(editingTask, editForm.sectionId, editForm.sectionName);
    }
    if (editingTask.kind === "standalone" && editingTask.rawId) {
      supabase.from("standalone_tasks").update({
        title: editForm.title, responsible: editForm.responsible, due_date: editForm.dueDate || null,
      }).eq("id", editingTask.rawId).then(() => {});
      setStandalone((prev) => prev.map((t) => t.id === editingTask.rawId
        ? { ...t, title: editForm.title, responsible: editForm.responsible, dueDate: editForm.dueDate }
        : t));
      const st = standalone.find((t) => t.id === editingTask.rawId);
      if (st?.todoistId) {
        fetch("/api/todoist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ todoistId: st.todoistId, title: editForm.title, dueDate: editForm.dueDate, responsible: editForm.responsible }),
        }).catch(() => {});
      }
    } else if (editingTask.kind === "project" && editingTask.projectId && editingTask.rawId) {
      updateProjectTask(editingTask.projectId, editingTask.rawId, {
        title: editForm.title, dueDate: editForm.dueDate, responsible: editForm.responsible,
      });
    } else if (editingTask.kind === "infra" && editingTask.projectId && editingTask.rawId) {
      updateInfraTask(editingTask.projectId, editingTask.rawId, {
        title: editForm.title, dueDate: editForm.dueDate, responsible: editForm.responsible,
      });
    }
    setEditingTask(null);
  };

  // ── Drag and drop ───────────────────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || !task.editable) return;
    const targetColId = over.id as string;
    const targetSectionId = targetColId === NO_SECTION ? "" : targetColId;
    const targetSection = todoistSections.find((s) => s.id === targetSectionId);
    moveTaskToSection(task, targetSectionId, targetSection?.name || "");
  };

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
              sectionId: task.todoistSectionId || project.todoistSectionId || undefined,
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
              sectionId: task.todoistSectionId || project.todoistSectionId || undefined,
            }),
          });
          const { todoistId } = await res.json();
          if (todoistId) { updateInfraTask(project.id, task.id, { ...(task as object), todoistId } as Parameters<typeof updateInfraTask>[2]); synced++; }
        } catch { /* skip */ }
      }
    }

    // Sync standalone tasks
    for (const task of standalone) {
      if (task.todoistId) continue;
      try {
        const res = await fetch("/api/todoist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            dueDate: task.dueDate || undefined,
            responsible: task.responsible || undefined,
            sectionId: task.todoistSectionId || standaloneSectionId || undefined,
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
  const doneCnt = tasks.filter((t) => t.done).length;

  // ── Group into Todoist-style columns ────────────────────────────
  const columns = useMemo(() => {
    const cols = todoistSections.map((s) => ({
      id: s.id,
      name: s.name,
      items: visible.filter((t) => t.sectionId === s.id)
        .sort((a, b) => {
          const da = safeDate(a.dueDate), db = safeDate(b.dueDate);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return da.getTime() - db.getTime();
        }),
    }));
    const unassigned = visible.filter((t) => !t.sectionId || !todoistSections.some((s) => s.id === t.sectionId))
      .sort((a, b) => {
        const da = safeDate(a.dueDate), db = safeDate(b.dueDate);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.getTime() - db.getTime();
      });
    return [...cols.filter((c) => c.items.length > 0 || true), { id: NO_SECTION, name: "ללא קטגוריה", items: unassigned }];
  }, [visible, todoistSections]);

  const SOURCE_COLORS: Record<string, string> = {
    ליד: "bg-cyan-100 text-cyan-700",
    פרויקט: "bg-emerald-100 text-emerald-700",
    תשתית: "bg-violet-100 text-violet-700",
    כללי: "bg-gray-100 text-gray-600",
  };

  const renderCardInner = (task: TaskItem, dragHandleProps?: React.HTMLAttributes<HTMLDivElement>) => {
    const badge = dueBadge(task.dueDate);
    return (
      <div
        className={`bg-white rounded-xl border shadow-sm p-3.5 group transition-opacity ${task.done ? "opacity-50" : ""} ${task.editable ? "cursor-pointer hover:border-gray-300" : ""}`}
        onClick={() => openEditTask(task)}
        {...(task.editable ? dragHandleProps : {})}
      >
        <div className="flex items-start gap-3">
          <button onClick={(e) => { e.stopPropagation(); task.onToggle(); }}
            className={`shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${
              task.done ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"
            }`}>
            {task.done && <span className="text-white text-[10px]">✓</span>}
          </button>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>
              {task.title}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[task.source]}`}>
                {task.source}
              </span>
              {task.href ? (
                <Link href={task.href} onClick={(e) => e.stopPropagation()} className="text-[10px] text-gray-400 hover:text-blue-500 hover:underline">
                  {task.sourceLabel} ←
                </Link>
              ) : task.sourceLabel && (
                <span className="text-[10px] text-gray-400">{task.sourceLabel}</span>
              )}
              {badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          {task.editable && (
            <Pencil size={13} className="opacity-0 group-hover:opacity-100 text-gray-300 shrink-0 transition-opacity mt-1" />
          )}
          {task.isStandalone && (
            <button onClick={(e) => { e.stopPropagation(); deleteStandalone(task.isStandalone!); }}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0 transition-opacity">
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  function DraggableCard({ task }: { task: TaskItem }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, disabled: !task.editable });
    const style: React.CSSProperties = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.3 : 1 };
    return (
      <div ref={setNodeRef} style={style}>
        {renderCardInner(task, { ...attributes, ...listeners })}
      </div>
    );
  }

  function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
      <div ref={setNodeRef} className={`space-y-2 min-h-[60px] rounded-xl transition-colors ${isOver ? "bg-blue-50/60 ring-1 ring-blue-200" : ""}`}>
        {children}
      </div>
    );
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">העבודה שלי</h1>
          <p className="text-sm text-gray-400 mt-0.5">מחולק לפי קטגוריות Todoist, כמו בלוח שלך</p>
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
          <button onClick={refreshSections} disabled={sectionsLoading} title="רענן קטגוריות מ-Todoist"
            className="flex items-center gap-2 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={14} className={sectionsLoading ? "animate-spin" : ""} />
            קטגוריות
          </button>
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
          <div className="min-w-[180px]">
            <label className="block text-xs text-gray-400 mb-1">קטגוריית Todoist</label>
            <TodoistSectionSelect value={newSectionId} onChange={(id, name) => { setNewSectionId(id); setNewSectionName(name); }} />
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

      {/* Kanban board — one column per Todoist category. Drag a card to change its category. */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center text-gray-400 shadow-sm">
          אין משימות משויכות ל{person}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => (
              <div key={col.id} className="w-72 shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-semibold text-sm text-gray-700">{col.name}</span>
                  <span className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 border">
                    {col.items.length}
                  </span>
                </div>
                <DroppableColumn id={col.id}>
                  {col.items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center text-xs text-gray-300">
                      גרור לכאן
                    </div>
                  ) : (
                    col.items.map((task) => <DraggableCard key={task.id} task={task} />)
                  )}
                </DroppableColumn>
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeTask && <div className="rotate-1 opacity-90 w-72">{renderCardInner(activeTask)}</div>}
          </DragOverlay>
        </DndContext>
      )}

      {/* Edit task modal */}
      {editingTask && (
        <Modal title="עריכת משימה" onClose={() => setEditingTask(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">כותרת *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">אחראי</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.responsible}
                  onChange={(e) => setEditForm({ ...editForm, responsible: e.target.value })}>
                  {TEAM.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תאריך יעד</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">קטגוריית Todoist</label>
              <TodoistSectionSelect
                value={editForm.sectionId}
                onChange={(id, name) => setEditForm({ ...editForm, sectionId: id, sectionName: name })} />
            </div>
            {editingTask.sourceLabel && (
              <p className="text-xs text-gray-400">
                מתוך: {editingTask.source} — {editingTask.sourceLabel}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={saveEditTask}
                className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">שמור</button>
              <button onClick={() => setEditingTask(null)}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
