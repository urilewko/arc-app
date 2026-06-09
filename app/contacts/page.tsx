"use client";
import { useState } from "react";
import { useStore, Contact } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

const empty = {
  orgName: "",
  contactName: "",
  role: "",
  phone: "",
  email: "",
  notes: "",
};

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Contact) => { setEditing(c); setForm({ ...c }); setOpen(true); };

  const save = () => {
    if (!form.orgName) return;
    if (editing) updateContact(editing.id, form);
    else addContact(form);
    setOpen(false);
  };

  const filtered = contacts.filter(
    (c) =>
      c.orgName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">אנשי קשר וארגונים</h1>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
          <Plus size={16} /> איש קשר חדש
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
        <input
          className="w-full bg-white border rounded-lg pr-9 pl-3 py-2 text-sm shadow-sm"
          placeholder="חיפוש לפי ארגון או שם..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium text-gray-500">ארגון</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">איש קשר</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">תפקיד</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">טלפון</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">אימייל</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">אין אנשי קשר</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.orgName}</td>
                <td className="px-4 py-3">{c.contactName}</td>
                <td className="px-4 py-3 text-gray-500">{c.role}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                <td className="px-4 py-3 text-gray-500">{c.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-gray-700"><Pencil size={15} /></button>
                    <button onClick={() => deleteContact(c.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "עריכת איש קשר" : "איש קשר חדש"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">ארגון *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">שם איש קשר</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תפקיד</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </div>
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
