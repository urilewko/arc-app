"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Copy, ExternalLink, FileDown, Send } from "lucide-react";

/**
 * The designed proposals (the pages built with the generator) of one lead.
 * They are created by the publish script and live in the `proposals` table; this strip only lists them,
 * copies the public link, opens it, prints it to PDF, and marks it as sent.
 * The simple proposals (QuoteBuilder, table `quotes`) are untouched.
 */
type Row = {
  id: string;
  label: string;
  token: string;
  status: "draft" | "sent" | "viewed" | "signed";
  created_at: string;
  view_count: number | null;
  last_viewed_at: string | null;
  signed_at: string | null;
  signed_name: string | null;
  signed_role: string | null;
};

const STATUS: Record<Row["status"], { text: string; cls: string }> = {
  draft: { text: "טיוטה", cls: "bg-gray-100 text-gray-600" },
  sent: { text: "נשלחה", cls: "bg-blue-50 text-blue-700" },
  viewed: { text: "נפתחה", cls: "bg-amber-50 text-amber-700" },
  signed: { text: "נחתמה", cls: "bg-green-50 text-green-700" },
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function DesignedProposals({ leadId }: { leadId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals?lead_id=${encodeURIComponent(leadId)}`, { headers: await authHeader() });
      if (!res.ok) {
        setState("off");
        return;
      }
      const j = await res.json();
      setRows(j.proposals || []);
      setState("ok");
    } catch {
      setState("off");
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  if (state !== "ok" || rows.length === 0) return null;

  const link = (r: Row, extra = "") => `${window.location.origin}/p/${r.token}${extra}`;
  const copy = async (r: Row) => {
    try {
      await navigator.clipboard.writeText(link(r));
      setCopied(r.id);
      setTimeout(() => setCopied(""), 1800);
    } catch {}
  };
  const markSent = async (r: Row) => {
    await fetch(`/api/proposals/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ status: "sent" }),
    });
    load();
  };

  return (
    <div className="px-4 py-2 bg-[#faf8f4] border-b border-gray-200 shrink-0" dir="rtl">
      <div className="text-[11px] font-semibold text-gray-400 mb-1.5">הצעות מעוצבות</div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-gray-700">{r.label || "הצעה מעוצבת"}</span>
            <span className="text-gray-400">{fmtDate(r.created_at)}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS[r.status]?.cls}`}>{STATUS[r.status]?.text}</span>
            {r.status === "signed" && (
              <span className="text-green-700">
                {r.signed_name}
                {r.signed_role ? ` (${r.signed_role})` : ""} · {fmtDate(r.signed_at)}
              </span>
            )}
            {r.status === "viewed" && r.view_count ? <span className="text-gray-400">נפתחה {r.view_count} פעמים, לאחרונה {fmtDate(r.last_viewed_at)}</span> : null}
            <span className="flex items-center gap-1 mr-auto">
              <button onClick={() => copy(r)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50">
                <Copy size={11} /> {copied === r.id ? "הועתק" : "העתק קישור"}
              </button>
              <a href={link(r, "?preview=1")} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50">
                <ExternalLink size={11} /> פתח
              </a>
              <a href={link(r, "?preview=1&print=1&lang=he")} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50">
                <FileDown size={11} /> PDF עב
              </a>
              <a href={link(r, "?preview=1&print=1&lang=en")} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50">
                <FileDown size={11} /> PDF EN
              </a>
              {r.status === "draft" && (
                <button onClick={() => markSent(r)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50">
                  <Send size={11} /> סמן כנשלחה
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
