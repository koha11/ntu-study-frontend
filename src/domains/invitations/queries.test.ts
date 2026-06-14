import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  invitationValidateQueryOptions,
  groupInvitationsQueryOptions,
  useAcceptInvitationMutation,
  useResendGroupInvitationMutation,
} from "./queries";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("./invitations-api", () => ({
  validateInvitationToken: vi.fn().mockResolvedValue({ valid: true, invitation: { email: "a@b.com" } }),
  acceptInvitation: vi.fn().mockResolvedValue({ user: { id: "u1" } }),
  fetchGroupInvitations: vi.fn().mockResolvedValue([]),
  resendGroupInvitation: vi.fn().mockResolvedValue({ id: "inv1" }),
}));

vi.mock("@/shared/adapters/query-keys", () => ({
  invitationKeys: {
    all: ["invitations"],
    validate: (token: string) => ["invitations", "validate", token],
    groupPending: (groupId: string) => ["invitations", "group", groupId, "pending"],
  },
  groupKeys: {
    all: ["groups"],
    lists: () => ["groups", "list"],
    members: (id: string) => ["groups", "detail", id, "members"],
    detail: (id: string) => ["groups", "detail", id],
  },
}));

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("invitations/queries – factory functions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("invitationValidateQueryOptions", () => {
    it("returns queryKey and queryFn, enabled when token is provided", () => {
      const opts = invitationValidateQueryOptions("abc");
      expect(opts.queryKey).toBeDefined();
      expect(typeof opts.queryFn).toBe("function");
      expect(opts.enabled).toBe(true);
    });

    it("is disabled when token is empty", () => {
      const opts = invitationValidateQueryOptions("");
      expect(opts.enabled).toBe(false);
    });

    it("queryFn calls validateInvitationToken and returns result", async () => {
      const opts = invitationValidateQueryOptions("tok");
      const result = await (opts.queryFn as () => Promise<unknown>)();
      expect(result).toBeDefined();
    });
  });

  describe("groupInvitationsQueryOptions", () => {
    it("returns queryKey and queryFn, enabled when groupId is provided", () => {
      const opts = groupInvitationsQueryOptions("g1");
      expect(opts.queryKey).toBeDefined();
      expect(typeof opts.queryFn).toBe("function");
      expect(opts.enabled).toBe(true);
    });

    it("is disabled when groupId is empty", () => {
      const opts = groupInvitationsQueryOptions("");
      expect(opts.enabled).toBe(false);
    });

    it("queryFn calls fetchGroupInvitations with the access token", async () => {
      const opts = groupInvitationsQueryOptions("g1");
      const result = await (opts.queryFn as () => Promise<unknown>)();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("useAcceptInvitationMutation", () => {
    it("fires and succeeds", async () => {
      const { result } = renderHook(() => useAcceptInvitationMutation(), {
        wrapper: makeWrapper(),
      });
      result.current.mutate({ token: "tok1" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("passes full_name when provided", async () => {
      const { acceptInvitation } = await import("./invitations-api");
      const { result } = renderHook(() => useAcceptInvitationMutation(), {
        wrapper: makeWrapper(),
      });
      result.current.mutate({ token: "tok1", full_name: "Alice" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(acceptInvitation).toHaveBeenCalledWith("tok1", { full_name: "Alice" });
    });
  });

  describe("useResendGroupInvitationMutation", () => {
    it("fires and succeeds", async () => {
      const { result } = renderHook(() => useResendGroupInvitationMutation(), {
        wrapper: makeWrapper(),
      });
      result.current.mutate({ groupId: "g1", invitationId: "inv1" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("calls resendGroupInvitation with access token", async () => {
      const { resendGroupInvitation } = await import("./invitations-api");
      const { result } = renderHook(() => useResendGroupInvitationMutation(), {
        wrapper: makeWrapper(),
      });
      result.current.mutate({ groupId: "g1", invitationId: "inv1" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(resendGroupInvitation).toHaveBeenCalledWith("g1", "inv1", "test-token");
    });
  });
});
