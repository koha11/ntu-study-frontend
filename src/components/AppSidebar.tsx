import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Sparkles,
  Bell,
  Settings,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DriveQuotaCard } from "@/components/DriveQuotaCard";
import ntuLongLogo from "@/assets/ntu_long_logo.png";

const NAV_ITEMS: { key: string; to: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { key: "sidebar.dashboard", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { key: "sidebar.groups", to: "/groups", icon: Users },
  { key: "sidebar.tasks", to: "/tasks", icon: CheckSquare },
  { key: "sidebar.flashcards", to: "/flashcards", icon: Sparkles },
  { key: "sidebar.notifications", to: "/notifications", icon: Bell },
  { key: "sidebar.settings", to: "/settings", icon: Settings },
  { key: "sidebar.guide", to: "/guide", icon: BookOpen, exact: true },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="hidden md:flex h-screen w-60 shrink-0 sticky top-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center px-4 h-16 border-b border-sidebar-border">
        <img src={ntuLongLogo} alt="NTU Study" className="h-10 w-auto object-contain" />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
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
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <DriveQuotaCard />
    </aside>
  );
}
