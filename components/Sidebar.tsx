"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  FolderOpen,
  Wrench,
  Users,
} from "lucide-react";

const links = [
  { href: "/", label: "דאשבורד", icon: LayoutDashboard },
  { href: "/leads", label: "לידים", icon: TrendingUp },
  { href: "/projects", label: "פרויקטים פעילים", icon: FolderOpen },
  { href: "/infra", label: "פרויקטי תשתית", icon: Wrench },
  { href: "/contacts", label: "אנשי קשר", icon: Users },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-xl font-bold tracking-wide">ARC</div>
        <div className="text-xs text-white/40 mt-0.5">אדריכלות חוויה</div>
      </div>
      <nav className="flex-1 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
