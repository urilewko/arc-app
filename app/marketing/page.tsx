"use client";
import { useState, useMemo } from "react";
import { useStore, MarketingChannel, MarketingCampaign, MarketingEvent, MarketingChannelStatus, MarketingCampaignStatus, MarketingIdeaStatus, CampaignChannelPlan } from "@/lib/store";
import Modal from "@/components/Modal";
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Megaphone, CalendarPlus, Lightbulb,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks,
  isSameMonth, isSameDay, isToday, parseISO, isValid,
} from "date-fns";
import { he } from "date-fns/locale";

type CalView = "day" | "week" | "month";
const VIEW_LABELS: Record<CalView, string> = { day: "יום", week: "שבוע", month: "חודש" };

const CHANNEL_STATUSES: MarketingChannelStatus[] = ["פעיל", "בהשהיה", "לא בשימוש"];

const CAMPAIGN_STATUSES: MarketingCampaignStatus[] = ["מתוכנן", "פעיל", "הסתיים"];
const CAMPAIGN_STATUS_COLORS: Record<MarketingCampaignStatus, string> = {
  "מתוכנן": "bg-blue-100 text-blue-700",
  "פעיל": "bg-green-100 text-green-700",
  "הסתיים": "bg-gray-100 text-gray-500",
};

// Deterministic per-channel color (by id), used in both the calendar and the channel cards
const CHANNEL_PALETTE = [
  { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-400",   bar: "bg-blue-400" },
  { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-400", bar: "bg-purple-400" },
  { bg: "bg-emerald-100",text: "text-emerald-700",dot: "bg-emerald-400",bar: "bg-emerald-400" },
  { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-400",  bar: "bg-amber-400" },
  { bg: "bg-pink-100",   text: "text-pink-700",   dot: "bg-pink-400",   bar: "bg-pink-400" },
  { bg: "bg-cyan-100",   text: "text-cyan-700",   dot: "bg-cyan-400",   bar: "bg-cyan-400" },
  { bg: "bg-rose-100",   text: "text-rose-700",   dot: "bg-rose-400",   bar: "bg-rose-400" },
  { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-400", bar: "bg-indigo-400" },
  { bg: "bg-teal-100",   text: "text-teal-700",   dot: "bg-teal-400",   bar: "bg-teal-400" },
  { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-400", bar: "bg-orange-400" },
];
const NO_CHANNEL_COLOR = { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-300", bar: "bg-gray-300" };
// Each channel gets its own palette slot: preferred slot comes from a hash of its id
// (stable), and if another channel already took it we move to the next free one, so
// colors never collide until there are more channels than palette entries.
function buildColorMap(channels: { id: string; createdAt: string }[]) {
  const map: Record<string, (typeof CHANNEL_PALETTE)[number]> = {};
  const taken = new Set<number>();
  [...channels].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((c) => {
    let h = 0;
    for (let i = 0; i < c.id.length; i++) h = (h * 31 + c.id.charCodeAt(i)) & 0xffff;
    let slot = h % CHANNEL_PALETTE.length;
    if (taken.size < CHANNEL_PALETTE.length) {
      while (taken.has(slot)) slot = (slot + 1) % CHANNEL_PALETTE.length;
      taken.add(slot);
    }
    map[c.id] = CHANNEL_PALETTE[slot];
  });
  return map;
}

const emptyChannel = { name: "", status: "פעיל" as MarketingChannelStatus, notes: "" };
const IDEA_STATUSES: MarketingIdeaStatus[] = ["רעיון", "בתכנון", "בוצע"];
const IDEA_STATUS_COLORS: Record<MarketingIdeaStatus, string> = {
  "רעיון": "bg-gray-100 text-gray-500",
  "בתכנון": "bg-amber-100 text-amber-700",
  "בוצע": "bg-green-100 text-green-700",
};
const campaignChannelsOf = (c: MarketingCampaign): CampaignChannelPlan[] =>
  c.channels?.length ? c.channels : c.channelId ? [{ channelId: c.channelId, plan: "" }] : [];

const emptyCampaign = {
  name: "", channels: [] as CampaignChannelPlan[], startDate: "", endDate: "", budget: 0,
  status: "מתוכנן" as MarketingCampaignStatus, resultLeads: 0, notes: "",
};
const emptyEvent = { date: "", title: "", channelId: "", notes: "" };

export default function MarketingPage() {
  const {
    leads, marketingChannels, marketingCampaigns, marketingEvents, marketingIdeas,
    addMarketingIdea, updateMarketingIdea, deleteMarketingIdea,
    addMarketingChannel, updateMarketingChannel, deleteMarketingChannel,
    addMarketingCampaign, updateMarketingCampaign, deleteMarketingCampaign,
    addMarketingEvent, updateMarketingEvent, deleteMarketingEvent,
  } = useStore();

  const colorMap = useMemo(() => buildColorMap(marketingChannels), [marketingChannels]);
  const channelColor = (id?: string) => (id && colorMap[id]) || NO_CHANNEL_COLOR;

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
  const [ideaDrafts, setIdeaDrafts] = useState<Record<string, string>>({});

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
      name: c.name, channels: campaignChannelsOf(c), startDate: c.startDate, endDate: c.endDate,
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
  const addIdea = (channelId: string) => {
    const text = (ideaDrafts[channelId] || "").trim();
    if (!text) return;
    addMarketingIdea({ channelId, text, status: "רעיון" });
    setIdeaDrafts((d) => ({ ...d, [channelId]: "" }));
  };
  const cycleIdeaStatus = (id: string, cur: MarketingIdeaStatus) => {
    const next = IDEA_STATUSES[(IDEA_STATUSES.indexOf(cur) + 1) % IDEA_STATUSES.length];
    updateMarketingIdea(id, { status: next });
  };
  const ideaToCalendar = (channelId: string, title: string) => {
    setEditingEvent(null);
    setEventForm({ ...emptyEvent, date: format(new Date(), "yyyy-MM-dd"), title, channelId });
    setEventOpen(true);
  };
  const toggleCampaignChannel = (channelId: string) => {
    setCampaignForm((f) => ({
      ...f,
      channels: f.channels.some((x) => x.channelId === channelId)
        ? f.channels.filter((x) => x.channelId !== channelId)
        : [...f.channels, { channelId, plan: "" }],
    }));
  };
  const setCampaignPlan = (channelId: string, plan: string) => {
    setCampaignForm((f) => ({ ...f, channels: f.channels.map((x) => x.channelId === channelId ? { ...x, plan } : x) }));
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

        {marketingChannels.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
            {marketingChannels.map((c) => {
              const col = channelColor(c.id);
              return (
                <span key={c.id} className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} /> {c.name}
                </span>
              );
            })}
          </div>
        )}

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
                (eventsByDate[format(cursor, "yyyy-MM-dd")] || []).map((ev) => {
                  const col = channelColor(ev.channelId);
                  return (
                    <div key={ev.id} onClick={() => openEditEvent(ev)}
                      className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{ev.title}</div>
                          {ev.channelId && <div className="text-xs text-gray-400 mt-0.5">{channelName(ev.channelId)}</div>}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteMarketingEvent(ev.id); }}
                        className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  );
                })
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
                    {dayEvents.slice(0, maxShow).map((ev) => {
                      const col = channelColor(ev.channelId);
                      return (
                        <div key={ev.id} onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                          className={`text-[10px] ${col.bg} ${col.text} rounded px-1.5 py-0.5 truncate hover:opacity-80`}>
                          {ev.title}
                        </div>
                      );
                    })}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-start">
          {CHANNEL_STATUSES.map((status) => {
            const inStatus = marketingChannels.filter((c) => c.status === status);
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-semibold text-sm text-gray-700">{status}</span>
                  <span className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 border">
                    {inStatus.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {inStatus.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center text-xs text-gray-300">
                      אין ערוצים
                    </div>
                  ) : (
                    inStatus.map((c) => {
                      const stats = channelStats(c.name);
                      const isOpen = expandedChannel === c.id;
                      const col = channelColor(c.id);
                      return (
                        <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          <div className={`h-1.5 ${col.bar}`} />
                          <div className="p-3.5 cursor-pointer" onClick={() => setExpandedChannel(isOpen ? null : c.id)}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-sm text-gray-800">{c.name}</div>
                              <div className="flex gap-1.5 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); openEditChannel(c); }} className="text-gray-300 hover:text-gray-600"><Pencil size={13} /></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteMarketingChannel(c.id); }} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="font-semibold text-gray-700">{stats.total}</span> לידים
                              {stats.total > 0 && <span>· {stats.rate}% המרה</span>}
                            </div>
                            {c.notes && <div className="text-xs text-gray-400 mt-1.5 line-clamp-2">{c.notes}</div>}
                            {(() => {
                              const camps = marketingCampaigns.filter((k) => campaignChannelsOf(k).some((x) => x.channelId === c.id));
                              const ideasCount = marketingIdeas.filter((i) => i.channelId === c.id).length;
                              return (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  <span className="flex items-center gap-1 text-[11px] text-gray-400"><Lightbulb size={11} /> {ideasCount} רעיונות</span>
                                  {camps.map((k) => (
                                    <span key={k.id} className={`text-[10px] px-1.5 py-0.5 rounded-full ${col.bg} ${col.text}`}>{k.name}</span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                          {isOpen && (
                            <div className="px-3.5 pb-3.5 pt-3 border-t border-gray-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                              {/* Ideas */}
                              <div>
                                <div className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><Lightbulb size={12} /> רעיונות ודרכי פעולה</div>
                                <input
                                  value={ideaDrafts[c.id] || ""}
                                  onChange={(e) => setIdeaDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                                  onKeyDown={(e) => e.key === "Enter" && addIdea(c.id)}
                                  placeholder="כתוב רעיון ולחץ Enter..."
                                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs mb-2" />
                                <div className="space-y-1">
                                  {marketingIdeas.filter((i) => i.channelId === c.id).map((i) => (
                                    <div key={i.id} className="group flex items-start gap-2 bg-gray-50 rounded-lg px-2 py-1.5">
                                      <button onClick={() => cycleIdeaStatus(i.id, i.status)} title="לחץ להחלפת סטטוס"
                                        className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 ${IDEA_STATUS_COLORS[i.status]}`}>{i.status}</button>
                                      <span className={`flex-1 text-xs ${i.status === "בוצע" ? "text-gray-400 line-through" : "text-gray-700"}`}>{i.text}</span>
                                      <button onClick={() => ideaToCalendar(c.id, i.text)} title="הוסף ללוח השנה"
                                        className="shrink-0 text-gray-300 hover:text-blue-500"><CalendarPlus size={13} /></button>
                                      <button onClick={() => deleteMarketingIdea(i.id)}
                                        className="shrink-0 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* Leads from this channel */}
                              <div>
                                <div className="text-xs font-semibold text-gray-500 mb-1.5">לידים מהערוץ</div>
                                {stats.items.length === 0 ? (
                                  <div className="text-xs text-gray-400">אין עדיין לידים מהערוץ הזה</div>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {stats.items.map((l) => (
                                      <span key={l.id} className="text-[11px] bg-gray-50 border rounded-full px-2 py-0.5 text-gray-600">
                                        {l.orgName} · {l.status}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
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
              <div className="space-y-3">
                {marketingCampaigns.map((c) => (
                  <div key={c.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{c.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAMPAIGN_STATUS_COLORS[c.status]}`}>{c.status}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex gap-3 flex-wrap">
                          {(c.startDate || c.endDate) && <span>{c.startDate || "?"} – {c.endDate || "?"}</span>}
                          {c.budget > 0 && <span>₪{c.budget.toLocaleString()}</span>}
                          {c.resultLeads > 0 && <span className="font-semibold text-gray-600">{c.resultLeads} לידים</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEditCampaign(c)} className="text-gray-300 hover:text-gray-600"><Pencil size={14} /></button>
                        <button onClick={() => deleteMarketingCampaign(c.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {c.notes && <div className="text-xs text-gray-500 mt-2">{c.notes}</div>}
                    {campaignChannelsOf(c).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {campaignChannelsOf(c).map((x) => {
                          const col = channelColor(x.channelId);
                          return (
                            <div key={x.channelId} className={`rounded-lg p-2.5 ${col.bg}`}>
                              <div className={`text-xs font-semibold ${col.text}`}>{channelName(x.channelId)}</div>
                              <div className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{x.plan || <span className="text-gray-400">אין תוכנית עדיין</span>}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
              dayModalEvents.map((ev) => {
                const col = channelColor(ev.channelId);
                return (
                  <div key={ev.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <button className="flex items-center gap-2 text-right flex-1" onClick={() => { setDayModalDate(null); openEditEvent(ev); }}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                      <span>
                        <div className="text-sm font-medium text-gray-800">{ev.title}</div>
                        {ev.channelId && <div className="text-xs text-gray-400">{channelName(ev.channelId)}</div>}
                      </span>
                    </button>
                    <button onClick={() => deleteMarketingEvent(ev.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                );
              })
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
              <label className="block text-sm font-medium mb-1">ערוצים בקמפיין</label>
              {marketingChannels.length === 0 ? (
                <div className="text-xs text-gray-400">הוסף קודם ערוצים</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {marketingChannels.map((ch) => {
                    const on = campaignForm.channels.some((x) => x.channelId === ch.id);
                    const col = channelColor(ch.id);
                    return (
                      <button key={ch.id} type="button" onClick={() => toggleCampaignChannel(ch.id)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${on ? `${col.bg} ${col.text} border-transparent font-medium` : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                        {ch.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {campaignForm.channels.map((x) => {
              const col = channelColor(x.channelId);
              return (
                <div key={x.channelId}>
                  <label className={`block text-xs font-semibold mb-1 ${col.text}`}>מה קורה ב{channelName(x.channelId)}?</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={x.plan}
                    onChange={(e) => setCampaignPlan(x.channelId, e.target.value)} />
                </div>
              );
            })}
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
