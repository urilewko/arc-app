"use client";
import { useState, useMemo, Fragment } from "react";
import { useStore, MarketingChannel, MarketingCampaign, MarketingEvent, MarketingChannelStatus, MarketingCampaignStatus } from "@/lib/store";
import Modal from "@/components/Modal";
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Megaphone,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks,
  isSameMonth, isSameDay, isToday, parseISO, isValid,
} from "date-fns";
import { he } from "date-fns/locale";

type CalView = "day" | "week" | "month";
const VIEW_LABELS: Record<CalView, string> = { day: "יום", week: "שבוע", month: "חודש" };

const CHANNEL_STATUSES: MarketingChannelStatus[] = ["פעיל", "בהשהיה", "לא בשימוש"];
const CHANNEL_STATUS_COLORS: Record<MarketingChannelStatus, string> = {
  "פעיל": "bg-green-100 text-green-700",
  "בהשהיה": "bg-orange-100 text-orange-700",
  "לא בשימוש": "bg-gray-100 text-gray-500",
};

const CAMPAIGN_STATUSES: MarketingCampaignStatus[] = ["מתוכנן", "פעיל", "הסתיים"];
const CAMPAIGN_STATUS_COLORS: Record<MarketingCampaignStatus, string> = {
  "מתוכנן": "bg-blue-100 text-blue-700",
  "פעיל": "bg-green-100 text-green-700",
  "הסתיים": "bg-gray-100 text-gray-500",
};

const emptyChannel = { name: "", status: "פעיל" as MarketingChannelStatus, notes: "" };
const emptyCampaign = {
  name: "", channelId: "", startDate: "", endDate: "", budget: 0,
  status: "מתוכנן" as MarketingCampaignStatus, resultLeads: 0, notes: "",
};
const emptyEvent = { date: "", title: "", channelId: "", notes: "" };

export default function MarketingPage() {
  const {
    leads, marketingChannels, marketingCampaigns, marketingEvents,
    addMarketingChannel, updateMarketingChannel, deleteMarketingChannel,
    addMarketingCampaign, updateMarketingCampaign, deleteMarketingCampaign,
    addMarketingEvent, updateMarketingEvent, deleteMarketingEvent,
  } = useStore();

  // ── Calendar state ──────────────────────────────────────────────
  const [calView, setCalView] = useState<CalView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MarketingEvent | null>(null);
  const [eventForm, setEventForm] = useState(emptyEvent);

  // ── Channels state ───────────────────────────────────────────────
  const [channelOpen, setChannelOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<MarketingChannel | null>(null);
  const [channelForm, setChannelForm] = useState(emptyChannel);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  // ── Campaigns state ──────────────────────────────────────────────
  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [campaignForm, setCampaignForm] = useState(emptyCampaign);

  // ── Calendar grid ────────────────────────────────────────────────
  const gridDays = useMemo(() => {
    if (calView === "day") return [cursor];
    if (calView === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 0 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return days;
  }, [calView, cursor]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, MarketingEvent[]> = {};
    marketingEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [marketingEvents]);

  const navigate = (dir: -1 | 1) => {
    if (calView === "day") setCursor((c) => addDays(c, dir));
    else if (calView === "week") setCursor((c) => addWeeks(c, dir));
    else setCursor((c) => addMonths(c, dir));
  };

  const periodLabel = useMemo(() => {
    if (calView === "day") return format(cursor, "EEEE, d MMMM yyyy", { locale: he });
    if (calView === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 0 });
      const end = endOfWeek(cursor, { weekStartsOn: 0 });
      return `${format(start, "d MMM", { locale: he })} – ${format(end, "d MMM yyyy", { locale: he })}`;
    }
    return format(cursor, "MMMM yyyy", { locale: he });
  }, [calView, cursor]);

  const openNewEvent = (dateStr: string) => {
    setEditingEvent(null);
    setEventForm({ ...emptyEvent, date: dateStr });
    setEventOpen(true);
  };
  const openEditEvent = (ev: MarketingEvent) => {
    setEditingEvent(ev);
    setEventForm({ date: ev.date, title: ev.title, channelId: ev.channelId || "", notes: ev.notes });
    setEventOpen(true);
  };
  const saveEvent = () => {
    if (!eventForm.title || !eventForm.date) return;
    if (editingEvent) updateMarketingEvent(editingEvent.id, eventForm);
    else addMarketingEvent(eventForm);
    setEventOpen(false);
    setDayModalDate(null);
  };

  // ── Channels helpers ─────────────────────────────────────────────
  const openNewChannel = () => { setEditingChannel(null); setChannelForm(emptyChannel); setChannelOpen(true); };
  const openEditChannel = (c: MarketingChannel) => { setEditingChannel(c); setChannelForm({ name: c.name, status: c.status, notes: c.notes }); setChannelOpen(true); };
  const saveChannel = () => {
    if (!channelForm.name.trim()) return;
    if (editingChannel) updateMarketingChannel(editingChannel.id, channelForm);
    else addMarketingChannel(channelForm);
    setChannelOpen(false);
  };

  const channelStats = (channelName: string) => {
    const channelLeads = leads.filter((l) => l.source === channelName);
    const closed = channelLeads.filter((l) => l.status === "נסגר").length;
    const rate = channelLeads.length ? Math.round((closed / channelLeads.length) * 100) : 0;
    return { total: channelLeads.length, closed, rate, items: channelLeads };
  };

  // ── Campaigns helpers ────────────────────────────────────────────
  const openNewCampaign = () => { setEditingCampaign(null); setCampaignForm(emptyCampaign); setCampaignOpen(true); };
  const openEditCampaign = (c: MarketingCampaign) => {
    setEditingCampaign(c);
    setCampaignForm({
      name: c.name, channelId: c.channelId, startDate: c.startDate, endDate: c.endDate,
      budget: c.budget, status: c.status, resultLeads: c.resultLeads, notes: c.notes,
    });
    setCampaignOpen(true);
  };
  const saveCampaign = () => {
    if (!campaignForm.name.trim()) return;
    if (editingCampaign) updateMarketingCampaign(editingCampaign.id, campaignForm);
    else addMarketingCampaign(campaignForm);
    setCampaignOpen(false);
  };
  const channelName = (id: string) => marketingChannels.find((c) => c.id === id)?.name || "—";

  const dayModalEvents = dayModalDate ? (eventsByDate[dayModalDate] || []) : [];

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone size={22} /> שיווק</h1>
          <p className="text-sm text-gray-500 mt-0.5">ערוצים, תוכנית תוכן וקמפיינים — המטרה: כמה שיותר לידים</p>
        </div>
      </div>

      {/* ── CALENDAR ── */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={18} /></button>
            <span className="font-semibold text-gray-800 min-w-[160px] text-center">{periodLabel}</span>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></button>
            <button onClick={() => setCursor(new Date())} className="text-xs text-gray-500 border rounded-lg px-2.5 py-1 hover:bg-gray-50">היום</button>
          </div>
          <div className="flex bg-gray-100 rounded-lg overflow-hidden text-sm">
            {(Object.keys(VIEW_LABELS) as CalView[]).map((v) => (
              <button key={v} onClick={() => setCalView(v)}
                className={`px-3 py-1.5 transition-colors ${calView === v ? "bg-[#1a1a1a] text-white" : "text-gray-500 hover:bg-gray-200"}`}>
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        {calView === "day" ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{(eventsByDate[format(cursor, "yyyy-MM-dd")] || []).length} פריטים</span>
              <button onClick={() => openNewEvent(format(cursor, "yyyy-MM-dd"))}
                className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] text-white px-3 py-1.5 rounded-lg hover:bg-[#333]">
                <Plus size={13} /> הוסף לתוכנית
              </button>
            </div>
            <div className="space-y-2">
              {(eventsByDate[format(cursor, "yyyy-MM-dd")] || []).length === 0 ? (
                <div className="text-center text-gray-300 text-sm py-10">אין תוכניות ליום הזה</div>
              ) : (
                (eventsByDate[format(cursor, "yyyy-MM-dd")] || []).map((ev) => (
                  <div key={ev.id} onClick={() => openEditEvent(ev)}
                    className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{ev.title}</div>
                      {ev.channelId && <div className="text-xs text-gray-400 mt-0.5">{channelName(ev.channelId)}</div>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteMarketingEvent(ev.id); }}
                      className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {["א","ב","ג","ד","ה","ו","ש"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
            {gridDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[dateStr] || [];
              const inMonth = calView === "week" ? true : isSameMonth(day, cursor);
              const maxShow = calView === "week" ? 6 : 2;
              return (
                <div key={dateStr}
                  onClick={() => setDayModalDate(dateStr)}
                  className={`rounded-lg border p-1.5 cursor-pointer transition-colors hover:border-gray-300 ${
                    calView === "week" ? "min-h-[160px]" : "min-h-[84px]"
                  } ${inMonth ? "bg-white" : "bg-gray-50/60"} ${isToday(day) ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-100"}`}>
                  <div className={`text-xs mb-1 ${isToday(day) ? "font-bold text-blue-600" : inMonth ? "text-gray-500" : "text-gray-300"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, maxShow).map((ev) => (
                      <div key={ev.id} onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                        className="text-[10px] bg-[#eef1e7] text-[#4a2e1b] rounded px-1.5 py-0.5 truncate hover:bg-[#e2e6d8]">
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > maxShow && (
                      <div className="text-[10px] text-gray-400">+{dayEvents.length - maxShow} עוד</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CHANNELS ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">ערוצים</h2>
        <button onClick={openNewChannel}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
          <Plus size={15} /> ערוץ חדש
        </button>
      </div>

      {marketingChannels.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm mb-8">
          אין עדיין ערוצים. לחץ &quot;ערוץ חדש&quot; כדי להתחיל.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-500">ערוץ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">סטטוס</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">לידים</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">המרה</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">הערות</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {marketingChannels.map((c) => {
                const stats = channelStats(c.name);
                const isOpen = expandedChannel === c.id;
                return (
                  <Fragment key={c.id}>
                    <tr className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedChannel(isOpen ? null : c.id)}>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHANNEL_STATUS_COLORS[c.status]}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-semibold">{stats.total}</td>
                      <td className="px-4 py-3 text-gray-500">{stats.total ? `${stats.rate}%` : "—"}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{c.notes}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={(e) => { e.stopPropagation(); openEditChannel(c); }} className="text-gray-400 hover:text-gray-700"><Pencil size={15} /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteMarketingChannel(c.id); }} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                          {isOpen ? <ChevronUp size={15} className="text-gray-300" /> : <ChevronDown size={15} className="text-gray-300" />}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-50/60 border-b">
                        <td colSpan={6} className="px-4 py-3">
                          {stats.items.length === 0 ? (
                            <div className="text-xs text-gray-400">אין עדיין לידים מהערוץ הזה</div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {stats.items.map((l) => (
                                <span key={l.id} className="text-xs bg-white border rounded-full px-2.5 py-1 text-gray-600">
                                  {l.orgName} · {l.status}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CAMPAIGNS (separate, collapsed section) ── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button onClick={() => setCampaignsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="text-right">
            <div className="font-semibold text-gray-800">קמפיינים</div>
            <div className="text-xs text-gray-400">{marketingCampaigns.length} קמפיינים</div>
          </div>
          {campaignsOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {campaignsOpen && (
          <div className="border-t border-gray-100 p-4">
            <div className="flex justify-end mb-3">
              <button onClick={openNewCampaign}
                className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] text-white px-3 py-1.5 rounded-lg hover:bg-[#333]">
                <Plus size={13} /> קמפיין חדש
              </button>
            </div>
            {marketingCampaigns.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-6">אין עדיין קמפיינים</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400">
                    <th className="text-right py-2 font-medium">שם</th>
                    <th className="text-right py-2 font-medium">ערוץ</th>
                    <th className="text-right py-2 font-medium">תאריכים</th>
                    <th className="text-right py-2 font-medium">תקציב</th>
                    <th className="text-right py-2 font-medium">סטטוס</th>
                    <th className="text-right py-2 font-medium">לידים בפועל</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {marketingCampaigns.map((c) => (
                    <tr key={c.id} className="border-t border-gray-50">
                      <td className="py-2.5 font-medium">{c.name}</td>
                      <td className="py-2.5 text-gray-500">{channelName(c.channelId)}</td>
                      <td className="py-2.5 text-gray-500 text-xs">{c.startDate} – {c.endDate}</td>
                      <td className="py-2.5 text-gray-500">{c.budget ? `₪${c.budget.toLocaleString()}` : "—"}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAMPAIGN_STATUS_COLORS[c.status]}`}>{c.status}</span>
                      </td>
                      <td className="py-2.5 font-semibold text-gray-700">{c.resultLeads || "—"}</td>
                      <td className="py-2.5">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEditCampaign(c)} className="text-gray-300 hover:text-gray-600"><Pencil size={13} /></button>
                          <button onClick={() => deleteMarketingCampaign(c.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Day modal (click a calendar cell) */}
      {dayModalDate && (
        <Modal title={isValid(parseISO(dayModalDate)) ? format(parseISO(dayModalDate), "EEEE, d MMMM yyyy", { locale: he }) : dayModalDate} onClose={() => setDayModalDate(null)}>
          <div className="space-y-2">
            {dayModalEvents.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">אין תוכניות ליום הזה</div>
            ) : (
              dayModalEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <button className="text-right flex-1" onClick={() => { setDayModalDate(null); openEditEvent(ev); }}>
                    <div className="text-sm font-medium text-gray-800">{ev.title}</div>
                    {ev.channelId && <div className="text-xs text-gray-400">{channelName(ev.channelId)}</div>}
                  </button>
                  <button onClick={() => deleteMarketingEvent(ev.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              ))
            )}
            <button onClick={() => openNewEvent(dayModalDate)}
              className="w-full flex items-center justify-center gap-1.5 text-sm border-2 border-dashed border-gray-200 text-gray-500 rounded-lg py-2.5 hover:border-gray-300 mt-2">
              <Plus size={14} /> הוסף פריט תוכנית
            </button>
          </div>
        </Modal>
      )}

      {/* Event modal */}
      {eventOpen && (
        <Modal title={editingEvent ? "עריכת פריט תוכנית" : "פריט תוכנית חדש"} onClose={() => setEventOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">תיאור *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder='למשל: "פוסט לינקדאין על ויולה"'
                value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">תאריך *</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ערוץ</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={eventForm.channelId}
                  onChange={(e) => setEventForm({ ...eventForm, channelId: e.target.value })}>
                  <option value="">—</option>
                  {marketingChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={eventForm.notes}
                onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEvent} className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">שמור</button>
              {editingEvent && (
                <button onClick={() => { deleteMarketingEvent(editingEvent.id); setEventOpen(false); }}
                  className="border border-red-200 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50">מחק</button>
              )}
              <button onClick={() => setEventOpen(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Channel modal */}
      {channelOpen && (
        <Modal title={editingChannel ? "עריכת ערוץ" : "ערוץ חדש"} onClose={() => setChannelOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">שם הערוץ *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="למשל: LinkedIn, ניוזלטר, הפניות"
                value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">השם צריך להתאים לשדה &quot;מקור&quot; בלידים כדי שהספירה תעבוד אוטומטית</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סטטוס</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={channelForm.status}
                onChange={(e) => setChannelForm({ ...channelForm, status: e.target.value as MarketingChannelStatus })}>
                {CHANNEL_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות / אסטרטגיה</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={channelForm.notes}
                onChange={(e) => setChannelForm({ ...channelForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveChannel} className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">שמור</button>
              <button onClick={() => setChannelOpen(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Campaign modal */}
      {campaignOpen && (
        <Modal title={editingCampaign ? "עריכת קמפיין" : "קמפיין חדש"} onClose={() => setCampaignOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">שם הקמפיין *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ערוץ</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={campaignForm.channelId}
                onChange={(e) => setCampaignForm({ ...campaignForm, channelId: e.target.value })}>
                <option value="">—</option>
                {marketingChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">תאריך התחלה</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">תאריך סיום</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">תקציב (₪)</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={campaignForm.budget}
                  onChange={(e) => setCampaignForm({ ...campaignForm, budget: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">סטטוס</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={campaignForm.status}
                  onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value as MarketingCampaignStatus })}>
                  {CAMPAIGN_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">לידים בפועל</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={campaignForm.resultLeads}
                onChange={(e) => setCampaignForm({ ...campaignForm, resultLeads: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={campaignForm.notes}
                onChange={(e) => setCampaignForm({ ...campaignForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveCampaign} className="flex-1 bg-[#1a1a1a] text-white py-2 rounded-lg text-sm hover:bg-[#333]">שמור</button>
              <button onClick={() => setCampaignOpen(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
