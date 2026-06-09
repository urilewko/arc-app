"use client";
import { useState } from "react";
import { useStore, Project, ProductType, ProductionStatus } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";

const PRODUCT_TYPES: ProductType[] = ["ריטריט", "סדנה חד פעמית", "Offsite", "קורס"];
const PRODUCTION_STATUSES: ProductionStatus[] = ["עוד לא התחלנו", "בעבודה", "בוצע"];

const STATUS_COLORS: Record<ProductionStatus, string> = {
  "עוד לא התחלנו": "bg-gray-100 text-gray-600",
  "בעבודה": "bg-blue-100 text-blue-700",
  "בוצע": "bg-green-100 text-green-700",
};

const empty = {
  leadId: "",
  contactId: "",
  orgName: "",
  productType: "סדנה חד פעמית" as ProductType,
  startDate: "",
  endDate: "",
  productionStatus: "עוד לא התחלנו" as ProductionStatus,
  price: 0,
  notes: "",
};

export default function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({ ...p }); setOpen(true); };

  const save = () => {
    if (!form.orgName) return;
    if (editing) updateProject(editing.id, form);
    else addProject(form);
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">פרויקטים פעילים</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]"
        >
          <Plus size={16} />
          פרויקט חדש
        </button>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">
            אין פרויקטים פעילים. לידים שנסגרים יופיעו כאן אוטומטית.
          </div>
        )}
        {projects.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{p.orgName}</h3>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{p.productType}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.productionStatus]}`}>
                  {p.productionStatus}
                </span>
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                {p.startDate && <span>📅 {p.startDate}{p.endDate ? ` — ${p.endDate}` : ""}</span>}
                {p.price > 0 && <span>💰 ₪{p.price.toLocaleString()}</span>}
              </div>
              {p.notes && <p className="text-sm text-gray-500 mt-2">{p.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-700">
                <Pencil size={16} />
              </button>
              <button onClick={() => deleteProject(p.id)} className="text-gray-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal title={editing ? "עריכת פרויקט" : "פרויקט חדש"} onClose={() => setOpen(false)}>
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
