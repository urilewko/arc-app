"use client";
import { useState } from "react";
import { useStore, InfraProject, InfraCategory, ProductionStatus, ExpenseItem } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";

const CATEGORIES: InfraCategory[] = ["The Blocks", "מרחב פיזי", "ארגוני", "שיווק", "אחר"];
const PRODUCTION_STATUSES: ProductionStatus[] = ["עוד לא התחלנו", "בעבודה", "בוצע"];

const STATUS_COLORS: Record<ProductionStatus, string> = {
  "עוד לא התחלנו": "bg-gray-100 text-gray-600",
  "בעבודה": "bg-blue-100 text-blue-700",
  "בוצע": "bg-green-100 text-green-700",
};

const CAT_COLORS: Record<InfraCategory, string> = {
  "The Blocks": "bg-purple-100 text-purple-700",
  "מרחב פיזי": "bg-amber-100 text-amber-700",
  "ארגוני": "bg-teal-100 text-teal-700",
  "שיווק": "bg-pink-100 text-pink-700",
  "אחר": "bg-gray-100 text-gray-600",
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
};

export default function InfraPage() {
  const { infraProjects, addInfraProject, updateInfraProject, deleteInfraProject } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InfraProject | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [catFilter, setCatFilter] = useState<InfraCategory | "הכל">("הכל");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(emptyProject); setOpen(true); };
  const openEdit = (p: InfraProject) => { setEditing(p); setForm({ ...p, expenses: p.expenses || [] }); setOpen(true); };

  const save = () => {
    if (!form.name) return;
    if (editing) updateInfraProject(editing.id, form);
    else addInfraProject(form);
    setOpen(false);
  };

  const filtered = catFilter === "הכל" ? infraProjects : infraProjects.filter((p) => p.category === catFilter);

  // Expense helpers (inline, per project)
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
          const isExpanded = expandedId === p.id;
          const expenses = p.expenses || [];
          const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);

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
                  </div>
                  <div className="flex gap-6 text-sm text-gray-500">
                    {p.owner && <span>👤 {p.owner}</span>}
                    {p.dueDate && <span>📅 יעד: {p.dueDate}</span>}
                  </div>
                  {p.notes && <p className="text-sm text-gray-500 mt-2">{p.notes}</p>}
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors">
                    💸 הוצאות ({expenses.length})
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-700"><Pencil size={16} /></button>
                  <button onClick={() => deleteInfraProject(p.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Expenses panel */}
              {isExpanded && (
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
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })} />
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
    </div>
  );
}
