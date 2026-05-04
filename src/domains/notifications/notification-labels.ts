/** Short heading for a notification row based on backend `type`. */
export function notificationTypeLabel(type: string): string {
  switch (type) {
    case "group_invitation":
      return "Group invitation";
    case "task_assigned":
      return "Task assigned";
    case "task_pending_review":
      return "Review requested";
    case "task_review_result":
      return "Task update";
    default:
      return "Notification";
  }
}
