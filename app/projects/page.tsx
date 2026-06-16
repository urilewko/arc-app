"use client";
import { useState } from "react";
import {
  useStore, Project, ProjectTask,
  ProductType, ProductionStatus, TaskCategory, TaskStatus
} from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, CheckSquare, ExternalLink } from "lucide-react";

const PRODUCT_TYPES: ProductType[] = ["ריטריט", "סדנה חד פעמית", "Offsite", "קורס"];
const PRODUCTION_STATUSES: ProductionStatus[] = ["עוד לא התחלנו", "בעבודה", "בוצע"];
const TASK_CATEGORIES: TaskCategory[] = ["תוכן", "לוגיסטיקה", "הנחייה", "שיווק", "פיננסי", "אחר"];
const TASK_STATUSES: TaskStatus[] = ["לביצוע", "בעבודה", "הושלם"];
const RESPONSIBLE = ["אורי", "ינון"];

const PRODUCT_COLORS: Record<ProductType, string> = {
  "ריטריט":        "bg-purple-100 text-purple-700",
  "סדנה חד פעמית": "bg-blue-100 text-blue-700",
  "Offsite":       "bg-teal-100 text-teal-700",
  "קורס":          "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<ProductionStatus, string> = {
  "עוד לא התחלנו": "bg-gray-100 text-gray-500",
  "בעבודה":        "bg-blue-100 text-blue-700",
  "בוצע":          "bg-green-100 text-green-700",
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  "לביצוע":  "bg-gray-100 text-gray-500",
  "בעבודה":  "bg-yellow-100 text-yellow-700",
  "הושלם":   "bg-green-100 text-green-700",
};

const TASK_CAT_COLORS: Record<TaskCategory, string> = {
  "תוכן":      "bg-purple-50 text-purple-600 border border-purple-200",
  "לוגיסטיקה": "bg-blue-50 text-blue-600 border border-blue-200",
  "הנחייה":    "bg-teal-50 text-teal-600 border border-teal-200",
  "שיווק":     "bg-pink-50 text-pink-600 border border-pink-200",
  "פיננסי":    "bg-green-50 text-green-600 border border-green-200",
  "אחר":       "bg-gray-50 text-gray-500 border border-gray-200",
};

const emptyProject = {
  leadId: "", contactId: "", orgName: "",
  productType: "סדנה חד פעמית" as ProductType,
  startDate: "", endDate: "",
  productionStatus: "עוד לא התחלנו" as ProductionStatus,
  price: 0, teamMembers: [] as string[], tasks: [] as ProjectTask[], notes: "", driveLink: "",
};

const emptyTask = {
  title: "", category: "תוכן" as TaskCategory,
  status: "לביצוע" as TaskStatus, responsible: "", dueDate: "", notes: "",
};

function TaskRow({ task, onStatusChange, onEdit, onDelete }: {
  task: ProjectTask;
  onStatusChange: (s: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50 group">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusChange(task.status === "הושלם" ? "לביצוע" : "הושלם")}
            className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              task.status === "הושלם" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"
            }`}
          >
            {task.status === "הושלם" && <span className="text-white text-[10px]">✓</span>}
          </button>
          <span className={`text-sm ${task.status === "הושלם" ? "line-through text-gray-400" : "text-gray-800"}`}>
            {task.title}
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TASK_CAT_COLORS[task.category]}`}>
          {task.category}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TASK_STATUS_COLORS[task.status]}`}>
          {task.status}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-500">{task.responsible}</td>
      <td className="px-4 py-2.5 text-sm text-gray-400">{task.dueDate}</td>
      <td className="px-4 py-2.5">
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="text-gray-300 hover:text-gray-600"><Pencil size={13} /></button>
          <button onClick={onDelete} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

export default function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject,
          addProjectTask, updateProjectTask, deleteProjectTask,
          financeRecords, addFinanceRecord } = useStore();

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState<string | null>(null); // projectId for new task
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [editTaskModal, setEditTaskModal] = useState<{ projectId: string; task: ProjectTask } | null>(null);
  const [editTaskForm, setEditTaskForm] = useState(emptyTask);
  const [catFilter, setCatFilter] = useState<TaskCategory | "הכל">("הכל");
  const [typeFilter, setTypeFilter] = useState<ProductType | "הכל">("הכל");

  const openNew = () => { setEditing(null); setForm(emptyProject); setOpenModal(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({ ...p, driveLink: p.driveLink || "" }); setOpenModal(true); };

  const save = () => {
    if (!form.orgName) return;
    if (editing) {
      // Auto-create a pending income record when project moves to "בוצע"
      const justCompleted =
        editing.productionStatus !== "בוצע" &&
        form.productionStatus === "בוצע" &&
        (form.price ?? 0) > 0;
      const alreadyHasRecord = financeRecords.some(
        (r) => r.projectId === editing.id && r.recordType === "income"
      );
      if (justCompleted && !alreadyHasRecord) {
        addFinanceRecord({
          projectId: editing.id,
          orgName: form.orgName,
          amount: form.price,
          paymentStatus: "ממתין",
          invoiceDate: form.endDate || form.startDate || new Date().toISOString().slice(0, 10),
          paidDate: "",
          notes: `נוצר אוטומטית עם סיום הפרויקט`,
          recordType: "income",
          expenseCategory: "",
        });
      }
      updateProject(editing.id, form);
    } else {
      addProject(form);
    }
    setOpenModal(false);
  };

  const saveTask = (projectId: string) => {
    if (!taskForm.title) return;
    addProjectTask(projectId, taskForm);
    setTaskForm(emptyTask);
    setTaskModal(null);
  };

  const openEditTask = (projectId: string, task: ProjectTask) => {
    setEditTaskModal({ projectId, task });
    setEditTaskForm({ title: task.title, category: task.category, status: task.status, responsible: task.responsible, dueDate: task.dueDate, notes: task.notes });
  };

  const saveEditTask = () => {
    if (!editTaskModal || !editTaskForm.title) return;
    updateProjectTask(editTaskModal.projectId, editTaskModal.task.id, editTaskForm);
    setEditTaskModal(null);
  };

  const activeProjects = projects.filter((p) => p.productionStatus !== "בוצע");
  const completedProjects = projects.filter((p) => p.productionStatus === "בוצע");
  const filtered = typeFilter === "הכל" ? activeProjects : activeProjects.filter((p) => p.productType === typeFilter);

  const progress = (p: Project) => {
    const tasks = p.tasks || [];
    if (!tasks.length) return null;
    const done = tasks.filter((t) => t.status === "הושלם").length;
    return { done, total: tasks.length, pct: Math.round((done / tasks.length) * 100) };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">פרויקטים פעילים</h1>
          {projects.filter((p) => p.productionStatus === "בוצע").length > 0 && (
            <a href="/debriefs" className="text-xs text-gray-400 hover:text-gray-600 mt-0.5 inline-block">
              {projects.filter((p) => p.productionStatus === "בוצע").length} פרויקטים הושלמו — ראה שימור ידע ←
            </a>
          )}
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
          <Plus size={16} /> פרויקט חדש
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(["הכל", ...PRODUCT_TYPES] as const).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t as ProductType | "הכל")}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              typeFilter === t ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">
          אין פרויקטים פעילים. לידים שנסגרים יופיעו כאן אוטומטית.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((p) => {
          const prog = progress(p);
          const isOpen = expanded === p.id;
          const filteredTasks = catFilter === "הכל"
            ? (p.tasks || [])
            : (p.tasks || []).filter((t) => t.category === catFilter);

          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              {/* Project header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : p.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-lg">{p.orgName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRODUCT_COLORS[p.productType]}`}>
                      {p.productType}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.productionStatus]}`}>
                      {p.productionStatus}
                    </span>
                  </div>
                  <div className="flex gap-5 text-sm text-gray-500 mt-1.5 flex-wrap items-center">
                    {p.startDate && <span>📅 {p.startDate}{p.endDate ? ` — ${p.endDate}` : ""}</span>}
                    {p.price > 0 && <span>💰 ₪{p.price.toLocaleString()}</span>}
                    {p.driveLink && (
                      <a href={p.driveLink} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium">
                        <ExternalLink size={12} /> Google Drive
                      </a>
                    )}
                    {prog && (
                      <span className="flex items-center gap-1.5">
                        <CheckSquare size={13} />
                        {prog.done}/{prog.total} משימות ({prog.pct}%)
                      </span>
                    )}
                  </div>
                  {prog && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full w-64 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${prog.pct}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                    className="text-gray-400 hover:text-gray-700"><Pencil size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                    className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </div>

              {/* Tasks section */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  {/* Task filters + add button */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 gap-3 flex-wrap">
                    <div className="flex gap-2 flex-wrap">
                      {(["הכל", ...TASK_CATEGORIES] as const).map((c) => (
                        <button key={c}
                          onClick={() => setCatFilter(c as TaskCategory | "הכל")}
                          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                            catFilter === c ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => { setTaskForm(emptyTask); setTaskModal(p.id); }}
                      className="flex items-center gap-1.5 text-sm bg-[#1a1a1a] text-white px-3 py-1.5 rounded-lg hover:bg-[#333]">
                      <Plus size={13} /> משימה
                    </button>
                  </div>

                  {/* Tasks table */}
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      אין משימות. לחץ "+ משימה" להוסיף.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">משימה</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">קטגוריה</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">סטטוס</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">אחראי</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">יעד</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onStatusChange={(s) => updateProjectTask(p.id, task.id, { status: s })}
                            onEdit={() => openEditTask(p.id, task)}
                            onDelete={() => deleteProjectTask(p.id, task.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completed projects */}
      {completedProjects.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            פרויקטים שהושלמו ({completedProjects.length})
          </h2>
          <div className="space-y-2">
            {completedProjects.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-gray-600">{p.orgName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRODUCT_COLORS[p.productType]}`}>{p.productType}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">בוצע</span>
                  {p.startDate && <span className="text-xs text-gray-400">📅 {p.startDate}</span>}
                  {p.price > 0 && <span className="text-xs text-gray-400">💰 ₪{p.price.toLocaleString()}</span>}
                </div>
                <button
                  onClick={() => deleteProject(p.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  title="מחק פרויקט">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project modal */}
      {openModal && (
        <Modal title={editing ? "עריכת פרויקט" : "פרויקט חדש"} onClose={() => setOpenModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">ארגון *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סוג מוצר</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.productType}
                onChange={(e) => setForm({ ...form, productType: e.target.value as ProductType })}>
                {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">תאריך התחלה</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תאריך סיום</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סטטוס הפקה</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.productionStatus}
                onChange={(e) => setForm({ ...form, productionStatus: e.target.value as ProductionStatus })}>
                {PRODUCTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">תמחור (₪)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">קישור Google Drive</label>
              <input type="url" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://drive.google.com/..."
                value={form.driveLink || ""}
                onChange={(e) => setForm({ ...form, driveLink: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">שמור</button>
              <button onClick={() => setOpenModal(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Task modal */}
      {editTaskModal && (
        <Modal title="עריכת משימה" onClose={() => setEditTaskModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">כותרת משימה *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={editTaskForm.title}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">קטגוריה</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={editTaskForm.category}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, category: e.target.value as TaskCategory })}>
                  {TASK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">סטטוס</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={editTaskForm.status}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value as TaskStatus })}>
                  {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">אחראי</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={editTaskForm.responsible}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, responsible: e.target.value })}>
                  <option value="">בחר...</option>
                  {RESPONSIBLE.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תאריך יעד</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={editTaskForm.dueDate}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={editTaskForm.notes}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEditTask}
                className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">שמור</button>
              <button onClick={() => setEditTaskModal(null)}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
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
                <label className="block text-sm font-medium mb-1">סטטוס</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}>
                  {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">אחראי</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={taskForm.responsible}
                  onChange={(e) => setTaskForm({ ...taskForm, responsible: e.target.value })}>
                  <option value="">בחר...</option>
                  {RESPONSIBLE.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תאריך יעד</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={taskForm.notes}
                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => saveTask(taskModal)}
                className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">הוסף משימה</button>
              <button onClick={() => setTaskModal(null)}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
