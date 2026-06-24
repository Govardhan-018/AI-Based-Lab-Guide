"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { getCurrentUser, logout, type AuthUser } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student", icon: "⌂" },
    { label: "My Subjects", href: "/student/subjects", icon: "▦" },
    { label: "Progress", href: "/student/progress", icon: "◔" },
  ],
  instructor: [
    { label: "Live Lab", href: "/instructor", icon: "●" },
    { label: "Subjects", href: "/instructor/subjects", icon: "▦" },
    { label: "Sessions", href: "/instructor/sessions", icon: "≡" },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: "⌂" },
    { label: "Subjects", href: "/teacher/subjects", icon: "▦" },
    { label: "Students", href: "/teacher/students", icon: "◉" },
    { label: "Analytics", href: "/teacher/analytics", icon: "◔" },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  instructor: "Lab Instructor",
  teacher: "Teacher",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS[role];
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-neutral-200">
        <Link href={`/${role}`} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white text-sm font-bold">
            LP
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">LabPilot</h1>
            <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">{ROLE_LABELS[role]}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = item.href === `/${role}` ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-xs font-bold">
            {user ? initials(user.name) : "··"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "—"}</p>
            <p className="text-xs text-neutral-400 truncate">{user?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 mt-2 text-xs text-neutral-400 hover:text-neutral-600 font-medium w-full"
        >
          ← Log out
        </button>
      </div>
    </aside>
  );
}
