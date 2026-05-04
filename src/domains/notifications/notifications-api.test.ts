import { describe, it, expect } from "vitest";
import { mapNotification } from "./notifications-api";

describe("mapNotification", () => {
  it("maps API row to list item", () => {
    const row = {
      id: "n1",
      type: "task_assigned",
      message: "Hello",
      is_read: false,
      created_at: "2026-01-01T00:00:00.000Z",
      related_entity_type: "task",
      related_entity_id: "t1",
    };
    expect(mapNotification(row)).toEqual({
      id: "n1",
      type: "task_assigned",
      message: "Hello",
      isRead: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      relatedEntityType: "task",
      relatedEntityId: "t1",
    });
  });
});
