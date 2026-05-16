import { Shield, Users, FolderKanban, Activity } from "lucide-react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const onAdmin = location.pathname.startsWith("/admin");

  const hash = location.hash ? `#${location.hash.replace(/^#/, "")}` : "";

  const sections: { labelKey: string; hash: string; icon: typeof Activity }[] = [
    { labelKey: "adminSidebar.overview", hash: "", icon: Activity },
    { labelKey: "adminSidebar.users", hash: "#users", icon: Users },
    { labelKey: "adminSidebar.groups", hash: "#groups", icon: FolderKanban },
  ];

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
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

      <nav className="flex-1 space-y-1 p-3">
        {sections.map((s) => {
          const active = onAdmin && (s.hash === "" ? !hash : hash === s.hash);
          const Icon = s.icon;
          return (
            <button
              key={s.labelKey}
              onClick={() => {
                navigate({ to: "/admin", hash: s.hash.replace("#", "") });
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
        })}
      </nav>

      <div className="m-3 rounded-xl border border-warning/20 bg-warning/5 p-3 text-[11px] text-muted-foreground">
        {t("adminSidebar.notice")}
      </div>
    </aside>
  );
}
