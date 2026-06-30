"use client";
import { useState } from "react";
import { useStore, InfraProject, InfraCategory, ProductionStatus, ExpenseItem, InfraTask, TaskStatus, TaskCategory } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X, CheckSquare } from "lucide-react";

const CATEGORIES: InfraCategory[] = ["תשתית", "המשק", "שטח", "שיווק ומיצוב", "The Hub", "הקהילה", "אחר"];
const PRODUCTION_STATUSES: ProductionStatus[] = ["עוד לא התחלנו", "בעבודה", "בוצע"];
const TASK_STATUSES: TaskStatus[] = ["לביצוע", "בעבודה", "הושלם"];
const TASK_CATEGORIES: TaskCategory[] = ["תוכן", "לוגיסטיקה", "הנחייה", "שיווק", "פיננסי", "אחר"];
const RESPONSIBLE = ["אורי", "ינון"];

const TASK_CAT_COLORS: Record<TaskCategory, string> = {
  "תוכן":      "bg-purple-50 text-purple-600 border border-purple-200",
  "לוגיסטיקה": "bg-blue-50 text-blue-600 border border-blue-200",
  "הנחייה":    "bg-teal-50 text-teal-600 border border-teal-200",
  "שיווק":     "bg-pink-50 text-pink-600 border border-pink-200",
  "פיננסי":    "bg-green-50 text-green-600 border border-green-200",
  "אחר":       "bg-gray-50 text-gray-500 border border-gray-200",
};

const STATUS_COLORS: Record<ProductionStatus, string> = {
  "עוד לא התחלנו": "bg-gray-100 text-gray-600",
  "בעבודה": "bg-blue-100 text-blue-700",
  "בוצע": "bg-green-100 text-green-700",
};

const CAT_COLORS: Record<InfraCategory, string> = {
  "תשתית":       "bg-blue-100 text-blue-700",
  "המשק":        "bg-amber-100 text-amber-700",
  "שטח":         "bg-green-100 text-green-700",
  "שיווק ומיצוב": "bg-pink-100 text-pink-700",
  "The Hub":     "bg-purple-100 text-purple-700",
  "הקהילה":      "bg-teal-100 text-teal-700",
  "אחר":         "bg-gray-100 text-gray-600",
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  "לביצוע": "bg-gray-100 text-gray-500",
  "בעבודה": "bg-yellow-100 text-yellow-700",
  "הושלם": "bg-green-100 text-green-700",
};

const uid = () => Math.random().toString(36).slice(2);

const emptyProject = {
  name: "",
  category: "אחר" as InfraCategory,
  productionStatus: "עוד לא התחלנו" as ProductionStatus,
  owner: "",
  dueDate: "",
  notes: "",
  expenses: [] as ExpenseItem[],
  tasks: [] as InfraTask[],
};

const emptyTask: Omit<InfraTask, "id"> = {
  title: "",
  status: "לביצוע",
  responsible: "",
  dueDate: "",
  notes: "",
  category: "אחר",
};

export default function InfraPage() {
  const { infraProjects, addInfraProject, updateInfraProject, deleteInfraProject,
          addInfraTask, updateInfraTask, deleteInfraTask } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InfraProject | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [catFilter, setCatFilter] = useState<InfraCategory | "הכל">("הכל");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<Record<string, "tasks" | "expenses" | null>>({});
  const [taskModal, setTaskModal] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [taskCatFilter, setTaskCatFilter] = useState<TaskCategory | "הכל">("הכל");

  const openNew = () => { setEditing(null); setForm(emptyProject); setOpen(true); };
  const openEdit = (p: InfraProject) => { setEditing(p); setForm({ ...p, expenses: p.expenses || [], tasks: p.tasks || [] }); setOpen(true); };

  const save = () => {
    if (!form.name) return;
    if (editing) updateInfraProject(editing.id, form);
    else addInfraProject(form);
    setOpen(false);
  };

  const filtered = catFilter === "הכל" ? infraProjects : infraProjects.filter((p) => p.category === catFilter);

  const toggleSection = (projectId: string, section: "tasks" | "expenses") => {
    setExpandedSection((prev) => ({
      ...prev,
      [projectId]: prev[projectId] === section ? null : section,
    }));
  };

  // Expense helpers
  const addExpense = (projectId: string) => {
    const p = infraProjects.find((x) => x.id === projectId);
    if (!p) return;
    updateInfraProject(projectId, {
      expenses: [...(p.expenses || []), { id: uid(), description: "", amount: 0, paidBy: "", date: "" }],
    });
  };
  const updateExpense = (projectId: string, expId: string, patch: Partial<ExpenseItem>) => {
    const p = infraProjects.find((x) => x.id === projectId);
    if (!p) return;
    updateInfraProject(projectId, {
      expenses: (p.expenses || []).map((e) => e.id === expId ? { ...e, ...patch } : e),
    });
  };
  const removeExpense = (projectId: string, expId: string) => {
    const p = infraProjects.find((x) => x.id === projectId);
    if (!p) return;
    updateInfraProject(projectId, { expenses: (p.expenses || []).filter((e) => e.id !== expId) });
  };

  const saveTask = (projectId: string) => {
    if (!taskForm.title) return;
    addInfraTask(projectId, taskForm);
    setTaskForm(emptyTask);
    setTaskModal(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">פרויקטי תשתית פנימיים</h1>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#4a2e1b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#3a2415]">
          <Plus size={16} /> פרויקט חדש
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {(["הכל", ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCatFilter(c as InfraCategory | "הכל")}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              catFilter === c ? "bg-[#4a2e1b] text-white border-[#4a2e1b]"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">אין פרויקטים להצגה</div>
        )}
        {filtered.map((p) => {
          const expenses = p.expenses || [];
          const tasks = p.tasks || [];
          const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);
          const doneTasks = tasks.filter((t) => t.status === "הושלם").length;
          const section = expandedSection[p.id] || null;

          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Main row */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[p.category]}`}>{p.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.productionStatus]}`}>{p.productionStatus}</span>
                    {totalExp > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-500">
                        💸 ₪{totalExp.toLocaleString()}
                      </span>
                    )}
                    {tasks.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        ✅ {doneTasks}/{tasks.length} משימות
                      </span>
                    )}
                  </div>
                  <div className="flex gap-6 text-sm text-gray-500">
                    {p.owner && <span>👤 {p.owner}</span>}
                    {p.dueDate && <span>📅 יעד: {p.dueDate}</span>}
                  </div>
                  {p.notes && <p className="text-sm text-gray-500 mt-2">{p.notes}</p>}
                </div>
                <div className="flex gap-2 items-center shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => toggleSection(p.id, "tasks")}
                    className={`flex items-center gap-1 text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${
                      section === "tasks" ? "bg-blue-50 text-blue-700 border-blue-200" : "text-gray-400 hover:text-gray-700 border-gray-200"}`}>
                    <CheckSquare size={13} /> משימות ({tasks.length})
                    {section === "tasks" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button
                    onClick={() => toggleSection(p.id, "expenses")}
                    className={`flex items-center gap-1 text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${
                      section === "expenses" ? "bg-red-50 text-red-700 border-red-200" : "text-gray-400 hover:text-gray-700 border-gray-200"}`}>
                    💸 הוצאות ({expenses.length})
                    {section === "expenses" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-700"><Pencil size={16} /></button>
                  <button onClick={() => deleteInfraProject(p.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Tasks panel */}
              {section === "tasks" && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="text-sm font-semibold text-gray-600">משימות הפרויקט</span>
                    <button onClick={() => { setTaskForm(emptyTask); setTaskModal(p.id); }}
                      className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50">
                      <Plus size={12} /> משימה חדשה
                    </button>
                  </div>
                  {tasks.length > 0 && (
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                      {(["הכל", ...TASK_CATEGORIES] as const).map((c) => (
                        <button key={c} onClick={() => setTaskCatFilter(c)}
                          className={`text-[11px] px-2 py-1 rounded-full font-medium transition-colors ${
                            taskCatFilter === c ? "bg-[#4a2e1b] text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  {tasks.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">אין משימות. לחץ "משימה חדשה" להוסיף.</p>
                  )}
                  <div className="space-y-2">
                    {tasks
                      .filter((task) => taskCatFilter === "הכל" || task.category === taskCatFilter)
                      .map((task) => (
                      <div key={task.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-gray-100 group">
                        <button
                          onClick={() => updateInfraTask(p.id, task.id, { status: task.status === "הושלם" ? "לביצוע" : "הושלם" })}
                          className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            task.status === "הושלם" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}>
                          {task.status === "הושלם" && <span className="text-white text-[10px]">✓</span>}
                        </button>
                        <span className={`flex-1 text-sm ${task.status === "הושלם" ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${TASK_CAT_COLORS[task.category || "אחר"]}`}>{task.category || "אחר"}</span>
                        {task.responsible && (
                          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0 ${task.responsible === "אורי" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            {task.responsible}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-[10px] text-gray-400 shrink-0">{task.dueDate}</span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${TASK_STATUS_COLORS[task.status]}`}>{task.status}</span>
                        <button onClick={() => deleteInfraTask(p.id, task.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0 transition-opacity">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses panel */}
              {section === "expenses" && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600">הוצאות הפרויקט</span>
                    <button onClick={() => addExpense(p.id)}
                      className="flex items-center gap-1 text-xs text-red-600 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50">
                      <Plus size={12} /> הוסף הוצאה
                    </button>
                  </div>
                  {expenses.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">אין הוצאות רשומות לפרויקט זה</p>
                  )}
                  <div className="space-y-2">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="grid grid-cols-12 gap-2 items-center">
                        <input className="col-span-4 border rounded-lg px-3 py-1.5 text-sm bg-white"
                          placeholder="תיאור הוצאה" value={exp.description}
                          onChange={(e) => updateExpense(p.id, exp.id, { description: e.target.value })} />
                        <input type="number" className="col-span-2 border rounded-lg px-3 py-1.5 text-sm bg-white"
                          placeholder="₪" value={exp.amount || ""}
                          onChange={(e) => updateExpense(p.id, exp.id, { amount: Number(e.target.value) })} />
                        <select className="col-span-2 border rounded-lg px-2 py-1.5 text-sm bg-white"
                          value={exp.paidBy || ""}
                          onChange={(e) => updateExpense(p.id, exp.id, { paidBy: e.target.value })}>
                          <option value="">שילם?</option>
                          <option>אורי</option><option>ינון</option><option>אחר</option>
                        </select>
                        <input type="date" className="col-span-3 border rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={exp.date || ""}
                          onChange={(e) => updateExpense(p.id, exp.id, { date: e.target.value })} />
                        <button className="col-span-1 text-gray-300 hover:text-red-500 justify-self-center"
                          onClick={() => removeExpense(p.id, exp.id)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                  {expenses.length > 0 && (
                    <div className="flex justify-end mt-3 pt-2 border-t border-gray-200">
                      <span className="text-sm font-bold text-red-500">סה״כ: ₪{totalExp.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Project modal */}
      {open && (
        <Modal title={editing ? "עריכת פרויקט" : "פרויקט תשתית חדש"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">שם פרויקט *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">קטגוריה</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as InfraCategory })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סטטוס</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.productionStatus}
                onChange={(e) => setForm({ ...form, productionStatus: e.target.value as ProductionStatus })}>
                {PRODUCTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">אחראי</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}>
                  <option value="">בחר...</option>
                  {RESPONSIBLE.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תאריך יעד</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-[#4a2e1b] text-white py-2 rounded-lg text-sm hover:bg-[#3a2415]">שמור</button>
              <button onClick={() => setOpen(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Task modal */}
      {taskModal && (
        <Modal title="משימה חדשה" onClose={() => setTaskModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">כותרת משימה *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">קטגוריה</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={taskForm.category}
                  onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as TaskCategory })}>
                  {TASK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">אחראי</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={taskForm.responsible}
                  onChange={(e) => setTaskForm({ ...taskForm, responsible: e.target.value })}>
                  <option value="">בחר...</option>
                  {RESPONSIBLE.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">תאריך יעד</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={taskForm.notes}
                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => saveTask(taskModal)}
                className="flex-1 bg-[#4a2e1b] text-white py-2 rounded-lg text-sm hover:bg-[#3a2415]">הוסף משימה</button>
              <button onClick={() => setTaskModal(null)}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
