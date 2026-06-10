"use client";
import { useState } from "react";
import { ReviewItem, ReviewType } from "@/lib/store";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 10);

interface Props {
  title: string;
  items: ReviewItem[];
  onChange: (items: ReviewItem[]) => void;
  defaultOpen?: boolean;
}

export default function ReviewSection({ title, items, onChange, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: "שיפור" as ReviewType, what: "", why: "", howToImprove: "" });

  const add = () => {
    if (!form.what) return;
    onChange([...items, { ...form, id: uid() }]);
    setForm({ type: "שיפור", what: "", why: "", howToImprove: "" });
    setAdding(false);
  };

  const remove = (id: string) => onChange(items.filter((x) => x.id !== id));

  const shimurCount = items.filter((x) => x.type === "שימור").length;
  const shiburCount = items.filter((x) => x.type === "שיפור").length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-right"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">{title}</span>
          {items.length > 0 && (
            <div className="flex gap-1.5">
              {shimurCount > 0 && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{shimurCount} שימור</span>
              )}
              {shiburCount > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">{shiburCount} שיפור</span>
              )}
            </div>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {items.map((item) => (
            <div key={item.id}
              className={`rounded-lg border p-3 ${item.type === "שימור" ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.type === "שימור" ? "bg-green-200 text-green-800" : "bg-orange-200 text-orange-800"
                    }`}>{item.type}</span>
                    <span className="font-medium text-sm">{item.what}</span>
                  </div>
                  {item.why && (
                    <div className="text-xs text-gray-600 mb-1"><span className="font-medium">למה: </span>{item.why}</div>
                  )}
                  {item.howToImprove && (
                    <div className="text-xs text-gray-600"><span className="font-medium">איך נשפר: </span>{item.howToImprove}</div>
                  )}
                </div>
                <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {adding ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, type: "שימור" })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.type === "שימור" ? "bg-green-100 text-green-700 border-green-300" : "bg-white text-gray-500 border-gray-200"
                  }`}>✓ שימור</button>
                <button
                  onClick={() => setForm({ ...form, type: "שיפור" })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.type === "שיפור" ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-white text-gray-500 border-gray-200"
                  }`}>↑ שיפור</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">מה *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="תאר את הנושא..."
                  value={form.what} onChange={(e) => setForm({ ...form, what: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">למה זה קרה</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="סיבת השורש..."
                  value={form.why} onChange={(e) => setForm({ ...form, why: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">איך נשפר</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="פעולה קונקרטית לפעם הבאה..."
                  value={form.howToImprove} onChange={(e) => setForm({ ...form, howToImprove: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={add} className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm">הוסף</button>
                <button onClick={() => setAdding(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 px-1 py-1">
              <Plus size={14} /> הוסף שימור / שיפור
            </button>
          )}
        </div>
      )}
    </div>
  );
}
