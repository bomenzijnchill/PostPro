"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { href: "/projects/new", label: "projecten", icon: FolderKanban },
  { href: "/team", label: "team", icon: Users },
  { href: "/settings", label: "instellingen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/dashboard" className="text-lg font-bold text-foreground">
            team5pm
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent-yellow/10 text-accent-yellow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-accent-purple/20 text-accent-purple text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.name ?? "laden..."}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.role ?? ""}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="text-muted-foreground hover:text-danger transition-colors"
              aria-label="Uitloggen"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
