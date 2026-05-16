/** Short heading for a notification row based on backend `type`. */
export function notificationTypeLabel(type: string, t: (key: string) => string): string {
  switch (type) {
    case "group_invitation":
      return t("notifications.types.group_invitation");
    case "task_assigned":
      return t("notifications.types.task_assigned");
    case "task_pending_review":
      return t("notifications.types.task_pending_review");
    case "task_review_result":
      return t("notifications.types.task_review_result");
    default:
      return t("notifications.types.default");
  }
}
