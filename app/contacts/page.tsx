"use client";
import { useState, useRef, KeyboardEvent } from "react";
import { useStore, Contact } from "@/lib/store";
import { Search, Phone, Mail, Trash2, ChevronDown, ChevronUp, Plus, Check, X } from "lucide-react";

const AVATAR_COLORS = [
  "bg-violet-400", "bg-blue-400", "bg-teal-400", "bg-emerald-400",
  "bg-amber-400", "bg-rose-400", "bg-pink-400", "bg-indigo-400",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const emptyForm = { orgName: "", contactName: "", role: "", phone: "", email: "", notes: "" };

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useStore();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // Quick-add bar state
  const [qa, setQa] = useState({ orgName: "", contactName: "", role: "", phone: "", email: "" });
  const qaOrgRef = useRef<HTMLInputElement>(null);

  const filtered = contacts.filter((c) =>
    c.orgName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  // Quick-add: press Enter on last field or click +
  const quickAdd = () => {
    if (!qa.orgName.trim()) { qaOrgRef.current?.focus(); return; }
    addContact({ ...emptyForm, ...qa });
    setQa({ orgName: "", contactName: "", role: "", phone: "", email: "" });
    qaOrgRef.current?.focus();
  };
  const qaKeyDown = (e: KeyboardEvent<HTMLInputElement>, isLast: boolean) => {
    if (e.key === "Enter") { if (isLast) quickAdd(); else (e.target as HTMLInputElement).form?.elements[
      Array.from((e.target as HTMLInputElement).form!.elements).indexOf(e.target as HTMLInputElement) + 1
    ] as HTMLInputElement}
  };

  const openExpand = (c: Contact) => {
    if (expanded === c.id) { setExpanded(null); return; }
    setExpanded(c.id);
    setEditForm({ orgName: c.orgName, contactName: c.contactName, role: c.role, phone: c.phone, email: c.email, notes: c.notes });
  };

  const saveEdit = (id: string) => {
    updateContact(id, editForm);
    setExpanded(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">הקהילה שלנו</h1>
        <span className="text-sm text-gray-400">{contacts.length} הקהילה שלנו</span>
      </div>

      {/* Quick-add bar */}
      <div className="bg-white rounded-xl shadow-sm border border-dashed border-[#aec6cf] p-3 mb-5">
        <p className="text-xs text-gray-400 mb-2 font-medium">➕ הוספה מהירה</p>
        <div className="grid grid-cols-12 gap-2 items-center">
          <input ref={qaOrgRef}
            className="col-span-3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#aec6cf]"
            placeholder="ארגון *" value={qa.orgName}
            onChange={(e) => setQa({ ...qa, orgName: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") (document.getElementById("qa-name") as HTMLInputElement)?.focus(); }} />
          <input id="qa-name"
            className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#aec6cf]"
            placeholder="שם איש קשר" value={qa.contactName}
            onChange={(e) => setQa({ ...qa, contactName: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") (document.getElementById("qa-role") as HTMLInputElement)?.focus(); }} />
          <input id="qa-role"
            className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#aec6cf]"
            placeholder="תפקיד" value={qa.role}
            onChange={(e) => setQa({ ...qa, role: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") (document.getElementById("qa-phone") as HTMLInputElement)?.focus(); }} />
          <input id="qa-phone"
            className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#aec6cf]"
            placeholder="טלפון" value={qa.phone}
            onChange={(e) => setQa({ ...qa, phone: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") (document.getElementById("qa-email") as HTMLInputElement)?.focus(); }} />
          <input id="qa-email"
            className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#aec6cf]"
            placeholder="אימייל" value={qa.email}
            onChange={(e) => setQa({ ...qa, email: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") quickAdd(); }} />
          <button onClick={quickAdd}
            className="col-span-1 flex items-center justify-center gap-1 bg-[#4a2e1b] text-white rounded-lg py-2 text-sm hover:bg-[#3a2415] transition-colors">
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute right-3 top-2.5 text-gray-400" />
        <input
          className="w-full bg-white border rounded-xl pr-9 pl-3 py-2 text-sm shadow-sm focus:outline-none focus:border-[#aec6cf]"
          placeholder="חיפוש לפי ארגון, שם, טלפון..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Cards */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👥</div>
          <p>אין הקהילה שלנו עדיין. השתמש בשורת ההוספה המהירה למעלה.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((c) => {
          const isOpen = expanded === c.id;
          const initials = (c.orgName || "?").slice(0, 2);
          const color = avatarColor(c.orgName);

          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Main row */}
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50/60 transition-colors"
                onClick={() => openExpand(c)}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-800">{c.orgName}</span>
                    {c.contactName && <span className="text-sm text-gray-500">{c.contactName}</span>}
                    {c.role && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{c.role}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#4a2e1b] transition-colors">
                        <Phone size={11} /> {c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#4a2e1b] transition-colors">
                        <Mail size={11} /> {c.email}
                      </a>
                    )}
                    {!c.phone && !c.email && <span className="text-xs text-gray-300">אין פרטי קשר</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); deleteContact(c.id); }}
                    className="text-gray-200 hover:text-red-400 transition-colors p-1 rounded">
                    <Trash2 size={14} />
                  </button>
                  {isOpen ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
                </div>
              </div>

              {/* Expanded edit */}
              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-4">
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-3">
                      <label className="text-xs text-gray-400 mb-1 block">ארגון</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#aec6cf]"
                        value={editForm.orgName}
                        onChange={(e) => setEditForm({ ...editForm, orgName: e.target.value })} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-gray-400 mb-1 block">שם</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#aec6cf]"
                        value={editForm.contactName}
                        onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">תפקיד</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#aec6cf]"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">טלפון</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#aec6cf]"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">אימייל</label>
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#aec6cf]"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="text-xs text-gray-400 mb-1 block">הערות</label>
                    <textarea className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#aec6cf] resize-none"
                      rows={2} value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setExpanded(null)}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors">
                      <X size={13} /> ביטול
                    </button>
                    <button onClick={() => saveEdit(c.id)}
                      className="flex items-center gap-1 text-sm bg-[#4a2e1b] text-white px-3 py-1.5 rounded-lg hover:bg-[#3a2415] transition-colors">
                      <Check size={13} /> שמור
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
