import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Loader2, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useLogout, useCurrentUser } from "@/domains/auth";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  useMarkNotificationAsReadMutation,
  useNotificationsList,
} from "@/domains/notifications";
import { navigateFromNotification } from "@/domains/notifications/navigate-from-notification";
import { notificationTypeLabel } from "@/domains/notifications/notification-labels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { UserRole } from "@/common/enums/user-role.enum";
import { Button } from "@/components/ui/button";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

const BELL_PREVIEW_LIMIT = 8;

export function TopBar() {
  const navigate = useNavigate();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: user } = useCurrentUser();
  const { data: notifications = [], isLoading: notificationsLoading } =
    useNotificationsList();
  const { mutate: markRead, isPending: markingRead } =
    useMarkNotificationAsReadMutation();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const preview = notifications.slice(0, BELL_PREVIEW_LIMIT);

  async function handleOpenNotification(n: (typeof notifications)[number]) {
    const token = getAccessToken();
    if (!token) {
      toast.error("Please sign in again.");
      return;
    }
    setOpeningId(n.id);
    try {
      const ok = await navigateFromNotification(n, token, navigate as never);
      if (!ok) {
        toast.message("This notification has no link.");
        return;
      }
      if (!n.isRead) {
        markRead(n.id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not open link.";
      toast.error(msg);
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-glow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96">
          <DropdownMenuLabel className="flex items-center justify-between font-semibold">
            <span>Notifications</span>
            {notificationsLoading && (
              <span className="text-[11px] font-normal text-muted-foreground">Loading…</span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-80 overflow-y-auto">
            {preview.length === 0 && !notificationsLoading && (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            )}
            {preview.map((n) => (
              <div
                key={n.id}
                className="border-b border-border/60 px-2 py-2 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    disabled={openingId === n.id}
                    onClick={() => void handleOpenNotification(n)}
                    className="min-w-0 flex-1 rounded-md text-left outline-none ring-offset-background hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  >
                    <div className="flex items-center gap-1.5">
                      {openingId === n.id ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                      ) : null}
                      <span className="text-xs font-medium">
                        {notificationTypeLabel(n.type)}
                      </span>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </button>
                  {!n.isRead && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-[11px]"
                      disabled={markingRead || openingId === n.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                    >
                      Read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigate({ to: "/notifications" })}
            className="cursor-pointer justify-center font-medium"
          >
            View all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-1.5 pr-3 transition-colors hover:bg-accent">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary text-[11px] font-bold text-primary-foreground">
            {user ? initials(user.name) : "…"}
          </div>
          <span className="hidden text-xs font-medium sm:inline">
            {user?.name?.split(" ")[0] ?? "…"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm">{user?.name ?? "Loading…"}</div>
            <div className="text-[11px] font-normal text-muted-foreground">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user?.role === UserRole.ADMIN && (
            <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
              Admin console
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
            <UserIcon className="mr-2 h-4 w-4" />
            Profile & Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isLoggingOut}
            onClick={() =>
              logout(undefined, {
                onSuccess: () => navigate({ to: "/login", replace: true }),
              })
            }
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
