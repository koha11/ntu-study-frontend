import { getRequiredEnv, HttpError } from "@/domains/auth/auth-api";

/** Shape returned by GET /notifications (matches Nest entity fields). */
export interface NotificationApiRow {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
}

export interface NotificationListItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export function mapNotification(row: NotificationApiRow): NotificationListItem {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
  };
}

export async function fetchNotifications(
  accessToken: string,
  options?: { unreadOnly?: boolean },
): Promise<NotificationListItem[]> {
  const { apiBase } = getRequiredEnv();
  const q = new URLSearchParams();
  if (options?.unreadOnly) {
    q.set("unread", "true");
  }
  const url = `${apiBase}/notifications${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(
      res.status,
      `Notifications fetch failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
  const rows = (await res.json()) as NotificationApiRow[];
  return Array.isArray(rows) ? rows.map(mapNotification) : [];
}

export async function patchAllNotificationsRead(
  accessToken: string,
): Promise<void> {
  const { apiBase } = getRequiredEnv();
  const res = await fetch(`${apiBase}/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(
      res.status,
      `Mark all read failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
}

export async function patchNotificationRead(
  accessToken: string,
  notificationId: string,
): Promise<NotificationListItem> {
  const { apiBase } = getRequiredEnv();
  const res = await fetch(`${apiBase}/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(
      res.status,
      `Mark read failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
  const row = (await res.json()) as NotificationApiRow;
  return mapNotification(row);
}
