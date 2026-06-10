"use client";
import { useState } from "react";
import { useStore, Debrief } from "@/lib/store";
import { Plus, FileText, Trash2, ChevronLeft, BookOpen, Lightbulb, FolderCheck } from "lucide-react";
import DebriefForm from "./DebriefForm";

type Tab = "debriefs" | "completed" | "lessons";

export default function DebriefsPage() {
  const { debriefs, projects, deleteDebrief } = useStore();
  const [tab, setTab] = useState<Tab>("debriefs");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Debrief | null>(null);
  const [lessonFilter, setLessonFilter] = useState<"הכל" | "שימור" | "שיפור">("הכל");

  if (creating) return <DebriefForm onClose={() => setCreating(false)} />;
  if (viewing) return <DebriefForm debrief={viewing} onClose={() => setViewing(null)} />;

  const getProject = (id: string) => projects.find((p) => p.id === id);
  const completedProjects = projects.filter((p) => p.productionStatus === "בוצע");

  const avgScore = (d: Debrief) => {
    const scores = [d.contentScore, d.logisticsScore, d.orgWorkScore, d.orgValueScore].filter(Boolean);
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
  };

  // Collect all lessons from all debriefs
  const allLessons = debriefs.flatMap((d) => {
    const reviews = [
      ...d.contentGeneralReviews,
      ...d.logisticsGeneralReviews,
      ...(d.contentSlotReviews || []).flatMap((s) => s.reviews),
      ...(d.collabReviews || []).flatMap((c) => c.reviews),
    ];
    return reviews
      .filter((r) => r.what?.trim())
      .map((r) => ({ ...r, orgName: d.orgName, eventDate: d.eventDate, blockName: d.blockName }));
  });

  const filteredLessons = lessonFilter === "הכל"
    ? allLessons
    : allLessons.filter((l) => l.type === lessonFilter);

  // Count recurring lessons (same "what" text appears 2+)
  const lessonCounts = allLessons.reduce<Record<string, number>>((acc, l) => {
    const key = l.what.trim().slice(0, 60);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={22} /> שימור ידע
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">תחקירים, פרויקטים שהושלמו ולקחים שנצברו</p>
        </div>
        {tab === "debriefs" && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#333]">
            <Plus size={16} /> תחקיר חדש
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 mb-6 w-fit">
        {([
          { id: "debriefs", label: "תחקירים", icon: FileText, count: debriefs.length },
          { id: "completed", label: "פרויקטים שהושלמו", icon: FolderCheck, count: completedProjects.length },
          { id: "lessons", label: "בנק לקחים", icon: Lightbulb, count: allLessons.length },
        ] as const).map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? "bg-[#1a1a1a] text-white" : "text-gray-500 hover:text-gray-800"
            }`}>
            <Icon size={15} /> {label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: תחקירים ── */}
      {tab === "debriefs" && (
        <>
          {debriefs.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <div className="text-2xl font-bold">{debriefs.length}</div>
                <div className="text-sm text-gray-500">תחקירים</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <div className="text-2xl font-bold">{debriefs.reduce((s, d) => s + (d.participantsCount || 0), 0)}</div>
                <div className="text-sm text-gray-500">משתתפים סה״כ</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <div className="text-2xl font-bold">
                  {(() => {
                    const all = debriefs.flatMap((d) => [d.contentScore, d.logisticsScore, d.orgWorkScore].filter(Boolean));
                    return all.length ? (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1) : "—";
                  })()}
                </div>
                <div className="text-sm text-gray-500">ציון ממוצע</div>
              </div>
            </div>
          )}
          {debriefs.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <FileText size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">אין תחקירים עדיין. לאחר כל אירוע — תחקרו!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...debriefs].reverse().map((d) => {
                const proj = getProject(d.projectId);
                const shipur = [
                  ...d.contentGeneralReviews,
                  ...d.logisticsGeneralReviews,
                  ...(d.contentSlotReviews || []).flatMap((s) => s.reviews),
                  ...(d.collabReviews || []).flatMap((c) => c.reviews),
                ].filter((r) => r.type === "שיפור").length;

                return (
                  <div key={d.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setViewing(d)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-bold text-lg">{d.orgName}</h3>
                        {proj && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{proj.productType}</span>}
                        {d.blockName && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">⚡ {d.blockName}</span>}
                      </div>
                      <div className="flex gap-5 text-sm text-gray-500 flex-wrap">
                        {d.eventDate && <span>📅 {d.eventDate}</span>}
                        {d.participantsCount > 0 && <span>👥 {d.participantsCount} משתתפים</span>}
                        {d.location && <span>📍 {d.location}</span>}
                        {shipur > 0 && <span className="text-orange-500">↑ {shipur} נקודות שיפור</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-bold">{avgScore(d)}</div>
                        <div className="text-xs text-gray-400">ציון כללי</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteDebrief(d.id); }}
                        className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                      <ChevronLeft size={18} className="text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB: פרויקטים שהושלמו ── */}
      {tab === "completed" && (
        <>
          {completedProjects.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <FolderCheck size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">כשפרויקט יעבור לסטטוס "בוצע" — הוא יופיע כאן</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...completedProjects].reverse().map((p) => {
                const debrief = debriefs.find((d) => d.projectId === p.id);
                return (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-bold text-lg">{p.orgName}</h3>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ בוצע</span>
                          {p.productType && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{p.productType}</span>}
                        </div>
                        <div className="flex gap-5 text-sm text-gray-500 flex-wrap">
                          {p.startDate && <span>📅 {p.startDate}</span>}
                          {p.price > 0 && <span>💰 ₪{p.price.toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {debrief ? (
                          <button onClick={() => setViewing(debrief)}
                            className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
                            <FileText size={13} /> פתח תחקיר
                          </button>
                        ) : (
                          <button onClick={() => { setCreating(true); }}
                            className="flex items-center gap-1.5 text-sm border border-dashed border-gray-300 hover:border-gray-500 text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg">
                            <Plus size={13} /> הוסף תחקיר
                          </button>
                        )}
                      </div>
                    </div>
                    {debrief && (
                      <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs text-gray-400">
                        <span>ציון: {avgScore(debrief)}/10</span>
                        {debrief.participantsCount > 0 && <span>👥 {debrief.participantsCount} משתתפים</span>}
                        {debrief.blockName && <span>⚡ {debrief.blockName}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB: בנק לקחים ── */}
      {tab === "lessons" && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1">
              {(["הכל", "שימור", "שיפור"] as const).map((f) => (
                <button key={f} onClick={() => setLessonFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    lessonFilter === f ? "bg-[#1a1a1a] text-white" : "text-gray-500 hover:text-gray-800"
                  }`}>{f}</button>
              ))}
            </div>
            <span className="text-sm text-gray-400">{filteredLessons.length} לקחים</span>
          </div>

          {filteredLessons.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <Lightbulb size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">הלקחים יצטברו כאן מתוך התחקירים</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Recurring lessons first */}
              {Object.entries(lessonCounts).filter(([, c]) => c >= 2).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="text-sm font-bold text-amber-800 mb-2">🔁 לקחים חוזרים (מופיעים ב-2+ תחקירים)</div>
                  <div className="space-y-1">
                    {Object.entries(lessonCounts).filter(([, c]) => c >= 2).map(([key, count]) => (
                      <div key={key} className="flex items-center gap-2 text-sm text-amber-700">
                        <span className="bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 text-xs font-bold">{count}×</span>
                        {key}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredLessons.map((lesson, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          lesson.type === "שימור" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        }`}>{lesson.type}</span>
                        <span className="text-xs text-gray-400">{lesson.orgName}</span>
                        {lesson.blockName && <span className="text-xs text-yellow-600">⚡ {lesson.blockName}</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-800">{lesson.what}</p>
                      {lesson.why && <p className="text-xs text-gray-500 mt-0.5">למה: {lesson.why}</p>}
                      {lesson.howToImprove && <p className="text-xs text-blue-500 mt-0.5">איך: {lesson.howToImprove}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
