import { fetchPendingInvitationToken } from "@/domains/invitations/invitations-api";
import { fetchTaskById } from "@/domains/tasks/tasks-api";
import type { NotificationListItem } from "./notifications-api";

/** Related entity types stored by the backend on notifications. */
const ENTITY_GROUP_INVITATION = "group_invitation";
const ENTITY_TASK = "task";

/**
 * Navigate to the relevant screen for a notification (invitation accept page or group tasks board).
 * Returns whether navigation was performed.
 */
export async function navigateFromNotification(
  notification: NotificationListItem,
  accessToken: string,
  navigate: (opts: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string | undefined>;
  }) => void,
): Promise<boolean> {
  const { relatedEntityType: rt, relatedEntityId: rid } = notification;
  if (!rid || !rt) {
    return false;
  }

  if (rt === ENTITY_GROUP_INVITATION) {
    const { token } = await fetchPendingInvitationToken(rid, accessToken);
    navigate({
      to: "/invitations/$token/accept",
      params: { token },
    });
    return true;
  }

  if (rt === ENTITY_TASK) {
    const task = await fetchTaskById(rid, accessToken);
    const gid = task.groupId;
    if (!gid) {
      navigate({ to: "/tasks" });
      return true;
    }
    navigate({
      to: "/groups/$groupId",
      params: { groupId: gid },
      search: { tab: "tasks" },
    });
    return true;
  }

  return false;
}
