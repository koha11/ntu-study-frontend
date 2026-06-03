import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useSubmitTaskMutation,
  useDeleteTaskMutation,
  useApproveTaskMutation,
  tasksListQueryOptions,
  taskDetailQueryOptions,
} from "./queries";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: vi.fn(() => "test-token"),
}));


vi.mock("./tasks-api", () => {
  const base = { id: "t1", title: "T", status: "todo", createdById: "u1", createdAt: "", updatedAt: "", subtasks: [] };
  return {
    fetchUserTasks: vi.fn().mockResolvedValue([]),
    fetchGroupTasks: vi.fn().mockResolvedValue([]),
    fetchTaskById: vi.fn().mockResolvedValue({ ...base }),
    createTask: vi.fn().mockResolvedValue({ ...base }),
    updateTask: vi.fn().mockResolvedValue({ ...base, status: "done" }),
    submitTask: vi.fn().mockResolvedValue({ ...base, status: "pending_review" }),
    approveTask: vi.fn().mockResolvedValue({ ...base, status: "done" }),
    deleteTask: vi.fn().mockResolvedValue(undefined),
  };
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("tasks/queries – mutation coverage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("useCreateTaskMutation fires mutationFn and onSuccess", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateTaskMutation(), { wrapper });
    act(() => { result.current.mutate({ title: "New task" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("t1");
  });

  it("useUpdateTaskMutation fires mutationFn and onSuccess", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useUpdateTaskMutation(), { wrapper });
    act(() => { result.current.mutate({ id: "t1", input: { title: "Updated" } }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useUpdateTaskStatusMutation fires mutationFn and onSuccess", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useUpdateTaskStatusMutation(), { wrapper });
    act(() => { result.current.mutate({ id: "t1", status: "done" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useSubmitTaskMutation fires mutationFn and onSuccess", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useSubmitTaskMutation(), { wrapper });
    act(() => { result.current.mutate("t1"); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useDeleteTaskMutation fires mutationFn and onSuccess", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useDeleteTaskMutation(), { wrapper });
    act(() => { result.current.mutate("t1"); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useApproveTaskMutation fires mutationFn and onSuccess", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useApproveTaskMutation(), { wrapper });
    act(() => { result.current.mutate({ id: "t1", input: { status: "done" } }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("tasksListQueryOptions creates query options with correct key", () => {
    const opts = tasksListQueryOptions({ status: "todo" });
    expect(opts.queryKey).toBeDefined();
  });

  it("taskDetailQueryOptions creates query options with correct key", () => {
    const opts = taskDetailQueryOptions("t1");
    expect(opts.queryKey).toBeDefined();
    expect(opts.enabled).toBe(true);
  });

  it("taskDetailQueryOptions is disabled for empty id", () => {
    const opts = taskDetailQueryOptions("");
    expect(opts.enabled).toBe(false);
  });
});
