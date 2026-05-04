import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";

function getApiBase(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (!apiBase?.trim()) {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return normalizeApiBase(apiBase);
}

function bearerHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
  const text = await res.text();
  if (!text.trim()) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function handleVoid(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
}

export const ADMIN_CRON_JOB_SLUGS = {
  OVERDUE_TASK_REMINDERS: "overdue-task-reminders",
  CLEANUP_OLD_NOTIFICATIONS: "notification-cleanup",
} as const;

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  /** Backend `users_role_enum` */
  role: string;
  is_active: boolean;
  locked: boolean;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  total: number;
}

export interface AdminGroupRow {
  id: string;
  name: string;
  status: string;
  member_count: number;
  created_at: string;
}

export interface AdminGroupsResponse {
  groups: AdminGroupRow[];
  total: number;
}

export interface AdminDashboardResponse {
  totals: {
    users: number;
    groups: number;
    tasks: number;
  };
  cron_jobs_last_7_days: Array<{
    job_name: string;
    runs: number;
    failures: number;
  }>;
  recent_cron_runs: Array<{
    id: string;
    job_name: string;
    started_at: string;
    finished_at: string | null;
    status: string;
    error_message: string | null;
    triggered_by: string;
  }>;
}

export async function fetchAdminUsers(
  token: string,
  params?: { skip?: number; take?: number; q?: string },
): Promise<AdminUsersResponse> {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.take != null) q.set("take", String(params.take));
  if (params?.q?.trim()) q.set("q", params.q.trim());
  const qs = q.toString();
  const url = `${getApiBase()}/admin/users${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  return handleJson<AdminUsersResponse>(res);
}

export async function lockAdminUser(token: string, userId: string): Promise<AdminUserRow> {
  const res = await fetch(`${getApiBase()}/admin/users/${encodeURIComponent(userId)}/lock`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
  return handleJson<AdminUserRow>(res);
}

export async function unlockAdminUser(token: string, userId: string): Promise<AdminUserRow> {
  const res = await fetch(`${getApiBase()}/admin/users/${encodeURIComponent(userId)}/unlock`, {
    method: "POST",
    headers: bearerHeaders(token),
  });
  return handleJson<AdminUserRow>(res);
}

export async function fetchAdminGroups(
  token: string,
  params?: { skip?: number; take?: number },
): Promise<AdminGroupsResponse> {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.take != null) q.set("take", String(params.take));
  const qs = q.toString();
  const url = `${getApiBase()}/admin/groups${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  return handleJson<AdminGroupsResponse>(res);
}

export async function deleteAdminGroup(token: string, groupId: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/admin/groups/${encodeURIComponent(groupId)}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
  return handleVoid(res);
}

export async function fetchAdminDashboard(token: string): Promise<AdminDashboardResponse> {
  const res = await fetch(`${getApiBase()}/admin/dashboard`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  return handleJson<AdminDashboardResponse>(res);
}

export async function runAdminCronJob(token: string, jobSlug: string): Promise<void> {
  const res = await fetch(
    `${getApiBase()}/admin/cron-jobs/${encodeURIComponent(jobSlug)}/run`,
    {
      method: "POST",
      headers: bearerHeaders(token),
    },
  );
  return handleVoid(res);
}
