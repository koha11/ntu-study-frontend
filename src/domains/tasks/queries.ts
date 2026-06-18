/**
 * Tasks Domain — TanStack Query + real REST API
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@/shared/adapters/query-keys";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  fetchUserTasks,
  fetchGroupTasks,
  fetchTaskById,
  fetchPendingReviewTasksForLeader,
  createTask,
  updateTask,
  submitTask,
  approveTask,
  deleteTask,
} from "./tasks-api";
import type { CreateTaskInput, UpdateTaskInput, TaskStatus, ApproveTaskInput } from "./types";

function requireAccessToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
}

export const tasksListQueryOptions = (filters?: {
  status?: string;
  groupId?: string;
  assignedInGroups?: boolean;
}) =>
  queryOptions({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      const token = requireAccessToken();
      if (filters?.groupId) {
        return fetchGroupTasks(filters.groupId, token);
      }
      if (filters?.assignedInGroups) {
        return fetchUserTasks(token, { assignedInGroups: true });
      }
      return fetchUserTasks(token, {
        status: filters?.status as TaskStatus | undefined,
      });
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  });

export const pendingReviewAsLeaderQueryOptions = () =>
  queryOptions({
    queryKey: taskKeys.list({ pendingReviewAsLeader: true }),
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchPendingReviewTasksForLeader(token);
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  });

export const taskDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchTaskById(id, token);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(id),
  });

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const token = requireAccessToken();
      return createTask(input, token);
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.setQueryData(taskKeys.detail(newTask.id), newTask);
    },
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; input: UpdateTaskInput }) => {
      const token = requireAccessToken();
      return updateTask(params.id, params.input, token);
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

export const useUpdateTaskStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; status: TaskStatus }) => {
      const token = requireAccessToken();
      return updateTask(params.id, { status: params.status }, token);
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

export const useSubmitTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = requireAccessToken();
      return submitTask(id, token);
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

export const useApproveTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; input: ApproveTaskInput }) => {
      const token = requireAccessToken();
      return approveTask(params.id, params.input, token);
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = requireAccessToken();
      await deleteTask(id, token);
    },
    onSuccess: (_, taskId) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

