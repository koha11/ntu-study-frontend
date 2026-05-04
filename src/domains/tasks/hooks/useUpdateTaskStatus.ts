/**
 * useUpdateTaskStatus Hook
 *
 * Updates a task's status (todo, in-progress, done).
 *
 * Usage:
 * const { mutate: updateStatus } = useUpdateTaskStatus();
 * updateStatus({ id: 'task-123', status: 'done' });
 */

import { useUpdateTaskStatusMutation } from "../queries";

export function useUpdateTaskStatus() {
  return useUpdateTaskStatusMutation();
}
