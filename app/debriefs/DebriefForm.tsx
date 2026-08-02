"use client";
import { useState, useCallback } from "react";
import { useStore, Debrief, ReviewItem, CollabReview } from "@/lib/store";
import ReviewSection from "@/components/ReviewSection";
import { ArrowRight, Plus, Trash2, Upload } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 10);

// ── Section — defined OUTSIDE component to avoid remount scroll-jump ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-bold border-b pb-3">{title}</h2>
      {children}
    </div>
  );
}

function ScoreInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              value === n ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>{n}</button>
        ))}
      </div>
    </div>
  );
}

const emptyDebrief: Omit<Debrief, "id" | "createdAt"> = {
  projectId: "",
  orgName: "",
  eventDate: "",
  eventDateEnd: "",
  participantsCount: 0,
  location: "עין איילה",
  blockName: "",
  scheduleSlots: [],
  contentSlotReviews: [],
  contentGeneralReviews: [],
  contentScore: 0,
  logisticsGeneralReviews: [],
  logisticsScore: 0,
  collabReviews: [],
  orgWorkScore: 0,
  orgValueScore: 0,
  paymentReceived: 0,
  expenses: [],
  photoAlbumLink: "",
  quotesLink: "",
  notes: "",
};

interface Props {
  debrief?: Debrief;
  onClose: () => void;
}

export default function DebriefForm({ debrief, onClose }: Props) {
  const { projects, blocks, addDebrief, updateDebrief } = useStore();
  const [form, setForm] = useState<Omit<Debrief, "id" | "createdAt">>(
    debrief ? { ...emptyDebrief, ...debrief } : { ...emptyDebrief }
  );
  const [scheduleText, setScheduleText] = useState("");

  const set = useCallback((patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch })), []);

  // ── Schedule slots ──
  const addSlot = () => set({ scheduleSlots: [...form.scheduleSlots, { id: uid(), name: "", reviews: [] }] });
  const updateSlot = (id: string, name: string) =>
    set({ scheduleSlots: form.scheduleSlots.map((s) => s.id === id ? { ...s, name } : s) });
  const removeSlot = (id: string) =>
    set({ scheduleSlots: form.scheduleSlots.filter((s) => s.id !== id) });

  // Parse pasted schedule text into slots
  const parseScheduleText = () => {
    const lines = scheduleText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const newSlots = lines.map((line) => ({ id: uid(), name: line, reviews: [] }));
    set({ scheduleSlots: [...form.scheduleSlots, ...newSlots] });
    setScheduleText("");
  };

  // File upload → extract text lines as slots
  const handleScheduleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
      const newSlots = lines.map((line) => ({ id: uid(), name: line, reviews: [] }));
      set({ scheduleSlots: [...form.scheduleSlots, ...newSlots] });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Content slot reviews ──
  const getSlotReviews = (slotId: string) =>
    form.contentSlotReviews.find((r) => r.slotId === slotId)?.reviews || [];
  const setSlotReviews = (slotId: string, reviews: ReviewItem[]) => {
    const existing = form.contentSlotReviews.filter((r) => r.slotId !== slotId);
    set({ contentSlotReviews: [...existing, { slotId, reviews }] });
  };

  // ── Collab reviews ──
  const addCollab = () =>
    set({ collabReviews: [...form.collabReviews, { id: uid(), name: "", reviews: [], score: 0 }] });
  const updateCollab = (id: string, patch: Partial<CollabReview>) =>
    set({ collabReviews: form.collabReviews.map((c) => c.id === id ? { ...c, ...patch } : c) });
  const removeCollab = (id: string) =>
    set({ collabReviews: form.collabReviews.filter((c) => c.id !== id) });

  const save = () => {
    if (!form.orgName) return;
    if (debrief) updateDebrief(debrief.id, form);
    else addDebrief(form);
    onClose();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm">
          <ArrowRight size={16} /> חזרה
        </button>
        <h1 className="text-2xl font-bold">{debrief ? `תחקיר — ${debrief.orgName}` : "תחקיר חדש"}</h1>
      </div>

      <div className="space-y-5 max-w-3xl">

        {/* 1. Basic Info */}
        <Section title="1. נתונים בסיסיים">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ארגון *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.orgName}
                onChange={(e) => set({ orgName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">שייך לפרויקט</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.projectId}
                onChange={(e) => {
                  const p = projects.find((p) => p.id === e.target.value);
                  set({ projectId: e.target.value, orgName: p?.orgName || form.orgName });
                }}>
                <option value="">ללא שיוך</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.orgName} — {p.startDate || p.productType}</option>)}
              </select>
            </div>

            {/* תאריכים: התחלה + סיום */}
            <div>
              <label className="block text-sm font-medium mb-1">תאריך התחלה</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.eventDate}
                onChange={(e) => set({ eventDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">תאריך סיום</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.eventDateEnd}
                onChange={(e) => set({ eventDateEnd: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">מספר משתתפים</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.participantsCount || ""}
                onChange={(e) => set({ participantsCount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">מיקום</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.location}
                onChange={(e) => set({ location: e.target.value })} />
            </div>
          </div>

          {/* Block selector */}
          <div>
            <label className="block text-sm font-medium mb-1">בלוק שבוצע</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.blockName}
              onChange={(e) => set({ blockName: e.target.value })}>
              <option value="">ללא</option>
              {blocks.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </Section>

        {/* 2. Schedule */}
        <Section title="2. לו״ז / משבצות תוכן">
          <p className="text-sm text-gray-500">הוסף משבצות תוכן — ידנית, הדבקת טקסט, או העלאת קובץ.</p>

          {/* Slots list */}
          <div className="space-y-2">
            {form.scheduleSlots.map((slot, i) => (
              <div key={slot.id} className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-5">{i + 1}.</span>
                <input className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="שם המשבצת (פתיחה, פעילות, ארוחה...)"
                  value={slot.name} onChange={(e) => updateSlot(slot.id, e.target.value)} />
                <button type="button" onClick={() => removeSlot(slot.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addSlot}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700">
            <Plus size={14} /> הוסף משבצת ידנית
          </button>

          {/* Paste schedule */}
          <div className="border-t pt-4 space-y-2">
            <label className="block text-sm font-medium">הדבק לוז (שורה = משבצת)</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={4}
              placeholder={"09:00 פתיחה\n09:30 פעילות קרח\n10:00 The Blender\n12:30 ארוחת צהריים"}
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
            />
            <button type="button" onClick={parseScheduleText}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-lg">
              ייבא שורות ללוז
            </button>
          </div>

          {/* File upload */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-2">העלה קובץ לוז (.txt / .csv)</label>
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-400 hover:border-gray-400 transition-colors w-full">
              <Upload size={15} />
              <span>בחר קובץ...</span>
              <input type="file" accept=".txt,.csv" className="hidden" onChange={handleScheduleFile} />
            </label>
            <p className="text-xs text-gray-400 mt-1">כל שורה בקובץ הופכת למשבצת תוכן</p>
          </div>
        </Section>

        {/* 3. Content */}
        <Section title="3. תוכן">
          {form.scheduleSlots.filter((s) => s.name).map((slot) => (
            <ReviewSection
              key={slot.id}
              title={`משבצת: ${slot.name}`}
              items={getSlotReviews(slot.id)}
              onChange={(items) => setSlotReviews(slot.id, items)}
            />
          ))}
          <ReviewSection
            title="שימור / שיפור כללי — תוכן"
            items={form.contentGeneralReviews}
            onChange={(items) => set({ contentGeneralReviews: items })}
            defaultOpen={form.scheduleSlots.length === 0}
          />
          <ScoreInput label="ציון עצמי על התוכן (1–10)" value={form.contentScore}
            onChange={(v) => set({ contentScore: v })} />
        </Section>

        {/* 4. Logistics */}
        <Section title="4. לוגיסטיקה">
          <ReviewSection
            title="שימור / שיפור כללי — לוגיסטיקה"
            items={form.logisticsGeneralReviews}
            onChange={(items) => set({ logisticsGeneralReviews: items })}
            defaultOpen
          />
          <ScoreInput label="ציון לוגיסטיקה (1–10)" value={form.logisticsScore}
            onChange={(v) => set({ logisticsScore: v })} />
        </Section>

        {/* 5. Collaborations */}
        <Section title='5. אנשים שהשזם לא מזהה'>
          {form.collabReviews.map((collab) => (
            <div key={collab.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="שם הגורם"
                  value={collab.name} onChange={(e) => updateCollab(collab.id, { name: e.target.value })} />
                <button type="button" onClick={() => removeCollab(collab.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
              <ReviewSection
                title={`שימור / שיפור — ${collab.name || "גורם חיצוני"}`}
                items={collab.reviews}
                onChange={(reviews) => updateCollab(collab.id, { reviews })}
                defaultOpen
              />
              <ScoreInput label="ציון (1–10)" value={collab.score}
                onChange={(v) => updateCollab(collab.id, { score: v })} />
            </div>
          ))}
          <button type="button" onClick={addCollab}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700">
            <Plus size={14} /> הוסף גורם חיצוני
          </button>
        </Section>

        {/* 6. Organization */}
        <Section title="6. הארגון שעבדנו איתו">
          <ScoreInput label="חווית עבודה משותפת (1–10)" value={form.orgWorkScore}
            onChange={(v) => set({ orgWorkScore: v })} />
          <ScoreInput label="הערך שקיבלנו מהפעילות (1–10)" value={form.orgValueScore}
            onChange={(v) => set({ orgValueScore: v })} />
        </Section>

        {/* 7. Financials */}
        <Section title="7. פיננסים">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">תשלום שהתקבל (₪)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.paymentReceived || ""}
                onChange={(e) => set({ paymentReceived: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">קיבל את התשלום</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.paymentReceivedBy || "שניהם"}
                onChange={(e) => set({ paymentReceivedBy: e.target.value as "אורי" | "ינון" | "שניהם" })}>
                <option value="שניהם">שניהם</option>
                <option value="אורי">אורי</option>
                <option value="ינון">ינון</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm w-full">
                <div className="text-gray-500 text-xs mb-0.5">רווח</div>
                <div className={`font-bold text-lg ${
                  (form.paymentReceived - (form.expenses || []).reduce((s, e) => s + e.amount, 0)) >= 0
                    ? "text-green-600" : "text-red-600"
                }`}>
                  ₪{(form.paymentReceived - (form.expenses || []).reduce((s, e) => s + e.amount, 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">הוצאות האירוע</label>
              <button type="button"
                onClick={() => set({ expenses: [...(form.expenses || []), { id: uid(), description: "", amount: 0 }] })}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
                <Plus size={13} /> הוסף הוצאה
              </button>
            </div>
            <div className="space-y-2">
              {(form.expenses || []).map((exp) => (
                <div key={exp.id} className="flex items-center gap-2">
                  <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="תיאור ההוצאה"
                    value={exp.description}
                    onChange={(e) => set({ expenses: form.expenses.map((x) => x.id === exp.id ? { ...x, description: e.target.value } : x) })} />
                  <input type="number" className="w-24 border rounded-lg px-3 py-2 text-sm" placeholder="₪"
                    value={exp.amount || ""}
                    onChange={(e) => set({ expenses: form.expenses.map((x) => x.id === exp.id ? { ...x, amount: Number(e.target.value) } : x) })} />
                  <select className="w-28 border rounded-lg px-2 py-2 text-sm"
                    value={exp.paidBy || ""}
                    onChange={(e) => set({ expenses: form.expenses.map((x) => x.id === exp.id ? { ...x, paidBy: e.target.value } : x) })}>
                    <option value="">מי שילם?</option>
                    <option value="אורי">אורי</option>
                    <option value="ינון">ינון</option>
                    <option value="אחר">אחר</option>
                  </select>
                  <button type="button" onClick={() => set({ expenses: form.expenses.filter((x) => x.id !== exp.id) })}
                    className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
              {(form.expenses || []).length > 0 && (
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>סה״כ הוצאות</span>
                  <span>₪{(form.expenses || []).reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* 8. Links */}
        <Section title="8. קישורים">
          <div>
            <label className="block text-sm font-medium mb-1">קישור לאלבום תמונות</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..."
              value={form.photoAlbumLink} onChange={(e) => set({ photoAlbumLink: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">קישור לציטוטים / תגובות</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..."
              value={form.quotesLink} onChange={(e) => set({ quotesLink: e.target.value })} />
          </div>
        </Section>

        {/* 9. Notes */}
        <Section title="9. הערות נוספות">
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4}
            placeholder="כל מה שרציתם לרשום..."
            value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Section>

        {/* Save */}
        <div className="flex gap-3 pb-6">
          <button type="button" onClick={save}
            className="flex-1 bg-[#1a1a1a] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#333]">
            {debrief ? "שמור שינויים" : "שמור תחקיר"}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 border py-3 rounded-xl text-sm hover:bg-gray-50">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
