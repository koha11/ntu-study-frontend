import { type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  accent?: "primary" | "success" | "warning" | "info";
};

const accentMap = {
  primary: "from-primary/20 to-primary-glow/10 text-primary-glow",
  success: "from-success/20 to-success/5 text-success",
  warning: "from-warning/20 to-warning/5 text-warning",
  info: "from-info/20 to-info/5 text-info",
} as const;

export function StatCard({ icon: Icon, label, value, delta, accent = "primary" }: Props) {
  const { t } = useTranslation();
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-elegant">
      <div
        className={cn(
          "absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100",
          accentMap[accent],
        )}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br",
              accentMap[accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
        {delta && (
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="text-success">{delta}</span> {t("common.vsLastWeek")}
          </div>
        )}
      </div>
    </div>
  );
}
