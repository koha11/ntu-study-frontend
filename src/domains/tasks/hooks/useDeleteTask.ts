/**
 * useDeleteTask Hook
 *
 * Deletes a task by ID.
 *
 * Usage:
 * const { mutate: deleteTask } = useDeleteTask();
 * deleteTask('task-123');
 */

import { useDeleteTaskMutation } from "../queries";

export function useDeleteTask() {
  return useDeleteTaskMutation();
}
