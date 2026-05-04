import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Sparkles,
  Bell,
  Settings,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DriveQuotaCard } from "@/components/DriveQuotaCard";

const navItems: { label: string; to: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Groups", to: "/groups", icon: Users },
  { label: "Tasks", to: "/tasks", icon: CheckSquare },
  { label: "Flashcards", to: "/flashcards", icon: Sparkles },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            NTU Study
          </div>
          <div className="text-[10px] text-muted-foreground">Group collaboration</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = item.exact ? path === item.to : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-elegant"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-primary-glow" : "text-sidebar-foreground/50",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <DriveQuotaCard />
    </aside>
  );
}
