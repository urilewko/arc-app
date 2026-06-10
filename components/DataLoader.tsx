"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function DataLoader({ children }: { children: React.ReactNode }) {
  const loadAll = useStore((s) => s.loadAll);
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (pathname !== "/login") router.replace("/login");
        setReady(true);
        return;
      }
      await loadAll();
      setReady(true);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="text-[#4a2e1b]/40 text-sm">טוען...</div>
      </div>
    );
  }

  return <>{children}</>;
}
