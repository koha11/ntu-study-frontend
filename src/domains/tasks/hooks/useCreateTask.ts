/**
 * useCreateTask Hook
 *
 * Creates a new task.
 *
 * Usage:
 * const { mutate: createTask, isPending } = useCreateTask();
 * createTask({ title: 'New task', dueDate: '2026-05-01' });
 */

import { useCreateTaskMutation } from "../queries";

export function useCreateTask() {
  return useCreateTaskMutation();
}
