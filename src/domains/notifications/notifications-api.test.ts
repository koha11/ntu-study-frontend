import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mapNotification,
  fetchNotifications,
  patchAllNotificationsRead,
  patchNotificationRead,
  type NotificationApiRow,
} from "./notifications-api";

vi.mock("@/domains/auth/auth-api", () => ({
  getRequiredEnv: () => ({ apiBase: "http://localhost:3000" }),
  HttpError: class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const makeRow = (overrides: Partial<NotificationApiRow> = {}): NotificationApiRow => ({
  id: "n1",
  type: "task_assigned",
  message: "You were assigned a task",
  is_read: false,
  created_at: "2026-01-15T10:00:00.000Z",
  related_entity_type: "task",
  related_entity_id: "t1",
  ...overrides,
});

describe("mapNotification", () => {
  it("maps API row to list item", () => {
    const row = makeRow();
    expect(mapNotification(row)).toEqual({
      id: "n1",
      type: "task_assigned",
      message: "You were assigned a task",
      isRead: false,
      createdAt: "2026-01-15T10:00:00.000Z",
      relatedEntityType: "task",
      relatedEntityId: "t1",
    });
  });

  it("maps is_read: true correctly", () => {
    expect(mapNotification(makeRow({ is_read: true })).isRead).toBe(true);
  });

  it("drops null related_entity_type and related_entity_id", () => {
    const mapped = mapNotification(
      makeRow({ related_entity_type: null, related_entity_id: null }),
    );
    expect(mapped.relatedEntityType).toBeUndefined();
    expect(mapped.relatedEntityId).toBeUndefined();
  });
});

describe("fetchNotifications", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("fetches and maps notification rows", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([makeRow()]), { status: 200 }),
    );
    const result = await fetchNotifications("token-abc");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("n1");
    expect(result[0].isRead).toBe(false);
  });

  it("appends ?unread=true when unreadOnly is set", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    await fetchNotifications("token-abc", { unreadOnly: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("?unread=true"),
      expect.anything(),
    );
  });

  it("does not append query string when unreadOnly is false", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    await fetchNotifications("token-abc", { unreadOnly: false });
    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).not.toContain("?");
  });

  it("sends Bearer Authorization header", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    await fetchNotifications("my-token");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { Authorization: "Bearer my-token" } }),
    );
  });

  it("returns empty array when response body is not an array", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(null), { status: 200 }));
    expect(await fetchNotifications("token-abc")).toEqual([]);
  });

  it("throws HttpError on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Unauthorized", { status: 401, statusText: "Unauthorized" }),
    );
    await expect(fetchNotifications("bad-token")).rejects.toMatchObject({ status: 401 });
  });
});

describe("patchAllNotificationsRead", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("sends PATCH to /notifications/read-all with auth header", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
    await patchAllNotificationsRead("token-abc");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/notifications/read-all",
      expect.objectContaining({
        method: "PATCH",
        headers: { Authorization: "Bearer token-abc" },
      }),
    );
  });

  it("throws HttpError on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Forbidden", { status: 403, statusText: "Forbidden" }),
    );
    await expect(patchAllNotificationsRead("token-abc")).rejects.toMatchObject({ status: 403 });
  });
});

describe("patchNotificationRead", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("sends PATCH to /notifications/:id/read and returns mapped notification", async () => {
    const row = makeRow({ id: "n42", is_read: true });
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(row), { status: 200 }));

    const result = await patchNotificationRead("token-abc", "n42");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/notifications/n42/read",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(result.id).toBe("n42");
    expect(result.isRead).toBe(true);
  });

  it("throws HttpError on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Not Found", { status: 404, statusText: "Not Found" }),
    );
    await expect(patchNotificationRead("token-abc", "missing")).rejects.toMatchObject({
      status: 404,
    });
  });
});
