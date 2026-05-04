/**
 * useTaskDetails Hook
 *
 * Fetches a single task by ID.
 *
 * Usage:
 * const { data: task } = useTaskDetails('task-123');
 */

import { useQuery } from "@tanstack/react-query";
import { taskDetailQueryOptions } from "../queries";

export function useTaskDetails(id: string) {
  return useQuery(taskDetailQueryOptions(id));
}
