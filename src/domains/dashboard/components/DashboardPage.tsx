import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Users,
  CheckSquare,
  Sparkles,
  Plus,
  ArrowRight,
  Calendar,
  HardDrive,
  Bell,
  ClipboardCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { useGroupsList } from "@/domains/groups";
import { useTasksList } from "@/domains/tasks";
import { useFlashcardsList } from "@/domains/flashcards";
import { useCurrentUser } from "@/domains/auth";
import { navigateFromNotification } from "@/domains/notifications/navigate-from-notification";
import { notificationTypeLabel } from "@/domains/notifications/notification-labels";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/domains/auth/token-storage";
import { pendingReviewAsLeaderQueryOptions } from "@/domains/tasks/queries";
import { fetchDashboard } from "../dashboard-api";
import type { RecentActivityItem, UpcomingItem } from "../dashboard-api";

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const navTo = navigate as unknown as (opts: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
  }) => void;
  const [openingNotifId, setOpeningNotifId] = useState<string | null>(null);

  const { data: groups = [], isLoading: groupsLoading } = useGroupsList();
  const { data: tasks = [], isLoading: tasksLoading } = useTasksList({
    assignedInGroups: true,
  });
  const { data: flashcards = [], isLoading: flashcardsLoading } = useFlashcardsList();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: pendingReviewTasks = [] } = useQuery(pendingReviewAsLeaderQueryOptions());

  const currentUserId = currentUser?.id || "user1";
  const role = currentUser?.role || "student";

  const myGroups = groups;
  const groupNameById = Object.fromEntries(myGroups.map((g) => [g.id, g.name]));
  const myTasks = tasks.filter(
    (task) =>
      (task.assigneeId === currentUserId || task.createdById === currentUserId) &&
      task.status !== "done" &&
      task.status !== "failed",
  );
  const dueCards = flashcards.reduce((n, s) => {
    const needsReview =
      s.cardCount > 0 && (!s.nextReviewAt || new Date(s.nextReviewAt) <= new Date());
    return n + (needsReview ? s.cardCount : 0);
  }, 0);

  const recentActivity: RecentActivityItem[] = dashboardData?.recentActivity ?? [];
  const upcoming: UpcomingItem[] = dashboardData?.upcoming ?? [];

  async function handleNotificationClick(item: RecentActivityItem) {
    if (item.kind !== "notification" || !item.notification) return;
    const n = item.notification;
    const tok = getAccessToken();
    if (!tok) return;
    setOpeningNotifId(n.id);
    try {
      await navigateFromNotification(
        {
          id: n.id,
          type: n.type,
          message: n.message,
          isRead: n.isRead,
          relatedEntityType: n.relatedEntityType,
          relatedEntityId: n.relatedEntityId,
          createdAt: item.occurredAt,
        },
        tok,
        navigate as never,
      );
    } catch {
      toast.error(t("notifications.couldNotOpen"));
    } finally {
      setOpeningNotifId(null);
    }
  }

  const isLoading =
    groupsLoading || tasksLoading || flashcardsLoading || userLoading || dashboardLoading;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("dashboard.loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary-glow">
            {role === "admin" ? t("dashboard.adminView") : t("dashboard.studentView")}
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {t("dashboard.greeting", { name: currentUser?.name?.split(" ")[0] || "Student" })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label={t("dashboard.stats.activeGroups")}
          value={myGroups.length}
          delta="+1"
          accent="primary"
        />
        <StatCard
          icon={CheckSquare}
          label={t("dashboard.stats.openTasks")}
          value={myTasks.length}
          delta="-2"
          accent="info"
        />
        <StatCard
          icon={Sparkles}
          label={t("dashboard.stats.cardsToReview")}
          value={dueCards}
          delta="+12"
          accent="warning"
        />
      </div>

      {pendingReviewTasks.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t("dashboard.pendingReview")}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("dashboard.pendingReviewDesc")}
              </p>
            </div>
            <ClipboardCheck className="h-5 w-5 text-warning shrink-0" />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pendingReviewTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() =>
                  navTo({
                    to: "/groups/$groupId",
                    params: { groupId: task.groupId ?? "" },
                    search: { tab: "tasks" },
                  })
                }
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-colors hover:bg-accent hover:border-warning/40"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15">
                  <ClipboardCheck className="h-3.5 w-3.5 text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {task.groupId && groupNameById[task.groupId] && (
                      <span className="text-[11px] text-muted-foreground">
                        {groupNameById[task.groupId]}
                      </span>
                    )}
                    {task.assigneeName && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{task.assigneeName}</span>
                      </>
                    )}
                  </div>
                  {task.submittedAt && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(task.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold">{t("dashboard.recentActivity")}</h2>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto sm:max-h-none">
            {recentActivity.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("dashboard.noActivity", "No recent activity")}
              </p>
            ) : (
              recentActivity.map((item) =>
                item.kind === "notification" ? (
                  <button
                    key={`notif-${item.notification?.id}`}
                    type="button"
                    disabled={openingNotifId === item.notification?.id}
                    onClick={() => void handleNotificationClick(item)}
                    className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-colors hover:bg-accent disabled:opacity-60"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {notificationTypeLabel(item.notification?.type ?? "", t)}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {new Date(item.occurredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {item.notification?.message}
                      </p>
                    </div>
                  </button>
                ) : (
                  <button
                    key={`drive-${item.driveActivity?.groupId}-${item.occurredAt}`}
                    type="button"
                    onClick={() => {
                      const fid = item.driveActivity?.fileId;
                      if (fid) {
                        window.open(
                          `https://drive.google.com/file/d/${fid}`,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }
                    }}
                    className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                      <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {item.driveActivity?.fileName}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {new Date(item.occurredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {item.driveActivity?.actorDisplayName ?? item.driveActivity?.actorLabel} ·{" "}
                        {item.driveActivity?.action} · {item.driveActivity?.groupName}
                      </p>
                    </div>
                  </button>
                ),
              )
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("dashboard.upcoming")}</h2>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("dashboard.noUpcoming", "Nothing upcoming")}
              </p>
            ) : (
              upcoming.map((item) =>
                item.kind === "task" ? (
                  <button
                    key={`task-${item.task?.id}`}
                    type="button"
                    onClick={() =>
                      navTo({
                        to: "/groups/$groupId",
                        params: { groupId: item.task?.groupId ?? "" },
                        search: { tab: "tasks" },
                      })
                    }
                    className="w-full cursor-pointer rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <CheckSquare className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate text-sm font-medium">{item.task?.title}</span>
                      </div>
                      <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary-glow">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {item.task?.groupName && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.task.groupName}
                      </p>
                    )}
                  </button>
                ) : (
                  <button
                    key={`cal-${item.calendarEvent?.id}`}
                    type="button"
                    onClick={() =>
                      window.open(item.calendarEvent?.htmlLink, "_blank", "noopener,noreferrer")
                    }
                    className="w-full cursor-pointer rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0 text-blue-500" />
                        <span className="truncate text-sm font-medium">
                          {item.calendarEvent?.summary}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {item.calendarEvent?.groupName && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.calendarEvent.groupName}
                      </p>
                    )}
                  </button>
                ),
              )
            )}
          </div>
        </div>
      </div>

      {/* Your groups quick grid */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("dashboard.yourGroups")}</h2>
          <Link to="/groups" className="text-xs text-primary-glow hover:underline">
            {t("dashboard.seeAll")}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myGroups.slice(0, 3).map((g) => (
            <Link
              key={g.id}
              to="/groups/$groupId"
              params={{ groupId: g.id }}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary-glow">
                  {t("dashboard.active")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {g.member_count} {t("dashboard.members")}
                </span>
              </div>
              <div className="mt-3 font-semibold group-hover:text-primary-glow">{g.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {g.description ?? ""}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
