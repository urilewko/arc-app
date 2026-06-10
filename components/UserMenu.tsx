"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!user) return null;

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "משתמש";
  const avatar = user.user_metadata?.avatar_url;
  const initials = name.slice(0, 2);

  return (
    <div className="px-4 py-3 border-t border-[#4a2e1b]/10 flex items-center gap-3">
      {avatar ? (
        <img src={avatar} alt={name} referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-white/70 shadow-sm" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[#4a2e1b]/20 flex items-center justify-center text-[#4a2e1b] text-xs font-bold shrink-0">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#4a2e1b] truncate">{name}</p>
        <p className="text-[10px] text-[#4a2e1b]/50 truncate">{user.email}</p>
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-[#4a2e1b]/40 hover:text-[#4a2e1b] transition-colors"
        title="התנתק">
        <LogOut size={14} />
      </button>
    </div>
  );
}
