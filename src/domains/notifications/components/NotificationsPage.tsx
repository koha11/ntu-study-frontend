import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import {
  useMarkNotificationAsReadMutation,
  useNotificationsList,
} from "@/domains/notifications";
import { getAccessToken } from "@/domains/auth/token-storage";
import { navigateFromNotification } from "@/domains/notifications/navigate-from-notification";
import { notificationTypeLabel } from "@/domains/notifications/notification-labels";
import { cn } from "@/lib/utils";

export function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotificationsList();
  const { mutate: markRead } = useMarkNotificationAsReadMutation();
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function handleOpen(notificationId: string) {
    const n = notifications.find((x) => x.id === notificationId);
    if (!n) return;
    const token = getAccessToken();
    if (!token) {
      toast.error(t("notifications.pleaseSignIn"));
      return;
    }
    setOpeningId(notificationId);
    try {
      const ok = await navigateFromNotification(n, token, navigate as never);
      if (!ok) {
        toast.message(t("notifications.noLink"));
        return;
      }
      if (!n.isRead) {
        markRead(notificationId);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("notifications.couldNotOpen");
      toast.error(msg);
    } finally {
      setOpeningId(null);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("notifications.loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("notifications.pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("notifications.pageSubtitle")}
        </p>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            type="button"
            disabled={openingId === n.id}
            onClick={() => void handleOpen(n.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-accent/50",
              !n.isRead ? "border-primary/30" : "border-border",
              openingId === n.id && "opacity-70",
            )}
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-xs font-bold text-primary-foreground">
              {openingId === n.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium">{notificationTypeLabel(n.type, t)}</div>
                {!n.isRead && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-glow shadow-glow" />
                )}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">{n.message}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : t("notifications.recently")}
              </div>
            </div>
          </button>
        ))}
        {notifications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
            {t("notifications.noNotifications")}
          </div>
        )}
      </div>
    </AppShell>
  );
}
