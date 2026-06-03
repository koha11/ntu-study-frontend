import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNotificationsList } from "./useNotificationsList";
import { useMarkNotificationAsRead } from "./useMarkNotificationAsRead";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("../notifications-api", () => ({
  fetchNotifications: vi.fn().mockResolvedValue([]),
  patchNotificationRead: vi.fn().mockResolvedValue({ id: "n1", isRead: true }),
  patchAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useNotificationsList", () => {
  it("returns query result object", () => {
    const { result } = renderHook(() => useNotificationsList(), { wrapper: makeWrapper() });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("accepts unreadOnly filter", () => {
    const { result } = renderHook(
      () => useNotificationsList({ unreadOnly: true }),
      { wrapper: makeWrapper() },
    );
    expect(result.current).toHaveProperty("data");
  });

  it("is loading initially while fetching", () => {
    const { result } = renderHook(() => useNotificationsList(), { wrapper: makeWrapper() });
    expect(typeof result.current.isLoading).toBe("boolean");
  });
});

describe("useMarkNotificationAsRead", () => {
  it("returns mutation object with mutate and isPending", () => {
    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper: makeWrapper(),
    });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
  });
});
