"use client";
import { useState, useMemo } from "react";
import { useStore, FinanceRecord, PaymentStatus, FinanceRecordType } from "@/lib/store";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { parseISO, isValid } from "date-fns";

type FinancePeriod = "h1" | "h2" | "year";
const PERIOD_LABELS: Record<FinancePeriod, string> = { h1: "מחצית א׳", h2: "מחצית ב׳", year: "שנה מלאה" };
const YEAR_OPTIONS = [2025, 2026, 2027];

function safeDate(str: string): Date | null {
  if (!str) return null;
  const d = parseISO(str);
  return isValid(d) ? d : null;
}

const PAYMENT_STATUSES: PaymentStatus[] = ["ממתין", "שולם חלקית", "שולם במלואו"];
const PAYERS = ["אורי", "ינון", "אחר"];
const EXPENSE_CATEGORIES = ["שכר", "ציוד", "שיווק", "נסיעות", "מנויים", "מזון ואירוח", "אחר"];

const STATUS_COLORS: Record<PaymentStatus, string> = {
  "ממתין":          "bg-orange-100 text-orange-700",
  "שולם חלקית":    "bg-yellow-100 text-yellow-700",
  "שולם במלואו":   "bg-green-100 text-green-700",
};

const PERSONS = ["אורי", "ינון", "שניהם"] as const;

const emptyIncome = {
  projectId: "", orgName: "", amount: 0,
  paymentStatus: "ממתין" as PaymentStatus,
  invoiceDate: "", paidDate: "", notes: "",
  recordType: "income" as FinanceRecordType,
  expenseCategory: "",
  person: "שניהם" as "אורי" | "ינון" | "שניהם",
};

const emptyExpense = {
  projectId: "", orgName: "", amount: 0,
  paymentStatus: "שולם במלואו" as PaymentStatus,
  invoiceDate: "", paidDate: "", notes: "",
  recordType: "expense" as FinanceRecordType,
  expenseCategory: "אחר",
  person: "שניהם" as "אורי" | "ינון" | "שניהם",
};

type FinanceTab = "income" | "expenses";

export default function FinancePage() {
  const { financeRecords, projects, debriefs, infraProjects, blocks, addFinanceRecord, updateFinanceRecord, deleteFinanceRecord } = useStore();
  const [tab, setTab] = useState<FinanceTab>("income");
  const [period, setPeriod] = useState<FinancePeriod>("h2");
  const [year, setYear] = useState(2026);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceRecord | null>(null);
  const [form, setForm] = useState(emptyIncome);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  // ── Period filter ─────────────────────────────────────────────
  function inPeriod(dateStr: string): boolean {
    const date = safeDate(dateStr);
    if (!date) return true; // no date = always show
    if (date.getFullYear() !== year) return false;
    if (period === "h1") return date.getMonth() < 6;
    if (period === "h2") return date.getMonth() >= 6;
    return true;
  }

  // ── Income records only ────────────────────────────────────────
  const allIncomeRecords = financeRecords.filter((r) => !r.recordType || r.recordType === "income");
  const incomeRecords = useMemo(
    () => allIncomeRecords.filter((r) => inPeriod(r.paidDate || r.invoiceDate || r.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [financeRecords, period, year]
  );
  const generalExpenseRecords = financeRecords.filter((r) => r.recordType === "expense");

  const totalPaid    = incomeRecords.filter((r) => r.paymentStatus === "שולם במלואו").reduce((s, r) => s + r.amount, 0);
  const totalPending = incomeRecords.filter((r) => r.paymentStatus !== "שולם במלואו").reduce((s, r) => s + r.amount, 0);

  // ── Partner balance (50/50) ────────────────────────────────────
  const paidRecords = incomeRecords.filter((r) => r.paymentStatus === "שולם במלואו");
  const uriIncome   = paidRecords.reduce((s, r) => s + (r.person === "אורי" ? r.amount : r.person === "שניהם" ? r.amount / 2 : 0), 0);
  const yinonIncome = paidRecords.reduce((s, r) => s + (r.person === "ינון" ? r.amount : r.person === "שניהם" ? r.amount / 2 : 0), 0);

  // ── Expense aggregation from all sources ──────────────────────
  const expFromDebriefs   = useMemo(() => debriefs.filter((d) => inPeriod(d.eventDate || d.createdAt)).flatMap((d) => (d.expenses || []).map((e) => ({ ...e, source: "תחקיר", sourceName: d.orgName, date: d.eventDate || "" }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debriefs, period, year]);
  const expFromInfra      = infraProjects.flatMap((p) => (p.expenses || []).filter((e) => inPeriod(e.date || "")).map((e) => ({ ...e, source: "תשתית", sourceName: p.name, date: e.date || "" })));
  const expFromBlocks     = blocks.flatMap((b) => (b.expenses || []).filter((e) => inPeriod(e.date || "")).map((e) => ({ ...e, source: "בלוק", sourceName: b.name, date: e.date || "" })));
  const expFromGeneral    = generalExpenseRecords.filter((r) => inPeriod(r.invoiceDate || r.createdAt)).map((r) => ({ id: r.id, description: r.notes || r.orgName, amount: r.amount, paidBy: "", source: "כללי", sourceName: r.expenseCategory || "כללי", date: r.invoiceDate || "" }));

  const allExpenses = [...expFromDebriefs, ...expFromInfra, ...expFromBlocks, ...expFromGeneral];
  const totalExpenses = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  // ── Partner balance including expenses ────────────────────────
  const uriExpenses   = allExpenses.reduce((s, e) => s + (e.paidBy === "אורי"  ? (e.amount || 0) : 0), 0);
  const yinonExpenses = allExpenses.reduce((s, e) => s + (e.paidBy === "ינון"  ? (e.amount || 0) : 0), 0);
  // net position per person (income brought in minus expenses paid out)
  const uriNet   = uriIncome   - uriExpenses;
  const yinonNet = yinonIncome - yinonExpenses;
  const netDiff  = uriNet - yinonNet; // positive = Yinon owes Uri, negative = Uri owes Yinon
  const transferAmount = Math.abs(netDiff) / 2;

  // Group expenses by source type
  const expenseGroups = [
    { key: "תחקיר", label: "הוצאות אירועים",    color: "bg-blue-500",   items: expFromDebriefs },
    { key: "תשתית", label: "פרויקטי תשתית",     color: "bg-purple-500", items: expFromInfra },
    { key: "בלוק",  label: "הוצאות בלוקים",     color: "bg-amber-500",  items: expFromBlocks },
    { key: "כללי",  label: "הוצאות כלליות",     color: "bg-red-400",    items: expFromGeneral },
  ].filter((g) => g.items.length > 0);

  // Payer breakdown
  const payerTotals = allExpenses.reduce<Record<string, number>>((acc, e) => {
    const k = e.paidBy || "לא צוין";
    acc[k] = (acc[k] || 0) + (e.amount || 0);
    return acc;
  }, {});

  const openNewIncome  = () => { setEditing(null); setForm(emptyIncome);  setOpen(true); };
  const openNewExpense = () => { setEditing(null); setForm(emptyExpense); setOpen(true); };
  const openEdit = (r: FinanceRecord) => { setEditing(r); setForm({ ...r, recordType: r.recordType || "income", expenseCategory: r.expenseCategory || "", person: r.person || "שניהם" }); setOpen(true); };

  const save = () => {
    if (!form.orgName || !form.amount) return;
    if (editing) updateFinanceRecord(editing.id, form);
    else addFinanceRecord(form);
    setOpen(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">פיננסים</h1>
          <p className="text-sm text-gray-500 mt-0.5">הכנסות, תשלומים והוצאות מכל המקורות</p>
        </div>
        <div className="flex gap-2">
          {tab === "income" && (
            <button onClick={openNewIncome}
              className="flex items-center gap-2 bg-[#4a2e1b] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#3a2415]">
              <Plus size={16} /> רשומת הכנסה
            </button>
          )}
          {tab === "expenses" && (
            <button onClick={openNewExpense}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
              <Plus size={16} /> הוצאה כללית
            </button>
          )}
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-3 mb-5">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
          {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex bg-white border rounded-lg overflow-hidden text-sm shadow-sm">
          {(Object.keys(PERIOD_LABELS) as FinancePeriod[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 transition-colors ${period === p ? "bg-[#4a2e1b] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400">
          {period === "h1" ? "ינואר–יוני" : period === "h2" ? "יולי–דצמבר" : "כל השנה"} {year}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 mb-6 w-fit">
        {([
          { id: "income"   as FinanceTab, label: "הכנסות",  icon: TrendingUp   },
          { id: "expenses" as FinanceTab, label: "הוצאות",  icon: TrendingDown },
        ]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? "bg-[#4a2e1b] text-white" : "text-gray-500 hover:text-gray-800"
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB: הכנסות ── */}
      {tab === "income" && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border-r-4 border-green-400">
              <div className="text-sm text-gray-500 mb-1">שולם במלואו</div>
              <div className="text-2xl font-bold text-green-600">₪{totalPaid.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-r-4 border-orange-400">
              <div className="text-sm text-gray-500 mb-1">ממתין לתשלום</div>
              <div className="text-2xl font-bold text-orange-500">₪{totalPending.toLocaleString()}</div>
            </div>
          </div>

          {/* Partner balance */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-[#aec6cf]/40">
            <div className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">מאזן שותפות — 50/50</div>
            <div className="grid grid-cols-3 gap-6 mb-4">
              {/* Uri column */}
              <div className="space-y-2">
                <div className="text-sm font-bold text-[#4a2e1b] text-center">אורי</div>
                <div className="flex justify-between text-xs text-gray-500"><span>הכנסות</span><span className="text-green-600 font-medium">₪{Math.round(uriIncome).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>הוצאות ששילם</span><span className="text-red-500 font-medium">₪{Math.round(uriExpenses).toLocaleString()}</span></div>
                <div className="border-t pt-1 flex justify-between text-sm font-bold text-[#4a2e1b]"><span>נטו</span><span>₪{Math.round(uriNet).toLocaleString()}</span></div>
              </div>

              {/* Transfer */}
              <div className="flex flex-col items-center justify-center text-center">
                {transferAmount < 100 ? (
                  <div className="text-green-600 font-bold text-sm">✓ מאוזן</div>
                ) : (
                  <>
                    <div className="text-xs text-gray-400 mb-1">להעברה</div>
                    <div className="text-2xl font-bold text-purple-600">₪{Math.round(transferAmount).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1 font-medium">
                      {netDiff > 0 ? "ינון → אורי" : "אורי → ינון"}
                    </div>
                  </>
                )}
              </div>

              {/* Yinon column */}
              <div className="space-y-2">
                <div className="text-sm font-bold text-[#4a2e1b] text-center">ינון</div>
                <div className="flex justify-between text-xs text-gray-500"><span>הכנסות</span><span className="text-green-600 font-medium">₪{Math.round(yinonIncome).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>הוצאות ששילם</span><span className="text-red-500 font-medium">₪{Math.round(yinonExpenses).toLocaleString()}</span></div>
                <div className="border-t pt-1 flex justify-between text-sm font-bold text-[#4a2e1b]"><span>נטו</span><span>₪{Math.round(yinonNet).toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">ארגון / לקוח</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">סכום</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">סטטוס תשלום</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">תאריך חשבונית</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">תאריך תשלום</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">הערות</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {incomeRecords.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">אין רשומות הכנסה עדיין</td></tr>
                )}
                {incomeRecords.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.orgName}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">₪{r.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.paymentStatus]}`}>
                        {r.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.person && <span className="px-2 py-0.5 rounded-full bg-[#aec6cf]/20 text-[#4a2e1b] font-medium">{r.person}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.invoiceDate}</td>
                    <td className="px-4 py-3 text-gray-500">{r.paidDate || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{r.notes}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-gray-700"><Pencil size={15} /></button>
                        <button onClick={() => deleteFinanceRecord(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB: הוצאות ── */}
      {tab === "expenses" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border-r-4 border-red-400 col-span-2 lg:col-span-1">
              <div className="text-xs text-gray-500 mb-1">סה״כ הוצאות</div>
              <div className="text-2xl font-bold text-red-500">₪{totalExpenses.toLocaleString()}</div>
            </div>
            {Object.entries(payerTotals).map(([payer, total]) => (
              <div key={payer} className="bg-white rounded-xl shadow-sm p-4">
                <div className="text-xs text-gray-500 mb-1">{payer}</div>
                <div className="text-xl font-bold text-gray-700">₪{(total as number).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Source groups */}
          {allExpenses.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <TrendingDown size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">הוצאות יצטברו כאן מכל המקורות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenseGroups.map((group) => {
                const isOpen = expandedSource === group.key;
                const groupTotal = group.items.reduce((s, e) => s + (e.amount || 0), 0);
                return (
                  <div key={group.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedSource(isOpen ? null : group.key)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${group.color}`} />
                        <div className="text-right">
                          <div className="font-semibold text-gray-800">{group.label}</div>
                          <div className="text-xs text-gray-400">{group.items.length} הוצאות</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-500">₪{groupTotal.toLocaleString()}</span>
                        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-right px-5 py-2 font-medium text-gray-400 text-xs">מקור</th>
                              <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">תיאור</th>
                              <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">סכום</th>
                              <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">שילם</th>
                              <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">תאריך</th>
                              {group.key === "כללי" && <th className="px-4 py-2"></th>}
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((e, i) => (
                              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                                <td className="px-5 py-2.5 text-xs text-gray-500">{e.sourceName}</td>
                                <td className="px-4 py-2.5 text-gray-700">{e.description}</td>
                                <td className="px-4 py-2.5 font-medium text-red-500">₪{e.amount.toLocaleString()}</td>
                                <td className="px-4 py-2.5">
                                  {e.paidBy ? <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{e.paidBy}</span> : <span className="text-gray-300 text-xs">—</span>}
                                </td>
                                <td className="px-4 py-2.5 text-gray-400 text-xs">{e.date || "—"}</td>
                                {group.key === "כללי" && (
                                  <td className="px-4 py-2.5">
                                    <button
                                      onClick={() => { const r = financeRecords.find((x) => x.id === e.id); if (r) openEdit(r); }}
                                      className="text-gray-300 hover:text-gray-600"><Pencil size={13} /></button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {open && (
        <Modal title={editing ? "עריכת רשומה" : form.recordType === "income" ? "רשומת הכנסה חדשה" : "הוצאה כללית חדשה"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            {form.recordType === "income" ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">ארגון / לקוח *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.orgName}
                    onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">שייך לפרויקט</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.projectId}
                    onChange={(e) => {
                      const p = projects.find((p) => p.id === e.target.value);
                      setForm({ ...form, projectId: e.target.value, orgName: p?.orgName || form.orgName });
                    }}>
                    <option value="">ללא שיוך</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.orgName} — {p.productType}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">סכום (₪) *</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">שייך ל</label>
                  <div className="flex gap-2">
                    {PERSONS.map((p) => (
                      <button key={p} type="button"
                        onClick={() => setForm({ ...form, person: p })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          form.person === p
                            ? "bg-[#4a2e1b] text-white border-[#4a2e1b]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">סטטוס תשלום</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.paymentStatus}
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}>
                    {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">תאריך חשבונית</label>
                    <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.invoiceDate}
                      onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">תאריך תשלום</label>
                    <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.paidDate}
                      onChange={(e) => setForm({ ...form, paidDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">הערות</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">תיאור ההוצאה *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="למשל: חידוש מנוי Canva"
                    value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">קטגוריה</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.expenseCategory}
                    onChange={(e) => setForm({ ...form, expenseCategory: e.target.value })}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">סכום (₪) *</label>
                    <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">שילם</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}>
                      <option value="">בחר...</option>
                      {PAYERS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">תאריך</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.invoiceDate}
                    onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-[#4a2e1b] text-white py-2 rounded-lg text-sm hover:bg-[#3a2415]">שמור</button>
              <button onClick={() => setOpen(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">ביטול</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
