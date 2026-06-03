import { describe, it, expect, vi, beforeEach } from "vitest";
import { navigateFromNotification } from "./navigate-from-notification";
import type { NotificationListItem } from "./notifications-api";

vi.mock("@/domains/invitations/invitations-api", () => ({
  fetchPendingInvitationToken: vi.fn(),
}));

vi.mock("@/domains/tasks/tasks-api", () => ({
  fetchTaskById: vi.fn(),
}));

import { fetchPendingInvitationToken } from "@/domains/invitations/invitations-api";
import { fetchTaskById } from "@/domains/tasks/tasks-api";

const mockNavigate = vi.fn();

const makeNotification = (overrides: Partial<NotificationListItem> = {}): NotificationListItem => ({
  id: "n1",
  type: "task_assigned",
  message: "msg",
  isRead: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("navigateFromNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when relatedEntityId is missing", async () => {
    const result = await navigateFromNotification(
      makeNotification({ relatedEntityType: "task" }),
      "tok",
      mockNavigate,
    );
    expect(result).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("returns false when relatedEntityType is missing", async () => {
    const result = await navigateFromNotification(
      makeNotification({ relatedEntityId: "e1" }),
      "tok",
      mockNavigate,
    );
    expect(result).toBe(false);
  });

  it("returns false when relatedEntityType is unknown", async () => {
    const result = await navigateFromNotification(
      makeNotification({ relatedEntityType: "unknown_type", relatedEntityId: "e1" }),
      "tok",
      mockNavigate,
    );
    expect(result).toBe(false);
  });

  it("navigates to invitation accept page for group_invitation type", async () => {
    vi.mocked(fetchPendingInvitationToken).mockResolvedValue({ token: "inv-tok" });

    const result = await navigateFromNotification(
      makeNotification({ relatedEntityType: "group_invitation", relatedEntityId: "inv1" }),
      "tok",
      mockNavigate,
    );

    expect(result).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/invitations/$token/accept",
      params: { token: "inv-tok" },
    });
  });

  it("navigates to /tasks for task type without groupId", async () => {
    vi.mocked(fetchTaskById).mockResolvedValue({
      id: "t1", title: "T", status: "todo", groupId: undefined,
      createdById: "u1", createdAt: "", updatedAt: "", subtasks: [],
    });

    const result = await navigateFromNotification(
      makeNotification({ relatedEntityType: "task", relatedEntityId: "t1" }),
      "tok",
      mockNavigate,
    );

    expect(result).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/tasks" });
  });

  it("navigates to group page for task type with groupId", async () => {
    vi.mocked(fetchTaskById).mockResolvedValue({
      id: "t1", title: "T", status: "todo", groupId: "g1",
      createdById: "u1", createdAt: "", updatedAt: "", subtasks: [],
    });

    const result = await navigateFromNotification(
      makeNotification({ relatedEntityType: "task", relatedEntityId: "t1" }),
      "tok",
      mockNavigate,
    );

    expect(result).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/groups/$groupId",
      params: { groupId: "g1" },
      search: { tab: "tasks" },
    });
  });
});
