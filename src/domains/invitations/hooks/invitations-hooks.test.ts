import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGroupInvitations } from "./useGroupInvitations";
import { useResendGroupInvitation } from "./useResendGroupInvitation";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("../invitations-api", () => ({
  fetchGroupInvitations: vi.fn().mockResolvedValue([]),
  resendGroupInvitation: vi.fn().mockResolvedValue({ id: "inv1" }),
  validateInvitationToken: vi.fn().mockResolvedValue({}),
  acceptInvitation: vi.fn().mockResolvedValue({}),
  fetchPendingInvitationToken: vi.fn().mockResolvedValue({ token: "tok" }),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useGroupInvitations", () => {
  it("returns query result object", () => {
    const { result } = renderHook(() => useGroupInvitations("group-1"), {
      wrapper: makeWrapper(),
    });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("is disabled when groupId is empty string", () => {
    const { result } = renderHook(() => useGroupInvitations(""), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when enabled flag is false", () => {
    const { result } = renderHook(() => useGroupInvitations("group-1", false), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useResendGroupInvitation", () => {
  it("returns mutation object with mutate and isPending", () => {
    const { result } = renderHook(() => useResendGroupInvitation(), {
      wrapper: makeWrapper(),
    });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
  });
});
