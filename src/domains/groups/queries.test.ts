import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useToggleMemberStatusMutation,
  useCreateGroupMeetEventMutation,
  useCreateGroupCalendarEventMutation,
} from "./queries";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: vi.fn(() => "test-token"),
}));

const baseGroup = {
  id: "g1", name: "G", leader_id: "u1", tags: [], status: "active",
  created_at: "", updated_at: "",
};

vi.mock("./groups-api", () => ({
  fetchUserGroups: vi.fn().mockResolvedValue([]),
  fetchGroupDetails: vi.fn().mockResolvedValue(null),
  fetchGroupMembers: vi.fn().mockResolvedValue([]),
  createGroup: vi.fn().mockResolvedValue({ id: "g1", name: "G", leader_id: "u1", tags: [], status: "active", created_at: "", updated_at: "" }),
  updateGroup: vi.fn().mockResolvedValue({ id: "g1", name: "G", leader_id: "u1", tags: [], status: "active", created_at: "", updated_at: "" }),
  inviteMember: vi.fn().mockResolvedValue({ token: "inv-tok" }),
  toggleMemberStatus: vi.fn().mockResolvedValue({ user_id: "u1", role: "member" }),
  removeMember: vi.fn().mockResolvedValue(undefined),
  createGroupMeetEvent: vi.fn().mockResolvedValue({ meetLink: "https://meet.google.com/abc" }),
  fetchGroupCalendarEvents: vi.fn().mockResolvedValue([]),
  createGroupCalendarEvent: vi.fn().mockResolvedValue({ id: "e1", summary: "E" }),
  fetchCanvaPreview: vi.fn().mockResolvedValue(null),
}));

void baseGroup;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("groups/queries – mutation coverage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("useCreateGroupMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateGroupMutation(), { wrapper });
    result.current.mutate({ name: "New Group", tags: [] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useUpdateGroupMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useUpdateGroupMutation(), { wrapper });
    result.current.mutate({ id: "g1", data: { name: "Updated" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useInviteMemberMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useInviteMemberMutation(), { wrapper });
    result.current.mutate({ groupId: "g1", email: "test@test.com" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useRemoveMemberMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useRemoveMemberMutation(), { wrapper });
    result.current.mutate({ groupId: "g1", userId: "u1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useToggleMemberStatusMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useToggleMemberStatusMutation(), { wrapper });
    result.current.mutate({ groupId: "g1", userId: "u1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useCreateGroupMeetEventMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateGroupMeetEventMutation(), { wrapper });
    result.current.mutate({ groupId: "g1", input: { start: "2026-06-01T10:00:00.000Z" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useCreateGroupCalendarEventMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateGroupCalendarEventMutation(), { wrapper });
    result.current.mutate({ groupId: "g1", input: { start: "2026-06-01T10:00:00.000Z", end: "2026-06-01T11:00:00.000Z", mode: "online" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
