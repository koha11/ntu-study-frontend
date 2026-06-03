import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "./queries";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: vi.fn(() => "test-token"),
}));

vi.mock("./notifications-api", () => ({
  fetchNotifications: vi.fn().mockResolvedValue([]),
  patchNotificationRead: vi.fn().mockResolvedValue({ id: "n1", is_read: true, type: "task_assigned", message: "msg", created_at: "" }),
  patchAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("notifications/queries – mutation coverage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("useMarkNotificationAsReadMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useMarkNotificationAsReadMutation(), { wrapper });
    result.current.mutate("n1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useMarkAllNotificationsAsReadMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useMarkAllNotificationsAsReadMutation(), { wrapper });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
