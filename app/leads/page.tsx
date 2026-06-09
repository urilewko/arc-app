"use client";
import { useState } from "react";
import { useStore, Lead, LeadStatus } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";

const STATUSES: LeadStatus[] = [
  "שיחה ראשונית",
  "הצעת עבודה",
  "משא ומתן",
  "פגישה",
  "ping",
  "נסגר",
  "נפל",
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  "שיחה ראשונית": "bg-blue-100 text-blue-700",
  "הצעת עבודה": "bg-purple-100 text-purple-700",
  "משא ומתן": "bg-orange-100 text-orange-700",
  פגישה: "bg-yellow-100 text-yellow-700",
  ping: "bg-gray-100 text-gray-600",
  נסגר: "bg-green-100 text-green-700",
  נפל: "bg-red-100 text-red-600",
};

const empty = {
  contactId: "",
  orgName: "",
  status: "שיחה ראשונית" as LeadStatus,
  source: "",
  dealValue: 0,
  nextAction: "",
  responsible: "",
  dueDate: "",
  notes: "",
};

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead, closeLead } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState<LeadStatus | "הכל">("הכל");

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (l: Lead) => {
    setEditing(l);
    setForm({ ...l });
    setOpen(true);
  };

  const save = () => {
    if (!form.orgName) return;
    if (editing) updateLead(editing.id, form);
    else addLead(form);
    setOpen(false);
  };

  const filtered =
    filter === "הכל" ? leads : leads.filter((l) => l.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">צינור לידים</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]"
        >
          <Plus size={16} />
          ליד חדש
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(["הכל", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as LeadStatus | "הכל")}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              filter === s
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium text-gray-500">ארגון</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">סטטוס</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">מקור</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">ערך עסקה</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">פעולה הבאה</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">אחראי</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">תאריך יעד</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  אין לידים להצגה
                </td>
              </tr>
            )}
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{lead.orgName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{lead.source}</td>
                <td className="px-4 py-3 text-gray-600">
                  {lead.dealValue ? `₪${lead.dealValue.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{lead.nextAction}</td>
                <td className="px-4 py-3 text-gray-600">{lead.responsible}</td>
                <td className="px-4 py-3 text-gray-600">{lead.dueDate}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {lead.status !== "נסגר" && lead.status !== "נפל" && (
                      <button
                        onClick={() => closeLead(lead.id)}
                        title="סגור עסקה"
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => openEdit(lead)} className="text-gray-400 hover:text-gray-700">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteLead(lead.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "עריכת ליד" : "ליד חדש"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">ארגון *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סטטוס</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">מקור הליד</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ערך עסקה (₪)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.dealValue}
                onChange={(e) => setForm({ ...form, dealValue: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">פעולה הבאה</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.nextAction}
                onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">אחראי</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.responsible}
                  onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תאריך יעד</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]"
              >
                שמור
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
