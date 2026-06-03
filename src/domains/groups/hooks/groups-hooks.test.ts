import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGroupsList } from "./useGroupsList";
import { useGroupDetails } from "./useGroupDetails";
import { useGroupMembers } from "./useGroupMembers";
import { useCreateGroup } from "./useCreateGroup";
import { useUpdateGroup } from "./useUpdateGroup";
import { useInviteMember } from "./useInviteMember";
import { useToggleMemberStatus } from "./useToggleMemberStatus";
import { useRemoveMember } from "./useRemoveMember";
import { useCreateGroupMeetEvent } from "./useCreateGroupMeetEvent";
import { useCanvaPreview } from "./useCanvaPreview";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("../groups-api", () => ({
  fetchUserGroups: vi.fn().mockResolvedValue([]),
  fetchGroupDetails: vi.fn().mockResolvedValue(null),
  fetchGroupMembers: vi.fn().mockResolvedValue([]),
  createGroup: vi.fn().mockResolvedValue({ id: "new-group" }),
  updateGroup: vi.fn().mockResolvedValue({}),
  inviteMember: vi.fn().mockResolvedValue({}),
  toggleMemberStatus: vi.fn().mockResolvedValue({}),
  removeMember: vi.fn().mockResolvedValue(undefined),
  createGroupMeetEvent: vi.fn().mockResolvedValue({}),
  fetchCanvaPreview: vi.fn().mockResolvedValue(null),
  fetchGroupCalendarEvents: vi.fn().mockResolvedValue([]),
  createGroupCalendarEvent: vi.fn().mockResolvedValue({}),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("groups hooks – function coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useGroupsList returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useGroupsList(), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useGroupsList accepts filter options", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useGroupsList({ role: "leader" }), { wrapper });
    expect(result.current).toHaveProperty("data");
  });

  it("useGroupDetails returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useGroupDetails("g1"), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useGroupMembers returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useGroupMembers("g1"), { wrapper });
    expect(result.current).toHaveProperty("data");
  });

  it("useCreateGroup returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateGroup(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useUpdateGroup returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useUpdateGroup(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useInviteMember returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useInviteMember(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useToggleMemberStatus returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useToggleMemberStatus(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useRemoveMember returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useRemoveMember(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useCreateGroupMeetEvent returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateGroupMeetEvent(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useCanvaPreview returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCanvaPreview("g1"), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });
});
