import { Link } from "@tanstack/react-router";
import { Users, CheckSquare, Sparkles, TrendingUp, Plus, ArrowRight, Calendar } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { useGroupsList } from "@/domains/groups";
import { useTasksList } from "@/domains/tasks";
import { useFlashcardsList } from "@/domains/flashcards";
import { useCurrentUser } from "@/domains/auth";
import { useNotificationsList } from "@/domains/notifications";
import { notificationTypeLabel } from "@/domains/notifications/notification-labels";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  // Fetch data from domains
  const { data: groups = [], isLoading: groupsLoading } = useGroupsList();
  const { data: tasks = [], isLoading: tasksLoading } = useTasksList({
    assignedInGroups: true,
  });
  const { data: flashcards = [], isLoading: flashcardsLoading } = useFlashcardsList();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: notifications = [], isLoading: notificationsLoading } = useNotificationsList();

  // Safe fallbacks while loading
  const currentUserId = currentUser?.id || "user1";
  const role = currentUser?.role || "student";

  /** GET /groups returns only groups the user belongs to */
  const myGroups = groups;
  const myTasks = tasks.filter(
    (t) =>
      (t.assigneeId === currentUserId || t.createdById === currentUserId) &&
      t.status !== "done" &&
      t.status !== "failed",
  );
  const dueCards = flashcards.reduce((n, s) => {
    const needsReview =
      s.cardCount > 0 &&
      (!s.nextReviewAt || new Date(s.nextReviewAt) <= new Date());
    return n + (needsReview ? s.cardCount : 0);
  }, 0);

  // Check loading state
  const isLoading =
    groupsLoading || tasksLoading || flashcardsLoading || userLoading || notificationsLoading;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary-glow">
            {role === "admin" ? "Admin view" : "Student view"}
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Good evening, {currentUser?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's moving across your groups today.
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-glow">
          <Plus className="h-4 w-4" /> Quick action
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active groups"
          value={myGroups.length}
          delta="+1"
          accent="primary"
        />
        <StatCard
          icon={CheckSquare}
          label="Open tasks"
          value={myTasks.length}
          delta="-2"
          accent="info"
        />
        <StatCard
          icon={Sparkles}
          label="Cards to review"
          value={dueCards}
          delta="+12"
          accent="warning"
        />
        <StatCard
          icon={TrendingUp}
          label="Contribution score"
          value="8.4"
          delta="+0.3"
          accent="success"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <Link to="/notifications" className="text-xs text-primary-glow hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-[11px] font-bold text-primary-foreground">
                  {n.type[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">
                      {notificationTypeLabel(n.type)}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming</h2>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-3">
            {tasks
              .filter((t) => t.status !== "done")
              .slice(0, 4)
              .map((t) => {
                const g = groups.find((g) => g.id === t.groupId);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border/60 bg-background/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{t.title}</div>
                      <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary-glow">
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{g?.name}</div>
                  </div>
                );
              })}
          </div>
          <Link
            to="/tasks"
            className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-border bg-background/40 py-2 text-xs font-medium hover:bg-accent"
          >
            All tasks <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Your groups quick grid */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your groups</h2>
          <Link to="/groups" className="text-xs text-primary-glow hover:underline">
            See all
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
                  Active
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {g.member_count} members
                </span>
              </div>
              <div className="mt-3 font-semibold group-hover:text-primary-glow">{g.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{g.description ?? ""}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
