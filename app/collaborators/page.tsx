"use client";
import { useState } from "react";
import { useStore, Collaborator, CollabDomain, CollabAvailability } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";

const DOMAINS: CollabDomain[] = ["הנחייה", "אמנות", "מוזיקה", "תנועה", "טבע", "בישול", "טכנולוגיה", "אחר"];
const AVAILABILITIES: CollabAvailability[] = ["פנוי", "עסוק חלקית", "לא זמין"];

const AVAIL_COLORS: Record<CollabAvailability, string> = {
  "פנוי": "bg-green-100 text-green-700",
  "עסוק חלקית": "bg-yellow-100 text-yellow-700",
  "לא זמין": "bg-red-100 text-red-600",
};

const empty = {
  name: "",
  domain: "הנחייה" as CollabDomain,
  specialty: "",
  phone: "",
  email: "",
  availability: "פנוי" as CollabAvailability,
  workTerms: "",
  pastProjects: "",
  notes: "",
};

export default function CollaboratorsPage() {
  const { collaborators, addCollaborator, updateCollaborator, deleteCollaborator } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<CollabDomain | "הכל">("הכל");

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Collaborator) => { setEditing(c); setForm({ ...c }); setOpen(true); };

  const save = () => {
    if (!form.name) return;
    if (editing) updateCollaborator(editing.id, form);
    else addCollaborator(form);
    setOpen(false);
  };

  const filtered = collaborators.filter((c) => {
    const matchSearch = c.name.includes(search) || c.specialty.includes(search);
    const matchDomain = domainFilter === "הכל" || c.domain === domainFilter;
    return matchSearch && matchDomain;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={22} /> אנשים שהשזם לא מזהה
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">מאגר מנחים, אמנים וספקים</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
          <Plus size={16} /> הוסף אדם
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-2.5 text-gray-400" />
          <input className="w-full bg-white border rounded-lg pr-9 pl-3 py-2 text-sm shadow-sm"
            placeholder="חיפוש לפי שם או התמחות..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="bg-white border rounded-lg px-3 py-2 text-sm shadow-sm"
          value={domainFilter} onChange={(e) => setDomainFilter(e.target.value as CollabDomain | "הכל")}>
          <option value="הכל">כל התחומים</option>
          {DOMAINS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">
            אין שיתופי פעולה להצגה
          </div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold">{c.name}</h3>
                <p className="text-sm text-gray-500">{c.specialty}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="text-gray-300 hover:text-gray-600"><Pencil size={15} /></button>
                <button onClick={() => deleteCollaborator(c.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{c.domain}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${AVAIL_COLORS[c.availability]}`}>{c.availability}</span>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {c.phone && <div>📱 {c.phone}</div>}
              {c.email && <div>✉️ {c.email}</div>}
            </div>
            {c.workTerms && (
              <div className="mt-3 text-xs text-gray-400 bg-gray-50 rounded p-2">{c.workTerms}</div>
            )}
            {c.pastProjects && (
              <div className="mt-2 text-xs text-gray-400">פרויקטים משותפים: {c.pastProjects}</div>
            )}
          </div>
        ))}
      </div>

      {open && (
        <Modal title={editing ? "עריכת שיתוף פעולה" : "שיתוף פעולה חדש"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">שם *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">תחום</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value as CollabDomain })}>
                  {DOMAINS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">זמינות</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value as CollabAvailability })}>
                  {AVAILABILITIES.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">התמחות</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">טלפון</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">אימייל</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">תנאי עבודה</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.workTerms}
                onChange={(e) => setForm({ ...form, workTerms: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">פרויקטים משותפים בעבר</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.pastProjects}
                onChange={(e) => setForm({ ...form, pastProjects: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes}
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
