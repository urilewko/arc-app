"use client";
import { useState } from "react";
import { useStore, Lead, LeadStatus } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, CheckCircle, LayoutList, Kanban, FileText } from "lucide-react";
import QuoteBuilder from "./QuoteBuilder";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const PRODUCT_TYPES = ["ריטריט", "סדנה חד פעמית", "Offsite", "קורס", "אירוע"];

const STATUSES: LeadStatus[] = [
  "שיחה ראשונית",
  "מחכים להצעת ערך",
  "מחכים להצעת מחיר",
  "פגישה",
  "משא ומתן",
  "ping",
  "נסגר",
  "נפל",
];

const PIPELINE_STATUSES: LeadStatus[] = [
  "שיחה ראשונית",
  "מחכים להצעת ערך",
  "מחכים להצעת מחיר",
  "פגישה",
  "משא ומתן",
  "ping",
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  "שיחה ראשונית": "bg-blue-100 text-blue-700 border-blue-200",
  "מחכים להצעת ערך": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "מחכים להצעת מחיר": "bg-purple-100 text-purple-700 border-purple-200",
  "פגישה": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "משא ומתן": "bg-orange-100 text-orange-700 border-orange-200",
  ping: "bg-gray-100 text-gray-600 border-gray-200",
  נסגר: "bg-green-100 text-green-700 border-green-200",
  נפל: "bg-red-100 text-red-600 border-red-200",
};

const STATUS_HEADER_COLORS: Record<LeadStatus, string> = {
  "שיחה ראשונית": "bg-blue-50 border-blue-200",
  "מחכים להצעת ערך": "bg-cyan-50 border-cyan-200",
  "מחכים להצעת מחיר": "bg-purple-50 border-purple-200",
  "פגישה": "bg-yellow-50 border-yellow-200",
  "משא ומתן": "bg-orange-50 border-orange-200",
  ping: "bg-gray-50 border-gray-200",
  נסגר: "bg-green-50 border-green-200",
  נפל: "bg-red-50 border-red-200",
};

const SOURCES = ["LinkedIn", "Meta", "פה לאוזן", "היכרות אישית", "אתר", "אחר"];

const NEXT_ACTIONS = [
  "שיחת טלפון",
  "שליחת הצעת מחיר",
  "פגישת היכרות",
  "פגישת הצגה",
  "שליחת חומרים",
  "מעקב / Ping",
  "חתימה על הסכם",
  "אחר",
];

const RESPONSIBLE = ["אורי", "ינון"];

const TRUST_LEVELS = ["חם", "בינוני", "קר"] as const;
type TrustLevel = typeof TRUST_LEVELS[number];

const TRUST_COLORS: Record<TrustLevel, { border: string; dot: string; label: string }> = {
  "חם":    { border: "border-l-4 border-l-green-400",  dot: "bg-green-400",  label: "text-green-700 bg-green-50" },
  "בינוני":{ border: "border-l-4 border-l-yellow-400", dot: "bg-yellow-400", label: "text-yellow-700 bg-yellow-50" },
  "קר":    { border: "border-l-4 border-l-blue-300",   dot: "bg-blue-300",   label: "text-blue-600 bg-blue-50" },
};

const empty = {
  contactId: "",
  orgName: "",
  status: "שיחה ראשונית" as LeadStatus,
  source: "",
  productType: "סדנה חד פעמית" as import("@/lib/store").ProductType,
  dealValue: 0,
  nextAction: "",
  responsible: "",
  dueDate: "",
  activityDate: "",
  notes: "",
  trustLevel: undefined as "חם" | "בינוני" | "קר" | undefined,
};

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[80px] rounded-lg transition-colors ${isOver ? "bg-blue-50/60 ring-1 ring-blue-200" : ""}`}>
      {children}
    </div>
  );
}

function DraggableLeadCard({ lead, onEdit, onDelete, onClose, onQuote }: {
  lead: Lead; onEdit: () => void; onDelete: () => void; onClose: () => void; onQuote: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard lead={lead} onEdit={onEdit} onDelete={onDelete} onClose={onClose} onQuote={onQuote}
        dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function LeadCard({ lead, onEdit, onDelete, onClose, onQuote, dragHandleProps }: {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onQuote: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const daysUntilDue = lead.dueDate
    ? Math.ceil((new Date(lead.dueDate).getTime() - Date.now()) / 86400000)
    : null;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3;

  const trust = lead.trustLevel ? TRUST_COLORS[lead.trustLevel] : null;

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${isUrgent ? "border-orange-300" : "border-gray-200"} ${trust ? trust.border : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none">
              <svg width="10" height="14" viewBox="0 0 12 18" fill="currentColor">
                <circle cx="4" cy="3" r="1.5"/><circle cx="4" cy="9" r="1.5"/><circle cx="4" cy="15" r="1.5"/>
                <circle cx="9" cy="3" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="9" cy="15" r="1.5"/>
              </svg>
            </div>
          )}
          <span className="font-bold text-sm leading-tight">{lead.orgName}</span>
          {trust && (
            <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0 ${trust.label}`}>{lead.trustLevel}</span>
          )}
        </div>
        <div className="flex gap-1 shrink-0 mr-1">
          {lead.status !== "נסגר" && lead.status !== "נפל" && (
            <button onClick={onClose} title="סגור עסקה" className="text-green-500 hover:text-green-700"><CheckCircle size={13} /></button>
          )}
          <button onClick={onQuote} title="הצעת מחיר" className="text-blue-400 hover:text-blue-600"><FileText size={12} /></button>
          <button onClick={onEdit} className="text-gray-300 hover:text-gray-600"><Pencil size={12} /></button>
          <button onClick={onDelete} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex gap-2 flex-wrap px-3 pb-2">
        {lead.productType && (
          <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{lead.productType}</span>
        )}
        {lead.source && (
          <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{lead.source}</span>
        )}
        {lead.dealValue > 0 && (
          <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold rounded-full px-2 py-0.5">₪{lead.dealValue.toLocaleString()}</span>
        )}
      </div>

      {/* Next action — prominent */}
      {lead.nextAction && (
        <div className={`mx-3 mb-2 rounded-lg px-2.5 py-2 ${isUrgent ? "bg-orange-50 border border-orange-200" : "bg-amber-50 border border-amber-100"}`}>
          <div className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">פעולה הבאה</div>
          <div className={`text-xs font-semibold ${isUrgent ? "text-orange-700" : "text-amber-800"}`}>⚡ {lead.nextAction}</div>
          <div className="flex items-center justify-between mt-1">
            {lead.responsible && (
              <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${lead.responsible === "אורי" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                {lead.responsible}
              </span>
            )}
            {lead.dueDate && (
              <span className={`text-[10px] font-medium ${isUrgent ? "text-orange-600 font-bold" : "text-gray-400"}`}>
                {isUrgent && daysUntilDue !== null
                  ? (daysUntilDue < 0 ? `איחור של ${Math.abs(daysUntilDue)} ימים` : daysUntilDue === 0 ? "היום!" : `${daysUntilDue} ימים`)
                  : lead.dueDate}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Activity date + notes */}
      <div className="px-3 pb-3 space-y-1">
        {lead.activityDate && (
          <div className="text-[10px] text-gray-400">📅 פעילות: <span className="text-gray-600">{lead.activityDate}</span></div>
        )}
        {lead.notes && (
          <div className="text-[10px] text-gray-400 truncate">{lead.notes}</div>
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead, closeLead } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(empty);
  const [view, setView] = useState<"pipeline" | "table">("pipeline");
  const [filter, setFilter] = useState<LeadStatus | "הכל">("הכל");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quoteLead, setQuoteLead] = useState<Lead | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const overId = over.id as string;
    // Check if dropped on a column (status)
    const targetStatus = STATUSES.find((s) => s === overId);
    if (targetStatus) {
      if (targetStatus === "נסגר") closeLead(active.id as string);
      else updateLead(active.id as string, { status: targetStatus });
      return;
    }
    // Dropped on another card — move to that card's column
    const targetLead = leads.find((l) => l.id === overId);
    if (targetLead) {
      if (targetLead.status === "נסגר") closeLead(active.id as string);
      else updateLead(active.id as string, { status: targetLead.status });
    }
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (l: Lead) => {
    setEditing(l);
    setForm({ contactId: l.contactId, orgName: l.orgName, status: l.status, source: l.source,
      productType: l.productType, dealValue: l.dealValue, nextAction: l.nextAction,
      responsible: l.responsible, dueDate: l.dueDate, activityDate: l.activityDate,
      notes: l.notes, trustLevel: l.trustLevel });
    setOpen(true);
  };

  const save = () => {
    if (!form.orgName) return;
    if (editing) {
      const becomingClosed = form.status === "נסגר" && editing.status !== "נסגר";
      if (becomingClosed) {
        // First close (creates project), then update remaining fields
        closeLead(editing.id);
        updateLead(editing.id, form);
      } else {
        updateLead(editing.id, form);
      }
    } else {
      addLead(form);
    }
    setOpen(false);
  };

  const filtered = filter === "הכל" ? leads : leads.filter((l) => l.status === filter);

  if (quoteLead) return <QuoteBuilder lead={quoteLead} onClose={() => setQuoteLead(null)} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">צינור לידים</h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-white border rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setView("pipeline")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                view === "pipeline" ? "bg-[#1a1a1a] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Kanban size={15} /> Pipeline
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                view === "table" ? "bg-[#1a1a1a] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <LayoutList size={15} /> טבלה
            </button>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]"
          >
            <Plus size={16} /> ליד חדש
          </button>
        </div>
      </div>

      {/* PIPELINE VIEW */}
      {view === "pipeline" && (
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="pb-4">
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
              {[...PIPELINE_STATUSES, "נסגר" as LeadStatus, "נפל" as LeadStatus].map((status) => {
                const statusLeads = leads.filter((l) => l.status === status);
                const totalValue = statusLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
                return (
                  <div key={status} className="min-w-0">
                    <div className={`rounded-t-lg border px-3 py-2 mb-2 ${STATUS_HEADER_COLORS[status]}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{status}</span>
                        <span className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-600 border">
                          {statusLeads.length}
                        </span>
                      </div>
                      {totalValue > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">₪{totalValue.toLocaleString()}</div>
                      )}
                    </div>
                    <SortableContext items={statusLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                      <DroppableColumn id={status}>
                        {statusLeads.map((lead) => (
                          <DraggableLeadCard
                            key={lead.id}
                            lead={lead}
                            onEdit={() => openEdit(lead)}
                            onDelete={() => deleteLead(lead.id)}
                            onClose={() => closeLead(lead.id)}
                            onQuote={() => setQuoteLead(lead)}
                          />
                        ))}
                        {statusLeads.length === 0 && (
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                            גרור לכאן
                          </div>
                        )}
                      </DroppableColumn>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </div>
          <DragOverlay>
            {activeLead && (
              <div className="rotate-2 opacity-90">
                <LeadCard lead={activeLead} onEdit={() => {}} onDelete={() => {}} onClose={() => {}} onQuote={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <>
          <div className="flex gap-2 flex-wrap mb-4">
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
                  <th className="text-right px-4 py-3 font-medium text-gray-500">יעד לפעולה</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">תאריך פעילות</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">אין לידים להצגה</td></tr>
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
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{lead.nextAction}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.responsible}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.dueDate}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.activityDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {lead.status !== "נסגר" && lead.status !== "נפל" && (
                          <button onClick={() => closeLead(lead.id)} title="סגור עסקה" className="text-green-600 hover:text-green-800">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => setQuoteLead(lead)} title="הצעת מחיר" className="text-blue-400 hover:text-blue-600"><FileText size={15} /></button>
                        <button onClick={() => openEdit(lead)} className="text-gray-400 hover:text-gray-700"><Pencil size={15} /></button>
                        <button onClick={() => deleteLead(lead.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL */}
      {open && (
        <Modal title={editing ? "עריכת ליד" : "ליד חדש"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">ארגון *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סטטוס</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">מקור הליד</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="">בחר מקור...</option>
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סוג מוצר מבוקש</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.productType}
                onChange={(e) => setForm({ ...form, productType: e.target.value as import("@/lib/store").ProductType })}>
                {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ערך עסקה (₪)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.dealValue}
                onChange={(e) => setForm({ ...form, dealValue: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">פעולה הבאה</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.nextAction}
                onChange={(e) => setForm({ ...form, nextAction: e.target.value })}>
                <option value="">בחר פעולה...</option>
                {NEXT_ACTIONS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">אחראי על הפעולה</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.responsible}
                  onChange={(e) => setForm({ ...form, responsible: e.target.value })}>
                  <option value="">בחר...</option>
                  {RESPONSIBLE.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">יעד לביצוע הפעולה</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">תאריך פעילות (מתי הפעילות תתקיים)</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.activityDate}
                onChange={(e) => setForm({ ...form, activityDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">רמת קרבה / אמון</label>
              <div className="flex gap-2">
                {TRUST_LEVELS.map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm({ ...form, trustLevel: form.trustLevel === t ? undefined : t })}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all
                      ${form.trustLevel === t
                        ? t === "חם" ? "bg-green-100 border-green-400 text-green-700"
                          : t === "בינוני" ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                          : "bg-blue-100 border-blue-300 text-blue-600"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}>
                    {t === "חם" ? "🔥 חם" : t === "בינוני" ? "🌤 בינוני" : "❄️ קר"}
                  </button>
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
