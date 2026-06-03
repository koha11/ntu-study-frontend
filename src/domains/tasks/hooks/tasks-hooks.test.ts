import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTasksList } from "./useTasksList";
import { useGroupTasks } from "./useGroupTasks";
import { useCreateTask } from "./useCreateTask";
import { useDeleteTask } from "./useDeleteTask";
import { useUpdateTaskStatus } from "./useUpdateTaskStatus";
import { useTaskDetails } from "./useTaskDetails";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("../tasks-api", () => ({
  fetchUserTasks: vi.fn().mockResolvedValue([]),
  fetchTaskDetails: vi.fn().mockResolvedValue(null),
  createTask: vi.fn().mockResolvedValue({ id: "new-task" }),
  updateTask: vi.fn().mockResolvedValue({}),
  updateTaskStatus: vi.fn().mockResolvedValue({}),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  submitTask: vi.fn().mockResolvedValue({}),
  reviewTask: vi.fn().mockResolvedValue({}),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("tasks hooks – function coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useTasksList returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useTasksList(), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useTasksList accepts filter options", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useTasksList({ assignedInGroups: true }),
      { wrapper },
    );
    expect(result.current).toHaveProperty("data");
  });

  it("useGroupTasks returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useGroupTasks("g1"), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useGroupTasks is disabled when groupId is empty", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useGroupTasks(""), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateTask returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateTask(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useDeleteTask returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useDeleteTask(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useUpdateTaskStatus returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useTaskDetails returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useTaskDetails("t1"), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });
});
