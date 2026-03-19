"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, ClipboardList, GitBranch, LayoutDashboard } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deviations", label: "Deviations", icon: FileText },
  { href: "/capas", label: "CAPA Tracker", icon: ClipboardList },
  { href: "/simulation", label: "Digital Twin", icon: GitBranch },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8">
      <div className="flex items-center gap-2 font-bold text-blue-700 text-lg mr-4">
        <Activity className="w-5 h-5" />
        <span>QualityAI Copilot</span>
      </div>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            pathname === href || (href !== "/" && pathname.startsWith(href))
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
