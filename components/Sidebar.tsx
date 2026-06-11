"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import {
  LayoutDashboard,
  TrendingUp,
  FolderOpen,
  Wrench,
  Users,
  Zap,
  HandshakeIcon,
  DollarSign,
  FileText,
  Target,
} from "lucide-react";

const links = [
  { href: "/", label: "דאשבורד", icon: LayoutDashboard },
  { href: "/strategy", label: "ניהול אסטרטגי", icon: Target },
  { href: "/leads", label: "לידים", icon: TrendingUp },
  { href: "/projects", label: "פרויקטים פעילים", icon: FolderOpen },
  { href: "/blocks", label: "The Blocks", icon: Zap },
  { href: "/finance", label: "פיננסים", icon: DollarSign },
  { href: "/debriefs", label: "שימור ידע", icon: FileText },
  { href: "/infra", label: "פרויקטי תשתית", icon: Wrench },
  { href: "/collaborators", label: "אנשים שהשזם לא מזהה", icon: HandshakeIcon },
  { href: "/contacts", label: "אנשי קשר", icon: Users },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 min-h-screen bg-[#aec6cf] flex flex-col">
      <div className="px-5 py-6 border-b border-[#4a2e1b]/15 flex flex-col items-center text-center">
        <div className="relative flex items-center justify-center mb-2">
          {/* Glow halo */}
          <div className="absolute rounded-full" style={{
            width: 90, height: 90,
            background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
            filter: "blur(6px)",
          }} />
          <Image src="/arc-logo.png" alt="ARC" width={64} height={64}
            className="object-contain relative"
            style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.7))" }} />
        </div>
        <div className="text-xs text-[#4a2e1b]/50">Irreplaceable Experiences</div>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#4a2e1b]/10 text-[#4a2e1b] font-bold"
                  : "text-[#4a2e1b]/70 hover:text-[#4a2e1b] hover:bg-[#4a2e1b]/8"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <UserMenu />
    </aside>
  );
}
