"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface DbError { id: number; table: string; action: string; message: string }

export default function DbErrorToast() {
  const [errors, setErrors] = useState<DbError[]>([]);

  useEffect(() => {
    let n = 0;
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<DbError, "id">;
      const id = ++n;
      setErrors((prev) => [...prev.slice(-2), { ...d, id }]);
      setTimeout(() => setErrors((prev) => prev.filter((x) => x.id !== id)), 12000);
    };
    window.addEventListener("arc-db-error", handler);
    return () => window.removeEventListener("arc-db-error", handler);
  }, []);

  if (errors.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[100] space-y-2 max-w-sm" dir="rtl">
      {errors.map((e) => (
        <div key={e.id} className="bg-red-600 text-white rounded-xl shadow-lg px-4 py-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold">השינוי לא נשמר</div>
              <div className="text-xs opacity-90 mt-0.5">טבלה: {e.table} · {e.message}</div>
            </div>
            <button onClick={() => setErrors((p) => p.filter((x) => x.id !== e.id))}><X size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
