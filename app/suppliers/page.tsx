"use client";
import { useState } from "react";
import { Search, Plus, Trash2, ChevronDown, ChevronUp, Phone, Mail, Pencil } from "lucide-react";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const uid = () => Math.random().toString(36).slice(2, 10);

const CATEGORIES = [
  "צילום ווידאו",
  "מזון ושתייה",
  "לוגיסטיקה והובלה",
  "ציוד ותפאורה",
  "מוזיקה ו-DJ",
  "הדפסה ועיצוב",
  "טכנולוגיה",
  "מרחבים ומקומות",
  "ניקיון ואחזקה",
  "אחר",
];

const PAYMENT_TERMS = ["מזומן", "העברה בנקאית", "30 יום", "60 יום", "אחר"];

const CAT_COLORS: Record<string, string> = {
  "צילום ווידאו":     "bg-violet-100 text-violet-700",
  "מזון ושתייה":      "bg-orange-100 text-orange-700",
  "לוגיסטיקה והובלה": "bg-blue-100 text-blue-700",
  "ציוד ותפאורה":     "bg-amber-100 text-amber-700",
  "מוזיקה ו-DJ":      "bg-pink-100 text-pink-700",
  "הדפסה ועיצוב":     "bg-teal-100 text-teal-700",
  "טכנולוגיה":        "bg-cyan-100 text-cyan-700",
  "מרחבים ומקומות":   "bg-green-100 text-green-700",
  "ניקיון ואחזקה":    "bg-gray-100 text-gray-600",
  "אחר":              "bg-gray-100 text-gray-600",
};

interface Supplier {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  paymentTerms: string;
  priceRange: string;
  rating: number;
  notes: string;
  createdAt: string;
}

const empty: Omit<Supplier, "id" | "createdAt"> = {
  name: "", category: "אחר", contactName: "",
  phone: "", email: "", paymentTerms: "",
  priceRange: "", rating: 0, notes: "",
};

const AVATAR_COLORS = ["bg-violet-400","bg-blue-400","bg-teal-400","bg-emerald-400","bg-amber-400","bg-rose-400"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("הכל");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    supabase.from("suppliers").select("*").then(({ data }) => {
      if (data) setSuppliers(data.map(toCamel) as Supplier[]);
    });
  }, []);

  function toCamel(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k in row) {
      out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = row[k];
    }
    return out;
  }
  function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k in obj) {
      out[k.replace(/([A-Z])/g, "_$1").toLowerCase()] = obj[k];
    }
    return out;
  }

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ ...s }); setOpen(true); };

  const save = async () => {
    if (!form.name) return;
    if (editing) {
      const patch = toSnake(form as unknown as Record<string, unknown>);
      await supabase.from("suppliers").update(patch).eq("id", editing.id);
      setSuppliers((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      const row = { ...toSnake(form as unknown as Record<string, unknown>), id: uid(), created_at: new Date().toISOString() };
      await supabase.from("suppliers").insert(row);
      setSuppliers((prev) => [...prev, toCamel(row) as unknown as Supplier]);
    }
    setOpen(false);
  };

  const remove = async (id: string) => {
    await supabase.from("suppliers").delete().eq("id", id);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const filtered = suppliers.filter((s) => {
    const matchSearch = s.name.includes(search) || s.contactName.includes(search) || s.category.includes(search);
    const matchCat = catFilter === "הכל" || s.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ספקים</h1>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
          <Plus size={16} /> ספק חדש
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש ספק..." className="w-full border rounded-lg px-4 py-2 text-sm pr-9 bg-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["הכל", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                catFilter === c ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-5">
        {CATEGORIES.filter((c) => suppliers.some((s) => s.category === c)).map((c) => (
          <div key={c} className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100 text-center">
            <div className="text-lg font-black text-gray-800">{suppliers.filter((s) => s.category === c).length}</div>
            <div className="text-[10px] text-gray-400">{c}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">אין ספקים להצגה</div>
      )}
      <div className="space-y-2">
        {filtered.map((s) => {
          const isOpen = expanded === s.id;
          const initials = s.name.slice(0, 2);
          return (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : s.id)}>
                <div className={`w-9 h-9 rounded-full ${avatarColor(s.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{s.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[s.category] || CAT_COLORS["אחר"]}`}>{s.category}</span>
                    {s.rating > 0 && (
                      <span className="text-[10px] text-amber-500">{"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}</span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-0.5">
                    {s.contactName && <span>{s.contactName}</span>}
                    {s.priceRange && <span>💰 {s.priceRange}</span>}
                    {s.paymentTerms && <span>📋 {s.paymentTerms}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.phone && (
                    <a href={`tel:${s.phone}`} onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-blue-500"><Phone size={14} /></a>
                  )}
                  {s.email && (
                    <a href={`mailto:${s.email}`} onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-blue-500"><Mail size={14} /></a>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} className="text-gray-300 hover:text-gray-600"><Pencil size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); remove(s.id); }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                  {isOpen ? <ChevronUp size={15} className="text-gray-300" /> : <ChevronDown size={15} className="text-gray-300" />}
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 grid grid-cols-2 gap-4 text-sm">
                  {s.phone && <div><span className="text-xs text-gray-400 block mb-0.5">טלפון</span><span>{s.phone}</span></div>}
                  {s.email && <div><span className="text-xs text-gray-400 block mb-0.5">אימייל</span><span>{s.email}</span></div>}
                  {s.priceRange && <div><span className="text-xs text-gray-400 block mb-0.5">טווח מחירים</span><span>{s.priceRange}</span></div>}
                  {s.paymentTerms && <div><span className="text-xs text-gray-400 block mb-0.5">תנאי תשלום</span><span>{s.paymentTerms}</span></div>}
                  {s.notes && <div className="col-span-2"><span className="text-xs text-gray-400 block mb-0.5">הערות</span><span className="text-gray-600">{s.notes}</span></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {open && (
        <Modal title={editing ? "עריכת ספק" : "ספק חדש"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">שם הספק *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">קטגוריה</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">איש קשר</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">טלפון</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">אימייל</label>
              <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">טווח מחירים</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="לדוג׳ ₪500–₪2,000"
                  value={form.priceRange} onChange={(e) => setForm({ ...form, priceRange: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תנאי תשלום</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}>
                  <option value="">בחר...</option>
                  {PAYMENT_TERMS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">דירוג</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setForm({ ...form, rating: form.rating === n ? 0 : n })}
                    className={`text-xl transition-colors ${n <= form.rating ? "text-amber-400" : "text-gray-200 hover:text-amber-200"}`}>★</button>
                ))}
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
