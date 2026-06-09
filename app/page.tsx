"use client";
import { useStore } from "@/lib/store";
import { FolderOpen, TrendingUp, Wrench, AlertCircle } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-orange-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { leads, projects, infraProjects } = useStore();

  const activeProjects = projects.filter((p) => p.productionStatus !== "בוצע");
  const confirmedRevenue = projects.reduce((s, p) => s + (p.price || 0), 0);
  const pipelineRevenue = leads
    .filter((l) => !["נסגר", "נפל"].includes(l.status))
    .reduce((s, l) => s + (l.dealValue || 0), 0);

  const openLeads = leads.filter((l) => !["נסגר", "נפל"].includes(l.status));
  const urgentLeads = openLeads.filter((l) => {
    if (!l.dueDate) return false;
    const days = Math.ceil((new Date(l.dueDate).getTime() - Date.now()) / 86400000);
    return days <= 3;
  });

  const infraInProgress = infraProjects.filter((p) => p.productionStatus === "בעבודה");

  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 86400000);
  const upcoming = [
    ...projects
      .filter((p) => p.startDate && new Date(p.startDate) >= now && new Date(p.startDate) <= in60)
      .map((p) => ({ date: p.startDate, label: p.orgName, type: "פרויקט" })),
    ...leads
      .filter((l) => l.dueDate && new Date(l.dueDate) >= now && new Date(l.dueDate) <= in60)
      .map((l) => ({ date: l.dueDate, label: `${l.orgName} — ${l.nextAction}`, type: "ליד" })),
    ...infraProjects
      .filter((p) => p.dueDate && new Date(p.dueDate) >= now && new Date(p.dueDate) <= in60)
      .map((p) => ({ date: p.dueDate, label: p.name, type: "תשתית" })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const TYPE_COLORS: Record<string, string> = {
    פרויקט: "bg-green-100 text-green-700",
    ליד: "bg-blue-100 text-blue-700",
    תשתית: "bg-purple-100 text-purple-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">דאשבורד</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="פרויקטים פעילים" value={activeProjects.length} icon={FolderOpen} color="bg-[#1a1a1a]" />
        <StatCard
          label="לידים פתוחים"
          value={openLeads.length}
          sub={urgentLeads.length > 0 ? `${urgentLeads.length} דחופים` : undefined}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard label="הכנסות מאושרות" value={`₪${confirmedRevenue.toLocaleString()}`} icon={FolderOpen} color="bg-green-600" />
        <StatCard label="פייפליין פוטנציאלי" value={`₪${pipelineRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-orange-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4">אירועים קרובים — 60 יום</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm">אין אירועים קרובים</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="text-gray-400 w-20 shrink-0 text-xs">{e.date}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${TYPE_COLORS[e.type]}`}>{e.type}</span>
                  <div className="text-gray-700 truncate">{e.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Wrench size={16} /> פרויקטי תשתית בעבודה
          </h2>
          {infraInProgress.length === 0 ? (
            <p className="text-gray-400 text-sm">אין פרויקטים בעבודה</p>
          ) : (
            <div className="space-y-2">
              {infraInProgress.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-gray-400 text-xs">{p.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {urgentLeads.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5 lg:col-span-2">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-orange-600">
              <AlertCircle size={16} /> לידים דחופים (עד 3 ימים)
            </h2>
            <div className="space-y-2">
              {urgentLeads.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm bg-orange-50 rounded-lg px-4 py-2">
                  <span className="font-medium">{l.orgName}</span>
                  <span className="text-gray-500">{l.nextAction}</span>
                  <span className="text-gray-400">{l.responsible}</span>
                  <span className="text-orange-600 font-medium">{l.dueDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
