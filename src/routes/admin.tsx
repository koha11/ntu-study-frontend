import * as React from "react";
import { createFileRoute, useLocation } from "@tanstack/react-router";
import {
  Search,
  Lock,
  Unlock,
  Trash2,
  Activity,
  Users as UsersIcon,
  AlertTriangle,
  CheckCircle2,
  Play,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/domains/auth";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  ADMIN_CRON_JOB_SLUGS,
  deleteAdminGroup,
  fetchAdminDashboard,
  fetchAdminGroups,
  fetchAdminUsers,
  lockAdminUser,
  runAdminCronJob,
  unlockAdminUser,
} from "@/domains/admin/admin-api";
import { UserRole } from "@/common/enums/user-role.enum";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => requireAdmin({ location }),
  component: AdminPage,
});

function AdminPage() {
  const location = useLocation();
  const hash = location.hash;
  const section = hash === "users" ? "users" : hash === "groups" ? "groups" : "overview";

  return (
    <AppShell>
      {section === "overview" && <Overview />}
      {section === "users" && <UsersAdmin />}
      {section === "groups" && <GroupsAdmin />}
    </AppShell>
  );
}

function Overview() {
  const token = getAccessToken();
  const queryClient = useQueryClient();

  const dashQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchAdminDashboard(token!),
    enabled: !!token,
  });

  const runCron = useMutation({
    mutationFn: (slug: string) => runAdminCronJob(token!, slug),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const data = dashQuery.data;
  const chartData =
    data?.cron_jobs_last_7_days?.map((d) => ({
      name: d.job_name,
      runs: d.runs,
      failures: d.failures,
    })) ?? [];

  const totalRuns = chartData.reduce((n, d) => n + d.runs, 0);
  const failures = chartData.reduce((n, d) => n + d.failures, 0);

  return (
    <>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-warning">Admin / Overview</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">System health</h1>
      </div>

      {dashQuery.isError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(dashQuery.error as Error)?.message ?? "Failed to load dashboard"}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat icon={UsersIcon} label="Total users" value={data?.totals.users ?? "—"} />
        <AdminStat icon={Activity} label="Total groups" value={data?.totals.groups ?? "—"} />
        <AdminStat icon={CheckCircle2} label="Cron runs (7d)" value={totalRuns} />
        <AdminStat
          icon={AlertTriangle}
          label="Failures (7d)"
          value={failures}
          tone={failures > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">Manual run:</span>
        <Button
          size="sm"
          variant="outline"
          disabled={!token || runCron.isPending}
          onClick={() => runCron.mutate(ADMIN_CRON_JOB_SLUGS.OVERDUE_TASK_REMINDERS)}
        >
          <Play className="mr-1 h-3 w-3" />
          Overdue reminders
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!token || runCron.isPending}
          onClick={() => runCron.mutate(ADMIN_CRON_JOB_SLUGS.CLEANUP_OLD_NOTIFICATIONS)}
        >
          <Play className="mr-1 h-3 w-3" />
          Notification cleanup
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h3 className="font-semibold">Cron jobs — last 7 days</h3>
          <div className="mt-4 h-72">
            {chartData.length === 0 && !dashQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No cron runs recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="name" stroke="oklch(0.7 0.025 260)" fontSize={11} />
                  <YAxis stroke="oklch(0.7 0.025 260)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.235 0.028 265)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="runs" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="failures" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Recent cron runs</h3>
          <div className="mt-4 space-y-2">
            {(data?.recent_cron_runs ?? []).slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border/60 bg-background/40 p-2.5 text-xs"
              >
                <div className="font-medium">{r.job_name}</div>
                <div className="text-muted-foreground">
                  <span className="text-foreground">{r.status}</span>
                  {r.triggered_by ? ` · ${r.triggered_by}` : ""}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(r.started_at).toLocaleString()}
                </div>
              </div>
            ))}
            {(data?.recent_cron_runs?.length ?? 0) === 0 && !dashQuery.isLoading && (
              <div className="text-xs text-muted-foreground">No runs yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold">System log</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Persisted cron execution records (v1). See rows below for errors and timing.
        </p>
        <div className="mt-3 space-y-2 font-mono text-[11px]">
          {(data?.recent_cron_runs ?? []).slice(0, 12).map((r) => (
            <LogLine
              key={r.id}
              ts={new Date(r.started_at).toLocaleTimeString()}
              level={
                r.status === "failure" ? "error" : r.status === "running" ? "warn" : "info"
              }
              msg={`${r.job_name} [${r.triggered_by}] ${r.status}${
                r.error_message ? ` — ${r.error_message}` : ""
              }`}
            />
          ))}
          {(data?.recent_cron_runs?.length ?? 0) === 0 && !dashQuery.isLoading && (
            <div className="text-muted-foreground">No log entries</div>
          )}
        </div>
      </div>
    </>
  );
}

function LogLine({
  ts,
  level,
  msg,
}: {
  ts: string;
  level: "info" | "warn" | "error";
  msg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-background/40 px-3 py-1.5">
      <span className="text-muted-foreground">{ts}</span>
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
          level === "info" && "bg-info/15 text-info",
          level === "warn" && "bg-warning/15 text-warning",
          level === "error" && "bg-destructive/15 text-destructive",
        )}
      >
        {level}
      </span>
      <span className="text-foreground">{msg}</span>
    </div>
  );
}

function AdminStat({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: typeof UsersIcon;
  label: string;
  value: string | number;
  tone?: "primary" | "success" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "primary" && "text-primary-glow",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
          )}
        />
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
    </div>
  );
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).slice(0, 2);
  return p.map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

function UsersAdmin() {
  const token = getAccessToken();
  const queryClient = useQueryClient();
  const [q, setQ] = React.useState("");

  const usersQuery = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: () => fetchAdminUsers(token!, { q: q || undefined, take: 100 }),
    enabled: !!token,
  });

  const lockMut = useMutation({
    mutationFn: (id: string) => lockAdminUser(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const unlockMut = useMutation({
    mutationFn: (id: string) => unlockAdminUser(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const users = usersQuery.data?.users ?? [];
  const filtered = users;

  return (
    <>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-warning">Admin / Users</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">User management</h1>
      </div>

      {usersQuery.isError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(usersQuery.error as Error)?.message ?? "Failed to load users"}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Email</th>
                <th className="px-4 py-2.5 text-left font-medium">Role</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary text-[10px] font-bold text-primary-foreground">
                        {initials(u.full_name)}
                      </div>
                      <span className="font-medium">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === UserRole.ADMIN ? (
                      <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                        ADMIN
                      </span>
                    ) : (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.locked ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        <Lock className="h-2.5 w-2.5" /> LOCKED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                        <CheckCircle2 className="h-2.5 w-2.5" /> ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role === UserRole.ADMIN ? (
                      <span className="text-[11px] text-muted-foreground">Cannot lock admin</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={lockMut.isPending || unlockMut.isPending}
                        onClick={() =>
                          u.locked
                            ? unlockMut.mutate(u.id)
                            : lockMut.mutate(u.id)
                        }
                      >
                        {u.locked ? (
                          <>
                            <Unlock className="h-3 w-3" /> Unlock
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Lock
                          </>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function GroupsAdmin() {
  const token = getAccessToken();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: () => fetchAdminGroups(token!, { take: 200 }),
    enabled: !!token,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminGroup(token!, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "groups"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const list = groupsQuery.data?.groups ?? [];

  return (
    <>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-warning">Admin / Groups</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Group management</h1>
      </div>

      {groupsQuery.isError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(groupsQuery.error as Error)?.message ?? "Failed to load groups"}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-background/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Group</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Members</th>
              <th className="px-4 py-2.5 text-left font-medium">Created</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((g) => (
              <tr key={g.id} className="hover:bg-accent/30">
                <td className="px-4 py-3 font-medium">{g.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                    {g.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{g.member_count}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(g.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      if (confirm(`Delete group "${g.name}"? This cannot be undone.`)) {
                        deleteMut.mutate(g.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
