import { describe, it, expect } from "vitest";
import { notificationTypeLabel } from "./notification-labels";

const t = (key: string) => key;

describe("notificationTypeLabel", () => {
  it("returns group_invitation label", () => {
    expect(notificationTypeLabel("group_invitation", t)).toBe("notifications.types.group_invitation");
  });

  it("returns task_assigned label", () => {
    expect(notificationTypeLabel("task_assigned", t)).toBe("notifications.types.task_assigned");
  });

  it("returns task_pending_review label", () => {
    expect(notificationTypeLabel("task_pending_review", t)).toBe("notifications.types.task_pending_review");
  });

  it("returns task_review_result label", () => {
    expect(notificationTypeLabel("task_review_result", t)).toBe("notifications.types.task_review_result");
  });

  it("returns default label for unknown type", () => {
    expect(notificationTypeLabel("unknown_type", t)).toBe("notifications.types.default");
  });
});
