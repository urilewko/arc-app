"use client";
import { useState } from "react";
import { useStore, InfraProject, InfraCategory, ProductionStatus } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

const empty = {
  name: "",
  category: "אחר" as InfraCategory,
  productionStatus: "עוד לא התחלנו" as ProductionStatus,
  owner: "",
  dueDate: "",
  notes: "",
};

export default function InfraPage() {
  const { infraProjects, addInfraProject, updateInfraProject, deleteInfraProject } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InfraProject | null>(null);
  const [form, setForm] = useState(empty);
  const [catFilter, setCatFilter] = useState<InfraCategory | "הכל">("הכל");

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: InfraProject) => { setEditing(p); setForm({ ...p }); setOpen(true); };

  const save = () => {
    if (!form.name) return;
    if (editing) updateInfraProject(editing.id, form);
    else addInfraProject(form);
    setOpen(false);
  };

  const filtered = catFilter === "הכל" ? infraProjects : infraProjects.filter((p) => p.category === catFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">פרויקטי תשתית פנימיים</h1>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
          <Plus size={16} /> פרויקט חדש
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {(["הכל", ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCatFilter(c as InfraCategory | "הכל")}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              catFilter === c ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">אין פרויקטים להצגה</div>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{p.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[p.category]}`}>{p.category}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.productionStatus]}`}>{p.productionStatus}</span>
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                {p.owner && <span>👤 {p.owner}</span>}
                {p.dueDate && <span>📅 יעד: {p.dueDate}</span>}
              </div>
              {p.notes && <p className="text-sm text-gray-500 mt-2">{p.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-700"><Pencil size={16} /></button>
              <button onClick={() => deleteInfraProject(p.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
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
              <button onClick={save} className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">שמור</button>
              <button onClick={() => setOpen(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
