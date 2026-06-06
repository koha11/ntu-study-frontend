import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  LayoutDashboard,
  Users,
  CheckSquare,
  Sparkles,
  Bell,
  Settings,
  Shield,
  Activity,
  FolderKanban,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
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

const ADMIN_SECTIONS: { labelKey: string; hash: string; icon: typeof Activity }[] = [
  { labelKey: "adminSidebar.overview", hash: "", icon: Activity },
  { labelKey: "adminSidebar.users", hash: "#users", icon: Users },
  { labelKey: "adminSidebar.groups", hash: "#groups", icon: FolderKanban },
];

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const hash = location.hash ? `#${location.hash.replace(/^#/, "")}` : "";
  const onAdmin = path.startsWith("/admin");

  return (
    <>
      <button
        type="button"
        className="flex md:hidden h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 flex flex-col bg-sidebar/95 backdrop-blur-xl border-sidebar-border"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          <div className="flex items-center px-4 h-16 border-b border-sidebar-border shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning shadow-elegant">
                  <Shield className="h-5 w-5 text-warning-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                    {t("adminSidebar.title")}
                  </div>
                  <div className="text-[10px] text-warning">{t("adminSidebar.tagline")}</div>
                </div>
              </div>
            ) : (
              <img src={ntuLongLogo} alt="NTU Study" className="h-10 w-auto object-contain" />
            )}
          </div>

          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {isAdmin
              ? ADMIN_SECTIONS.map((s) => {
                  const active = onAdmin && (s.hash === "" ? !hash : hash === s.hash);
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.labelKey}
                      onClick={() => {
                        navigate({ to: "/admin", hash: s.hash.replace("#", "") });
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                        active
                          ? "bg-warning/15 text-warning shadow-elegant"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(s.labelKey)}
                    </button>
                  );
                })
              : NAV_ITEMS.map((item) => {
                  const active = item.exact ? path === item.to : path.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
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
        </SheetContent>
      </Sheet>
    </>
  );
}
