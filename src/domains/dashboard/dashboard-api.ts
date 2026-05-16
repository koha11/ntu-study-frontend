import { getRequiredEnv, HttpError } from "@/domains/auth/auth-api";
import { getAccessToken } from "@/domains/auth/token-storage";

export interface DashboardNotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface DashboardDriveActivityItem {
  fileName: string;
  fileId?: string;
  action: string;
  actorLabel: string;
  actorDisplayName?: string;
  actorPhotoUrl?: string;
  groupId: string;
  groupName: string;
}

export interface RecentActivityItem {
  kind: "notification" | "drive_activity";
  occurredAt: string;
  notification?: DashboardNotificationItem;
  driveActivity?: DashboardDriveActivityItem;
}

export interface UpcomingTaskItem {
  id: string;
  title: string;
  status: string;
  groupId: string;
  groupName: string;
}

export interface UpcomingCalendarEventItem {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
  groupId: string;
  groupName: string;
}

export interface UpcomingItem {
  kind: "task" | "calendar_event";
  date: string;
  task?: UpcomingTaskItem;
  calendarEvent?: UpcomingCalendarEventItem;
}

export interface DashboardData {
  recentActivity: RecentActivityItem[];
  upcoming: UpcomingItem[];
}

export async function fetchDashboard(): Promise<DashboardData> {
  const { apiBase } = getRequiredEnv();
  const token = getAccessToken();
  if (!token) throw new HttpError(401, "Not authenticated");
  const res = await fetch(`${apiBase}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
  return res.json() as Promise<DashboardData>;
}
